"""
报告生成路由 - 多素材AI综合报告
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import json
import logging

from services.grok_client import GrokClient
from services.openai_client import OpenAIClient

router = APIRouter()
logger = logging.getLogger(__name__)

# 初始化AI客户端
grok_client = GrokClient()
openai_client = OpenAIClient()


class Resource(BaseModel):
    """资源模型"""
    id: str
    title: str
    abstract: Optional[str] = None
    authors: Optional[Any] = None
    published_date: Optional[str] = None
    tags: Optional[Any] = None
    type: str


class ReportRequest(BaseModel):
    """报告生成请求"""
    resources: List[Resource] = Field(..., min_items=2, max_items=10)
    template: str = Field(..., pattern="^(comparison|trend|learning-path|literature-review)$")
    model: str = Field(default="grok", pattern="^(grok|gpt-4)$")


class ReportSection(BaseModel):
    """报告章节"""
    title: str
    content: str


class ReportResponse(BaseModel):
    """报告响应"""
    title: str
    summary: str
    sections: List[ReportSection]
    metadata: Optional[Dict[str, Any]] = None


def prepare_resources_info(resources: List[Resource]) -> str:
    """准备资源信息文本"""
    info_parts = []
    for i, resource in enumerate(resources, 1):
        # 处理authors
        authors_str = "N/A"
        if resource.authors:
            if isinstance(resource.authors, list):
                authors_str = ", ".join(resource.authors[:3])  # 只显示前3个作者
            elif isinstance(resource.authors, str):
                authors_str = resource.authors

        # 处理tags
        tags_str = "N/A"
        if resource.tags:
            if isinstance(resource.tags, list):
                tags_str = ", ".join(resource.tags[:5])  # 只显示前5个标签
            elif isinstance(resource.tags, str):
                tags_str = resource.tags

        # 处理abstract
        abstract = resource.abstract or "No abstract available"
        if len(abstract) > 500:
            abstract = abstract[:500] + "..."

        info = f"""
Resource {i}:
- ID: {resource.id}
- Title: {resource.title}
- Type: {resource.type}
- Date: {resource.published_date or 'N/A'}
- Authors: {authors_str}
- Tags: {tags_str}
- Abstract: {abstract}
"""
        info_parts.append(info)

    return "\n".join(info_parts)


# 报告模板Prompts
REPORT_PROMPTS = {
    "comparison": """You are a technical analyst. Analyze and compare the following {count} resources.

Resources:
{resources_info}

Generate a comprehensive comparison report with these sections:

1. **Executive Summary** (200-300 words)
   - Overview of all resources
   - Main themes and connections
   - Key takeaways

2. **Detailed Comparison**
   Create a comparison table in markdown format with these aspects:
   - Approach/Method
   - Key Innovation
   - Performance/Results
   - Limitations
   - Use Cases

3. **Key Insights** (5-7 bullet points)
   - Common patterns across resources
   - Key differences and trade-offs
   - Evolution and improvements
   - Complementary aspects

4. **Recommendations**
   - Which to choose for different scenarios
   - Learning order suggestions
   - Further reading

IMPORTANT: Output ONLY valid JSON in this exact format:
{{
  "title": "Comparison of [Topic]",
  "summary": "Executive summary text...",
  "sections": [
    {{"title": "Detailed Comparison", "content": "markdown table and text"}},
    {{"title": "Key Insights", "content": "markdown list"}},
    {{"title": "Recommendations", "content": "markdown text"}}
  ]
}}

JSON output:
""",

    "trend": """You are a technology trend analyst. Analyze the following {count} resources to identify trends.

Resources:
{resources_info}

Generate a trend analysis report with these sections:

1. **Overview** (150-200 words)
   - Time span covered
   - Main themes
   - Overall direction

2. **Technology Timeline**
   Create a chronological timeline in markdown format showing:
   - Year/Date
   - Key milestone
   - Innovation introduced
   - Impact level (High/Medium/Low)

3. **Key Breakthroughs** (4-6 items)
   For each breakthrough:
   - What changed
   - Why it matters
   - Follow-up work

4. **Trend Predictions**
   - Emerging patterns
   - Likely next developments (3-6 months)
   - Opportunities and challenges

IMPORTANT: Output ONLY valid JSON in this exact format:
{{
  "title": "Trend Analysis: [Topic]",
  "summary": "Overview text...",
  "sections": [
    {{"title": "Technology Timeline", "content": "markdown timeline"}},
    {{"title": "Key Breakthroughs", "content": "markdown list"}},
    {{"title": "Trend Predictions", "content": "markdown text"}}
  ]
}}

JSON output:
""",

    "learning-path": """You are a learning path designer. Create a structured learning plan from these {count} resources.

Resources:
{resources_info}

Generate a learning path report with these sections:

1. **Learning Objectives** (150 words)
   - What you'll learn
   - Target audience
   - Prerequisites

2. **Recommended Learning Sequence**
   For each resource (in order):
   - Resource title and type
   - Difficulty level (Beginner/Intermediate/Advanced)
   - Estimated time investment
   - Key concepts covered
   - Why this sequence matters

3. **Difficulty Analysis**
   - Concept progression
   - Knowledge dependencies
   - Potential challenges

4. **Practice Recommendations**
   - Hands-on projects
   - Additional resources
   - Learning tips

