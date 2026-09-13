// 画面に出す日時の整形。

export function formatDate(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

export function formatDateTime(date: Date): string {
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${formatDate(date)} ${hour}:${minute}`;
}

// 「2時間前」のような相対表示。一覧の更新日時に使う。
export function formatRelative(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) {
    return "たった今";
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}分前`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}時間前`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}日前`;
  }
  const weeks = Math.floor(days / 7);
  if (weeks < 5) {
    return `${weeks}週間前`;
  }
  return formatDate(date);
}

// アバターに出す頭文字。
export function initialOf(name: string): string {
  return name.slice(0, 1).toUpperCase();
}
