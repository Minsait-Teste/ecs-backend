resource "aws_db_instance" "default" {
  identifier            = "aws-bootcamp-db"
  db_name                = var.rds_db_name
  engine                 = var.rds_engine
  engine_version         = var.rds_engine_version
  instance_class         = var.rds_instance_class
  storage_type           = var.rds_storage_type
  allocated_storage      = 20
  username               = var.rds_username
  password               = var.rds_password
  skip_final_snapshot    = true
  publicly_accessible    = true
  db_subnet_group_name   = aws_db_subnet_group.rds_subnet_group.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
}

# subnet group for rds -> list of subnets to use
resource "aws_db_subnet_group" "rds_subnet_group" {
  name       = "aws-bootcamp-db"
  subnet_ids = [module.network.public1_subnet.id, module.network.public2_subnet.id]
}
