import { NextResponse } from "next/server";
import { listCommentsForViewer, createComment } from "@/lib/services/comments";
import { getCurrentUser } from "@/lib/auth";

// 画面（Server Action）と同じサービス関数を呼ぶ。
// 判断は services/comments.ts にあるので、ここは HTTP の作法だけを担当する
// （/api/threads の route.ts と同じ構造）。

type Context = { params: Promise<{ id: string }> };

// GET /api/threads/:id/comments
// 見てよいスレッドかどうかはサービス側が判定する。ダメなら null が返る。
export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  const user = await getCurrentUser();

  const comments = await listCommentsForViewer(id, user?.id ?? null);
  if (!comments) {
    return NextResponse.json(
      { error: "スレッドが見つかりません" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    comments: comments.map((comment) => ({
      id: comment.id,
      body: comment.body,
      authorName: comment.author.name,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    })),
  });
}

// POST /api/threads/:id/comments
export async function POST(request: Request, context: Context) {
  const { id } = await context.params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const body = await request.json();

  const result = await createComment(user.id, id, String(body.body ?? ""));

  if (!result.ok) {
    // 入力ミスは 400、対象が無い（他人のスレッドを含む）は 404。
    return NextResponse.json(
      { error: result.error },
      { status: result.reason === "notFound" ? 404 : 400 },
    );
  }

  return NextResponse.json({ id: result.commentId }, { status: 201 });
}
