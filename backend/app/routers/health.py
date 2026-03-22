from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.database import get_db
from app.config import get_settings

router = APIRouter()


@router.get("/api/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    settings = get_settings()
    result = {"status": "ok", "database": False, "redis": False}

    try:
        await db.execute(text("SELECT 1"))
        result["database"] = True
    except Exception:
        result["status"] = "degraded"

    try:
        r = aioredis.from_url(settings.REDIS_URL)
        await r.ping()
        await r.aclose()
        result["redis"] = True
    except Exception:
        result["status"] = "degraded"

    return result
