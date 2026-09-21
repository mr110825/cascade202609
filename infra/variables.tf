variable "region" {
  description = "デプロイ先リージョン"
  type        = string
  default     = "ap-northeast-1"
}

variable "name_prefix" {
  description = "全リソース名の接頭辞"
  type        = string
  default     = "cascade"
}

variable "vpc_cidr" {
  description = "VPC の CIDR"
  type        = string
  default     = "10.20.0.0/16"
}

variable "my_ip_cidr" {
  description = "ローカルから psql / prisma migrate deploy を流すための自宅グローバルIP（/32）"
  type        = string
}

variable "allow_amplify_db_access" {
  description = <<-EOT
    Aurora の 5432 を 0.0.0.0/0 に開けるか。
    Amplify の SSR コンピュートは送信元IPが公開されておらず絞り込めないため、
    アプリを動かす期間だけ true にする。
  EOT
  type        = bool
  default     = false
}

variable "db_name" {
  description = "cascade は PostgreSQL の予約語で RDS に拒否されるため使えない"
  type        = string
  default     = "cascadeapp"
}

variable "db_username" {
  description = "db_name と同じ理由で予約語を避ける"
  type        = string
  default     = "cascadeapp"
}

variable "db_engine_version" {
  description = "aws rds describe-db-engine-versions --default-only で確認した値"
  type        = string
  default     = "17.9"
}

variable "db_min_acu" {
  description = "0 にすると無操作で自動停止する"
  type        = number
  default     = 0
}

variable "db_max_acu" {
  type    = number
  default = 1
}

variable "db_seconds_until_auto_pause" {
  description = "自動停止までの無操作時間（秒）。300〜86400"
  type        = number
  default     = 3600
}

variable "github_repository" {
  type    = string
  default = "https://github.com/mr110825/cascade202609"
}

variable "github_access_token" {
  description = "Amplify が GitHub を読むためのトークン。TF_VAR_github_access_token で渡す"
  type        = string
  sensitive   = true
  default     = ""
}

variable "enable_basic_auth" {
  description = "Amplify の Basic 認証でサイト全体を閉じるか"
  type        = bool
  default     = true
}

variable "basic_auth_username" {
  description = "Basic 認証のユーザー名"
  type        = string
  default     = "reviewer"
}

variable "basic_auth_password" {
  description = "Basic 認証のパスワード。TF_VAR_basic_auth_password で渡す"
  type        = string
  sensitive   = true
  default     = ""
}
