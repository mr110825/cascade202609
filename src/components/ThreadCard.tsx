import Link from "next/link";
import { StatusBadge, VisibilityBadge } from "@/components/Badges";
import { formatRelative, initialOf } from "@/lib/format";
import type { ThreadStatus, Visibility } from "@/generated/prisma/enums";

// 一覧に並ぶ1行。トップページとダッシュボードの両方で使う。
// トップページでは作成者名を出し、公開設定は出さない（全部公開なので）。
type Props = {
  id: string;
  title: string;
  status: ThreadStatus;
  visibility: Visibility;
  commentCount: number;
  updatedAt: Date;
  authorName?: string;
  showVisibility: boolean;
};

export function ThreadCard({
  id,
  title,
  status,
  visibility,
  commentCount,
  updatedAt,
  authorName,
  showVisibility,
}: Props) {
  return (
    <div className="thread-card">
      <div className="thread-card__header">
        <StatusBadge status={status} />
        {showVisibility && <VisibilityBadge visibility={visibility} />}
        <h3 className="thread-card__title">
          <Link href={`/threads/${id}`}>{title}</Link>
        </h3>
      </div>
      <div className="thread-card__meta">
        {authorName && (
          <span className="flex items-center gap-1">
            <span className="avatar avatar-sm">{initialOf(authorName)}</span>
            {authorName}
          </span>
        )}
        <span>{commentCount}件のコメント</span>
        <span>{formatRelative(updatedAt)}に更新</span>
      </div>
    </div>
  );
}
