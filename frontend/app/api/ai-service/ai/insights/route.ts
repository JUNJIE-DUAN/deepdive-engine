import { NextRequest, NextResponse } from 'next/server';

const AI_SERVICE_URL =
  process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, language = 'zh' } = body;

    // Forward request to AI service
    const response = await fetch(`${AI_SERVICE_URL}/api/v1/ai/insights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        language,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI service responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('AI insights error:', error);
    return NextResponse.json(
      { error: 'Failed to communicate with AI service' },
      { status: 500 }
    );
  }
}
