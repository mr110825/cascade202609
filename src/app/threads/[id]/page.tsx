import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getThreadForViewer } from "@/lib/services/threads";
import { StatusBadge, VisibilityBadge } from "@/components/Badges";
import { formatDate, formatDateTime, initialOf } from "@/lib/format";
import {
  updateThreadTitleAction,
  updateThreadStatusAction,
  deleteThreadAction,
} from "@/app/actions/threads";

// スレッド詳細。Part3 の Pattern B に合わせて2カラム。
// メタ情報と操作ボタンは右サイドバーに集約する。
//
// 「編集中かどうか」は URL の ?edit= で表している。
//   ?edit=title → タイトルを編集
// こうすると状態を持つ必要がなくなり、全部 Server Component のままで書ける。
export default async function ThreadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { id } = await params;
  const { edit } = await searchParams;

  const user = await getCurrentUser();
  const thread = await getThreadForViewer(id, user?.id ?? null);

  // 存在しない、または見る権限がない場合は 404。
  // 「権限がない」と「存在しない」を区別しないことで、
  // 非公開スレッドの ID が実在することを外から確かめられないようにしている。
  if (!thread) {
    notFound();
  }

  const isOwner = user !== null && user.id === thread.author.id;
  const threadPath = `/threads/${thread.id}`;

  return (
    <main className="layout-body layout-two-column">
      {/* --- メインカラム --- */}
      <div>
        <Link href="/dashboard" className="btn btn-ghost btn-sm mb-2">
          <ArrowLeft size={14} />
          マイスレッド
        </Link>

        {isOwner && edit === "title" ? (
          <form action={updateThreadTitleAction} className="mb-4">
            <input type="hidden" name="threadId" value={thread.id} />
            <div className="form-group">
              <input
                name="title"
                type="text"
                className="input"
                defaultValue={thread.title}
                required
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary btn-sm">
                保存
              </button>
              <Link href={threadPath} className="btn btn-ghost btn-sm">
                キャンセル
              </Link>
            </div>
          </form>
        ) : (
          <div className="mb-4 flex items-start gap-2">
            <h1 className="flex-1 text-2xl font-bold">{thread.title}</h1>
            {isOwner && (
              <Link
                href={`${threadPath}?edit=title`}
                className="btn btn-ghost btn-sm"
              >
                タイトルを編集
              </Link>
            )}
          </div>
        )}

        {/* --- コメント一覧 --- */}
        <div>
          {thread.comments.length === 0 && (
            <p className="form-hint py-4">まだコメントがありません。</p>
          )}

          {thread.comments.map((comment) => (
            <div key={comment.id} className="comment">
              <div className="avatar">{initialOf(comment.author.name)}</div>
              <div className="comment__body">
                <div className="comment__header">
                  <span className="comment__author">{comment.author.name}</span>
                  <span>{formatDateTime(comment.createdAt)}</span>
                </div>
                {/* Markdown 表示は M3 で入れる。今は改行だけ活かして素のまま出す */}
                <p className="whitespace-pre-wrap">{comment.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- 右サイドバー（メタ情報と操作） --- */}
      <aside className="sidebar-right">
        <div className="sidebar-right__section">
          <div className="sidebar-right__label">ステータス</div>
          <div className="sidebar-right__value">
            <StatusBadge status={thread.status} />
          </div>
          {isOwner && (
            <form action={updateThreadStatusAction} className="mt-2">
              <input type="hidden" name="threadId" value={thread.id} />
              {/* 送信ボタン自身に name と value を持たせている。
                  押したボタンの値だけが FormData に入るので、
                  hidden input を別に用意しなくてよい */}
              <button
                type="submit"
                name="status"
                value={thread.status === "OPEN" ? "CLOSED" : "OPEN"}
                className="btn btn-secondary btn-sm btn-block"
              >
                {thread.status === "OPEN" ? "Closedにする" : "Openに戻す"}
              </button>
            </form>
          )}
        </div>

        <div className="sidebar-right__section">
          <div className="sidebar-right__label">公開設定</div>
          <div className="sidebar-right__value">
            <VisibilityBadge visibility={thread.visibility} />
          </div>
        </div>

        <div className="sidebar-right__section">
          <div className="sidebar-right__label">作成者</div>
          <div className="sidebar-right__value flex items-center gap-2">
            <span className="avatar avatar-sm">
              {initialOf(thread.author.name)}
            </span>
            {thread.author.name}
          </div>
        </div>

        <div className="sidebar-right__section">
          <div className="sidebar-right__label">作成日</div>
          <div className="sidebar-right__value">
            {formatDate(thread.createdAt)}
          </div>
        </div>

        <div className="sidebar-right__section">
          <div className="sidebar-right__label">コメント</div>
          <div className="sidebar-right__value">{thread.comments.length}件</div>
        </div>

        {isOwner && (
          <div className="sidebar-right__section">
            <form action={deleteThreadAction}>
              <input type="hidden" name="threadId" value={thread.id} />
              <button type="submit" className="btn btn-danger btn-sm btn-block">
                このスレッドを削除
              </button>
            </form>
          </div>
        )}
      </aside>
    </main>
  );
}
