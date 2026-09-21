resource "aws_db_subnet_group" "this" {
  name       = "${var.name_prefix}-db-subnet-group"
  subnet_ids = aws_subnet.public[*].id

  tags = { Name = "${var.name_prefix}-db-subnet-group" }
}

resource "aws_security_group" "db" {
  name        = "${var.name_prefix}-db-sg"
  description = "Aurora Serverless v2 (public) inbound 5432"
  vpc_id      = aws_vpc.this.id

  tags = { Name = "${var.name_prefix}-db-sg" }
}

# ローカルから psql / prisma migrate deploy を流すための穴
resource "aws_vpc_security_group_ingress_rule" "db_from_home" {
  security_group_id = aws_security_group.db.id
  description       = "psql / prisma migrate deploy from my laptop"

  cidr_ipv4   = var.my_ip_cidr
  ip_protocol = "tcp"
  from_port   = 5432
  to_port     = 5432
}

# Amplify の SSR コンピュートから Aurora へ。
# 送信元IPが公開されていないため絞り込めない。アプリを動かす期間だけ開ける。
resource "aws_vpc_security_group_ingress_rule" "db_from_amplify" {
  count = var.allow_amplify_db_access ? 1 : 0

  security_group_id = aws_security_group.db.id
  description       = "Amplify SSR compute (source IP is not published)"

  cidr_ipv4   = "0.0.0.0/0"
  ip_protocol = "tcp"
  from_port   = 5432
  to_port     = 5432
}

resource "random_password" "db" {
  length = 32

  # RDS が禁止する記号と接続文字列のエスケープを両方避けるため英数字のみにする
  special = false
}

resource "aws_rds_cluster_parameter_group" "this" {
  name        = "${var.name_prefix}-aurora-pg17"
  family      = "aurora-postgresql17"
  description = "force SSL for ${var.name_prefix}"

  parameter {
    name         = "rds.force_ssl"
    value        = "1"
    apply_method = "pending-reboot"
  }
}

resource "aws_rds_cluster" "this" {
  cluster_identifier = "${var.name_prefix}-aurora"

  engine         = "aurora-postgresql"
  engine_mode    = "provisioned"
  engine_version = var.db_engine_version

  database_name   = var.db_name
  master_username = var.db_username
  master_password = random_password.db.result

  db_subnet_group_name            = aws_db_subnet_group.this.name
  vpc_security_group_ids          = [aws_security_group.db.id]
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.this.name

  storage_encrypted       = true
  backup_retention_period = 1

  # 捨てる前提の検証環境
  skip_final_snapshot = true
  deletion_protection = false

  serverlessv2_scaling_configuration {
    min_capacity             = var.db_min_acu
    max_capacity             = var.db_max_acu
    seconds_until_auto_pause = var.db_seconds_until_auto_pause
  }
}

resource "aws_rds_cluster_instance" "this" {
  identifier         = "${var.name_prefix}-aurora-1"
  cluster_identifier = aws_rds_cluster.this.id

  instance_class = "db.serverless"
  engine         = aws_rds_cluster.this.engine
  engine_version = aws_rds_cluster.this.engine_version

  publicly_accessible = true
}
