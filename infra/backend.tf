terraform {
  backend "s3" {
    bucket       = "aws-full-project-terraform-state"
    key          = "ecs-backend/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true
  }
}