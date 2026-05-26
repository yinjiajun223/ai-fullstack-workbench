---
name: rag-pipeline
description: 用于构建或修改文档上传、文本抽取、chunking、embedding、向量存储、检索、引用答案生成或 RAG 评估逻辑。
---

# RAG Pipeline Skill

## 目标

构建可靠的知识库 ingestion 和检索增强生成流程。

## 规则

RAG 必须拆成清晰阶段：

1. loading
2. parsing
3. chunking
4. embedding
5. storage
6. retrieval
7. generation
8. citation rendering
9. evaluation

## Chunk 记录必须包含

- document id
- chunk id
- chunk index
- source name
- page number，若可获得
- text
- metadata

## Retrieval 必须做到

- 返回内容和 metadata。
- 支持 topK。
- 预留 future filters。
- 能把 retrieved chunks 暴露给调试 UI。

## Generation 必须做到

- 在知识库模式下只基于 retrieved context 回答。
- 找不到信息时明确说明。
- 可获得来源时包含 citation 或 source reference。

## 完成前检查

- ingestion path 和 query path 已分离。
- embedding provider 已抽象。
- vector store 逻辑已抽象。
- retrieval 可调试。
- 有意义的修改至少添加一个 eval case。
