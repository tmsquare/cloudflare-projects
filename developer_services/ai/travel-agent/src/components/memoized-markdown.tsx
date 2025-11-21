import { marked } from "marked";
import type { Tokens } from "marked";
import { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PerfectStayResults } from "@/components/perfectstay-card/PerfectStayCard";

function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens: TokensList = marked.lexer(markdown);
  return tokens.map((token: Tokens.Generic) => token.raw);
}

type TokensList = Array<Tokens.Generic & { raw: string }>;

// Parse PerfectStay JSON results from markdown
function extractPerfectStayResults(content: string): { products: any[] } | null {
  try {
    // Look for JSON code blocks containing products
    const jsonMatch = content.match(/```json\s*(\{[\s\S]*?"products"\s*:\s*\[[\s\S]*?\][\s\S]*?\})\s*```/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed.products && Array.isArray(parsed.products)) {
        return parsed;
      }
    }

    // Try direct JSON parsing
    if (content.trim().startsWith('{') && content.includes('"products"')) {
      const parsed = JSON.parse(content);
      if (parsed.products && Array.isArray(parsed.products)) {
        return parsed;
      }
    }
  } catch (e) {
    // Not JSON or not PerfectStay results
  }
  return null;
}

const MemoizedMarkdownBlock = memo(
  ({ content }: { content: string }) => {
    // Check if this block contains PerfectStay results
    const perfectStayData = extractPerfectStayResults(content);
    
    if (perfectStayData && perfectStayData.products.length > 0) {
      return <PerfectStayResults products={perfectStayData.products} />;
    }

    return (
      <div className="markdown-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    );
  },
  (prevProps, nextProps) => prevProps.content === nextProps.content
);

MemoizedMarkdownBlock.displayName = "MemoizedMarkdownBlock";

export const MemoizedMarkdown = memo(
  ({ content, id }: { content: string; id: string }) => {
    const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content]);
    return blocks.map((block, index) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: immutable index
      <MemoizedMarkdownBlock content={block} key={`${id}-block_${index}`} />
    ));
  }
);

MemoizedMarkdown.displayName = "MemoizedMarkdown";
