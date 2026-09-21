provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project   = "cascade202609"
      ManagedBy = "terraform"
      Step      = "raretech-455"
    }
  }
}

data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}
