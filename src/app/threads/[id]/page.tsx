import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getThreadForViewer } from "@/lib/services/threads";
import { StatusBadge, VisibilityBadge } from "@/components/Badges";
import { formatDate, formatDateTime, initialOf } from "@/lib/format";

// スレッド詳細。Part3 の Pattern B に合わせて2カラム。
// メタ情報と操作ボタンは右サイドバーに集約する。
export default async function ThreadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await getCurrentUser();
  const thread = await getThreadForViewer(id, user?.id ?? null);

  // 存在しない、または見る権限がない場合は 404。
  // 「権限がない」と「存在しない」を区別しないことで、
  // 非公開スレッドの ID が実在することを外から確かめられないようにしている。
  if (!thread) {
    notFound();
  }

  return (
    <main className="layout-body layout-two-column">
      {/* --- メインカラム --- */}
      <div>
        <Link href="/dashboard" className="btn btn-ghost btn-sm mb-2">
          <ArrowLeft size={14} />
          マイスレッド
        </Link>

        <div className="mb-4 flex items-start gap-2">
          <h1 className="flex-1 text-2xl font-bold">{thread.title}</h1>
        </div>

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
      </aside>
    </main>
  );
}
