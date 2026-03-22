import json
import time
from typing import AsyncGenerator

from openai import AsyncOpenAI

from app.config import get_settings

settings = get_settings()

MODEL_CONFIG = {
    # ── OpenAI ──────────────────────────────────────────────────────────────
    "gpt-4o": {
        "display_name": "GPT-4o",
        "description": "OpenAI 最强多模态旗舰模型",
        "base_url": settings.OPENAI_BASE_URL,
        "api_key": settings.OPENAI_API_KEY,
        "supports_thinking": False,
        "thinking_params": {},
        "provider": "openai",
    },
    "gpt-4o-mini": {
        "display_name": "GPT-4o mini",
        "description": "OpenAI 轻量快速模型，性价比高",
        "base_url": settings.OPENAI_BASE_URL,
        "api_key": settings.OPENAI_API_KEY,
        "supports_thinking": False,
        "thinking_params": {},
        "provider": "openai",
    },
    # ── DeepSeek ────────────────────────────────────────────────────────────
    "deepseek-chat": {
        "display_name": "DeepSeek V3",
        "description": "DeepSeek 旗舰对话模型，支持深度思考",
        "base_url": "https://api.deepseek.com",
        "api_key": settings.DEEPSEEK_API_KEY,
        "supports_thinking": True,
        "thinking_params": {"thinking": {"type": "enabled"}},
        "provider": "deepseek",
    },
    "deepseek-reasoner": {
        "display_name": "DeepSeek R1",
        "description": "DeepSeek 深度推理模型，思维链更完整",
        "base_url": "https://api.deepseek.com",
        "api_key": settings.DEEPSEEK_API_KEY,
        "supports_thinking": True,
        "thinking_params": {},
        "provider": "deepseek",
    },
    # ── Qwen ────────────────────────────────────────────────────────────────
    "qwen3-235b-a22b": {
        "display_name": "Qwen3 235B",
        "description": "通义千问 3 超大参数模型，支持深度思考",
        "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "api_key": settings.QWEN_API_KEY,
        "supports_thinking": True,
        "thinking_params": {"enable_thinking": True},
        "provider": "qwen",
    },
    "qwen-plus": {
        "display_name": "Qwen Plus",
        "description": "通义千问增强版，均衡速度与能力",
        "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "api_key": settings.QWEN_API_KEY,
        "supports_thinking": False,
        "thinking_params": {},
        "provider": "qwen",
    },
    # ── 智谱 AI ─────────────────────────────────────────────────────────────
    "glm-4.6": {
        "display_name": "GLM-4.6",
        "description": "智谱 AI 最新旗舰模型，支持深度思考",
        "base_url": "https://open.bigmodel.cn/api/paas/v4/",
        "api_key": settings.ZHIPU_API_KEY,
        "supports_thinking": True,
        "thinking_params": {"thinking": {"type": "enabled"}},
        "provider": "zhipu",
    },
    "glm-4-flash": {
        "display_name": "GLM-4 Flash",
        "description": "智谱 AI 免费轻量模型，响应极快",
        "base_url": "https://open.bigmodel.cn/api/paas/v4/",
        "api_key": settings.ZHIPU_API_KEY,
        "supports_thinking": False,
        "thinking_params": {},
        "provider": "zhipu",
    },
}

DEFAULT_MODEL = "deepseek-chat"


def get_model_config(model_name: str) -> dict:
    return MODEL_CONFIG.get(model_name, MODEL_CONFIG[DEFAULT_MODEL])


def _make_client(config: dict) -> AsyncOpenAI:
    """创建 AsyncOpenAI 客户端。智谱 AI 的 OpenAI 兼容端点支持直接使用 API Key。"""
    return AsyncOpenAI(api_key=config["api_key"], base_url=config["base_url"])


def get_available_models() -> list[dict]:
    return [
        {
            "id": model_id,
            "display_name": cfg["display_name"],
            "description": cfg["description"],
            "provider": cfg["provider"],
            "supports_thinking": cfg["supports_thinking"],
        }
        for model_id, cfg in MODEL_CONFIG.items()
    ]


async def generate_title(user_message: str, assistant_reply: str) -> str:
    """用 LLM 为对话生成简短标题（使用便宜的模型）"""
    config = MODEL_CONFIG.get("qwen-plus", MODEL_CONFIG[DEFAULT_MODEL])
    client = _make_client(config)

    try:
        response = await client.chat.completions.create(
            model="qwen-plus",
            messages=[
                {
                    "role": "system",
                    "content": "根据下面的对话内容，生成一个简短的中文标题（不超过15个字），只输出标题本身，不要加引号或其他符号。",
                },
                {
                    "role": "user",
                    "content": f"用户: {user_message[:200]}\n助手: {assistant_reply[:300]}",
                },
            ],
            max_tokens=30,
        )
        title = response.choices[0].message.content.strip()
        title = title.strip('"\'""''')
        return title[:30] if title else user_message[:20]
    except Exception:
        return user_message[:20]
    finally:
        await client.close()


async def stream_chat(
    model_name: str,
    messages: list[dict],
) -> AsyncGenerator[str, None]:
    """
    流式调用 LLM，yield SSE 格式的事件字符串。
    事件类型: thinking / content / done / error
    """
    config = get_model_config(model_name)
    client = _make_client(config)

    extra_body = {}
    if config["supports_thinking"]:
        extra_body = config["thinking_params"]

    create_kwargs = {
        "model": model_name,
        "messages": messages,
        "stream": True,
    }
    if extra_body:
        create_kwargs["extra_body"] = extra_body

    reasoning_content = ""
    content = ""

    try:
        response = await client.chat.completions.create(**create_kwargs)

        async for chunk in response:
            if not chunk.choices:
                continue

            delta = chunk.choices[0].delta
            finish_reason = chunk.choices[0].finish_reason

            rc = getattr(delta, "reasoning_content", None)
            if rc:
                reasoning_content += rc
                yield f"data: {json.dumps({'type': 'thinking', 'content': rc}, ensure_ascii=False)}\n\n"

            c = getattr(delta, "content", None)
            if c:
                content += c
                yield f"data: {json.dumps({'type': 'content', 'content': c}, ensure_ascii=False)}\n\n"

            if finish_reason == "stop":
                break

        yield f"data: {json.dumps({'type': 'done', 'reasoning_content': reasoning_content, 'content': content}, ensure_ascii=False)}\n\n"

    except Exception as e:
        error_msg = str(e)
        yield f"data: {json.dumps({'type': 'error', 'message': error_msg}, ensure_ascii=False)}\n\n"

    finally:
        await client.close()
