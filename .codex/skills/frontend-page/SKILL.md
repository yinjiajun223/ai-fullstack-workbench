---
name: frontend-page
description: 用于创建或重构 Next.js 前端页面、AI 聊天界面、仪表盘、表单、表格或任何用户可见的交互组件。
---

# 前端页面 Skill

## 目标

为 AI 全栈工作台创建生产级前端页面和组件。

## 规则

- 使用 Next.js App Router。
- 使用 TypeScript。
- 使用 React 函数组件。
- 默认使用 Server Component，只有需要交互时才使用 Client Component。
- 使用 Tailwind CSS 和 shadcn/ui 风格组件。
- 客户端组件绝不能直接调用模型供应商 API。
- 用户可见的异步模块必须包含 loading、empty、error、success 状态。
- 组件保持小而可组合。
- 使用语义化 HTML 和可访问表单标签。
- 不要在组件里硬编码无关业务数据。

## 完成前检查

- 页面没有 TypeScript 错误。
- 有空状态。
- 有加载状态。
- 有错误状态。
- 响应式布局可接受。
- 交互控件可访问。
- API 调用隔离在服务端 route、service 或 hook 中。
