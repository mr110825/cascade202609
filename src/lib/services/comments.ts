import { prisma } from "@/lib/prisma";
import { getThreadForViewer } from "@/lib/services/threads";

// コメントまわりの処理。threads.ts と同じ方針で、
// 「誰が」操作しているのかを必ず第1引数で受け取る。
//
// 書き込みができるのはスレッド作成者だけにしている。
// Cascade のスレッドは「1人の学習ログ」なので、他人が書き込む場面が
// MVP には無い（他人に見せるのは公開設定の話で、書き込み権限とは別）。

// 失敗の理由を reason で分けているのは、REST API 側で
// 入力ミス（400）と対象なし（404）を出し分けるため。
// 画面側はどちらも同じくエラー文言を出すだけなので error しか見ない。
type CreateResult =
  | { ok: true; commentId: string }
  | { ok: false; error: string; reason: "invalid" | "notFound" };

type UpdateResult =
  | { ok: true }
  | { ok: false; error: string; reason: "invalid" | "notFound" };

const MAX_BODY_LENGTH = 10000;

// 一覧は「そのスレッドを見てよいか」の判定がそのまま使える。
// 同じ判定を書き直さず、threads.ts の getThreadForViewer に相乗りする。
// 見てはいけない場合は null を返し、呼び出し側で 404 にする。
export async function listCommentsForViewer(
  threadId: string,
  viewerId: string | null,
) {
  const thread = await getThreadForViewer(threadId, viewerId);
  if (!thread) {
    return null;
  }
  return thread.comments;
}

export async function createComment(
  userId: string,
  threadId: string,
  body: string,
): Promise<CreateResult> {
  const trimmed = body.trim();

  if (!trimmed) {
    return {
      ok: false,
      error: "コメントを入力してください",
      reason: "invalid",
    };
  }
  if (trimmed.length > MAX_BODY_LENGTH) {
    return {
      ok: false,
      error: `コメントは${MAX_BODY_LENGTH}文字以内で入力してください`,
      reason: "invalid",
    };
  }

  // where に authorId を入れているので、他人のスレッドは 0 件＝「見つからない」になる。
  // 「書く権限がありません」と返すと、その ID のスレッドが実在することを
  // 教えてしまうため、存在しないときと同じ文言にしている（#29 と同じ考え方）。
  const thread = await prisma.thread.findFirst({
    where: { id: threadId, authorId: userId },
    select: { id: true },
  });

  if (!thread) {
    return {
      ok: false,
      error: "スレッドが見つかりません",
      reason: "notFound",
    };
  }

  const comment = await prisma.comment.create({
    data: { body: trimmed, threadId, authorId: userId },
  });

  await touchThread(threadId);

  return { ok: true, commentId: comment.id };
}

// 更新・削除は threads.ts の updateMany 一発と違い、先に findFirst で引いている。
// 更新後にスレッドの updatedAt も進めたく（touchThread）、そのために
// 対象コメントの threadId が要るため。where に authorId を入れる点は同じで、
// 他人のコメント ID を渡しても 0 件＝「見つからない」になる。
export async function updateComment(
  userId: string,
  commentId: string,
  body: string,
): Promise<UpdateResult> {
  const trimmed = body.trim();

  if (!trimmed) {
    return {
      ok: false,
      error: "コメントを入力してください",
      reason: "invalid",
    };
  }
  if (trimmed.length > MAX_BODY_LENGTH) {
    return {
      ok: false,
      error: `コメントは${MAX_BODY_LENGTH}文字以内で入力してください`,
      reason: "invalid",
    };
  }

  const comment = await prisma.comment.findFirst({
    where: { id: commentId, authorId: userId },
    select: { id: true, threadId: true },
  });

  if (!comment) {
    return {
      ok: false,
      error: "コメントが見つかりません",
      reason: "notFound",
    };
  }

  await prisma.comment.update({
    where: { id: comment.id },
    data: { body: trimmed },
  });
  await touchThread(comment.threadId);

  return { ok: true };
}

export async function deleteComment(
  userId: string,
  commentId: string,
): Promise<UpdateResult> {
  const comment = await prisma.comment.findFirst({
    where: { id: commentId, authorId: userId },
    select: { id: true, threadId: true },
  });

  if (!comment) {
    return {
      ok: false,
      error: "コメントが見つかりません",
      reason: "notFound",
    };
  }

  await prisma.comment.delete({ where: { id: comment.id } });
  await touchThread(comment.threadId);

  return { ok: true };
}

// スレッドの updatedAt だけを今の時刻に進める。
// 一覧は updatedAt の新しい順に並ぶので、これが無いと
// 「コメントを書き足しただけのスレッド」が一覧の下に沈んだままになる。
// updatedAt は @updatedAt 属性が付いているが、値を明示すればそれが優先される。
async function touchThread(threadId: string): Promise<void> {
  await prisma.thread.update({
    where: { id: threadId },
    data: { updatedAt: new Date() },
  });
}
