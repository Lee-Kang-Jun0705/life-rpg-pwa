import { NextRequest, NextResponse } from 'next/server'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const { provider, apiKey, messages, tone, temperature = 0.7 } = await request.json()

    if (!provider || !apiKey || !messages) {
      return NextResponse.json(
        { error: 'Provider, API key, and messages are required' },
        { status: 400 }
      )
    }

    // 톤에 따른 시스템 프롬프트
    const tonePrompts = {
      friendly: '당신은 친근하고 따뜻한 AI 코치입니다. 이모지를 적절히 사용하며 격려와 응원을 아끼지 않습니다.',
      strict: '당신은 엄격하지만 공정한 AI 코치입니다. 직설적으로 피드백을 제공하며 높은 기준을 요구합니다.',
      humorous: '당신은 유머러스하고 재치있는 AI 코치입니다. 재미있는 비유와 농담을 섞어가며 조언합니다.',
      mentor: '당신은 현명하고 경험 많은 멘토입니다. 깊이 있는 통찰과 장기적 관점을 제시합니다.',
      cheerleader: '당신은 열정적인 응원단장입니다. 항상 긍정적이며 동기부여에 초점을 맞춥니다.'
    }

    const systemPrompt = `${tonePrompts[tone as keyof typeof tonePrompts] || tonePrompts.friendly}
    사용자의 목표 달성을 돕는 Life RPG AI 코치로서 다음을 수행하세요:
    1. 구체적이고 실천 가능한 조언 제공
    2. 중장기 목표를 3개의 큰 목표로 나누고, 각각 3개의 작은 실천사항으로 세분화
    3. 진행 상황을 모니터링하고 피드백 제공
    4. 동기부여와 격려를 통한 지속적인 성장 지원`

    const fullMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages
    ]

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
          messages: fullMessages,
          temperature,
          max_tokens: 1000
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
          max_tokens: 1000,
          temperature,
          system: systemPrompt,
          messages: messages.map((msg: ChatMessage) => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content
          }))
        })
      })

      const data = await response.json()
      if (data.content && data.content[0]) {
        aiResponse = data.content[0].text
      }
    } else if (provider.includes('gemini')) {
      // Google Gemini API 호출
      const geminiMessages = fullMessages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }))

      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${provider}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: geminiMessages.filter(msg => msg.role === 'user'),
            generationConfig: {
              temperature,
              maxOutputTokens: 1000
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

    return NextResponse.json({
      response: aiResponse,
      model: provider
    })

  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json(
      { error: 'AI 응답 생성 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}