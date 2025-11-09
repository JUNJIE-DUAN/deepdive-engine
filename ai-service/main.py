"""
DeepDive AI Service - FastAPI 应用入口
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from loguru import logger
import sys

# ⚠️ 关键：必须在导入 secret_manager 之前加载环境变量
load_dotenv()

from routers import ai
from services.grok_client import GrokClient
from services.openai_client import OpenAIClient
from services.ai_orchestrator import AIOrchestrator
from utils.secret_manager import secret_manager

# 配置日志
logger.remove()
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

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3003", "http://localhost:4000"],  # 前端和后端
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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


@app.get("/")
async def root():
    """根路径"""
    return {
        "service": "DeepDive AI Service",
        "version": "1.0.0",
        "status": "running"
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


@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭事件"""
    logger.info("👋 DeepDive AI Service shutting down...")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=5000,
        reload=True,
        log_level="info"
    )
