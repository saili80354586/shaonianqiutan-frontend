# 部署指南

## 环境要求

- Node.js 20+
- npm 10+
- Nginx (推荐) 或 Apache

## 生产构建

```bash
# 安装依赖
npm ci

# 类型检查
npx tsc --noEmit

# 运行测试
npm test

# 生产构建
npm run build
```

构建输出将在 `dist/` 目录中。

## 环境变量

前端运行时默认通过同源路径访问后端，推荐生产环境让 Nginx 代理 `/api` 和 `/ws`：

```bash
VITE_API_BASE_URL=/api
VITE_WS_URL=
```

本地开发时，Vite 会把 `/api` 和 `/ws` 转发到后端：

```bash
VITE_DEV_API_TARGET=http://localhost:8080
VITE_DEV_SERVER_PORT=5173
```

如果前端需要直连独立 API 域名，可以显式设置：

```bash
VITE_API_BASE_URL=https://api.your-domain.com/api
VITE_WS_URL=wss://api.your-domain.com/ws
```

后端需要同步允许对应前端来源：

```bash
FRONTEND_URL=https://your-domain.com
CORS_ALLOWED_ORIGINS=https://your-domain.com,https://admin.your-domain.com
BASE_URL=https://api.your-domain.com
```

## 手动部署

### 1. 构建应用

```bash
npm run build
```

### 2. 配置 Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/shaonianqiutan/dist;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 前端路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api {
        proxy_pass http://backend-server:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket 代理
    location /ws {
        proxy_pass http://backend-server:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. 部署文件

```bash
# 复制构建文件到服务器
rsync -avz --delete dist/ user@server:/var/www/shaonianqiutan/

# 重启 Nginx
ssh user@server "sudo systemctl restart nginx"
```

## Docker 部署

### Dockerfile

```dockerfile
# 构建阶段
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 生产阶段
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 构建和运行

```bash
# 构建镜像
docker build -t shaonianqiutan-frontend .

# 运行容器
docker run -d -p 80:80 --name shaonianqiutan shaonianqiutan-frontend
```

## CI/CD 自动部署

项目已配置 GitHub Actions 工作流 (`.github/workflows/ci.yml`)：

- **Push/PR 到 main/develop**: 自动运行测试和构建
- **合并到 main**: 自动部署

### 配置 Secrets

在 GitHub 仓库设置中添加：

- `DEPLOY_HOST`: 服务器地址
- `DEPLOY_USER`: 部署用户
- `DEPLOY_KEY`: SSH 私钥

## 健康检查

部署后访问以下端点验证：

```bash
# 检查应用是否运行
curl https://your-domain.com

# 检查静态资源
curl https://your-domain.com/assets/index-*.js
```

## 回滚

```bash
# 保留旧版本备份
mv /var/www/shaonianqiutan /var/www/shaonianqiutan-backup-$(date +%Y%m%d)

# 恢复旧版本
mv /var/www/shaonianqiutan-backup-YYYYMMDD /var/www/shaonianqiutan
```

## 监控

建议配置：

- **Uptime 监控**: UptimeRobot, Pingdom
- **性能监控**: Google Analytics, Sentry
- **日志收集**: ELK Stack, Graylog
