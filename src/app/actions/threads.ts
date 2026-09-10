"use server";

import { redirect } from "next/navigation";
import { createThread } from "@/lib/services/threads";
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
