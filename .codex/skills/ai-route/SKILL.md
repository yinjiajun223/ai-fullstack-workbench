---
name: ai-route
description: 用于创建或修改会调用 AI 模型、流式输出、生成结构化结果或使用 embedding 的后端 API Route。
---

# AI Route Skill

## 目标

创建安全、可观测、供应商无关的 AI 后端接口。

## 规则

- AI provider 调用只能发生在服务端。
- 使用 Zod 校验请求体。
- 使用环境变量前必须统一读取和校验。
- 使用 `src/server/ai` 下的 provider adapter。
- 不要在 route handler 里散落供应商特定逻辑。
- 每个请求都要有 request id。
- 归一化 provider 错误。
- 可用时记录 token usage、latency、model、status。
- UI 需要流式输出时，route 必须支持 streaming。
- 不要返回 secret、原始堆栈或 provider 内部错误。

## 完成前检查

- 请求输入已校验。
- 错误响应格式一致。
- 模型 key 没有暴露到前端。
- 已记录 token 和基础成本信息，若当前可获得。
- 新增环境变量时已更新 `.env.example`。
