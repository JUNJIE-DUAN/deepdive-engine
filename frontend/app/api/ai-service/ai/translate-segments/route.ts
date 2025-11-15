import { NextRequest, NextResponse } from 'next/server';

const AI_SERVICE_URL =
  process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:5000';

// 增加超时时间到5分钟
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      segments,
      targetLanguage = 'zh-CN',
      model = 'gpt-4o-mini',
      batchSize = 10,
    } = body;

    console.log(
      `Translation request: ${segments.length} segments, model: ${model}, batchSize: ${batchSize}`
    );

    // 创建带超时的 fetch 请求
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5分钟超时

    try {
      // Forward request to AI service
      const response = await fetch(
        `${AI_SERVICE_URL}/api/v1/ai/translate-segments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            segments,
            targetLanguage,
            model,
            batchSize,
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`AI service error: ${response.status} - ${errorText}`);
        throw new Error(`AI service responded with status: ${response.status}`);
      }

      const data = await response.json();
      console.log(
        `Translation completed: ${data.translations?.length || 0} translations`
      );
      return NextResponse.json(data);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('Translation request timed out after 5 minutes');
        throw new Error('Translation request timed out');
      }
      throw fetchError;
    }
  } catch (error: any) {
    console.error('Translation error:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Failed to translate segments' },
      { status: 500 }
    );
  }
}
