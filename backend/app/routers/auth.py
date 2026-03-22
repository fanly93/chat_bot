import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    RefreshRequest,
    UserResponse,
    MessageResponse,
)
from app.services.auth_service import (
    register_user,
    authenticate_user,
    get_user_by_username,
    get_user_by_email,
    create_access_token,
    create_refresh_token,
    store_refresh_token,
    validate_refresh_token,
    revoke_refresh_token,
    decode_token,
    get_user_by_id,
)
from app.middleware.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    if await get_user_by_username(db, req.username):
        raise HTTPException(status_code=400, detail="用户名已被注册")
    if await get_user_by_email(db, req.email):
        raise HTTPException(status_code=400, detail="邮箱已被注册")

    user = await register_user(db, req.username, req.email, req.password)
    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))
    await store_refresh_token(str(user.id), refresh_token)

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, req.username, req.password)
    if not user:
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))
    await store_refresh_token(str(user.id), refresh_token)

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(req: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(req.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="无效的 refresh token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="无效的 refresh token")

    valid = await validate_refresh_token(user_id, req.refresh_token)
    if not valid:
        raise HTTPException(status_code=401, detail="refresh token 已失效")

    user = await get_user_by_id(db, uuid.UUID(user_id))
    if not user:
        raise HTTPException(status_code=401, detail="用户不存在")

    access_token = create_access_token(user_id)
    new_refresh_token = create_refresh_token(user_id)
    await store_refresh_token(user_id, new_refresh_token)

    return TokenResponse(access_token=access_token, refresh_token=new_refresh_token)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/logout", response_model=MessageResponse)
async def logout(current_user: User = Depends(get_current_user)):
    await revoke_refresh_token(str(current_user.id))
    return MessageResponse(message="已退出登录")
