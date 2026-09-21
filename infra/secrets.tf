resource "aws_secretsmanager_secret" "db" {
  name        = "${var.name_prefix}/database-url"
  description = "Cascade 本番 DB の接続情報（RareTECH ステップ455）"

  # destroy 後すぐ同じ名前で作り直せるようにする
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "db" {
  secret_id = aws_secretsmanager_secret.db.id

  secret_string = jsonencode({
    username     = var.db_username
    password     = random_password.db.result
    host         = aws_rds_cluster.this.endpoint
    port         = 5432
    dbname       = var.db_name
    DATABASE_URL = local.database_url
  })
}
