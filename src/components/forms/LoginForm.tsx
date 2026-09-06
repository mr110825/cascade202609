"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import type { FormState } from "@/lib/form-state";

export function LoginForm() {
  const initialState: FormState = {};
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <form action={formAction}>
      {state.error && <p className="form-error">{state.error}</p>}

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
          placeholder="パスワードを入力"
          required
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary btn-lg btn-block"
        disabled={pending}
      >
        {pending ? "ログイン中..." : "ログイン"}
      </button>
    </form>
  );
}
