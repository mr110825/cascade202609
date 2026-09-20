// 入力の上限値をここに集約する。
// コメント本文の上限は「コメント追加」と「スレッド作成時の最初のコメント」の
// 2経路から使うため、どちらからも import できる場所に置く。
// （comments.ts に置くと threads.ts との循環 import になる）
export const MAX_COMMENT_BODY_LENGTH = 10000;
