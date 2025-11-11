"""
AI API 路由
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from loguru import logger
from models.schemas import (
    SummaryRequest, SummaryResponse,
    InsightRequest, InsightResponse, Insight,
    ClassificationRequest, ClassificationResponse,
    HealthResponse
)
from services.ai_orchestrator import AIOrchestrator
from pydantic import BaseModel
from typing import Optional, Literal
import json


router = APIRouter(prefix="/ai", tags=["AI"])


class ChatRequest(BaseModel):
    """聊天请求"""
    message: str
    context: Optional[str] = None
    model: Literal["grok", "openai"] = "grok"
    stream: bool = False


class QuickActionRequest(BaseModel):
    """快捷操作请求"""
    content: str
    action: Literal["methodology", "summary", "insights"]
    model: Literal["grok", "openai"] = "grok"


def get_orchestrator() -> AIOrchestrator:
    """获取 AI 编排器实例（依赖注入）"""
    from main import orchestrator
    return orchestrator


@router.post("/summary", response_model=SummaryResponse)
async def generate_summary(
    request: SummaryRequest,
    orch: AIOrchestrator = Depends(get_orchestrator)
):
    """
    生成内容摘要

    Args:
        request: 摘要请求

    Returns:
        摘要响应
    """
    logger.info(f"Generating summary for content length: {len(request.content)}")

    prompt = f"""请为以下内容生成一个简洁的摘要（不超过{request.max_length}字）：

{request.content}

要求：
- 使用{request.language}语言
- 抓住核心要点
- 简洁明了
"""

    result, model = await orch.generate_completion(
        prompt,
        max_tokens=request.max_length * 2,  # 中文一个字约2个token
        temperature=0.5
    )

    if result is None:
        raise HTTPException(status_code=503, detail="All AI services unavailable")

    return SummaryResponse(
        summary=result,
        model_used=model
    )


@router.post("/insights", response_model=InsightResponse)
async def extract_insights(
    request: InsightRequest,
    orch: AIOrchestrator = Depends(get_orchestrator)
):
    """
    提取关键洞察

    Args:
        request: 洞察请求

    Returns:
        洞察响应
    """
    logger.info(f"Extracting insights for content length: {len(request.content)}")

    prompt = f"""请从以下内容中提取3-5个关键洞察：

{request.content}

要求：
- 使用{request.language}语言
- 每个洞察包含标题和描述
- 标注重要性（high/medium/low）
- 以 JSON 格式返回，格式如下：
[
  {{"title": "洞察标题", "description": "洞察描述", "importance": "high"}},
  ...
]
"""

    result, model = await orch.generate_completion(
        prompt,
        max_tokens=800,
        temperature=0.7
    )

    if result is None:
        raise HTTPException(status_code=503, detail="All AI services unavailable")

    # 解析 JSON 响应
    try:
        import json
        # 提取 JSON 部分（可能被 markdown 代码块包裹）
        if "```json" in result:
            result = result.split("```json")[1].split("```")[0].strip()
        elif "```" in result:
            result = result.split("```")[1].split("```")[0].strip()

        insights_data = json.loads(result)
        insights = [Insight(**item) for item in insights_data]

        return InsightResponse(
            insights=insights,
            model_used=model
        )
    except Exception as e:
        logger.error(f"Failed to parse insights: {str(e)}")
        # 降级处理：返回空列表
        return InsightResponse(
            insights=[],
            model_used=model
        )


@router.post("/classify", response_model=ClassificationResponse)
async def classify_content(
    request: ClassificationRequest,
    orch: AIOrchestrator = Depends(get_orchestrator)
):
    """
    分类内容

    Args:
        request: 分类请求

    Returns:
        分类响应
    """
    logger.info(f"Classifying content length: {len(request.content)}")

    prompt = f"""请对以下内容进行分类：

{request.content}

