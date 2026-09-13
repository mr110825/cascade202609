import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listMyThreads, countMyThreadsByStatus } from "@/lib/services/threads";
import { ThreadCard } from "@/components/ThreadCard";
import type { ThreadStatus, Visibility } from "@/generated/prisma/enums";

const VISIBILITIES: { value: Visibility; label: string }[] = [
  { value: "PUBLIC", label: "公開" },
  { value: "LIMITED", label: "限定公開" },
  { value: "PRIVATE", label: "非公開" },
];

// マイスレッド一覧。ログイン必須。
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; visibility?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  // URL のクエリはユーザーが自由に書ける。
  // 想定した値でなければ「絞り込みなし」に倒す。
  const status =
    params.status === "OPEN" || params.status === "CLOSED"
      ? (params.status as ThreadStatus)
      : undefined;
  const visibility = VISIBILITIES.some((v) => v.value === params.visibility)
    ? (params.visibility as Visibility)
    : undefined;

  const threads = await listMyThreads(user.id, { status, visibility });
  const counts = await countMyThreadsByStatus(user.id);

  // 今の条件を保ったまま、一部だけ差し替えたリンクを作る。
  function hrefWith(changes: Record<string, string | undefined>) {
    const current: Record<string, string | undefined> = {
      status,
      visibility,
      ...changes,
    };

    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(current)) {
      if (value) {
        search.set(key, value);
      }
    }
    const queryString = search.toString();
    return queryString ? `/dashboard?${queryString}` : "/dashboard";
  }

  return (
    <main className="layout-body">
      <div className="page-header">
        <h1>マイスレッド</h1>
        <Link href="/threads/new" className="btn btn-primary">
          + 新規スレッド
        </Link>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <Link
            href={hrefWith({ status: undefined })}
            className={`filter-group__btn ${status ? "" : "active"}`}
          >
            すべて ({counts.all})
          </Link>
          <Link
            href={hrefWith({ status: "OPEN" })}
            className={`filter-group__btn ${status === "OPEN" ? "active" : ""}`}
          >
            Open ({counts.open})
          </Link>
          <Link
            href={hrefWith({ status: "CLOSED" })}
            className={`filter-group__btn ${status === "CLOSED" ? "active" : ""}`}
          >
            Closed ({counts.closed})
          </Link>
        </div>

        <div className="filter-group">
          <Link
            href={hrefWith({ visibility: undefined })}
            className={`filter-group__btn ${visibility ? "" : "active"}`}
          >
            全公開設定
          </Link>
          {VISIBILITIES.map((item) => (
            <Link
              key={item.value}
              href={hrefWith({ visibility: item.value })}
              className={`filter-group__btn ${visibility === item.value ? "active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {threads.length === 0 ? (
        <div className="empty-state">
          <h2>スレッドがありません</h2>
          <p>「+ 新規スレッド」から学習テーマを1つ立ててみてください。</p>
        </div>
      ) : (
        <div>
          {threads.map((thread) => (
            <ThreadCard
              key={thread.id}
              id={thread.id}
              title={thread.title}
              status={thread.status}
              visibility={thread.visibility}
              commentCount={thread._count.comments}
              updatedAt={thread.updatedAt}
              showVisibility={true}
            />
          ))}
        </div>
      )}
    </main>
  );
}
