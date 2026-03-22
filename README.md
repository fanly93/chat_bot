# ChatBot - AI 对话问答系统

基于 Next.js + FastAPI 的类 ChatGPT 对话问答系统，支持多模型切换、流式输出、思考链展示、联网搜索、深色模式。

## 技术栈

- **前端**: Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui + Zustand
- **后端**: FastAPI + SQLAlchemy 2.0 (async) + PostgreSQL + Redis
- **LLM**: OpenAI / DeepSeek / Qwen / 智谱 AI（通过 openai SDK 统一调用）
- **搜索**: Tavily API 联网搜索

## 功能特性

- 多模型切换（同一会话内可切换模型）
- 流式输出 + 思考链（Thinking）展示
- 联网搜索，带来源卡片展示
- 自动生成会话标题
- 停止生成 / 重新生成
- 深色模式 / 浅色模式
- 响应式布局，支持移动端

---

## 快速开始

### 前置条件

- Docker & Docker Compose（用于运行 PostgreSQL 和 Redis）
- Python 3.11+
- Node.js 20+

### 1. 克隆代码

```bash
git clone https://github.com/fanly93/chat_bot.git
cd chat_bot
```

### 2. 配置环境变量

```bash
cp .env.example backend/.env
```

编辑 `backend/.env`，填入你的 API Key：

```env
DATABASE_URL=postgresql+asyncpg://chatbot:chatbot123@localhost:5432/chatbot
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-long-random-secret-key-here

OPENAI_API_KEY=sk-xxx
OPENAI_BASE_URL=https://api.openai.com/v1   # 国内用代理地址

DEEPSEEK_API_KEY=sk-xxx
QWEN_API_KEY=sk-xxx
ZHIPU_API_KEY=xxx
TAVILY_API_KEY=tvly-xxx

# 前端可访问的 URL（CORS），多个用逗号分隔
ALLOWED_ORIGINS=http://localhost:3000
```

### 3. 启动数据库（PostgreSQL + Redis）

```bash
docker compose up -d
```

### 4. 后端

**Linux / macOS：**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Windows：**

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 5. 前端

```bash
cd frontend
npm install
npm run dev       # 开发模式
# npm run build && npm start   # 生产模式
```

访问 [http://localhost:3000](http://localhost:3000)

---

## 一键 Docker 部署（推荐生产环境）

完整容器化部署，包含前端、后端、PostgreSQL、Redis：

```bash
# 1. 配置环境变量
cp .env.example backend/.env
# 编辑 backend/.env，填入 API Key

# 2. 启动全部服务
docker compose -f docker-compose.prod.yml up -d --build

# 3. 执行数据库迁移（仅首次）
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

访问 [http://your-server-ip](http://your-server-ip)（默认前端 80 端口，后端 8000 端口）

---

## 环境变量说明

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `DATABASE_URL` | ✅ | PostgreSQL 连接字符串 |
| `REDIS_URL` | ✅ | Redis 连接字符串 |
| `SECRET_KEY` | ✅ | JWT 签名密钥（生产环境请使用长随机字符串） |
| `OPENAI_API_KEY` | 可选 | OpenAI API Key |
| `OPENAI_BASE_URL` | 可选 | OpenAI 兼容 API 地址（国内代理或自部署） |
| `DEEPSEEK_API_KEY` | 可选 | DeepSeek API Key |
| `QWEN_API_KEY` | 可选 | 阿里云通义千问 API Key |
| `ZHIPU_API_KEY` | 可选 | 智谱 AI API Key |
| `TAVILY_API_KEY` | 可选 | Tavily 联网搜索 API Key |
| `ALLOWED_ORIGINS` | 可选 | 允许跨域的前端地址，默认 `http://localhost:3000` |

---

## 项目结构

```
chat_bot/
├── backend/                # FastAPI 后端
│   ├── app/
│   │   ├── main.py         # FastAPI 应用入口
│   │   ├── config.py       # 配置管理
│   │   ├── database.py     # 数据库连接
│   │   ├── models/         # SQLAlchemy 模型
│   │   ├── schemas/        # Pydantic 模式
│   │   ├── routers/        # API 路由
│   │   ├── services/       # 业务逻辑（LLM、搜索）
│   │   └── middleware/     # 中间件（认证）
│   ├── alembic/            # 数据库迁移
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/               # Next.js 前端
│   ├── src/
│   │   ├── app/            # Next.js App Router 页面
│   │   ├── components/     # React 组件
│   │   ├── stores/         # Zustand 状态管理
│   │   └── lib/            # API 客户端
│   └── Dockerfile
├── docker-compose.yml      # 开发环境（仅数据库）
├── docker-compose.prod.yml # 生产环境（全栈）
└── .env.example            # 环境变量模板
```
