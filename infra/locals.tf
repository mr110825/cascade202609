locals {
  database_url = format(
    "postgresql://%s:%s@%s:5432/%s?schema=public&sslmode=require",
    var.db_username,
    random_password.db.result,
    aws_rds_cluster.this.endpoint,
    var.db_name,
  )
}
