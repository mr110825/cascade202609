import { hash, verify } from "@node-rs/argon2";

// パスワードのハッシュ化は絶対に自作しない。ここはライブラリに任せる部分。
// argon2 は現在のパスワードハッシュの推奨アルゴリズム。
// ソルトは argon2 が内部で自動生成してハッシュ文字列に含めてくれるので、
// 自分でソルトを用意する必要はない。

export async function hashPassword(password: string): Promise<string> {
  return hash(password);
}

export async function verifyPassword(
  passwordHash: string,
  password: string,
): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    // ハッシュの形式が壊れている場合など。ログインは失敗扱いにする。
    return false;
  }
}
