import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";

// ページやサーバー側の処理から「今ログインしているのは誰か」を聞くための入口。
// ログインしていなければ null。
export async function getCurrentUser() {
  return getSessionUser();
}

// ログイン必須のページで使う。未ログインならログイン画面へ飛ばす。
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
