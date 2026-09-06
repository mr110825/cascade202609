// 画面に出す値の整形。

// アバターに出す頭文字。
export function initialOf(name: string): string {
  return name.slice(0, 1).toUpperCase();
}
