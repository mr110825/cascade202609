import { prisma } from "@/lib/prisma";
import type { ThreadStatus, Visibility } from "@/generated/prisma/enums";

// スレッドまわりの処理。
// 「誰が」操作しているのかを必ず引数で受け取り、
// 自分のスレッド以外を触れないようにする。

type CreateResult =
  | { ok: true; threadId: string }
  | { ok: false; error: string };

export async function createThread(
  userId: string,
  title: string,
  visibility: Visibility,
  firstComment: string,
): Promise<CreateResult> {
  if (!title.trim()) {
    return { ok: false, error: "タイトルを入力してください" };
  }
  if (title.length > 120) {
    return { ok: false, error: "タイトルは120文字以内で入力してください" };
  }

  const thread = await prisma.thread.create({
    data: {
      title: title.trim(),
      visibility,
      authorId: userId,
      // 最初のコメントは任意。入力があるときだけ一緒に作る。
      comments: firstComment.trim()
        ? { create: [{ body: firstComment.trim(), authorId: userId }] }
        : undefined,
    },
  });

  return { ok: true, threadId: thread.id };
}

// ダッシュボード用。自分のスレッドを全部返す（公開設定を問わない）。
export async function listMyThreads(
  userId: string,
  options: {
    status?: ThreadStatus;
    visibility?: Visibility;
  },
) {
  return prisma.thread.findMany({
    where: {
      authorId: userId,
      ...(options.status ? { status: options.status } : {}),
      ...(options.visibility ? { visibility: options.visibility } : {}),
    },
    include: {
      _count: { select: { comments: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

// ダッシュボードのフィルタに出す件数。
export async function countMyThreadsByStatus(userId: string) {
  const all = await prisma.thread.count({ where: { authorId: userId } });
  const open = await prisma.thread.count({
    where: { authorId: userId, status: "OPEN" },
  });
  return { all, open, closed: all - open };
}
