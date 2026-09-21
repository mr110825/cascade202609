locals {
  # TLS の設定は URL に書かずアプリ側（src/lib/prisma.ts）に置く。
  # node-postgres は接続文字列に sslmode があるとコード側の ssl 設定を無視するため、
  # ここに sslmode を書くと RDS の CA を渡せず、証明書の検証に失敗する。
  # アプリは RDS の CA を明示して証明書とホスト名を検証する（verify-full 相当）。
  database_url = format(
    "postgresql://%s:%s@%s:5432/%s?schema=public",
    var.db_username,
    random_password.db.result,
    aws_rds_cluster.this.endpoint,
    var.db_name,
  )
}
