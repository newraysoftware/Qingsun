#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

GH="${GH:-gh}"
if ! command -v "$GH" >/dev/null 2>&1; then
  GH="/opt/homebrew/bin/gh"
fi

REPO_NAME="${REPO_NAME:-Qingsun}"
GITHUB_USER="${GITHUB_USER:-}"

if ! "$GH" auth status >/dev/null 2>&1; then
  echo "请先登录 GitHub："
  "$GH" auth login --hostname github.com --git-protocol https --web
fi

if [ -z "$GITHUB_USER" ]; then
  GITHUB_USER="$("$GH" api user -q .login)"
fi

echo ">>> 生成安装包..."
npm run package

echo ">>> 初始化 Git 仓库..."
if [ ! -d .git ]; then
  git init -b main
fi

git add -A
git status

if git diff --cached --quiet; then
  echo "没有需要提交的变更。"
else
  git commit -m "$(cat <<'EOF'
Initial commit: 青笋介入培训平台源码与安装包

包含完整前后端源代码及 packages/ 可部署安装产物。
EOF
)"
fi

REMOTE="https://github.com/${GITHUB_USER}/${REPO_NAME}.git"

if "$GH" repo view "${GITHUB_USER}/${REPO_NAME}" >/dev/null 2>&1; then
  echo ">>> 远程仓库已存在: ${GITHUB_USER}/${REPO_NAME}"
else
  echo ">>> 创建 GitHub 仓库 ${REPO_NAME}..."
  "$GH" repo create "$REPO_NAME" --public --source=. --remote=origin --description "青笋 - 介入医生自学培训平台"
fi

git remote remove origin 2>/dev/null || true
git remote add origin "$REMOTE"
git push -u origin main

echo ""
echo "完成: https://github.com/${GITHUB_USER}/${REPO_NAME}"
