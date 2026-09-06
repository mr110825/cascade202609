import { randomBytes, createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

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

// ログイン成功時に呼ぶ。セッション行を作り、ブラウザへ渡すトークンを返す。
// Cookie に載せるのは呼び出し側の仕事（#16 でここに取り込む）。
export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");

  await prisma.session.create({
    data: {
      id: toSessionId(token),
      userId,
      expiresAt: expiresAt(),
    },
  });

  return token;
}
