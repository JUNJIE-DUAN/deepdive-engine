import { NextRequest, NextResponse } from 'next/server';

const AI_SERVICE_URL =
  process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, targetLanguage = 'zh-CN', model = 'grok' } = body;

    // Forward request to AI service
    const response = await fetch(
      `${AI_SERVICE_URL}/api/v1/ai/translate-single`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          targetLanguage,
          model,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI service error: ${response.status} - ${errorText}`);
      throw new Error(`AI service responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Translation error:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Failed to translate text' },
      { status: 500 }
    );
  }
}
