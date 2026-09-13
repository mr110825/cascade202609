"use server";

import { refresh } from "next/cache";
import { notFound, redirect } from "next/navigation";
import {
  createComment,
  updateComment,
  deleteComment,
} from "@/lib/services/comments";
import { requireUser } from "@/lib/auth";
import { text, type FormState } from "@/lib/form-state";

// 投稿だけは入力エラーを画面に出したいので useActionState 用の形にしている
// （スレッド作成 createThreadAction と同じ理由）。
export async function createCommentAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const result = await createComment(
    user.id,
    text(formData, "threadId"),
    text(formData, "body"),
  );

  if (!result.ok) {
    return { error: result.error };
  }

  // Server Action を実行しただけでは画面は描き直されない。
  // ここでルーターを更新して、増えたコメントを一覧に反映させる。
  // （リダイレクトしないのは、投稿位置にとどまりたいため）
  refresh();
  return {};
}

// ここから下は結果を画面に出す必要がないので、
// <form action={...}> に直接渡せる形（FormData だけを受け取る）にしている。
// 終わったらスレッド詳細（?edit= の付かない URL）へ戻す。

export async function updateCommentAction(formData: FormData) {
  const user = await requireUser();
  const threadId = text(formData, "threadId");

  await updateComment(user.id, text(formData, "commentId"), text(formData, "body"));

  redirect(`/threads/${threadId}`);
}

export async function deleteCommentAction(formData: FormData) {
  const user = await requireUser();
  const threadId = text(formData, "threadId");

  const result = await deleteComment(user.id, text(formData, "commentId"));

  // 他人のコメントを指定された場合は削除件数が 0 件になる。
  // スレッド削除（#29）と同じく、403 ではなく 404 にそろえる。
  if (!result.ok) {
    notFound();
  }

  redirect(`/threads/${threadId}`);
}
