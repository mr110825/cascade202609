import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { RDS_CA } from "./rds-ca";

// RDS へ繋ぐときだけ CA を明示して証明書とホスト名を検証する。
// ローカルの docker 上の Postgres は TLS を張っていないので何も渡さない。
// なお接続文字列に sslmode が入っていると node-postgres はこの ssl 設定を無視する。
function sslOptions(url: string | undefined) {
  if (!url || !/\.rds\.amazonaws\.com(:|\/)/.test(url)) return {};
  return { ssl: { ca: RDS_CA } };
}

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    ...sslOptions(process.env.DATABASE_URL),
  });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
