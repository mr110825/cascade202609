import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/forms/LoginForm";

export default async function LoginPage() {
  // すでにログイン済みならログイン画面を見せる必要がない。
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="auth-container">
      <div className="auth-card">
        <h1>ログイン</h1>
        <LoginForm />
        <p className="auth-footer">
          アカウントをお持ちでない方は <Link href="/signup">新規登録</Link>
        </p>
      </div>
    </main>
  );
}
