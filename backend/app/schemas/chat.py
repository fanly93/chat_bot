import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class ConversationCreate(BaseModel):
    title: str = "新对话"
    model: str = "deepseek-chat"


class ConversationUpdate(BaseModel):
    title: str | None = None
    model: str | None = None


class ConversationResponse(BaseModel):
    id: uuid.UUID
    title: str
    model: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MessageResponse(BaseModel):
    id: uuid.UUID
    role: str
    content: str
    reasoning_content: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationDetail(ConversationResponse):
    messages: list[MessageResponse] = []


class SendMessageRequest(BaseModel):
    content: str = Field(min_length=1, max_length=20000)
    enable_search: bool = False
