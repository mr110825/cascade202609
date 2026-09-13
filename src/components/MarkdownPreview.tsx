"use client";

import { MarkdownHooks } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeShiki from "@shikijs/rehype";

// 入力中のプレビュー用。ブラウザ側で Markdown を組み立てる。
//
// 投稿後の表示（MarkdownBody）との違いは使うコンポーネントだけ。
//   ・MarkdownAsync … Server Component 用（描画そのものを await できる）
//   ・MarkdownHooks … Client Component 用（内部で待ってから描き直す）
// plugin と theme を同じにしてあるので、プレビューと投稿後の見た目が一致する。
//
// Shiki の読み込みが終わるまでの一瞬は fallback を出す。
export function MarkdownPreview({ body }: { body: string }) {
  return (
    <div className="markdown">
      <MarkdownHooks
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeShiki, { theme: "github-dark" }]]}
        fallback={<p className="form-hint">プレビューを準備しています...</p>}
      >
        {body}
      </MarkdownHooks>
    </div>
  );
}
