################################################################################
# VPC Module for BarberZap Multi-Region Deployment
#
# This module creates a VPC with public and private subnets, routing tables,
# NAT gateway, and associated security groups.
################################################################################

resource "aws_vpc" "this" {
  cidr_block           = var.cidr_block
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(var.tags, {
    Name = "${var.region_name}-vpc"
  })
}

################################################################################
# Internet Gateway
################################################################################

resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id
  
  tags = merge(var.tags, {
    Name = "${var.region_name}-igw"
  })
}

################################################################################
# Public Subnets
################################################################################

resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.this.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(var.tags, {
    Name = "${var.region_name}-public-subnet-${count.index + 1}"
    Type = "public"
  })
}

################################################################################
# Private Subnets
################################################################################

resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.this.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]
  
  tags = merge(var.tags, {
    Name = "${var.region_name}-private-subnet-${count.index + 1}"
    Type = "private"
  })
}

################################################################################
# Elastic IP for NAT Gateway
################################################################################

resource "aws_eip" "nat" {
  count  = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : length(var.availability_zones)) : 0
  domain = "vpc"
  
  tags = merge(var.tags, {
    Name = "${var.region_name}-nat-eip-${count.index + 1}"
  })
  
  lifecycle {
    create_before_destroy = true
  }
}

################################################################################
# NAT Gateway
################################################################################

resource "aws_nat_gateway" "this" {
  count         = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : length(var.availability_zones)) : 0
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[0].id
  
  tags = merge(var.tags, {
    Name = "${var.region_name}-nat-gateway-${count.index + 1}"
  })
  
  depends_on = [aws_internet_gateway.this]
  
  lifecycle {
    create_before_destroy = true
  }
}

################################################################################
# Route Tables - Public
################################################################################

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id
  
  tags = merge(var.tags, {
    Name = "${var.region_name}-public-rt"
  })
}

resource "aws_route" "public_internet_gateway" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.this.id
}

resource "aws_route_table_association" "public" {
  count          = length(var.public_subnet_cidrs)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

################################################################################
# Route Tables - Private
################################################################################

resource "aws_route_table" "private" {
  count  = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : length(var.availability_zones)) : 1
  vpc_id = aws_vpc.this.id
  
  tags = merge(var.tags, {
    Name = "${var.region_name}-private-rt-${count.index + 1}"
  })
}

resource "aws_route" "private_nat_gateway" {
  count                  = var.enable_nat_gateway ? 1 : 0
  route_table_id         = aws_route_table.private[0].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.this[0].id
}

resource "aws_route_table_association" "private" {
  count          = length(var.private_subnet_cidrs)
  
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = var.single_nat_gateway || !var.enable_nat_gateway ? aws_route_table.private[0].id : aws_route_table.private[count.index].id
}

################################################################################
# VPC Endpoints (for AWS services without NAT)
################################################################################

resource "aws_vpc_endpoint" "ecr_dkr" {
  vpc_id       = aws_vpc.this.id
  service_name = "com.amazonaws.${data.aws_region.current.name}.ecr.dkr"
  vpc_endpoint_type = "Interface"
  
  private_dns_enabled = true
  
  security_group_ids = [aws_security_group.vpc_endpoints.id]
  
  subnet_ids = aws_subnet.private[*].id
  
  tags = merge(var.tags, {
    Name = "${var.region_name}-ecr-dkr-endpoint"
  })
}

resource "aws_vpc_endpoint" "ecr_api" {
  vpc_id       = aws_vpc.this.id
  service_name = "com.amazonaws.${data.aws_region.current.name}.ecr.api"
  vpc_endpoint_type = "Interface"
  
  private_dns_enabled = true
  
  security_group_ids = [aws_security_group.vpc_endpoints.id]
  
  subnet_ids = aws_subnet.private[*].id
  
  tags = merge(var.tags, {
    Name = "${var.region_name}-ecr-api-endpoint"
  })
}

resource "aws_vpc_endpoint" "logs" {
  vpc_id       = aws_vpc.this.id
  service_name = "com.amazonaws.${data.aws_region.current.name}.logs"
  vpc_endpoint_type = "Interface"
  
  private_dns_enabled = true
  
  security_group_ids = [aws_security_group.vpc_endpoints.id]
  
  subnet_ids = aws_subnet.private[*].id
  
  tags = merge(var.tags, {
    Name = "${var.region_name}-cloudwatch-logs-endpoint"
  })
}

################################################################################
# Security Group - VPC Endpoints
################################################################################

resource "aws_security_group" "vpc_endpoints" {
  name        = "${var.region_name}-vpc-endpoints-sg"
  description = "Security group for VPC endpoints"
  vpc_id      = aws_vpc.this.id
  
  tags = merge(var.tags, {
    Name = "${var.region_name}-vpc-endpoints-sg"
  })
}

resource "aws_vpc_security_group_ingress_rule" "vpc_endpoints" {
  security_group_id = aws_security_group.vpc_endpoints.id
  cidr_ipv4         = var.cidr_block
  ip_protocol       = "-1"
}

resource "aws_vpc_security_group_egress_rule" "vpc_endpoints" {
  security_group_id = aws_security_group.vpc_endpoints.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

################################################################################
# Flow Logs (optional)
################################################################################

resource "aws_flow_log" "vpc" {
  count = var.enable_flow_logs ? 1 : 0
  
  iam_role_arn    = var.flow_log_iam_role_arn
  log_destination = var.flow_log_destination_arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.this.id
  
  tags = merge(var.tags, {
    Name = "${var.region_name}-vpc-flow-log"
  })
}

################################################################################
# Outputs
################################################################################

output "vpc_id" {
  value       = aws_vpc.this.id
  description = "VPC ID"
}

output "vpc_cidr_block" {
  value       = aws_vpc.this.cidr_block
  description = "VPC CIDR block"
}

output "public_subnet_ids" {
  value       = aws_subnet.public[*].id
  description = "Public subnet IDs"
}

output "private_subnet_ids" {
  value       = aws_subnet.private[*].id
  description = "Private subnet IDs"
}

output "internet_gateway_id" {
  value       = aws_internet_gateway.this.id
  description = "Internet Gateway ID"
}

output "nat_gateway_ids" {
  value       = aws_nat_gateway.this[*].id
  description = "NAT Gateway IDs"
}
