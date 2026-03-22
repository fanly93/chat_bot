# ChatBot - AI 对话问答系统

基于 Next.js + FastAPI 的类 ChatGPT 对话问答系统，支持多模型切换、流式输出、思考链展示、联网搜索。

## 技术栈

- **前端**: Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui
- **后端**: FastAPI + SQLAlchemy 2.0 (async) + PostgreSQL + Redis
- **LLM**: OpenAI / DeepSeek / Qwen / 智谱 AI (通过 openai SDK 统一调用)

## 快速开始

### 1. 启动数据库

```bash
docker compose up -d
```

### 2. 后端

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

### 3. 前端

```bash
cd frontend
npm install
npm run dev
```

访问 http://localhost:3000 查看健康检查页面。

## 环境变量

复制 `.env.example` 为 `.env`，填写 API Key：

```
OPENAI_API_KEY=sk-xxx
DEEPSEEK_API_KEY=sk-xxx
QWEN_API_KEY=sk-xxx
ZHIPU_API_KEY=xxx
TAVILY_API_KEY=tvly-xxx
```
