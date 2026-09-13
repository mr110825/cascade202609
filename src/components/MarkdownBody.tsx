import { MarkdownAsync } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeShiki from "@shikijs/rehype";

// コメント本文の Markdown 表示。Server Component 側でだけ使う。
//
// MarkdownAsync を使っているのは、Shiki のハイライトが非同期処理だから。
// 通常の <Markdown> は同期レンダリングなので、await が要る rehype プラグインを
// 差せない。RSC なら「描画そのものを待てる」ので、サーバ側で色付けまで済ませて
// 出来上がった HTML だけをブラウザに渡せる（クライアントに Shiki を積まない）。
//
// rehype-raw は入れない。
// 入れると本文中の生 HTML がそのまま DOM になり、<script> や
// <img onerror=...> が動く（＝XSS）。入れなければ react-markdown は
// HTML をタグとして解釈せず、ただの文字として出す。
export async function MarkdownBody({ body }: { body: string }) {
  return (
    <div className="markdown">
      <MarkdownAsync
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeShiki, { theme: "github-dark" }]]}
      >
        {body}
      </MarkdownAsync>
    </div>
  );
}