要求：
- 确定主类别（如：AI/机器学习、前端开发、后端开发、数据科学等）
- 提取子类别（2-3个）
- 提取相关标签（3-5个）
- 评估难度等级（beginner/intermediate/advanced/expert）
- 以 JSON 格式返回：
{{
  "category": "主类别",
  "subcategories": ["子类别1", "子类别2"],
  "tags": ["标签1", "标签2", "标签3"],
  "difficulty_level": "intermediate"
}}
"""

    result, model = await orch.generate_completion(
        prompt,
        max_tokens=500,
        temperature=0.3
    )

    if result is None:
        raise HTTPException(status_code=503, detail="All AI services unavailable")

    # 解析 JSON 响应
    try:
        import json
        if "```json" in result:
            result = result.split("```json")[1].split("```")[0].strip()
        elif "```" in result:
            result = result.split("```")[1].split("```")[0].strip()

        classification_data = json.loads(result)

        return ClassificationResponse(
            category=classification_data.get("category", "Unknown"),
            subcategories=classification_data.get("subcategories", []),
            tags=classification_data.get("tags", []),
            difficulty_level=classification_data.get("difficulty_level", "intermediate"),
            model_used=model
        )
    except Exception as e:
        logger.error(f"Failed to parse classification: {str(e)}")
        # 降级处理
        return ClassificationResponse(
            category="Unknown",
            subcategories=[],
            tags=[],
            difficulty_level="intermediate",
            model_used=model
        )


@router.get("/health", response_model=HealthResponse)
async def health_check(orch: AIOrchestrator = Depends(get_orchestrator)):
    """
    健康检查

    Returns:
        健康状态
    """
    health_status = await orch.health_check()

    return HealthResponse(
        status=health_status["status"],
        grok_available=health_status["grok_available"],
        openai_available=health_status["openai_available"],
        active_model=health_status["active_model"]
    )


@router.post("/simple-chat")
async def simple_chat(
    request: ChatRequest,
    orch: AIOrchestrator = Depends(get_orchestrator)
):
    """
    简单聊天接口（支持流式响应）
    注意：这是一个简单的聊天接口，不支持资源对话。
    如果需要与资源对话，请使用 /api/v1/ai/chat 端点。

    Args:
        request: 聊天请求

    Returns:
        聊天响应（流式或常规）
    """
    logger.info(f"Chat request: model={request.model}, stream={request.stream}, message_len={len(request.message)}")

    # 构建完整的提示
    prompt = request.message
    if request.context:
        prompt = f"Context:\n{request.context}\n\nUser Question:\n{request.message}"

    # 根据指定的模型选择客户端
    if request.model == "grok":
        client = orch.grok
    else:
        client = orch.openai

    if not client.available:
        raise HTTPException(status_code=503, detail=f"{request.model.upper()} service unavailable")

    if request.stream:
        # 流式响应
        async def generate():
            try:
                async for chunk in client.stream_completion(prompt, max_tokens=2000, temperature=0.7):
                    # 以 SSE 格式发送
                    yield f"data: {json.dumps({'content': chunk, 'model': request.model})}\n\n"
                yield "data: [DONE]\n\n"
            except Exception as e:
                logger.error(f"Streaming error: {str(e)}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        )
    else:
        # 常规响应
        result = await client.generate_completion(prompt, max_tokens=2000, temperature=0.7)

        if result is None:
            raise HTTPException(status_code=503, detail="Failed to generate response")

        return {
            "content": result,
            "model": request.model
        }


@router.post("/quick-action")
async def quick_action(
    request: QuickActionRequest,
    orch: AIOrchestrator = Depends(get_orchestrator)
):
    """
    快捷操作（摘要、洞察、方法论）

    Args:
        request: 快捷操作请求

    Returns:
        操作结果
    """
    logger.info(f"Quick action: {request.action}, model={request.model}")

    # 根据不同的 action 构建不同的 prompt
    if request.action == "methodology":
        prompt = f"""You are a JSON-only API. Analyze the research methodology or technical methods in the following content.

Content:
{request.content}

Requirements:
1. Extract 3-5 main methods or techniques
2. Each method must have exactly these fields: title, description, importance
3. importance must be one of: high, medium, low
4. Output ONLY a valid JSON array, nothing else
5. No explanations, no markdown, no code blocks, just the JSON array

Output format (follow exactly):
[{{"title":"Method Name","description":"Method description and features","importance":"high"}},{{"title":"Method Name 2","description":"Method description 2","importance":"medium"}}]

