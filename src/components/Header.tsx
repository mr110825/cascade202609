import Link from "next/link";
import { Search } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";
import { initialOf } from "@/lib/format";

// ヘッダーは Server Component なので、ここで直接ログイン状態を調べられる。
// （ブラウザ側で fetch して調べる必要がない）
export async function Header() {
  const user = await getCurrentUser();

  // 検索ボックスは form の GET。入力値が ?q= として付いた URL に飛ぶ。
  // ログイン中は自分のスレッド、未ログインなら公開スレッドを検索する。
  const searchTarget = user ? "/dashboard" : "/";

  return (
    <header className="global-header">
      <div className="global-header__inner">
        <Link href={user ? "/dashboard" : "/"} className="global-header__logo">
          Cascade
        </Link>

        <form action={searchTarget} className="global-header__search">
          <div className="relative">
            <Search
              size={16}
              className="absolute top-1/2 left-3 -translate-y-1/2 text-text-secondary"
            />
            <input
              type="text"
              name="q"
              className="input pl-9"
              placeholder={
                user ? "マイスレッドを検索..." : "公開スレッドを検索..."
              }
            />
          </div>
        </form>

        <nav className="global-header__nav">
          {user ? (
            <>
              <Link href="/threads/new" className="btn btn-primary">
                + 新規スレッド
              </Link>
              <Link href="/settings" title={user.name} className="avatar">
                {initialOf(user.name)}
              </Link>
              <form action={logoutAction}>
                <button type="submit" className="btn btn-ghost btn-sm">
                  ログアウト
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost">
                ログイン
              </Link>
              <Link href="/signup" className="btn btn-primary">
                新規登録
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
