import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { VoiceInputButton } from '@/components/VoiceInputButton'
import { useVoiceInputTrigger } from '@/hooks/useVoiceInputTrigger'
import { useSpeechRecognition } from '@/lib/speech/use-speech-recognition'
import { vi } from 'vitest'
import type { Mock } from 'vitest'

// Mock hooks
vi.mock('@/hooks/useVoiceInputTrigger')
vi.mock('@/lib/speech/use-speech-recognition')

describe('VoiceInputButton - 오프라인 음성 입력', () => {
  const mockAddActivity = vi.fn()
  const mockStartListening = vi.fn()
  const mockStopListening = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    ;(useVoiceInputTrigger as Mock).mockReturnValue({
      isVisible: true
    })

    ;(useSpeechRecognition as Mock).mockReturnValue({
      transcript: '',
      isListening: false,
      startListening: mockStartListening,
      stopListening: mockStopListening,
      hasRecognitionSupport: true,
      isOnline: true
    })
  })

  describe('기본 렌더링', () => {
    it('음성 입력 버튼이 표시되어야 함', () => {
      render(<VoiceInputButton addActivity={mockAddActivity} />)

      const button = screen.getByRole('button', { name: /음성.*입력/i })
      expect(button).toBeInTheDocument()
    })

    it('음성 인식이 지원되지 않으면 폴백 UI를 표시해야 함', () => {
      ;(useSpeechRecognition as Mock).mockReturnValue({
        hasRecognitionSupport: false,
        isOnline: true
      })

      render(<VoiceInputButton addActivity={mockAddActivity} />)

      expect(screen.getByText(/음성 인식이 지원되지 않습니다/i)).toBeInTheDocument()
    })
  })

  describe('오프라인 상태 처리', () => {
    it('오프라인 상태에서도 음성 입력이 가능해야 함', () => {
      ;(useSpeechRecognition as Mock).mockReturnValue({
        transcript: '',
        isListening: false,
        startListening: mockStartListening,
        stopListening: mockStopListening,
        hasRecognitionSupport: true,
        isOnline: false // 오프라인
      })

      render(<VoiceInputButton addActivity={mockAddActivity} />)

      const button = screen.getByRole('button', { name: /음성.*입력/i })
      fireEvent.click(button)

      expect(mockStartListening).toHaveBeenCalledWith({
        continuous: false,
        language: 'ko-KR'
      })
    })

    it('오프라인 상태를 사용자에게 알려야 함', () => {
      ;(useSpeechRecognition as Mock).mockReturnValue({
        transcript: '',
        isListening: false,
        startListening: mockStartListening,
        stopListening: mockStopListening,
        hasRecognitionSupport: true,
        isOnline: false
      })

      render(<VoiceInputButton addActivity={mockAddActivity} />)

      expect(screen.getByText(/오프라인 모드/i)).toBeInTheDocument()
    })
  })

  describe('음성 인식 프로세스', () => {
    it('음성 인식을 시작하고 중지할 수 있어야 함', async() => {
      const { rerender } = render(<VoiceInputButton addActivity={mockAddActivity} />)

      const button = screen.getByRole('button', { name: /음성.*입력/i })

      // 시작
      fireEvent.click(button)
      expect(mockStartListening).toHaveBeenCalled()

      // 리스닝 상태로 변경
      ;(useSpeechRecognition as Mock).mockReturnValue({
        transcript: '',
        isListening: true,
        startListening: mockStartListening,
        stopListening: mockStopListening,
        hasRecognitionSupport: true,
        isOnline: true
      })

      rerender(<VoiceInputButton addActivity={mockAddActivity} />)

      // 중지
      fireEvent.click(button)
      expect(mockStopListening).toHaveBeenCalled()
    })

    it('음성 인식 결과를 처리하고 활동으로 저장해야 함', async() => {
      const { rerender } = render(<VoiceInputButton addActivity={mockAddActivity} />)

      const button = screen.getByRole('button', { name: /음성.*입력/i })
      fireEvent.click(button)

      // 음성 인식 결과 시뮬레이션
      ;(useSpeechRecognition as Mock).mockReturnValue({
        transcript: '30분 운동했어요',
        isListening: false,
        startListening: mockStartListening,
        stopListening: mockStopListening,
        hasRecognitionSupport: true,
        isOnline: true
      })

      rerender(<VoiceInputButton addActivity={mockAddActivity} />)

      await waitFor(() => {
        expect(mockAddActivity).toHaveBeenCalledWith({
          statType: 'health',
          category: '운동',
          description: '30분 운동했어요',
          experience: expect.any(Number),
          synced: true // 온라인 상태
        })
      })
    })

    it('오프라인 상태에서 저장된 활동은 synced가 false여야 함', async() => {
      ;(useSpeechRecognition as Mock).mockReturnValue({
        transcript: '',
        isListening: false,
        startListening: mockStartListening,
        stopListening: mockStopListening,
        hasRecognitionSupport: true,
        isOnline: false // 오프라인
      })

      const { rerender } = render(<VoiceInputButton addActivity={mockAddActivity} />)

      const button = screen.getByRole('button', { name: /음성.*입력/i })
      fireEvent.click(button)

      // 음성 인식 결과
      ;(useSpeechRecognition as Mock).mockReturnValue({
        transcript: '책 읽기 완료',
        isListening: false,
        startListening: mockStartListening,
        stopListening: mockStopListening,
        hasRecognitionSupport: true,
        isOnline: false
      })

      rerender(<VoiceInputButton addActivity={mockAddActivity} />)

      await waitFor(() => {
        expect(mockAddActivity).toHaveBeenCalledWith({
          statType: 'learning',
          category: '학습',
          description: '책 읽기 완료',
          experience: expect.any(Number),
          synced: false // 오프라인이므로 false
        })
      })
    })
  })

  describe('활동 타입 자동 분류', () => {
    const testCases = [
      { transcript: '운동 30분 완료', expectedType: 'health' },
      { transcript: '책 한 챕터 읽음', expectedType: 'learning' },
      { transcript: '친구랑 저녁 먹음', expectedType: 'relationship' },
      { transcript: '프로젝트 마일스톤 달성', expectedType: 'achievement' }
    ]

    testCases.forEach(({ transcript, expectedType }) => {
      it(`"${transcript}"는 ${expectedType} 타입으로 분류되어야 함`, async() => {
        const { rerender } = render(<VoiceInputButton addActivity={mockAddActivity} />)

        const button = screen.getByRole('button', { name: /음성.*입력/i })
        fireEvent.click(button)

        ;(useSpeechRecognition as Mock).mockReturnValue({
          transcript,
          isListening: false,
          startListening: mockStartListening,
          stopListening: mockStopListening,
          hasRecognitionSupport: true,
          isOnline: true
        })

        rerender(<VoiceInputButton addActivity={mockAddActivity} />)

        await waitFor(() => {
          expect(mockAddActivity).toHaveBeenCalledWith(
            expect.objectContaining({
              statType: expectedType,
              description: transcript
            })
          )
        })
      })
    })
  })

  describe('에러 처리', () => {
    it('음성 인식 에러를 표시해야 함', () => {
      ;(useSpeechRecognition as Mock).mockReturnValue({
        transcript: '',
        isListening: false,
        startListening: mockStartListening,
        stopListening: mockStopListening,
        hasRecognitionSupport: true,
        isOnline: true,
        error: '마이크 접근 권한이 없습니다'
      })

      render(<VoiceInputButton addActivity={mockAddActivity} />)

      expect(screen.getByText(/마이크 접근 권한이 없습니다/i)).toBeInTheDocument()
    })

    it('빈 음성 입력은 처리하지 않아야 함', async() => {
      const { rerender } = render(<VoiceInputButton addActivity={mockAddActivity} />)

      const button = screen.getByRole('button', { name: /음성.*입력/i })
      fireEvent.click(button)

      // 빈 transcript
      ;(useSpeechRecognition as Mock).mockReturnValue({
        transcript: '',
        isListening: false,
        startListening: mockStartListening,
        stopListening: mockStopListening,
        hasRecognitionSupport: true,
        isOnline: true
      })

      rerender(<VoiceInputButton addActivity={mockAddActivity} />)

      await waitFor(() => {
        expect(mockAddActivity).not.toHaveBeenCalled()
      })
    })
  })
})
