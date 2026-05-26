# 数据库

项目后续使用用户已有的阿里云数据库。当前阶段还没有正式接入数据库。

## 方向

- 优先使用现有阿里云数据库。
- 默认使用 Drizzle ORM。
- 所有 schema 变更走 migrations。
- AI 请求日志和用户内容尽量分表保存。
- 不存储明文密钥。

## 建议表

按模块逐步引入，不一次性建全：

- `users`
- `conversations`
- `messages`
- `ai_requests`
- `tool_calls`
- `documents`
- `document_chunks`
- `eval_runs`
- `eval_cases`
- `eval_results`

## 下一步

建议先接最小三张表：

- `conversations`
- `messages`
- `ai_requests`

这样可以先把 Chat 历史和 AI 请求日志落库。
