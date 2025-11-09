"""
AI API 路由
"""
from fastapi import APIRouter, HTTPException, Depends
from loguru import logger
from models.schemas import (
    SummaryRequest, SummaryResponse,
    InsightRequest, InsightResponse, Insight,
    ClassificationRequest, ClassificationResponse,
    HealthResponse
)
from services.ai_orchestrator import AIOrchestrator


router = APIRouter(prefix="/ai", tags=["AI"])


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
