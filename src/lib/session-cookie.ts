// Cookie の名前だけを置いた小さなファイル。
//
// middleware は Edge ランタイムで動くため、node:crypto や Prisma を
// 読み込むファイルを import できない。
// そこで名前だけをここに切り出し、middleware と session.ts の両方から使う。
export const SESSION_COOKIE_NAME = "cascade_session";
