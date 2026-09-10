import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { NewThreadForm } from "@/components/forms/NewThreadForm";

export default async function NewThreadPage() {
  await requireUser();

  return (
    <main className="layout-narrow">
      <Link href="/dashboard" className="btn btn-ghost btn-sm mb-4">
        <ArrowLeft size={14} />
        マイスレッド
      </Link>

      <h1 className="mb-6 text-2xl font-bold">新規スレッド作成</h1>

      <NewThreadForm />
    </main>
  );
}
