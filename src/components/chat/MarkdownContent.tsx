type MarkdownContentProps = {
  content: string;
};

type MarkdownBlock =
  | {
      type: "code";
      language?: string;
      content: string;
    }
  | {
      type: "text";
      content: string;
    };

export function MarkdownContent({ content }: MarkdownContentProps) {
  const blocks = parseMarkdownBlocks(content);

  return (
    <div className="space-y-3 text-sm leading-7 text-zinc-800">
      {blocks.map((block, index) => {
        if (block.type === "code") {
          return (
            <figure
              className="overflow-hidden rounded-md border border-zinc-200 bg-zinc-950"
              key={`${block.type}-${index}`}
            >
              {block.language ? (
                <figcaption className="border-b border-white/10 px-3 py-2 text-xs text-zinc-300">
                  {block.language}
                </figcaption>
              ) : null}
              <pre className="overflow-x-auto p-4 text-sm leading-6 text-zinc-50">
                <code>{block.content}</code>
              </pre>
            </figure>
          );
        }

        return renderTextBlock(block.content, index);
      })}
    </div>
  );
}

function parseMarkdownBlocks(content: string): MarkdownBlock[] {
  const lines = content.split(/\r?\n/);
  const blocks: MarkdownBlock[] = [];
  let textBuffer: string[] = [];
  let codeBuffer: string[] = [];
  let codeLanguage: string | undefined;
  let inCodeBlock = false;

  const flushText = () => {
    const text = textBuffer.join("\n").trim();

    if (text) {
      blocks.push({ type: "text", content: text });
    }

    textBuffer = [];
  };

  for (const line of lines) {
    const fenceMatch = line.match(/^```([a-zA-Z0-9_-]+)?\s*$/);

    if (fenceMatch) {
      if (inCodeBlock) {
        blocks.push({
          type: "code",
          language: codeLanguage,
          content: codeBuffer.join("\n"),
        });
        codeBuffer = [];
        codeLanguage = undefined;
        inCodeBlock = false;
      } else {
        flushText();
        codeLanguage = fenceMatch[1];
        inCodeBlock = true;
      }

      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    textBuffer.push(line);
  }

  if (inCodeBlock) {
    blocks.push({
      type: "code",
      language: codeLanguage,
      content: codeBuffer.join("\n"),
    });
  }

  flushText();

  return blocks;
}

function renderTextBlock(content: string, index: number) {
  const lines = content.split(/\r?\n/).filter(Boolean);
  const listLines = lines.filter((line) => /^[-*]\s+/.test(line));

  if (listLines.length === lines.length && lines.length > 0) {
    return (
      <ul className="list-disc space-y-1 pl-5" key={`list-${index}`}>
        {lines.map((line, lineIndex) => (
          <li key={lineIndex}>{renderInlineMarkdown(line.replace(/^[-*]\s+/, ""))}</li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-2" key={`text-${index}`}>
      {lines.map((line, lineIndex) => {
        const heading = line.match(/^(#{1,3})\s+(.+)$/);

        if (heading) {
          const HeadingTag = heading[1].length === 1 ? "h2" : heading[1].length === 2 ? "h3" : "h4";

          return (
            <HeadingTag className="font-semibold text-zinc-950" key={lineIndex}>
              {renderInlineMarkdown(heading[2])}
            </HeadingTag>
          );
        }

        return <p key={lineIndex}>{renderInlineMarkdown(line)}</p>;
      })}
    </div>
  );
}

function renderInlineMarkdown(text: string) {
  const parts = text.split(/(`[^`]+`)/g);

  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-zinc-900" key={index}>
          {part.slice(1, -1)}
        </code>
      );
    }

    return <span key={index}>{part}</span>;
  });
}
