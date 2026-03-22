import json
from typing import AsyncGenerator

from openai import AsyncOpenAI

from app.config import get_settings

settings = get_settings()

MODEL_CONFIG = {
    "deepseek-chat": {
        "base_url": "https://api.deepseek.com",
        "api_key": settings.DEEPSEEK_API_KEY,
        "supports_thinking": True,
        "thinking_params": {"thinking": {"type": "enabled"}},
        "provider": "deepseek",
    },
    "qwen3-235b-a22b": {
        "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "api_key": settings.QWEN_API_KEY,
        "supports_thinking": True,
        "thinking_params": {"enable_thinking": True},
        "provider": "qwen",
    },
    "qwen-plus": {
        "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "api_key": settings.QWEN_API_KEY,
        "supports_thinking": False,
        "thinking_params": {},
        "provider": "qwen",
    },
}

DEFAULT_MODEL = "deepseek-chat"


def get_model_config(model_name: str) -> dict:
    return MODEL_CONFIG.get(model_name, MODEL_CONFIG[DEFAULT_MODEL])


def get_available_models() -> list[dict]:
    return [
        {
            "id": model_id,
            "provider": cfg["provider"],
            "supports_thinking": cfg["supports_thinking"],
        }
        for model_id, cfg in MODEL_CONFIG.items()
    ]


async def generate_title(user_message: str, assistant_reply: str) -> str:
    """用 LLM 为对话生成简短标题（使用便宜的模型）"""
    config = MODEL_CONFIG.get("qwen-plus", MODEL_CONFIG[DEFAULT_MODEL])
    client = AsyncOpenAI(api_key=config["api_key"], base_url=config["base_url"])

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
    事件类型: thinking / content / done
    """
    config = get_model_config(model_name)
    client = AsyncOpenAI(api_key=config["api_key"], base_url=config["base_url"])

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

    response = await client.chat.completions.create(**create_kwargs)

    reasoning_content = ""
    content = ""

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

    await client.close()
