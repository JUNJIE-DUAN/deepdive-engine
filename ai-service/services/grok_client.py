"""
Grok API 客户端 (x.AI)
"""
import httpx
from typing import Optional
from loguru import logger


class GrokClient:
    """Grok API 客户端"""

    def __init__(self, api_key: Optional[str] = None):
        """
        初始化 Grok 客户端

        Args:
            api_key: Grok API 密钥
        """
        self.api_key = api_key
        self.base_url = "https://api.x.ai/v1"
        self.available = bool(api_key)

        if not self.available:
            logger.warning("Grok API key not available")
        else:
            logger.info("Grok client initialized")

    async def generate_completion(
        self,
        prompt: str,
        max_tokens: int = 500,
        temperature: float = 0.7
    ) -> Optional[str]:
        """
        生成文本补全

        Args:
            prompt: 提示词
            max_tokens: 最大 token 数
            temperature: 温度参数

        Returns:
            生成的文本，失败返回 None
        """
        if not self.available:
            logger.error("Grok client not available")
            return None

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "grok-3",
                        "messages": [
                            {"role": "user", "content": prompt}
                        ],
                        "max_tokens": max_tokens,
                        "temperature": temperature,
                    }
                )

                if response.status_code == 200:
                    data = response.json()
                    return data["choices"][0]["message"]["content"]
                else:
                    logger.error(f"Grok API error: {response.status_code} - {response.text}")
                    return None

        except Exception as e:
            logger.error(f"Grok API exception: {str(e)}")
            return None

    async def health_check(self) -> bool:
        """
        健康检查

        Returns:
            是否可用
        """
        if not self.available:
            return False

        try:
            result = await self.generate_completion("Hello", max_tokens=10)
            return result is not None
        except Exception as e:
            logger.error(f"Grok health check failed: {str(e)}")
            return False
