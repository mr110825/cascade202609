data "aws_iam_policy_document" "amplify_assume" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["amplify.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "amplify" {
  name               = "${var.name_prefix}-amplify-service-role"
  assume_role_policy = data.aws_iam_policy_document.amplify_assume.json
}

# SSR コンピュートのログを CloudWatch Logs に出すためだけの権限
resource "aws_iam_role_policy" "amplify_logs" {
  name = "${var.name_prefix}-amplify-logs"
  role = aws_iam_role.amplify.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams",
      ]
      Resource = "arn:aws:logs:${var.region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/amplify/*:*"
    }]
  })
}
