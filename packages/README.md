# 青笋 · 安装包目录

本目录存放可直接部署的安装产物，由 `npm run package` 生成。

| 目录/文件 | 说明 |
|-----------|------|
| `frontend/` | 前端静态站点（部署到 Nginx / 对象存储） |
| `server/` | 后端生产构建（Node.js 运行） |
| `qingsun-frontend.zip` | 前端安装包 |
| `qingsun-server.zip` | 后端安装包 |

## 前端部署

将 `frontend/` 内所有文件托管为静态网站，或将 `qingsun-frontend.zip` 解压后部署。

## 后端部署

```bash
cd server
cp .env.example .env   # 配置 JWT_SECRET 等
npm install --omit=dev
node dist/index.js
```

或使用 `qingsun-server.zip` 解压后按上述步骤操作。默认端口 `3001`。

## 完整联调

前端需将 `/api` 反向代理到后端，开发环境可参考项目根目录 `vite.config.ts`。
