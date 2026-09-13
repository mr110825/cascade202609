import { prisma } from "@/lib/prisma";
import type { ThreadStatus, Visibility } from "@/generated/prisma/enums";

// スレッドまわりの処理。
// 「誰が」操作しているのかを必ず引数で受け取り、
// 自分のスレッド以外を触れないようにする。

type CreateResult =
  | { ok: true; threadId: string }
  | { ok: false; error: string };

type UpdateResult = { ok: true } | { ok: false; error: string };

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

// スレッド詳細。閲覧してよい相手かどうかもここで判定する。
// 見てはいけない場合は null を返し、呼び出し側で 404 にする。
export async function getThreadForViewer(
  threadId: string,
  viewerId: string | null,
) {
  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    include: {
      author: { select: { id: true, name: true } },
      comments: {
        include: { author: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!thread) {
    return null;
  }

  // 非公開スレッドは作成者本人だけ。
  // 限定公開は「URL を知っていれば見られる」なので、ここでは弾かない。
  if (thread.visibility === "PRIVATE" && thread.author.id !== viewerId) {
    return null;
  }

  return thread;
}

// 以下の更新系はすべて updateMany を使い、where に authorId を入れている。
// 他人のスレッドを指定しても更新件数が 0 件になるだけで、書き換わらない。
export async function updateThreadTitle(
  userId: string,
  threadId: string,
  title: string,
): Promise<UpdateResult> {
  if (!title.trim()) {
    return { ok: false, error: "タイトルを入力してください" };
  }

  const result = await prisma.thread.updateMany({
    where: { id: threadId, authorId: userId },
    data: { title: title.trim() },
  });

  if (result.count === 0) {
    return { ok: false, error: "スレッドが見つかりません" };
  }
  return { ok: true };
}

export async function deleteThread(
  userId: string,
  threadId: string,
): Promise<UpdateResult> {
  // コメントは schema.prisma の onDelete: Cascade で一緒に消える。
  const result = await prisma.thread.deleteMany({
    where: { id: threadId, authorId: userId },
  });

  if (result.count === 0) {
    return { ok: false, error: "スレッドが見つかりません" };
  }
  return { ok: true };
}

export async function updateThreadStatus(
  userId: string,
  threadId: string,
  status: ThreadStatus,
): Promise<UpdateResult> {
  const result = await prisma.thread.updateMany({
    where: { id: threadId, authorId: userId },
    data: { status },
  });

  if (result.count === 0) {
    return { ok: false, error: "スレッドが見つかりません" };
  }
  return { ok: true };
}

// トップページ・公開API 用。公開スレッドだけを新しい順に返す。
export async function listPublicThreads(options: { status?: ThreadStatus }) {
  return prisma.thread.findMany({
    where: {
      visibility: "PUBLIC",
      ...(options.status ? { status: options.status } : {}),
    },
    include: {
      author: { select: { name: true } },
      _count: { select: { comments: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}
