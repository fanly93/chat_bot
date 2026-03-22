import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.chat import (
    ConversationCreate,
    ConversationUpdate,
    ConversationResponse,
    ConversationDetail,
    MessageResponse,
    SendMessageRequest,
)
from app.services.llm_service import stream_chat, generate_title
from app.services.search_service import search_web

router = APIRouter(prefix="/api/conversations", tags=["chat"])

MAX_CONTEXT_MESSAGES = 20


@router.get("", response_model=list[ConversationResponse])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == current_user.id)
        .order_by(desc(Conversation.updated_at))
    )
    return result.scalars().all()


@router.post("", response_model=ConversationResponse, status_code=201)
async def create_conversation(
    req: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conv = Conversation(
        user_id=current_user.id,
        title=req.title,
        model=req.model,
    )
    db.add(conv)
    await db.flush()
    await db.refresh(conv)
    return conv


@router.get("/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation)
        .options(selectinload(Conversation.messages))
        .where(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="对话不存在")
    return conv


@router.patch("/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    conversation_id: uuid.UUID,
    req: ConversationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="对话不存在")

    if req.title is not None:
        conv.title = req.title
    if req.model is not None:
        conv.model = req.model

    await db.flush()
    await db.refresh(conv)
    return conv


@router.delete("/{conversation_id}", status_code=204)
async def delete_conversation(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="对话不存在")

    await db.delete(conv)


@router.post("/{conversation_id}/messages")
async def send_message(
    conversation_id: uuid.UUID,
    req: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation)
        .options(selectinload(Conversation.messages))
        .where(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="对话不存在")

    user_msg = Message(
        conversation_id=conv.id,
        role="user",
        content=req.content,
    )
    db.add(user_msg)
    await db.flush()

    context = [
        {"role": m.role, "content": m.content}
        for m in conv.messages[-MAX_CONTEXT_MESSAGES:]
    ]
    context.append({"role": "user", "content": req.content})

    collected = {"reasoning_content": "", "content": "", "has_error": False}
    user_content = req.content
    conv_id = conv.id
    conv_title = conv.title

    async def event_generator():
        import json as _json

        llm_context = list(context)  # 拷贝，避免污染外部变量

        # ── 联网搜索 ────────────────────────────────────────────────
        if req.enable_search:
            yield f"data: {_json.dumps({'type': 'searching', 'query': req.content[:100]}, ensure_ascii=False)}\n\n"
            try:
                search_result = await search_web(req.content)
                sources = search_result["sources"]
                search_context = search_result["context"]
                # 将搜索结果来源推送给前端
                yield f"data: {_json.dumps({'type': 'sources', 'sources': sources}, ensure_ascii=False)}\n\n"
                # 在上下文最前面注入 system 消息
                llm_context = [{"role": "system", "content": search_context}] + llm_context
            except Exception as e:
                yield f"data: {_json.dumps({'type': 'search_error', 'message': str(e)}, ensure_ascii=False)}\n\n"

        # ── LLM 流式调用 ─────────────────────────────────────────────
        async for event in stream_chat(conv.model, llm_context):
            yield event

            if event.startswith("data: "):
                try:
                    data = _json.loads(event[6:].strip())
                    if data.get("type") == "done":
                        collected["reasoning_content"] = data.get("reasoning_content", "")
                        collected["content"] = data.get("content", "")
                    elif data.get("type") == "error":
                        collected["has_error"] = True
                except Exception:
                    pass

    async def stream_and_save():
        import json as _json  # noqa: F811

        async for event in event_generator():
            yield event

        # 出错时不保存空的 assistant 消息
        if collected["has_error"] and not collected["content"]:
            return

        new_title = None

        async with async_session() as save_db:
            assistant_msg = Message(
                conversation_id=conv_id,
                role="assistant",
                content=collected["content"] or "",
                reasoning_content=collected["reasoning_content"] or None,
            )
            save_db.add(assistant_msg)

            result = await save_db.execute(
                select(Conversation).where(Conversation.id == conv_id)
            )
            save_conv = result.scalar_one_or_none()
            if save_conv:
                from sqlalchemy import func
                save_conv.updated_at = func.now()

                if conv_title == "新对话" and collected["content"]:
                    try:
                        new_title = await generate_title(user_content, collected["content"])
                        save_conv.title = new_title
                    except Exception:
                        new_title = user_content[:20]
                        save_conv.title = new_title

            await save_db.commit()

        if new_title:
            yield f"data: {_json.dumps({'type': 'title_generated', 'title': new_title}, ensure_ascii=False)}\n\n"

    from app.database import async_session

    return StreamingResponse(
        stream_and_save(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
