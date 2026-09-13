import type { ThreadStatus, Visibility } from "@/generated/prisma/enums";

// ステータスと公開設定のバッジ。
// 値ごとに「どのクラスを付けるか」「何と表示するか」を対応表にしている。

const STATUS_LABEL: Record<ThreadStatus, string> = {
  OPEN: "Open",
  CLOSED: "Closed",
};

const STATUS_CLASS: Record<ThreadStatus, string> = {
  OPEN: "badge badge-open",
  CLOSED: "badge badge-closed",
};

const VISIBILITY_LABEL: Record<Visibility, string> = {
  PUBLIC: "公開",
  LIMITED: "限定公開",
  PRIVATE: "非公開",
};

const VISIBILITY_CLASS: Record<Visibility, string> = {
  PUBLIC: "badge badge-public",
  LIMITED: "badge badge-limited",
  PRIVATE: "badge badge-private",
};

export function StatusBadge({ status }: { status: ThreadStatus }) {
  return <span className={STATUS_CLASS[status]}>{STATUS_LABEL[status]}</span>;
}

export function VisibilityBadge({ visibility }: { visibility: Visibility }) {
  return (
    <span className={VISIBILITY_CLASS[visibility]}>
      {VISIBILITY_LABEL[visibility]}
    </span>
  );
}
