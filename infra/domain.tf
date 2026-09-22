# 456: 独自ドメイン。
# ドメインは Route53 で登録したため、同名のホストゾーンが自動作成され、
# NS 4本もドメインに自動設定されている。よって resource ではなく data で参照する。
# 本番 URL は https://www.<domain_name>。
data "aws_route53_zone" "this" {
  name         = var.domain_name
  private_zone = false
}

# Amplify にドメインを紐づける。
# wait_for_verification の既定 true は「検証が終わるまで待つ」だが、
# 検証用 CNAME はこのリソースの作成後にしか値が返らないため、
# 待つと自分でレコード作成をブロックしてデッドロックする。
resource "aws_amplify_domain_association" "this" {
  app_id      = aws_amplify_app.this.id
  domain_name = var.domain_name

  wait_for_verification = false

  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = "www"
  }
}

# Amplify が返す DNS レコードは "<名前> <型> <値>" のスペース区切り文字列。
# sub_domain は set なので prefix をキーにした map に直して参照する。
locals {
  cert_record = split(" ", aws_amplify_domain_association.this.certificate_verification_dns_record)
  sub_records = {
    for s in aws_amplify_domain_association.this.sub_domain :
    s.prefix => split(" ", s.dns_record)
  }
}

# ACM の DNS 検証用レコード
resource "aws_route53_record" "cert_verification" {
  zone_id = data.aws_route53_zone.this.zone_id
  name    = local.cert_record[0]
  type    = local.cert_record[1]
  records = [local.cert_record[2]]
  ttl     = 300

  # 検証レコードが再発行されたときに衝突しないように
  allow_overwrite = true
}

# www をサイト（CloudFront）へ向ける
resource "aws_route53_record" "www" {
  zone_id = data.aws_route53_zone.this.zone_id
  name    = "www.${var.domain_name}"
  type    = "CNAME"
  records = [local.sub_records["www"][2]]
  ttl     = 300

  # ホストゾーンが同一アカウント内にあるため、Amplify 自身が先に
  # 同名の CNAME を作る（TTL 500）。Terraform 管理下に取り込む。
  allow_overwrite = true
}
