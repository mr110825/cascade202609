import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";

// ユーザーまわりの処理をここにまとめる。
// 画面（Server Action）からも REST API からも、同じこの関数を呼ぶ。
// そうしておけば、片方だけ仕様がずれることがない。

// 成功か失敗のどちらかしか返らないことを型で表している。
// ok が true のときだけ userId があり、false のときだけ error がある。
type RegisterResult =
  | { ok: true; userId: string }
  | { ok: false; error: string };

type LoginResult = { ok: true; userId: string } | { ok: false; error: string };

type UpdateResult = { ok: true } | { ok: false; error: string };

const MIN_PASSWORD_LENGTH = 8;

export async function registerUser(
  email: string,
  name: string,
  password: string,
): Promise<RegisterResult> {
  if (!email || !name || !password) {
    return { ok: false, error: "すべての項目を入力してください" };
  }
  if (!email.includes("@")) {
    return { ok: false, error: "メールアドレスの形式が正しくありません" };
  }
  if (name.length > 32) {
    return { ok: false, error: "ユーザー名は32文字以内で入力してください" };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: `パスワードは${MIN_PASSWORD_LENGTH}文字以上にしてください`,
    };
  }

  const emailTaken = await prisma.user.findUnique({ where: { email } });
  if (emailTaken) {
    return { ok: false, error: "このメールアドレスは登録済みです" };
  }

  const nameTaken = await prisma.user.findUnique({ where: { name } });
  if (nameTaken) {
    return { ok: false, error: "このユーザー名は使われています" };
  }

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: await hashPassword(password),
    },
  });

  return { ok: true, userId: user.id };
}

export async function login(
  email: string,
  password: string,
): Promise<LoginResult> {
  const user = await prisma.user.findUnique({ where: { email } });

  // ユーザーが居ない場合とパスワードが違う場合で、返すメッセージを変えない。
  // 変えると「このメールアドレスは登録されている」ことが分かってしまう。
  if (!user) {
    return { ok: false, error: "メールアドレスまたはパスワードが違います" };
  }

  const correct = await verifyPassword(user.passwordHash, password);
  if (!correct) {
    return { ok: false, error: "メールアドレスまたはパスワードが違います" };
  }

  return { ok: true, userId: user.id };
}

export async function changeName(
  userId: string,
  name: string,
): Promise<UpdateResult> {
  if (!name) {
    return { ok: false, error: "ユーザー名を入力してください" };
  }
  if (name.length > 32) {
    return { ok: false, error: "ユーザー名は32文字以内で入力してください" };
  }

  // name は unique なので、そのまま update すると他人と衝突したときに
  // Prisma が例外を投げて 500 になる。先に取られていないか確かめて、
  // 画面に出せるエラーとして返す。
  const taken = await prisma.user.findUnique({ where: { name } });
  if (taken && taken.id !== userId) {
    return { ok: false, error: "このユーザー名は使われています" };
  }

  await prisma.user.update({ where: { id: userId }, data: { name } });
  return { ok: true };
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<UpdateResult> {
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: `新しいパスワードは${MIN_PASSWORD_LENGTH}文字以上にしてください`,
    };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { ok: false, error: "ユーザーが見つかりません" };
  }

  const correct = await verifyPassword(user.passwordHash, currentPassword);
  if (!correct) {
    return { ok: false, error: "現在のパスワードが違います" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(newPassword) },
  });

  return { ok: true };
}