IMPORTANT: Output ONLY valid JSON in this exact format:
{{
  "title": "Learning Path: [Topic]",
  "summary": "Learning objectives text...",
  "sections": [
    {{"title": "Recommended Learning Sequence", "content": "markdown ordered list"}},
    {{"title": "Difficulty Analysis", "content": "markdown text"}},
    {{"title": "Practice Recommendations", "content": "markdown list"}}
  ]
}}

JSON output:
""",

    "literature-review": """You are an academic researcher. Write a literature review for these {count} resources.

Resources:
{resources_info}

Generate an academic literature review with these sections:

1. **Introduction and Background** (200-250 words)
   - Research context
   - Motivation and significance
   - Scope of review

2. **Methodology Evolution**
   Discuss how methods have evolved:
   - Early approaches
   - Key innovations
   - Current state-of-the-art

3. **Comparative Analysis**
   Create a detailed comparison of:
   - Research methods
   - Results and findings
   - Strengths and limitations

4. **Future Directions**
   - Open problems
   - Promising research directions
   - Potential applications

IMPORTANT: Output ONLY valid JSON in this exact format:
{{
  "title": "Literature Review: [Topic]",
  "summary": "Introduction text...",
  "sections": [
    {{"title": "Methodology Evolution", "content": "markdown text"}},
    {{"title": "Comparative Analysis", "content": "markdown text with tables"}},
    {{"title": "Future Directions", "content": "markdown list"}}
  ]
}}

JSON output:
"""
}


def parse_json_response(response_text: str) -> Dict[str, Any]:
    """解析AI响应中的JSON"""
    try:
        # 尝试直接解析
        return json.loads(response_text)
    except json.JSONDecodeError:
        # 尝试提取JSON部分
        response_text = response_text.strip()

        # 移除markdown代码块
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()

        # 查找JSON对象
        start_idx = response_text.find('{')
        end_idx = response_text.rfind('}')

        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            json_str = response_text[start_idx:end_idx + 1]
            try:
                return json.loads(json_str)
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON: {e}\nContent: {json_str[:200]}")
                raise

        raise ValueError("No valid JSON found in response")


@router.post("/api/v1/ai/generate-report", response_model=ReportResponse)
async def generate_report(request: ReportRequest):
    """
    生成多素材综合报告

    Args:
        request: 包含资源列表、模板和模型的请求

    Returns:
        ReportResponse: 结构化的报告内容
    """
    try:
        logger.info(f"Generating {request.template} report for {len(request.resources)} resources using {request.model}")

        # 1. 准备资源信息
        resources_info = prepare_resources_info(request.resources)

        # 2. 选择prompt模板
        prompt_template = REPORT_PROMPTS.get(request.template)
        if not prompt_template:
            raise HTTPException(status_code=400, detail=f"Invalid template: {request.template}")

        # 3. 构建完整prompt
        prompt = prompt_template.format(
            count=len(request.resources),
            resources_info=resources_info
        )

        # 4. 调用AI生成
        if request.model == "gpt-4":
            logger.info("Using OpenAI GPT-4")
            response = await openai_client.chat(
                messages=[{
                    "role": "system",
                    "content": "You are a helpful AI assistant that generates structured reports. Always output valid JSON."
                }, {
                    "role": "user",
                    "content": prompt
                }],
                model="gpt-4",
                temperature=0.7,
                max_tokens=3000
            )
        else:
            logger.info("Using Grok")
            response = await grok_client.chat(
                messages=[{
                    "role": "system",
                    "content": "You are a helpful AI assistant that generates structured reports. Always output valid JSON."
                }, {
                    "role": "user",
                    "content": prompt
                }],
                temperature=0.7,
                max_tokens=3000
            )

        # 5. 解析响应
        report_data = parse_json_response(response)

        # 6. 验证必需字段
        if "title" not in report_data or "summary" not in report_data or "sections" not in report_data:
            raise ValueError("Response missing required fields: title, summary, or sections")

        # 7. 构建响应
        result = ReportResponse(
            title=report_data["title"],
            summary=report_data["summary"],
            sections=[
                ReportSection(title=s["title"], content=s["content"])
                for s in report_data["sections"]
            ],
            metadata={
                "model": request.model,
                "template": request.template,
                "resourceCount": len(request.resources),
            }
        )

        logger.info(f"Successfully generated report: {result.title}")
        return result

    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse AI response as JSON: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Report generation error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate report: {str(e)}"
        )


@router.get("/api/v1/ai/report-templates")
async def get_report_templates():
    """获取可用的报告模板列表"""
    return {
        "templates": [
            {
                "id": "comparison",
                "name": "对比分析",
                "description": "多维度对比各素材的特点、优劣势和适用场景",
                "icon": "📊",
                "minItems": 2,
                "maxItems": 5,
                "estimatedTime": "60秒",
                "model": "gpt-4",
            },
            {
                "id": "trend",
                "name": "趋势报告",
                "description": "分析技术演进轨迹和未来发展方向",
                "icon": "📈",
                "minItems": 3,
                "maxItems": 10,
                "estimatedTime": "45秒",
                "model": "grok",
            },
            {
                "id": "learning-path",
                "name": "学习路径",
                "description": "生成由浅入深的学习计划和实践建议",
                "icon": "🗺️",
                "minItems": 3,
                "maxItems": 8,
                "estimatedTime": "50秒",
                "model": "grok",
            },
            {
                "id": "literature-review",
                "name": "文献综述",
                "description": "学术风格的文献综述报告",
                "icon": "📝",
                "minItems": 5,
                "maxItems": 10,
                "estimatedTime": "90秒",
                "model": "gpt-4",
            },
        ]
    }
