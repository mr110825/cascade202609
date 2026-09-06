import Link from "next/link";
import { requireUser } from "@/lib/auth";

// マイスレッド一覧。ログイン必須。
// M1 の時点では requireUser() でログインを要求するだけの器で、
// 実際の一覧表示（自分のスレッドを取得して並べる・絞り込む）は M2 で作る。
export default async function DashboardPage() {
  await requireUser();

  return (
    <main className="layout-body">
      <div className="page-header">
        <h1>マイスレッド</h1>
        <Link href="/threads/new" className="btn btn-primary">
          + 新規スレッド
        </Link>
      </div>

      <div className="empty-state">
        <h2>スレッドがありません</h2>
        <p>「+ 新規スレッド」から学習テーマを1つ立ててみてください。</p>
      </div>
    </main>
  );
}
