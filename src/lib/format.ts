// 画面に出す日時の整形。
// 本番の SSR コンピュートは TZ=UTC で動くため、date.getHours() のような
// 実行環境のローカルTZに依存するメソッドは使わず、明示的に Asia/Tokyo で組み立てる。

const JST = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function partsOf(date: Date): Record<string, string> {
  return Object.fromEntries(JST.formatToParts(date).map((x) => [x.type, x.value]));
}

export function formatDate(date: Date): string {
  const p = partsOf(date);
  return `${p.year}年${p.month}月${p.day}日`;
}

export function formatDateTime(date: Date): string {
  const p = partsOf(date);
  return `${p.year}年${p.month}月${p.day}日 ${p.hour}:${p.minute}`;
}

// 「2時間前」のような相対表示。一覧の更新日時に使う。エポック差分なので TZ 非依存。
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
