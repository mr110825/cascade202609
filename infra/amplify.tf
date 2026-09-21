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
}

resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.this.id
  branch_name = "main"

  stage             = "PRODUCTION"
  framework         = "Next.js - SSR"
  enable_auto_build = true
}
