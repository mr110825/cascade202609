# 出力は、対応するリソースを作ったタスクで追記する。
#   #4 Aurora           -> db_endpoint
#   #5 Secrets Manager  -> db_secret_name
#   #8 Amplify          -> amplify_app_id / amplify_url

output "db_endpoint" {
  description = "Aurora クラスタのライターエンドポイント"
  value       = aws_rds_cluster.this.endpoint
}

output "db_secret_name" {
  description = "接続情報を入れた Secrets Manager のシークレット名"
  value       = aws_secretsmanager_secret.db.name
}

output "amplify_app_id" {
  value = aws_amplify_app.this.id
}

output "amplify_url" {
  value = "https://${aws_amplify_branch.main.branch_name}.${aws_amplify_app.this.default_domain}"
}
