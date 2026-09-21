# 出力は、対応するリソースを作ったタスクで追記する。
#   #4 Aurora           -> db_endpoint
#   #5 Secrets Manager  -> db_secret_name
#   #8 Amplify          -> amplify_app_id / amplify_url

output "db_endpoint" {
  description = "Aurora クラスタのライターエンドポイント"
  value       = aws_rds_cluster.this.endpoint
}
