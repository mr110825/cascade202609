import { requireUser } from "@/lib/auth";
import {
  ChangeNameForm,
  ChangePasswordForm,
} from "@/components/forms/SettingsForms";

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <main className="layout-narrow">
      <h1 className="mb-6 text-2xl font-bold">アカウント設定</h1>

      <section className="mb-8">
        <h2 className="mb-3 text-base font-semibold">ユーザー名</h2>
        <ChangeNameForm currentName={user.name} />
      </section>

      <section className="border-border border-t pt-8">
        <h2 className="mb-3 text-base font-semibold">パスワード</h2>
        <ChangePasswordForm />
      </section>
    </main>
  );
}
