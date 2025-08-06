import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { provider, apiKey } = await request.json()

    if (!provider || !apiKey) {
      return NextResponse.json(
        { success: false, error: 'Provider and API key are required' },
        { status: 400 }
      )
    }

    // 각 프로바이더별 테스트 엔드포인트
    let testEndpoint = ''
    let headers: HeadersInit = {}
    let body = {}

    if (provider.startsWith('gpt')) {
      // OpenAI
      testEndpoint = 'https://api.openai.com/v1/models'
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    } else if (provider.includes('claude')) {
      // Anthropic Claude
      testEndpoint = 'https://api.anthropic.com/v1/messages'
      headers = {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      }
      body = {
        model: provider === 'claude-opus-4' ? 'claude-3-opus-20240229' :
               provider === 'claude-sonnet-4' ? 'claude-3-5-sonnet-20241022' :
               provider,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }]
      }
    } else if (provider.includes('gemini')) {
      // Google Gemini
      testEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${provider}:generateContent?key=${apiKey}`
      headers = {
        'Content-Type': 'application/json'
      }
      body = {
        contents: [{ parts: [{ text: 'Hi' }] }]
      }
    } else if (provider === 'custom') {
      // 사용자 정의 엔드포인트는 테스트하지 않음
      return NextResponse.json({ success: true })
    }

    // API 호출 테스트
    const response = await fetch(testEndpoint, {
      method: provider.startsWith('gpt') ? 'GET' : 'POST',
      headers,
      body: provider.startsWith('gpt') ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(5000) // 5초 타임아웃
    })

    if (response.ok) {
      return NextResponse.json({ success: true })
    } else {
      const errorText = await response.text()
      return NextResponse.json(
        { success: false, error: `API 연결 실패: ${response.status}` },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('API test error:', error)
    return NextResponse.json(
      { success: false, error: '연결 테스트 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}