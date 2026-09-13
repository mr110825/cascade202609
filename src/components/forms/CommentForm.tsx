"use client";

import { useActionState, useState } from "react";
import { MarkdownPreview } from "@/components/MarkdownPreview";
import { createCommentAction } from "@/app/actions/comments";
import type { FormState } from "@/lib/form-state";

// コメント投稿フォーム。
//
// 呼び出し側で key={comments.length} を付けている。
// 投稿が成功するとコメント件数が変わり、React はこれを「別のコンポーネント」と
// 見なして作り直す。結果、下の useState（本文・タブ）が初期値に戻り、
// 入力欄が自動で空になる。投稿後に自分で setBody("") しなくてよい。
export function CommentForm({ threadId }: { threadId: string }) {
  const initialState: FormState = {};
  const [state, formAction, pending] = useActionState(
    createCommentAction,
    initialState,
  );

  const [body, setBody] = useState("");
  const [tab, setTab] = useState<"write" | "preview">("write");

  return (
    <form action={formAction} className="mt-6">
      {state.error && <p className="form-error">{state.error}</p>}

      <input type="hidden" name="threadId" value={threadId} />
      {/* 本文は textarea ではなく hidden input で送る。
          プレビュー中は textarea が DOM から消えるため、
          textarea に name を付けていると本文が送信されなくなる。 */}
      <input type="hidden" name="body" value={body} />

      <div className="form-group">
        <div className="filter-group w-fit">
          {/* type="button" は必須。form 内の button は既定で submit 扱いになるので、
              指定しないとタブを切り替えるたびに空投稿が飛ぶ。 */}
          <button
            type="button"
            className={`filter-group__btn${tab === "write" ? " active" : ""}`}
            onClick={() => setTab("write")}
          >
            Write
          </button>
          <button
            type="button"
            className={`filter-group__btn${tab === "preview" ? " active" : ""}`}
            onClick={() => setTab("preview")}
          >
            Preview
          </button>
        </div>
      </div>

      {tab === "write" ? (
        <div className="form-group">
          <label className="form-label" htmlFor="commentBody">
            コメントを追加
          </label>
          <textarea
            id="commentBody"
            className="input textarea"
            placeholder="学習の記録やつまずいた点を書き残しましょう..."
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
          <span className="form-hint">
            Markdown記法が使えます（コードブロックは色付きで表示されます）
          </span>
        </div>
      ) : (
        <div className="form-group">
          <span className="form-label">プレビュー</span>
          <div className="comment-preview">
            {body.trim() ? (
              <MarkdownPreview body={body} />
            ) : (
              <p className="form-hint">プレビューする内容がありません</p>
            )}
          </div>
        </div>
      )}

      <button
        type="submit"
        className="btn btn-primary"
        disabled={pending || !body.trim()}
      >
        {pending ? "投稿中..." : "コメントを投稿"}
      </button>
    </form>
  );
}
