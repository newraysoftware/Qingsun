# 青笋 · 介入医生自学培训平台

ToC 介入医生自学培训网站，围绕 **培训体系 → 培训规划 → 培训内容** 核心逻辑搭建。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + TypeScript + Vite + Tailwind CSS 4 |
| 后端 | Express 5 + TypeScript + Node 内置 SQLite (`node:sqlite`) |
| 认证 | JWT + bcrypt 密码加密 |

## 本地运行

### 1. 安装依赖

```bash
npm install
cd server && npm install && cd ..
```

### 2. 配置后端环境变量

```bash
cp server/.env.example server/.env
```

按需修改 `server/.env` 中的 `JWT_SECRET`（生产环境务必更换）。

### 3. 同时启动前后端

```bash
npm run dev
```

- 前端：http://localhost:5173
- 后端 API：http://localhost:3001（开发时通过 Vite 代理 `/api`）

也可分别启动：

```bash
npm run dev:web   # 仅前端
npm run dev:api   # 仅后端
```

## 用户注册与登录

### 页面操作

1. 打开网站，点击右上角 **注册**，填写姓名、邮箱、密码、从业年限
2. 注册成功后自动登录并跳转 **我的培训规划**
3. 已有账号使用 **登录**；个人中心可 **退出登录**

### 需登录的功能

- 我的培训规划、个人中心、学习激励、培训考核、交流互动

浏览培训体系、内容、案例等可游客访问；游客学习进度保存在浏览器本地。

### API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/auth/register` | 注册 `{ email, password, name, yearsOfPractice? }` |
| `POST` | `/api/auth/login` | 登录 `{ email, password }` |
| `GET` | `/api/auth/me` | 获取当前用户（Header: `Authorization: Bearer <token>`） |
| `PATCH` | `/api/users/me` | 更新学习档案（积分、阶段进度等） |

示例：

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@example.com","password":"securepass","name":"张医生","yearsOfPractice":3}'
```

## 构建

```bash
npm run build          # 前端
npm run build:server   # 后端
npm run package        # 生成 packages/ 安装包（含 zip）
```

## 仓库目录说明

| 路径 | 内容 |
|------|------|
| `/` | 工程源代码（前端 + `server/` 后端） |
| `packages/` | 可部署安装包（前端静态站、后端构建产物） |
| `scripts/` | 构建与发布脚本 |

## 发布到 GitHub

```bash
./scripts/publish-to-github.sh
```

首次运行需按提示完成 `gh auth login`。

## 数据存储

- 用户账号与培训档案：`server/data/qingsun.db`（SQLite，已加入 `.gitignore`）
- JWT 令牌：浏览器 `localStorage`（键名 `qingsun-token`）

## 功能模块

### 自学核心端
培训体系、个性化规划、分阶段内容、考核评估、学习激励、交流互动

### 公共服务端
专家资源、资讯工具、虚拟实操、典型案例

### 管理后台
`/admin` 内容/用户/体系/统计/激励管理（演示界面）
