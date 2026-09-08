# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "aws-bootcamp-cluster"
}

# ECS task definition
resource "aws_ecs_task_definition" "app" {
  family                   = "aws-bootcamp-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn      = aws_iam_role.ecs_task_execution_role.arn

  # task role -> prmissions the running contanrs will have
  # execuation role -> permissions for ecs agent to pull images and send logs

  container_definitions = jsonencode([
    {
      name  = var.ecs_container_name
      image = "808826729764.dkr.ecr.us-east-1.amazonaws.com/aws-bootcamp-test-01:latest"

      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/aws-bootcamp",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }

    environment = [
      {
        name  = "DB_NAME"
        value = var.rds_db_name
      },
      {
        name  = "DB_HOST"
        # value = aws_db_instance.default.address
        value = "postgres"
      },
      {
        name  = "DB_PORT"
        value = var.rds_port
      },
      {
        name  = "DB_USER"
        value = var.rds_username
      },
      {
        name  = "DB_PASSWORD"
        value = var.rds_password
      },
      {
        name  = "PORT"
        value = var.app_port
      }
    ]
      essential = true
      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000
          protocol = "tcp" }
      ] 
    }
  ])
}

resource "aws_ecs_service" "app_service" {
  name            = "aws-bootcamp-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [module.network.public1_subnet.id, module.network.public2_subnet.id]
    security_groups  = [aws_security_group.ecs_sg.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app_tg.arn
    container_name   = var.ecs_container_name
    container_port   = var.app_port
  }

  depends_on = [ aws_db_instance.default ]
}

# IAM role for ECS task execution
resource "aws_iam_role" "ecs_task_execution_role" {
  name = "aws-bootcamp-ecsTaskExecutionRole" 
    assume_role_policy = jsonencode({
        Version = "2012-10-17"
        Statement = [
        {
            Action = "sts:AssumeRole"
            Effect = "Allow"
            Principal = {
            Service = "ecs-tasks.amazonaws.com"
            }
        }]
    })
}

# IAM policy for ECS task execution - ECR pull permissions
resource "aws_iam_role_policy" "ecs_task_execution_policy" {
    name   = "aws-bootcamp-ecsTaskExecutionPolicy"
    role   = aws_iam_role.ecs_task_execution_role.id
    policy = jsonencode({
"Version": "2012-10-17",
"Statement": [
    {
        "Effect": "Allow",
        "Action": [
            "ecr:GetAuthorizationToken",
            "ecr:BatchCheckLayerAvailability",
            "ecr:GetDownloadUrlForLayer",
            "ecr:BatchGetImage",
            "logs:CreateLogStream",
            "logs:PutLogEvents"
        ],
        "Resource": "*"
    }]
  })
}
