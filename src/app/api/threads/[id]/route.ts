import { NextResponse } from "next/server";
import {
  getThreadForViewer,
  updateThreadTitle,
  updateThreadStatus,
  updateThreadVisibility,
  deleteThread,
} from "@/lib/services/threads";
import { getCurrentUser } from "@/lib/auth";
import type { ThreadStatus, Visibility } from "@/generated/prisma/enums";

// URL の [id] は params から取る。Next.js 16 では Promise で渡ってくる。
type Context = { params: Promise<{ id: string }> };

// GET /api/threads/:id
export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  const user = await getCurrentUser();

  const thread = await getThreadForViewer(id, user?.id ?? null);
  if (!thread) {
    return NextResponse.json(
      { error: "スレッドが見つかりません" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    id: thread.id,
    title: thread.title,
    status: thread.status,
    visibility: thread.visibility,
    authorName: thread.author.name,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
    comments: thread.comments.map((comment) => ({
      id: comment.id,
      body: comment.body,
      authorName: comment.author.name,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    })),
  });
}

// PATCH /api/threads/:id
// title / status / visibility のうち、送られてきたものだけ更新する。
// 他人のスレッドを指定した場合はサービスが 0 件を返すので 404 になる
// （403 にすると、その ID が実在することを教えてしまう）。
export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const body = await request.json();

  if (typeof body.title === "string") {
    const result = await updateThreadTitle(user.id, id, body.title);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
  }

  if (body.status === "OPEN" || body.status === "CLOSED") {
    const result = await updateThreadStatus(
      user.id,
      id,
      body.status as ThreadStatus,
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
  }

  if (
    body.visibility === "PUBLIC" ||
    body.visibility === "LIMITED" ||
    body.visibility === "PRIVATE"
  ) {
    const result = await updateThreadVisibility(
      user.id,
      id,
      body.visibility as Visibility,
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/threads/:id
export async function DELETE(_request: Request, context: Context) {
  const { id } = await context.params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const result = await deleteThread(user.id, id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
