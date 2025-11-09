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


@router.post("/chat")
async def chat(
    request: ChatRequest,
    orch: AIOrchestrator = Depends(get_orchestrator)
):
    """
    聊天接口（支持流式响应）

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
        prompt = f"""请分析以下内容的研究方法论或技术方法：

{request.content}

要求：
- 识别主要的方法论或技术手段
- 说明方法的创新点和优势
- 指出可能的局限性
- 以清晰的结构化方式呈现（使用标题和列表）
"""
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
        prompt = f"""请从以下内容中提取关键洞察：

{request.content}

要求：
- 识别3-5个关键洞察
- 每个洞察包含标题和详细说明
- 标注重要性（高/中/低）
- 说明对读者的启发
"""

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

    return {
        "content": result,
        "action": request.action,
        "model": request.model
    }
