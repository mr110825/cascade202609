import Link from "next/link";

export function Footer() {
  return (
    <footer className="global-footer">
      <Link href="/terms">利用規約</Link>
      <Link href="/privacy">プライバシーポリシー</Link>
      <span>© 2026 Cascade</span>
    </footer>
  );
}
