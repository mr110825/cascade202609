import { randomBytes, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME } from "@/lib/session-cookie";

// セッションの有効期間。
const SESSION_DAYS = 30;

// ブラウザに渡すトークンから、DB に保存する ID を作る。
// 保存するのはハッシュのほうなので、DB を見てもログインには使えない。
function toSessionId(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function expiresAt(): Date {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
}

// ログイン成功時に呼ぶ。セッション行を作って Cookie を配る。
export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expires = expiresAt();

  await prisma.session.create({
    data: {
      id: toSessionId(token),
      userId,
      expiresAt: expires,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true, // JavaScript から読めなくする（XSS でトークンを盗まれないように）
    secure: process.env.NODE_ENV === "production", // 本番は HTTPS のみ
    sameSite: "lax", // 別サイトからのリクエストには基本付けない（CSRF 対策）
    path: "/",
    expires,
  });
}

// Cookie のトークンから、生きているセッションとユーザーを引く。
export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { id: toSessionId(token) },
    include: { user: true },
  });
  if (!session) {
    return null;
  }

  // 期限切れなら消して未ログイン扱いにする。
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return session.user;
}

// ログアウト時に呼ぶ。DB の行を消して Cookie も消す。
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { id: toSessionId(token) } });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

// パスワード変更時に呼ぶ。そのユーザーの全セッションを無効にする。
export async function deleteAllSessionsOfUser(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}
