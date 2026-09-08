# load balancer for ecs 
resource "aws_lb" "app_alb" {
  name               = "aws-bootcamp-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.ecs_sg.id, aws_security_group.alb_sg.id]
  subnets            = [module.network.public1_subnet.id, module.network.public2_subnet.id]
}

resource "aws_lb_target_group" "app_tg" {
  name        = "aws-bootcamp-tg"
  port        = var.app_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 3
    interval            = 20
    path                = "/healthcheck"
    matcher             = "200"
  }
}
resource "aws_lb_listener" "app_listener" {
  load_balancer_arn = aws_lb.app_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app_tg.arn
  }
}

# # listener for https
# resource "aws_lb_listener" "app_listener_https" {
#   load_balancer_arn = aws_lb.app_alb.arn
#   port              = "443"
#   protocol          = "HTTPS"
#   ssl_policy        = "ELBSecurityPolicy-2016-08"
#   certificate_arn   = aws_acm_certificate.cert.arn

#   default_action {
#     type             = "forward"
#     target_group_arn = aws_lb_target_group.app_tg.arn
#   }
# }
