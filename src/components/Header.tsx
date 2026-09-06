import Link from "next/link";
import { Search } from "lucide-react";

// M0 の時点では「未ログインの見た目」だけを置く。
// ログイン状態による出し分け（アバター・新規スレッド・ログアウト）は M1 で足す。
export function Header() {
  return (
    <header className="global-header">
      <div className="global-header__inner">
        <Link href="/" className="global-header__logo">
          Cascade
        </Link>

        {/* 検索ボックスは form の GET。入力値が ?q= として付いた URL に飛ぶ */}
        <form action="/" className="global-header__search">
          <div className="relative">
            <Search
              size={16}
              className="absolute top-1/2 left-3 -translate-y-1/2 text-text-secondary"
            />
            <input
              type="text"
              name="q"
              className="input pl-9"
              placeholder="公開スレッドを検索..."
            />
          </div>
        </form>

        <nav className="global-header__nav">
          <Link href="/login" className="btn btn-ghost">
            ログイン
          </Link>
          <Link href="/signup" className="btn btn-primary">
            新規登録
          </Link>
        </nav>
      </div>
    </header>
  );
}
