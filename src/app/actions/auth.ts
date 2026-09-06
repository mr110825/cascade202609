"use server";

import { redirect } from "next/navigation";
import {
  registerUser,
  login,
  changeName,
  changePassword,
} from "@/lib/services/users";
import {
  createSession,
  deleteSession,
  deleteAllSessionsOfUser,
} from "@/lib/session";
import { requireUser } from "@/lib/auth";
import { text, type FormState } from "@/lib/form-state";

// "use server" が付いたファイルの関数は、ブラウザから直接呼べる
// サーバー側の処理になる（Server Action）。
// <form action={loginAction}> のように form へ直接渡して使う。
// useActionState に渡す関数は「前回の状態」を第1引数で受け取る決まり。

export async function signupAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const result = await registerUser(
    text(formData, "email"),
    text(formData, "name"),
    text(formData, "password"),
  );

  if (!result.ok) {
    return { error: result.error };
  }

  // 登録できたら、そのままログイン状態にする。
  await createSession(result.userId);
  redirect("/dashboard");
}

export async function loginAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const result = await login(
    text(formData, "email"),
    text(formData, "password"),
  );

  if (!result.ok) {
    return { error: result.error };
  }

  await createSession(result.userId);
  redirect("/dashboard");
}

// 引数を取らないので useActionState は使わず、
// <form action={logoutAction}> にそのまま渡せる。
export async function logoutAction(): Promise<void> {
  await deleteSession();
  redirect("/");
}

export async function changeNameAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const result = await changeName(user.id, text(formData, "name"));

  if (!result.ok) {
    return { error: result.error };
  }
  return { success: "ユーザー名を変更しました" };
}

export async function changePasswordAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const result = await changePassword(
    user.id,
    text(formData, "currentPassword"),
    text(formData, "newPassword"),
  );

  if (!result.ok) {
    return { error: result.error };
  }

  // パスワードを変えたら、他の端末に残っているセッションも無効にする。
  // そのあと自分の分だけ作り直して、この画面ではログイン状態を保つ。
  await deleteAllSessionsOfUser(user.id);
  await createSession(user.id);

  return { success: "パスワードを変更しました" };
}
