provider "aws" {
  region = "us-east-1"
}

resource "aws_key_pair" "chatui_key" {
  key_name   = "chatui-key"
  public_key = file("~/.ssh/chatui-key.pub")
}

resource "aws_security_group" "chatui_sg" {
  name        = "ham-chat-ui-sg"
  description = "Allow SSH, HTTP, and ChatUI traffic"

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "ChatUI Dev Server"
    from_port   = 5173
    to_port     = 5173
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "ham_chat_ui_instance" {
  ami                         = "ami-0fc5d935ebf8bc3bc" # Ubuntu 22.04 in us-east-1
  instance_type               = "t3.small"
  key_name                    = aws_key_pair.chatui_key.key_name
  vpc_security_group_ids      = [aws_security_group.chatui_sg.id]
  associate_public_ip_address = true

  tags = {
    Name = "ham-chat-ui-ec2"
  }
}

output "chatui_public_ip" {
  value = aws_instance.ham_chat_ui_instance.public_ip
}