JSON output:
["""
    elif request.action == "summary":
        prompt = f"""请为以下内容生成一个结构化的摘要：

{request.content}

要求：
- 核心观点（2-3个要点）
- 主要发现或结论
- 实际应用价值
- 使用清晰的标题和列表格式
"""
    else:  # insights
        prompt = f"""You are a JSON-only API. Extract key insights from the following content.

Content:
{request.content}

Requirements:
1. Extract 3-5 key insights
2. Each insight must have exactly these fields: title, description, importance
3. importance must be one of: high, medium, low
4. Output ONLY a valid JSON array, nothing else
5. No explanations, no markdown, no code blocks, just the JSON array

Output format (follow exactly):
[{{"title":"Core Finding","description":"Research reveals significant breakthrough","importance":"high"}},{{"title":"Application Value","description":"Can be applied to production","importance":"medium"}}]

JSON output:
["""

    # 选择模型
    if request.model == "grok":
        client = orch.grok
    else:
        client = orch.openai

    if not client.available:
        raise HTTPException(status_code=503, detail=f"{request.model.upper()} service unavailable")

    result = await client.generate_completion(prompt, max_tokens=1500, temperature=0.7)

    if result is None:
        raise HTTPException(status_code=503, detail="Failed to generate response")

    # 对于需要JSON格式的action，尝试提取JSON
    if request.action in ["methodology", "insights"]:
        try:
            # 提取JSON部分（可能被markdown代码块包裹）
            json_content = result.strip()

            # 如果prompt以"["结尾，响应可能不包含开头的"["，需要补上
            # 检查响应是否以某个对象开始
            if json_content.startswith('{"') or json_content.startswith('{'):
                # 可能缺少开头的"["，补上
                if not json_content.startswith('['):
                    json_content = '[' + json_content
                    # 检查结尾是否缺少"]"
                    if not json_content.endswith(']'):
                        # 尝试找到最后一个完整的}
                        last_brace = json_content.rfind('}')
                        if last_brace != -1:
                            json_content = json_content[:last_brace + 1] + ']'

            # 移除markdown代码块标记
            if "```json" in json_content:
                json_content = json_content.split("```json")[1].split("```")[0].strip()
            elif "```" in json_content:
                json_content = json_content.split("```")[1].split("```")[0].strip()

            # 移除可能的前后文本，只保留JSON数组部分
            # 尝试找到第一个 [ 和最后一个 ]
            start_idx = json_content.find('[')
            end_idx = json_content.rfind(']')

            if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                json_content = json_content[start_idx:end_idx + 1]

            # 尝试解析JSON
            import json as json_lib
            parsed_json = json_lib.loads(json_content)

            # 验证是否为数组
            if isinstance(parsed_json, list):
                # 如果解析成功，返回JSON字符串
                result = json_lib.dumps(parsed_json, ensure_ascii=False)
                logger.info(f"Successfully parsed JSON for {request.action}: {len(parsed_json)} items")
            else:
                logger.warning(f"Parsed JSON is not an array for {request.action}, returning original content")

        except Exception as e:
            logger.error(f"Failed to parse JSON for {request.action}: {str(e)}")
            logger.debug(f"Original content: {result[:500]}...")
            # 如果解析失败，返回原始内容，前端会尝试使用markdown解析

    return {
        "content": result,
        "action": request.action,
        "model": request.model
    }


class TranslateRequest(BaseModel):
    """翻译请求"""
    text: str
    targetLanguage: str = "zh-CN"
    model: Literal["grok", "openai", "gpt-4"] = "gpt-4"


@router.post("/translate")
async def translate_text(
    request: TranslateRequest,
    orch: AIOrchestrator = Depends(get_orchestrator)
):
    """
    翻译文本

    Args:
        request: 翻译请求

    Returns:
        翻译结果
    """
    logger.info(f"Translating text to {request.targetLanguage}, length: {len(request.text)}")

    prompt = f"""Translate the following text to {request.targetLanguage}.
Preserve the line breaks and structure. Only output the translation, no explanations.

Text to translate:
{request.text}

Translation:"""

    # 选择模型（默认使用 OpenAI，因为翻译质量更好）
    if request.model == "grok":
        client = orch.grok
    else:
        client = orch.openai

    if not client.available:
        raise HTTPException(status_code=503, detail=f"{request.model} service unavailable")

    result = await client.generate_completion(prompt, max_tokens=4000, temperature=0.3)

    if result is None:
        raise HTTPException(status_code=503, detail="Failed to generate translation")

    return {
        "translatedText": result.strip(),
        "targetLanguage": request.targetLanguage,
        "model": request.model
    }


class YouTubeReportRequest(BaseModel):
    """YouTube报告生成请求"""
    title: str
    transcript: str
    model: Literal["grok", "openai", "gpt-4"] = "gpt-4"


@router.post("/youtube-report")
async def generate_youtube_report(
    request: YouTubeReportRequest,
    orch: AIOrchestrator = Depends(get_orchestrator)
):
    """
    根据YouTube字幕生成报告

    Args:
        request: YouTube报告请求

    Returns:
        报告内容
    """
    logger.info(f"Generating YouTube report for: {request.title}")

    prompt = f"""Please analyze the following YouTube video transcript and generate a comprehensive report.

Video Title: {request.title}

Transcript:
{request.transcript}

Generate a structured report with the following sections:
1. **Summary** (概要): 2-3 sentences summarizing the main content
2. **Key Points** (要点): 3-5 bullet points of the most important takeaways
3. **Detailed Analysis** (详细分析): Deeper analysis of the content, themes, and implications
4. **Conclusions** (结论): Final thoughts and recommendations

Format the output in clear sections with markdown headings."""

    # 选择模型
    if request.model == "grok":
        client = orch.grok
    else:
        client = orch.openai

    if not client.available:
        raise HTTPException(status_code=503, detail=f"{request.model} service unavailable")

    result = await client.generate_completion(prompt, max_tokens=2000, temperature=0.7)

    if result is None:
        raise HTTPException(status_code=503, detail="Failed to generate report")

    return {
        "title": f"Analysis Report: {request.title}",
        "summary": "AI-generated analysis of the video content",
        "sections": [
            {
                "title": "Full Report",
                "content": result
            }
        ],
        "model": request.model
    }

