"use client";

import { useActionState } from "react";
import { changeNameAction, changePasswordAction } from "@/app/actions/auth";
import type { FormState } from "@/lib/form-state";

export function ChangeNameForm({ currentName }: { currentName: string }) {
  const initialState: FormState = {};
  const [state, formAction, pending] = useActionState(
    changeNameAction,
    initialState,
  );

  return (
    <form action={formAction}>
      {state.error && <p className="form-error">{state.error}</p>}
      {state.success && <p className="form-success">{state.success}</p>}

      <div className="form-group">
        <label className="form-label" htmlFor="name">
          ユーザー名
        </label>
        <input
          id="name"
          name="name"
          type="text"
          className="input"
          defaultValue={currentName}
          required
        />
        <span className="form-hint">
          32文字以内。他の人と同じ名前は使えません
        </span>
      </div>

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "変更中..." : "ユーザー名を変更"}
      </button>
    </form>
  );
}

export function ChangePasswordForm() {
  const initialState: FormState = {};
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    initialState,
  );

  return (
    <form action={formAction}>
      {state.error && <p className="form-error">{state.error}</p>}
      {state.success && <p className="form-success">{state.success}</p>}

      <div className="form-group">
        <label className="form-label" htmlFor="currentPassword">
          現在のパスワード
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          className="input"
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="newPassword">
          新しいパスワード
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          className="input"
          required
        />
        <span className="form-hint">
          8文字以上。変更すると他の端末のログインは解除されます
        </span>
      </div>

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "変更中..." : "パスワードを変更"}
      </button>
    </form>
  );
}
