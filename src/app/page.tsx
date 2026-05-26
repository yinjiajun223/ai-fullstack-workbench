import Link from "next/link";

const copy = {
  eyebrow: "AI 全栈工作台",
  title: "AI 全栈学习工作台",
  description:
    "按 AGENTS.md 的里程碑逐步完成 Chat、结构化输出、工具调用、RAG、Agent、MCP、Evals 和部署。",
  open: "打开模块",
  pending: "待实现",
  enabled: "已接入",
  planned: "规划中",
};

const modules = [
  {
    title: "AI 聊天",
    description: "流式对话、Markdown、代码块、停止生成和重新生成。",
    href: "/chat",
    status: copy.enabled,
  },
  {
    title: "结构化输出",
    description: "基于场景 schema 生成 JSON，并展示校验结果。",
    href: "/structured-output",
    status: copy.enabled,
  },
  {
    title: "工具调用",
    description: "展示后端工具选择、输入校验、执行状态和结构化输出。",
    href: "/tool-calling",
    status: copy.enabled,
  },
  {
    title: "RAG 知识库",
    description: "文档上传、切分、检索、引用回答和调试面板。",
    href: "#",
    status: copy.planned,
  },
  {
    title: "Agent 工作流",
    description: "简单 agent loop、步骤展示和安全工具调用。",
    href: "#",
    status: copy.planned,
  },
  {
    title: "MCP 演示",
    description: "把项目能力通过本地 MCP server 暴露给 AI client。",
    href: "#",
    status: copy.planned,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-100">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <header className="space-y-3">
          <p className="text-sm font-medium text-zinc-500">{copy.eyebrow}</p>
          <div className="max-w-3xl space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              {copy.title}
            </h1>
            <p className="text-sm leading-6 text-zinc-600">{copy.description}</p>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => {
            const enabled = module.href !== "#";

            return (
              <article className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm" key={module.title}>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold text-zinc-950">{module.title}</h2>
                  <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600">
                    {module.status}
                  </span>
                </div>
                <p className="mt-3 min-h-12 text-sm leading-6 text-zinc-600">{module.description}</p>
                {enabled ? (
                  <Link
                    className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
                    href={module.href}
                  >
                    {copy.open}
                  </Link>
                ) : (
                  <button
                    className="mt-5 inline-flex h-10 cursor-not-allowed items-center justify-center rounded-md border border-zinc-200 px-4 text-sm font-medium text-zinc-400"
                    disabled
                    type="button"
                  >
                    {copy.pending}
                  </button>
                )}
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
