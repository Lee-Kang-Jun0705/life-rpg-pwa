import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { provider, apiKey, userContext, tone = 'friendly' } = await request.json()

    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: 'Provider and API key are required' },
        { status: 400 }
      )
    }

    const systemPrompt = `당신은 Life RPG의 목표 설정 전문 AI 코치입니다.
    사용자의 상황과 관심사를 분석하여 달성 가능한 3개의 중장기 목표를 제안해주세요.
    각 목표마다 3개의 구체적이고 측정 가능한 실천 사항을 포함해야 합니다.
    
    목표 구조:
    1. 큰 목표 1 (3-6개월 달성 가능)
       - 작은 실천 1 (주 단위로 실행 가능)
       - 작은 실천 2 (주 단위로 실행 가능)
       - 작은 실천 3 (주 단위로 실행 가능)
    2. 큰 목표 2 (3-6개월 달성 가능)
       - 작은 실천 1 (주 단위로 실행 가능)
       - 작은 실천 2 (주 단위로 실행 가능)
       - 작은 실천 3 (주 단위로 실행 가능)
    3. 큰 목표 3 (3-6개월 달성 가능)
       - 작은 실천 1 (주 단위로 실행 가능)
       - 작은 실천 2 (주 단위로 실행 가능)
       - 작은 실천 3 (주 단위로 실행 가능)
    
    반드시 JSON 형식으로 응답해주세요:
    {
      "goals": [
        {
          "title": "목표 제목",
          "description": "목표 설명",
          "category": "dream|growth|career 중 하나",
          "subGoals": [
            {"text": "실천사항 1"},
            {"text": "실천사항 2"},
            {"text": "실천사항 3"}
          ]
        }
      ]
    }`

    const userPrompt = userContext || '나는 더 나은 삶을 살고 싶습니다. 건강하고, 지적으로 성장하며, 의미있는 관계를 만들고 싶습니다.'

    let response
    let aiResponse = ''

    if (provider.startsWith('gpt')) {
      // OpenAI API 호출
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: provider,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 1500,
          response_format: { type: 'json_object' }
        })
      })

      const data = await response.json()
      if (data.choices && data.choices[0]) {
        aiResponse = data.choices[0].message.content
      }
    } else if (provider.includes('claude')) {
      // Anthropic Claude API 호출
      const claudeModel = provider === 'claude-opus-4' ? 'claude-3-opus-20240229' :
                         provider === 'claude-sonnet-4' ? 'claude-3-5-sonnet-20241022' :
                         provider

      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: claudeModel,
          max_tokens: 1500,
          temperature: 0.7,
          system: systemPrompt,
          messages: [
            { role: 'user', content: userPrompt }
          ]
        })
      })

      const data = await response.json()
      if (data.content && data.content[0]) {
        aiResponse = data.content[0].text
      }
    } else if (provider.includes('gemini')) {
      // Google Gemini API 호출
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${provider}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: systemPrompt },
                  { text: userPrompt }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1500
            }
          })
        }
      )

      const data = await response.json()
      if (data.candidates && data.candidates[0]) {
        aiResponse = data.candidates[0].content.parts[0].text
      }
    }

    if (!aiResponse) {
      throw new Error('AI 응답을 받지 못했습니다')
    }

    // JSON 파싱 시도
    try {
      const parsedResponse = JSON.parse(aiResponse)
      return NextResponse.json(parsedResponse)
    } catch {
      // JSON 파싱 실패 시 텍스트 응답을 구조화
      return NextResponse.json({
        goals: [
          {
            title: '건강한 라이프스타일 구축',
            description: '규칙적인 운동과 균형잡힌 식단으로 건강 개선',
            category: 'growth',
            subGoals: [
              { text: '주 3회 이상 30분 운동하기' },
              { text: '매일 물 8잔 이상 마시기' },
              { text: '주 5일 이상 채소 포함 식사하기' }
            ]
          },
          {
            title: '지속적인 학습과 성장',
            description: '새로운 기술과 지식을 습득하여 전문성 향상',
            category: 'career',
            subGoals: [
              { text: '매일 30분 이상 독서하기' },
              { text: '월 1회 온라인 강의 수강하기' },
              { text: '배운 내용 노트에 정리하기' }
            ]
          },
          {
            title: '의미있는 인간관계 구축',
            description: '가족, 친구와의 관계 강화 및 새로운 인연 만들기',
            category: 'dream',
            subGoals: [
              { text: '주 1회 가족과 quality time 갖기' },
              { text: '월 2회 친구들과 만나기' },
              { text: '새로운 모임이나 동호회 참여하기' }
            ]
          }
        ],
        rawResponse: aiResponse
      })
    }

  } catch (error) {
    console.error('AI goals generation error:', error)
    
    // 에러 시 기본 목표 제공
    return NextResponse.json({
      goals: [
        {
          title: '건강한 생활 습관 만들기',
          description: '몸과 마음의 건강을 위한 일상 루틴 구축',
          category: 'growth',
          subGoals: [
            { text: '매일 30분 이상 걷기' },
            { text: '하루 7시간 이상 수면' },
            { text: '주 2회 이상 홈트레이닝' }
          ]
        },
        {
          title: '자기계발과 학습',
          description: '지속적인 성장을 위한 학습 습관',
          category: 'career',
          subGoals: [
            { text: '매일 책 30페이지 읽기' },
            { text: '주 1회 새로운 것 배우기' },
            { text: '월 1회 학습 내용 정리하기' }
          ]
        },
        {
          title: '관계와 소통 개선',
          description: '소중한 사람들과의 관계 강화',
          category: 'dream',
          subGoals: [
            { text: '매일 감사 인사 전하기' },
            { text: '주 1회 의미있는 대화 나누기' },
            { text: '월 1회 함께 활동하기' }
          ]
        }
      ],
      error: 'AI 서비스 일시적 오류로 기본 목표를 제공합니다'
    })
  }
}