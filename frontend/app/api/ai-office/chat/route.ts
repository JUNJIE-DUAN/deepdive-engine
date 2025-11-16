import { NextRequest, NextResponse } from 'next/server';

const AI_SERVICE_URL =
  process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:5000';

/**
 * AI Office Chat API
 * Handles AI conversations with resource context for document generation
 */
interface AIOfficeResource {
  resourceType: string;
  metadata?: {
    title?: string;
    description?: string;
    authors?: string;
    channel?: string;
    url?: string;
  };
  aiAnalysis?: {
    summary?: string;
    keyPoints?: string[];
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      message,
      resources = [],
      model = 'grok',
      stream = true,
      generateDocument = false,
      isDocumentGeneration = false,
      conversationHistory = [],
    } = body as {
      message: string;
      resources?: AIOfficeResource[];
      documentId?: string;
      model?: string;
      stream?: boolean;
      generateDocument?: boolean;
      isDocumentGeneration?: boolean;
      conversationHistory?: Array<{ role: string; content: string }>;
    };

    // Build context from selected resources
    const context = buildResourceContext(resources);

    // 构建系统提示
    let systemPrompt = '';
    if (isDocumentGeneration || generateDocument) {
      systemPrompt = `你是一个专业的文档创作助手。当用户要求生成PPT、Word文档或报告时：
1. 直接输出可用的结构化内容，而不是建议或步骤
2. 使用清晰的Markdown格式
3. 对于PPT，使用"## 第X页：标题"来标记每一页幻灯片
4. 确保内容专业、完整、可直接使用
5. 不要说"我建议"、"你可以"等指导性语言，直接给出内容

请基于用户提供的资源和要求，生成高质量的内容。`;
    }

    // Forward request to AI service (using reports/chat endpoint)
    const response = await fetch(`${AI_SERVICE_URL}/api/v1/reports/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        context: systemPrompt ? `${systemPrompt}\n\n${context}` : context,
        model,
        stream,
        resources, // Pass resources array to backend
        conversationHistory, // Pass conversation history for context
      }),
    });

    if (!response.ok) {
      throw new Error(`AI service responded with status: ${response.status}`);
    }

    // If streaming, pass through the stream
    if (stream && response.body) {
      return new NextResponse(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // Otherwise return JSON
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('AI Office chat error:', error);
    return NextResponse.json(
      { error: 'Failed to communicate with AI service' },
      { status: 500 }
    );
  }
}

/**
 * Build context string from resources
 */
function buildResourceContext(resources: AIOfficeResource[]): string {
  if (!resources || resources.length === 0) {
    return '';
  }

  const contextParts = ['以下是用户选择的资源信息：\n'];

  resources.forEach((resource, index) => {
    contextParts.push(`\n资源 ${index + 1}: ${resource.resourceType}`);

    if (resource.metadata) {
      contextParts.push(`标题: ${resource.metadata.title || '无标题'}`);

      if (resource.metadata.description) {
        contextParts.push(`描述: ${resource.metadata.description}`);
      }

      if (resource.metadata.authors) {
        contextParts.push(`作者: ${resource.metadata.authors}`);
      }

      if (resource.metadata.channel) {
        contextParts.push(`频道: ${resource.metadata.channel}`);
      }

      if (resource.metadata.url) {
        contextParts.push(`链接: ${resource.metadata.url}`);
      }
    }

    if (resource.aiAnalysis) {
      if (resource.aiAnalysis.summary) {
        contextParts.push(`AI摘要: ${resource.aiAnalysis.summary}`);
      }

      if (
        resource.aiAnalysis.keyPoints &&
        resource.aiAnalysis.keyPoints.length > 0
      ) {
        contextParts.push('关键点:');
        resource.aiAnalysis.keyPoints.forEach((point: string) => {
          contextParts.push(`  - ${point}`);
        });
      }
    }

    contextParts.push('---');
  });

  return contextParts.join('\n');
}
