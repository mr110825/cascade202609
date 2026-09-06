// トップページ（公開スレッド一覧）。
// M0 の時点では Pattern B のレイアウトが載っているだけの器で、
// 実際の一覧表示（DB から取得して ThreadCard を並べる）は M2 で作る。
export default function TopPage() {
  return (
    <main className="layout-body">
      <div className="page-header">
        <h1>公開スレッド</h1>
      </div>

      <div className="empty-state">
        <h2>公開スレッドがありません</h2>
        <p>条件を変えて探すか、自分のスレッドを公開してみてください。</p>
      </div>
    </main>
  );
}
