#!/bin/bash

# 少年球探 - 一键部署脚本
# 使用方法: ./deploy.sh [环境] [操作]
# 示例: ./deploy.sh production deploy

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 目录
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
NGINX_CONF="$PROJECT_ROOT/deploy/nginx.conf"
SYSTEMD_SERVICE="/etc/systemd/system/shaonianqiutan.service"

log() { echo -e "${GREEN}[部署]${NC} $1"; }
warn() { echo -e "${YELLOW}[警告]${NC} $1"; }
error() { echo -e "${RED}[错误]${NC} $1"; exit 1; }

# 检查命令
command_exists() { command -v "$1" >/dev/null 2>&1; }

# 1. 构建后端
build_backend() {
  log "开始构建后端..."
  cd "$BACKEND_DIR"

  if command_exists go; then
    log "Go版本: $(go version"
    go build -o shaonianqiutan .
    log "后端构建成功"
  else
    warn "Go未安装，跳过后端构建"
    warn "请手动执行: cd $BACKEND_DIR && go build -o main ."
  fi
}

# 2. 构建前端
build_frontend() {
  log "开始构建前端..."
  cd "$FRONTEND_DIR"

  if command_exists npm; then
    log "npm版本: $(npm --version)"
    npm install
    npm run build
    log "前端构建成功"
  else
    error "npm未安装"
  fi
}

# 3. 配置Nginx
config_nginx() {
  log "配置Nginx..."
  if [ -f /etc/nginx/nginx.conf ]; then
    sudo cp "$NGINX_CONF" /etc/nginx/sites-available/shaonianqiutan.conf
    sudo ln -sf /etc/nginx/sites-enabled/shaonianqiutan.conf /etc/nginx/sites-enabled/ 2>/dev/null || true
    sudo nginx -t && sudo systemctl reload nginx
    log "Nginx配置完成"
  fi
}

# 4. 配置Systemd服务
config_systemd() {
  log "配置Systemd服务..."

  if [ -f "$SYSTEMD_SERVICE" ]; then
    sudo cp "$PROJECT_ROOT/deploy/shaonianqiutan.service" /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable shaonianqiutan
    sudo systemctl restart shaonianqiutan
    log "后端服务已启动"
  fi
}

# 5. 防火墙
config_firewall() {
  if command_exists ufw; then
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw allow 8080/tcp
    log "防火墙规则已添加"
  fi
}

# 主函数
main() {
  log "少年球探一键部署脚本"
  log "项目目录: $PROJECT_ROOT"

  build_backend
  build_frontend
  config_nginx
  config_systemd
  config_firewall

  log "部署完成!"
  log "访问 http://localhost 查看"
}

# 前端独立构建
build_frontend_only() {
  cd "$FRONTEND_DIR"
  npm install
  npm run build
  echo "前端构建产物: $FRONTEND_DIR/dist"
}

# 帮助
help() {
  echo "使用: ./deploy.sh [命令]"
  echo "  build     构建项目"
  echo "  start     启动服务"
  echo "  stop      停止服务"
  echo "  restart   重启服务"
  echo "  status    服务状态"
  echo "  logs      查看日志"
}

# 执行
case "${1:-help}" in
  build) main ;;
  start) sudo systemctl start shaonianqiutan ;;
  stop) sudo systemctl stop shaonianqiutan ;;
  restart) sudo systemctl restart shaonianqiutan ;;
  status) systemctl --user status shaonianqiutan ;;
  logs) journalctl -u shaonianqiutan -f ;;
  frontend) build_frontend_only ;;
  *) help ;;
esac
