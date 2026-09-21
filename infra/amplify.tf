resource "aws_amplify_app" "this" {
  name       = "cascade202609"
  repository = var.github_repository

  access_token         = var.github_access_token
  platform             = "WEB_COMPUTE"
  iam_service_role_arn = aws_iam_role.amplify.arn

  # build_spec は書かない。リポジトリルートの amplify.yml を使う（#9）

  environment_variables = {
    DATABASE_URL = local.database_url
  }

  # Amplify は access_token を読み戻せない（write-only）ため、Terraform は
  # apply のたびに差分ありと判定して再送する。有効な PAT を export し続けない限り
  # plan が No changes. にならず、トークン失効時には無関係な apply まで巻き添えで失敗する。
  # リポジトリ接続は Amplify 側に保存済みなので、更新時は送らない（作成時は送られる）。
  lifecycle {
    ignore_changes = [access_token]
  }
}

resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.this.id
  branch_name = "main"

  stage             = "PRODUCTION"
  framework         = "Next.js - SSR"
  enable_auto_build = true

  enable_basic_auth = var.enable_basic_auth
  basic_auth_credentials = var.enable_basic_auth ? base64encode(
    "${var.basic_auth_username}:${var.basic_auth_password}"
  ) : null

  # Amplify は basic_auth_credentials をそのまま返さない。GetBranch が返すのは
  # base64("<username>:<70文字の別表現>") で、送った値と一致しないため plan に
  # 恒久差分が出る（access_token と同じ「書けるが読み戻せない」属性）。
  # パスワードを変えるときは、この ignore_changes を一時的に外すか
  # terraform apply -replace=aws_amplify_branch.main を使う。
  lifecycle {
    ignore_changes = [basic_auth_credentials]
  }
}
