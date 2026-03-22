from fastapi import APIRouter

from app.services.llm_service import get_available_models

router = APIRouter(prefix="/api", tags=["models"])


@router.get("/models")
async def list_models():
    """返回所有可用 LLM 模型列表，无需认证"""
    return get_available_models()
