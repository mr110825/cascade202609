import { NextResponse } from "next/server";
import { listPublicThreads, createThread } from "@/lib/services/threads";
import { getCurrentUser } from "@/lib/auth";
import type { ThreadStatus, Visibility } from "@/generated/prisma/enums";

// 画面（Server Action）と同じサービス関数を呼ぶ。
// 入力の検証も権限の判定もサービス側にあるので、ここは
// HTTP の作法（ステータスコードと JSON）だけを担当する。

// GET /api/threads?q=...&status=OPEN
// 公開スレッドの一覧。ログインしていなくても呼べる。
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");

  const threads = await listPublicThreads({
    query: searchParams.get("q") ?? undefined,
    status:
      statusParam === "OPEN" || statusParam === "CLOSED"
        ? (statusParam as ThreadStatus)
        : undefined,
  });

  return NextResponse.json({
    threads: threads.map((thread) => ({
      id: thread.id,
      title: thread.title,
      status: thread.status,
      visibility: thread.visibility,
      authorName: thread.author.name,
      commentCount: thread._count.comments,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
    })),
  });
}

// POST /api/threads
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const body = await request.json();

  const result = await createThread(
    user.id,
    String(body.title ?? ""),
    (body.visibility ?? "PRIVATE") as Visibility,
    String(body.firstComment ?? ""),
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ id: result.threadId }, { status: 201 });
}
