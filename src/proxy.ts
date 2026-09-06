import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/session-cookie";

// ページが表示される前に必ず通る場所。
// Next.js 15 までは middleware.ts という名前だったが、16 から proxy.ts になった。
//
// ここでやるのは Cookie が付いているかどうかの確認だけ。
// 中身が本物かどうかは DB を見ないと分からないが、この処理は
// Edge ランタイムで動くため DB を触れない。
// 本当の確認は各ページの requireUser() が行っている（そちらが本命の防御）。
// ここは「明らかに未ログインの人を早めに追い返す」ための入口。
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE_NAME);

  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// この matcher に当てはまるパスだけ proxy が動く。
export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*", "/threads/new"],
};
