import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getThreadForViewer } from "@/lib/services/threads";
import { StatusBadge, VisibilityBadge } from "@/components/Badges";
import { MarkdownBody } from "@/components/MarkdownBody";
import { CommentForm } from "@/components/forms/CommentForm";
import { formatDate, formatDateTime, initialOf } from "@/lib/format";
import {
  updateThreadTitleAction,
  updateThreadStatusAction,
  updateThreadVisibilityAction,
  deleteThreadAction,
} from "@/app/actions/threads";
import {
  updateCommentAction,
  deleteCommentAction,
} from "@/app/actions/comments";
import type { Visibility } from "@/generated/prisma/enums";

// 公開設定の選択肢。ダッシュボードのフィルタと同じ並び・同じラベルにしている。
// Visibility 型を付けているので、enum にない値を書くとビルドで落ちる。
const VISIBILITY_OPTIONS: { value: Visibility; label: string }[] = [
  { value: "PUBLIC", label: "公開" },
  { value: "LIMITED", label: "限定公開" },
  { value: "PRIVATE", label: "非公開" },
];

// スレッド詳細。Part3 の Pattern B に合わせて2カラム。
// メタ情報と操作ボタンは右サイドバーに集約する。
//
// 「編集中かどうか」は URL の ?edit= で表している。
//   ?edit=title      → タイトルを編集
//   ?edit=<コメントID> → そのコメントだけを編集
// こうすると状態を持つ必要がなくなり、編集フォームも Server Component のまま書ける。
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

          {thread.comments.map((comment) => {
            const isCommentOwner = user !== null && user.id === comment.author.id;
            const isEditing = isCommentOwner && edit === comment.id;

            return (
              <div key={comment.id} className="comment">
                <div className="avatar">{initialOf(comment.author.name)}</div>
                <div className="comment__body">
                  <div className="comment__header">
                    <span className="comment__author">
                      {comment.author.name}
                    </span>
                    <span>{formatDateTime(comment.createdAt)}</span>
                    {comment.updatedAt.getTime() !==
                      comment.createdAt.getTime() && <span>(編集済み)</span>}

                    {isCommentOwner && !isEditing && (
                      <span className="comment__actions">
                        <Link
                          href={`${threadPath}?edit=${comment.id}`}
                          className="btn btn-ghost btn-sm"
                        >
                          編集
                        </Link>
                        <form action={deleteCommentAction}>
                          <input
                            type="hidden"
                            name="threadId"
                            value={thread.id}
                          />
                          <input
                            type="hidden"
                            name="commentId"
                            value={comment.id}
                          />
                          <button
                            type="submit"
                            className="btn btn-ghost btn-sm"
                          >
                            削除
                          </button>
                        </form>
                      </span>
                    )}
                  </div>

                  {isEditing ? (
                    <form action={updateCommentAction}>
                      <input type="hidden" name="threadId" value={thread.id} />
                      <input
                        type="hidden"
                        name="commentId"
                        value={comment.id}
                      />
                      <div className="form-group">
                        <textarea
                          name="body"
                          className="input textarea"
                          defaultValue={comment.body}
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="btn btn-primary btn-sm"
                        >
                          保存
                        </button>
                        <Link href={threadPath} className="btn btn-ghost btn-sm">
                          キャンセル
                        </Link>
                      </div>
                    </form>
                  ) : (
                    <MarkdownBody body={comment.body} />
                  )}
                </div>
              </div>
            );
          })}

          {/* 書き込めるのはスレッド作成者だけ（services/comments.ts の判定に合わせる）。
              key にコメント件数を渡しているので、投稿が成功して件数が変わると
              フォームが作り直され、入力欄が空に戻る。 */}
          {isOwner && (
            <CommentForm key={thread.comments.length} threadId={thread.id} />
          )}
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
          {isOwner && (
            <form action={updateThreadVisibilityAction} className="mt-2">
              <input type="hidden" name="threadId" value={thread.id} />
              {/* ステータス変更と同じで、押したボタンの name/value だけが
                  FormData に入る。3つ並べても hidden input は1つでよい */}
              <div className="filter-group">
                {VISIBILITY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="submit"
                    name="visibility"
                    value={option.value}
                    className={`filter-group__btn ${
                      thread.visibility === option.value ? "active" : ""
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </form>
          )}
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
