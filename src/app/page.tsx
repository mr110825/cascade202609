import Link from "next/link";
import { listPublicThreads } from "@/lib/services/threads";
import { ThreadCard } from "@/components/ThreadCard";
import type { ThreadStatus } from "@/generated/prisma/enums";

// トップページ。公開スレッドの一覧。
// searchParams は URL の ?q=... ?status=... のこと。
// Next.js 16 では Promise で渡ってくるので await して受け取る。
export default async function TopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const query = params.q ?? "";
  const status =
    params.status === "OPEN" || params.status === "CLOSED"
      ? (params.status as ThreadStatus)
      : undefined;

  const threads = await listPublicThreads({ query, status });

  // フィルタのリンク先を組み立てる。今の検索語は保ったままステータスだけ変える。
  function filterHref(nextStatus: string | undefined) {
    const search = new URLSearchParams();
    if (query) {
      search.set("q", query);
    }
    if (nextStatus) {
      search.set("status", nextStatus);
    }
    const queryString = search.toString();
    return queryString ? `/?${queryString}` : "/";
  }

  return (
    <main className="layout-body">
      <div className="page-header">
        <h1>公開スレッド</h1>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <Link
            href={filterHref(undefined)}
            className={`filter-group__btn ${status ? "" : "active"}`}
          >
            すべて
          </Link>
          <Link
            href={filterHref("OPEN")}
            className={`filter-group__btn ${status === "OPEN" ? "active" : ""}`}
          >
            Open
          </Link>
          <Link
            href={filterHref("CLOSED")}
            className={`filter-group__btn ${status === "CLOSED" ? "active" : ""}`}
          >
            Closed
          </Link>
        </div>
        {query && (
          <span className="form-hint">
            「{query}」の検索結果 {threads.length}件
          </span>
        )}
      </div>

      {threads.length === 0 ? (
        <div className="empty-state">
          <h2>公開スレッドがありません</h2>
          <p>条件を変えて探すか、自分のスレッドを公開してみてください。</p>
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
              authorName={thread.author.name}
              showVisibility={false}
            />
          ))}
        </div>
      )}
    </main>
  );
}
