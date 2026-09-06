// フォームの結果を画面に返すときの形。
// useActionState でこの型の値を受け取り、エラーや完了メッセージを表示する。
export type FormState = { error?: string; success?: string };

// FormData から文字列を取り出す小さな道具。
// formData.get() は string | File | null を返すので、そのままだと扱いにくい。
export function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "");
}
