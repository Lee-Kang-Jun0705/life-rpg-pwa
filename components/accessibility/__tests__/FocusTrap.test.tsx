import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FocusTrap } from '../FocusTrap'

describe('FocusTrap 컴포넌트', () => {
  it('첫 번째 포커스 가능한 요소에 자동으로 포커스가 되어야 함', () => {
    render(
      <FocusTrap>
        <div>
          <button>첫 번째 버튼</button>
          <button>두 번째 버튼</button>
          <input type="text" placeholder="입력 필드" />
        </div>
      </FocusTrap>
    )

    const firstButton = screen.getByText('첫 번째 버튼')
    expect(document.activeElement).toBe(firstButton)
  })

  it('Tab 키로 순환 네비게이션이 되어야 함', async () => {
    const user = userEvent.setup()
    
    render(
      <FocusTrap>
        <div>
          <button>버튼 1</button>
          <button>버튼 2</button>
          <button>버튼 3</button>
        </div>
      </FocusTrap>
    )

    const button1 = screen.getByText('버튼 1')
    const button2 = screen.getByText('버튼 2')
    const button3 = screen.getByText('버튼 3')

    // 첫 번째 버튼에 포커스
    expect(document.activeElement).toBe(button1)

    // Tab 키로 다음 요소로 이동
    await user.tab()
    expect(document.activeElement).toBe(button2)

    await user.tab()
    expect(document.activeElement).toBe(button3)

    // 마지막 요소에서 Tab을 누르면 첫 번째로 돌아가야 함
    await user.tab()
    expect(document.activeElement).toBe(button1)
  })

  it('Shift+Tab으로 역방향 네비게이션이 되어야 함', async () => {
    const user = userEvent.setup()
    
    render(
      <FocusTrap>
        <div>
          <button>버튼 1</button>
          <button>버튼 2</button>
          <button>버튼 3</button>
        </div>
      </FocusTrap>
    )

    const button1 = screen.getByText('버튼 1')
    const button3 = screen.getByText('버튼 3')

    // 첫 번째 버튼에서 Shift+Tab을 누르면 마지막으로 가야 함
    await user.tab({ shift: true })
    expect(document.activeElement).toBe(button3)
  })

  it('Escape 키 핸들러가 작동해야 함', () => {
    const onEscape = jest.fn()
    
    render(
      <FocusTrap onEscape={onEscape}>
        <div>
          <button>버튼</button>
        </div>
      </FocusTrap>
    )

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onEscape).toHaveBeenCalled()
  })

  it('비활성화 상태에서는 포커스 트랩이 작동하지 않아야 함', () => {
    render(
      <FocusTrap active={false}>
        <div>
          <button>버튼 1</button>
          <button>버튼 2</button>
        </div>
      </FocusTrap>
    )

    const button1 = screen.getByText('버튼 1')
    // 비활성 상태에서는 자동 포커스가 되지 않음
    expect(document.activeElement).not.toBe(button1)
  })

  it('disabled 요소는 포커스 대상에서 제외되어야 함', async () => {
    const user = userEvent.setup()
    
    render(
      <FocusTrap>
        <div>
          <button>활성 버튼 1</button>
          <button disabled>비활성 버튼</button>
          <button>활성 버튼 2</button>
        </div>
      </FocusTrap>
    )

    const activeButton1 = screen.getByText('활성 버튼 1')
    const activeButton2 = screen.getByText('활성 버튼 2')

    expect(document.activeElement).toBe(activeButton1)

    // Tab을 누르면 disabled 버튼을 건너뛰고 다음 활성 버튼으로
    await user.tab()
    expect(document.activeElement).toBe(activeButton2)
  })
})