"use server";

import { redirect } from "next/navigation";
import { createThread, updateThreadTitle } from "@/lib/services/threads";
import { requireUser } from "@/lib/auth";
import { text, type FormState } from "@/lib/form-state";
import type { Visibility } from "@/generated/prisma/enums";

// 作成だけは入力エラーを画面に出したいので useActionState 用の形にしている。
export async function createThreadAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const result = await createThread(
    user.id,
    text(formData, "title"),
    text(formData, "visibility") as Visibility,
    text(formData, "firstComment"),
  );

  if (!result.ok) {
    return { error: result.error };
  }

  redirect(`/threads/${result.threadId}`);
}

// ここから下は結果を画面に出す必要がないので、
// <form action={...}> に直接渡せる形（FormData だけを受け取る）にしている。
// 終わったらスレッド詳細へ戻す。

export async function updateThreadTitleAction(formData: FormData) {
  const user = await requireUser();
  const threadId = text(formData, "threadId");

  await updateThreadTitle(user.id, threadId, text(formData, "title"));

  redirect(`/threads/${threadId}`);
}
