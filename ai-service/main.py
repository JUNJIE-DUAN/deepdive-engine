"""
DeepDive AI Service - FastAPI 应用入口
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from loguru import logger
import sys
import os

# ⚠️ 关键：必须在导入 secret_manager 之前加载环境变量
load_dotenv()

# Import routers
from routers import ai, report, workspace, quick_generate
from services.grok_client import GrokClient
from services.openai_client import OpenAIClient
from services.ai_orchestrator import AIOrchestrator
from utils.secret_manager import secret_manager
from utils.feature_flags import is_workspace_ai_v2_enabled

# 配置日志
logger.remove()
# Windows 环境下配置 UTF-8 输出以支持 emoji
import io
import platform
if platform.system() == "Windows":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
    level="INFO"
)

# 创建 FastAPI 应用
app = FastAPI(
    title="DeepDive AI Service",
    description="AI-driven insights and content processing service",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# 配置 CORS - 使用正则表达式匹配所有localhost端口
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://localhost:\d+",  # 允许所有localhost端口
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # OPTIONS预检缓存时间
)

# 初始化 AI 客户端
grok_api_key = secret_manager.get_grok_api_key()
openai_api_key = secret_manager.get_openai_api_key()

grok_client = GrokClient(api_key=grok_api_key)
openai_client = OpenAIClient(api_key=openai_api_key)

# 初始化编排器（全局单例）
orchestrator = AIOrchestrator(grok_client, openai_client)

# 注册路由
app.include_router(ai.router, prefix="/api/v1")
app.include_router(report.router)
app.include_router(workspace.router, prefix="/api/v1")
app.include_router(quick_generate.router)

# 将AI客户端注入到report路由中
report.init_clients(grok_client, openai_client)
quick_generate.init_clients(grok_client, openai_client)


@app.get("/")
async def root():
    """根路径"""
    return {
        "service": "DeepDive AI Service",
        "version": "1.0.0",
        "status": "running",
        "workspaceAiV2Enabled": is_workspace_ai_v2_enabled(),
    }


@app.get("/api/v1")
async def api_root():
    """API 根路径"""
    return {
        "message": "DeepDive AI Service API v1",
        "endpoints": {
            "summary": "/api/v1/ai/summary",
            "insights": "/api/v1/ai/insights",
            "classify": "/api/v1/ai/classify",
            "health": "/api/v1/ai/health"
        }
    }


@app.on_event("startup")
async def startup_event():
    """应用启动事件"""
    logger.info("🚀 DeepDive AI Service starting up...")
    logger.info(f"📝 Grok available: {grok_client.available}")
    logger.info(f"📝 OpenAI available: {openai_client.available}")
    logger.info(f"🎯 Active model: {orchestrator.active_model}")
    logger.info(f"🧩 Workspace AI v2 enabled: {is_workspace_ai_v2_enabled()}")


@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭事件"""
    logger.info("👋 DeepDive AI Service shutting down...")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8000)),
        
        log_level="info"
    )
