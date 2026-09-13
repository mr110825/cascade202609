"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createThreadAction } from "@/app/actions/threads";
import type { FormState } from "@/lib/form-state";

const VISIBILITY_OPTIONS = [
  { value: "PUBLIC", label: "公開" },
  { value: "LIMITED", label: "限定公開" },
  { value: "PRIVATE", label: "非公開" },
];

export function NewThreadForm() {
  const initialState: FormState = {};
  const [state, formAction, pending] = useActionState(
    createThreadAction,
    initialState,
  );

  return (
    <form action={formAction}>
      {state.error && <p className="form-error">{state.error}</p>}

      <div className="form-group">
        <label className="form-label" htmlFor="title">
          タイトル
        </label>
        <input
          id="title"
          name="title"
          type="text"
          className="input"
          placeholder="学習テーマを入力（例: Terraformの基礎を理解する）"
          required
        />
        <span className="form-hint">
          スレッドの学習テーマを簡潔に記入してください
        </span>
      </div>

      <div className="form-group">
        <span className="form-label">公開設定</span>
        <div className="filter-group w-fit">
          {VISIBILITY_OPTIONS.map((option) => (
            <label key={option.value} className="filter-group__btn">
              <input
                type="radio"
                name="visibility"
                value={option.value}
                defaultChecked={option.value === "PRIVATE"}
              />
              {option.label}
            </label>
          ))}
        </div>
        <span className="form-hint">
          公開: 誰でも閲覧可能 / 限定公開: URLを知っている人のみ / 非公開: 自分だけ
        </span>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="firstComment">
          最初のコメント（任意）
        </label>
        <textarea
          id="firstComment"
          name="firstComment"
          className="input textarea"
          placeholder="学習の目標や計画を書いておくと、後から振り返りやすくなります..."
        />
        <span className="form-hint">
          Markdown記法が使えます。作成後にコメントを追加することもできます
        </span>
      </div>

      <div className="flex items-center gap-3 border-t border-border py-6">
        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={pending}
        >
          {pending ? "作成中..." : "スレッドを作成"}
        </button>
        <Link href="/dashboard" className="btn btn-ghost">
          キャンセル
        </Link>
      </div>
    </form>
  );
}
