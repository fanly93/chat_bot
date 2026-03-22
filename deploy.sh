#!/bin/bash
# ============================================================
# ChatBot 一键部署脚本（Linux）
# 使用方式：
#   chmod +x deploy.sh
#   ./deploy.sh
# ============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== ChatBot 部署脚本 ===${NC}"

# 1. 检查依赖
echo -e "\n${YELLOW}[1/5] 检查依赖...${NC}"
command -v docker >/dev/null 2>&1 || { echo -e "${RED}错误：未安装 Docker${NC}"; exit 1; }
command -v docker compose >/dev/null 2>&1 || { echo -e "${RED}错误：未安装 Docker Compose${NC}"; exit 1; }
echo "Docker 版本: $(docker --version)"
echo "Docker Compose 版本: $(docker compose version)"

# 2. 检查环境变量文件
echo -e "\n${YELLOW}[2/5] 检查环境变量配置...${NC}"
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}backend/.env 不存在，从模板创建...${NC}"
    cp .env.example backend/.env
    echo -e "${RED}请编辑 backend/.env，填写 API Key，然后重新运行此脚本${NC}"
    exit 1
fi

# 检查 SECRET_KEY 是否还是默认值
if grep -q "change-me-in-production" backend/.env; then
    echo -e "${RED}警告：backend/.env 中的 SECRET_KEY 仍为默认值，请修改为随机字符串！${NC}"
    echo -e "可以运行：openssl rand -hex 32"
    exit 1
fi

echo "环境变量配置检查通过"

# 3. 构建并启动服务
echo -e "\n${YELLOW}[3/5] 构建并启动 Docker 服务...${NC}"
docker compose -f docker-compose.prod.yml up -d --build

# 4. 等待数据库就绪
echo -e "\n${YELLOW}[4/5] 等待数据库就绪...${NC}"
sleep 5
docker compose -f docker-compose.prod.yml exec -T backend sh -c \
    "until alembic upgrade head 2>&1; do echo '数据库未就绪，等待...'; sleep 3; done" || {
    echo -e "${YELLOW}尝试手动执行迁移...${NC}"
    docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
}

# 5. 显示状态
echo -e "\n${YELLOW}[5/5] 服务状态${NC}"
docker compose -f docker-compose.prod.yml ps

echo -e "\n${GREEN}=== 部署完成 ===${NC}"
echo -e "前端地址：${GREEN}http://$(hostname -I | awk '{print $1}'):3000${NC}"
echo -e "后端地址：${GREEN}http://$(hostname -I | awk '{print $1}'):8000${NC}"
echo -e "API 文档：${GREEN}http://$(hostname -I | awk '{print $1}'):8000/docs${NC}"
echo ""
echo -e "查看日志：${YELLOW}docker compose -f docker-compose.prod.yml logs -f${NC}"
echo -e "停止服务：${YELLOW}docker compose -f docker-compose.prod.yml down${NC}"
