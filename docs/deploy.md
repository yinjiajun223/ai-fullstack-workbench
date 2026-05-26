# 部署

默认部署目标是用户自己的服务器。

## 基础流程

1. 按 `.env.example` 配置环境变量。
2. 执行 `pnpm install` 安装依赖。
3. 执行 `pnpm build` 构建项目。
4. 如果已经接入数据库，先运行 migration。
5. 使用 `pnpm start` 启动应用。
6. 用进程管理器或 Docker 托管 Node 进程。
7. 用 Nginx 做反向代理。
8. 配置 HTTPS 证书。

## 必需环境变量

- `APP_ENV`
- `APP_URL`
- `AI_PROVIDER`
- `AI_BASE_URL`
- `AI_API_KEY`
- `AI_CHAT_MODEL`
- `AI_FAST_MODEL`
- `AI_REASONING_MODEL`
- `AI_EMBEDDING_MODEL`

后续接数据库、Qdrant、Redis 后，再补充对应变量。

## 回滚

- 保留上一版构建产物或容器镜像。
- 代码回滚和环境变量回滚要一起做。
- 数据库 migration 上线前要准备 rollback 方案。
