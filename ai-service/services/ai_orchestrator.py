"""
AI 编排器 - 管理多个 AI 服务提供商的故障切换
"""
from typing import Optional, Literal
from loguru import logger
from .grok_client import GrokClient
from .openai_client import OpenAIClient


class AIOrchestrator:
    """AI 编排器 - 实现故障切换和负载均衡"""

    def __init__(self, grok_client: GrokClient, openai_client: OpenAIClient):
        """
        初始化 AI 编排器

        Args:
            grok_client: Grok 客户端
            openai_client: OpenAI 客户端
        """
        self.grok = grok_client
        self.openai = openai_client

        # 故障计数器
        self.grok_failures = 0
        self.openai_failures = 0

        # 故障阈值（连续失败 3 次则切换）
        self.failure_threshold = 3

        # 当前活跃模型
        self._active_model: Literal["grok", "openai"] = "grok"  # 默认优先使用 Grok

        logger.info("AIOrchestrator initialized")

    @property
    def active_model(self) -> str:
        """获取当前活跃模型"""
        return self._active_model

    async def generate_completion(
        self,
        prompt: str,
        max_tokens: int = 500,
        temperature: float = 0.7,
        force_model: Optional[Literal["grok", "openai"]] = None
    ) -> tuple[Optional[str], str]:
        """
        生成文本补全（带故障切换）

        Args:
            prompt: 提示词
            max_tokens: 最大 token 数
            temperature: 温度参数
            force_model: 强制使用的模型

        Returns:
            (生成的文本, 使用的模型名称)
        """
        # 如果指定了强制模型，直接使用
        if force_model:
            return await self._try_model(force_model, prompt, max_tokens, temperature)

        # 否则使用故障切换逻辑
        result, model = await self._try_model(self._active_model, prompt, max_tokens, temperature)

        if result is not None:
            # 成功，重置失败计数
            if model == "grok":
                self.grok_failures = 0
            else:
                self.openai_failures = 0
            return result, model

        # 当前模型失败，增加失败计数
        logger.warning(f"{self._active_model} failed, trying fallback")

        if self._active_model == "grok":
            self.grok_failures += 1
            if self.grok_failures >= self.failure_threshold:
                logger.warning(f"Grok failed {self.grok_failures} times, switching to OpenAI")
                self._active_model = "openai"

            # 尝试 OpenAI
            result, model = await self._try_model("openai", prompt, max_tokens, temperature)
            if result is not None:
                self.openai_failures = 0
                return result, model

        else:
            self.openai_failures += 1
            if self.openai_failures >= self.failure_threshold:
                logger.warning(f"OpenAI failed {self.openai_failures} times, switching to Grok")
                self._active_model = "grok"

            # 尝试 Grok
            result, model = await self._try_model("grok", prompt, max_tokens, temperature)
            if result is not None:
                self.grok_failures = 0
                return result, model

        # 所有模型都失败
        logger.error("All AI models failed")
        return None, "none"

    async def _try_model(
        self,
        model: Literal["grok", "openai"],
        prompt: str,
        max_tokens: int,
        temperature: float
    ) -> tuple[Optional[str], str]:
        """
        尝试使用指定模型

        Args:
            model: 模型名称
            prompt: 提示词
            max_tokens: 最大 token 数
            temperature: 温度参数

        Returns:
            (生成的文本, 模型名称)
        """
        if model == "grok":
            result = await self.grok.generate_completion(prompt, max_tokens, temperature)
            return result, "grok" if result else "none"
        else:
            result = await self.openai.generate_completion(prompt, max_tokens, temperature)
            return result, "openai" if result else "none"

    async def health_check(self) -> dict:
        """
        健康检查

        Returns:
            各服务的健康状态
        """
        grok_healthy = await self.grok.health_check() if self.grok.available else False
        openai_healthy = await self.openai.health_check() if self.openai.available else False

        return {
            "grok_available": grok_healthy,
            "openai_available": openai_healthy,
            "active_model": self._active_model,
            "status": "ok" if (grok_healthy or openai_healthy) else "error"
        }

    def reset_failures(self):
        """重置失败计数器"""
        self.grok_failures = 0
        self.openai_failures = 0
        logger.info("Failure counters reset")
