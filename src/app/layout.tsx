import type { Metadata } from "next";
import { Inter, Noto_Sans_JP, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

// Part3 で決めたフォント。next/font はビルド時にフォントを取り込むので、
// 表示のたびに Google のサーバーへ取りに行くことがない。
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const notoSansJp = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
});
const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cascade",
  description: "技術学習の記録をスレッド形式で残すアプリ",
};

// すべてのページが、この layout の children の位置に入る。
// ヘッダーとフッターはここに1回書けば全ページに出る。
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${inter.variable} ${notoSansJp.variable} ${jetBrainsMono.variable} antialiased`}
    >
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
