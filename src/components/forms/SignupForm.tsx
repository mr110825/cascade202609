"use client";

import { useActionState } from "react";
import { signupAction } from "@/app/actions/auth";
import type { FormState } from "@/lib/form-state";

// "use client" が付いているので、これはブラウザ側でも動くコンポーネント。
// 入力エラーをその場に出したいので Client Component にしている。
//
// useActionState は
//   [ 直前の実行結果, form に渡す関数, 送信中かどうか ]
// の3つを返す。送信中は true になるのでボタンを無効化できる。
export function SignupForm() {
  const initialState: FormState = {};
  const [state, formAction, pending] = useActionState(
    signupAction,
    initialState,
  );

  return (
    <form action={formAction}>
      {state.error && <p className="form-error">{state.error}</p>}

      <div className="form-group">
        <label className="form-label" htmlFor="name">
          ユーザー名
        </label>
        <input
          id="name"
          name="name"
          type="text"
          className="input"
          placeholder="fumi"
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="email">
          メールアドレス
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="input"
          placeholder="you@example.com"
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="password">
          パスワード
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="input"
          placeholder="8文字以上"
          required
        />
        <span className="form-hint">8文字以上で入力してください</span>
      </div>

      <button
        type="submit"
        className="btn btn-primary btn-lg btn-block"
        disabled={pending}
      >
        {pending ? "登録中..." : "アカウントを作成"}
      </button>
    </form>
  );
}
