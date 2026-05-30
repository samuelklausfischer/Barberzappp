################################################################################
# Variables for BarberZap Multi-Region Terraform Deployment
################################################################################

variable "aws_region" {
  description = "Default AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "production"
}

variable "domain" {
  description = "Domain name for the application"
  type        = string
  default     = "barberzap.com"
}

################################################################################
# VPC Configuration
################################################################################

variable "use_existing_vpc" {
  description = "Use existing VPC instead of creating new one"
  type        = bool
  default     = false
}

variable "existing_vpc_id" {
  description = "Existing VPC ID if use_existing_vpc is true"
  type        = string
  default     = ""
}

# LATAM VPC
variable "vpc_cidr_latam" {
  description = "CIDR block for LATAM VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones_latam" {
  description = "Availability zones for LATAM region"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "public_subnet_cidrs_latam" {
  description = "CIDR blocks for LATAM public subnets"
  type        = list(string)
  default     = [
    "10.0.1.0/24",
    "10.0.2.0/24",
    "10.0.3.0/24",
  ]
}

variable "private_subnet_cidrs_latam" {
  description = "CIDR blocks for LATAM private subnets"
  type        = list(string)
  default     = [
    "10.0.10.0/24",
    "10.0.11.0/24",
    "10.0.12.0/24",
  ]
}

# US West VPC
variable "vpc_cidr_uswest" {
  description = "CIDR block for US West VPC"
  type        = string
  default     = "10.1.0.0/16"
}

variable "public_subnet_cidrs_uswest" {
  description = "CIDR blocks for US West public subnets"
  type        = list(string)
  default     = [
    "10.1.1.0/24",
    "10.1.2.0/24",
  ]
}

variable "private_subnet_cidrs_uswest" {
  description = "CIDR blocks for US West private subnets"
  type        = list(string)
  default     = [
    "10.1.10.0/24",
    "10.1.11.0/24",
  ]
}

# EU Central VPC
variable "vpc_cidr_eucentral" {
  description = "CIDR block for EU Central VPC"
  type        = string
  default     = "10.2.0.0/16"
}

variable "public_subnet_cidrs_eucentral" {
  description = "CIDR blocks for EU Central public subnets"
  type        = list(string)
  default     = [
    "10.2.1.0/24",
    "10.2.2.0/24",
  ]
}

variable "private_subnet_cidrs_eucentral" {
  description = "CIDR blocks for EU Central private subnets"
  type        = list(string)
  default     = [
    "10.2.10.0/24",
    "10.2.11.0/24",
  ]
}

# Asia Pacific VPC
variable "vpc_cidr_asiapacific" {
  description = "CIDR block for Asia Pacific VPC"
  type        = string
  default     = "10.3.0.0/16"
}

variable "public_subnet_cidrs_asiapacific" {
  description = "CIDR blocks for Asia Pacific public subnets"
  type        = list(string)
  default     = [
    "10.3.1.0/24",
    "10.3.2.0/24",
  ]
}

variable "private_subnet_cidrs_asiapacific" {
  description = "CIDR blocks for Asia Pacific private subnets"
  type        = list(string)
  default     = [
    "10.3.10.0/24",
    "10.3.11.0/24",
  ]
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets"
  type        = bool
  default     = true
}

################################################################################
# Supabase Configuration
################################################################################

variable "supabase_organization_id" {
  description = "Supabase organization ID"
  type        = string
  default     = ""
}

variable "supabase_db_password" {
  description = "Password for Supabase databases"
  type        = string
  sensitive   = true
  default     = "change-me-in-production"
}

################################################################################
# Redis Configuration
################################################################################

variable "redis_node_size" {
  description = "Node size for Redis cluster"
  type        = string
  default     = "cache.m5.large"
}

variable "redis_num_nodes_latam" {
  description = "Number of Redis nodes for LATAM region"
  type        = number
  default     = 3
}

variable "redis_num_nodes_uswest" {
  description = "Number of Redis nodes for US West region"
  type        = number
  default     = 2
}

variable "redis_multi_az" {
  description = "Enable Multi-AZ for Redis"
  type        = bool
  default     = true
}

variable "redis_engine_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.0"
}

variable "redis_port" {
  description = "Redis port"
  type        = number
  default     = 6379
}

################################################################################
# ECS Configuration
################################################################################

variable "ecs_instance_type" {
  description = "EC2 instance type for ECS"
  type        = string
  default     = "m5.large"
}

variable "ecs_min_capacity" {
  description = "Minimum capacity for ECS auto scaling"
  type        = number
  default     = 2
}

variable "ecs_max_capacity" {
  description = "Maximum capacity for ECS auto scaling"
  type        = number
  default     = 20
}

variable "ecs_desired_capacity" {
  description = "Initial desired capacity for ECS"
  type        = number
  default     = 3
}

variable "ecs_task_cpu" {
  description = "CPU units for ECS tasks"
  type        = number
  default     = 1024
}

variable "ecs_task_memory" {
  description = "Memory (MB) for ECS tasks"
  type        = number
  default     = 2048
}

################################################################################
# CloudFront Configuration
################################################################################

variable "cf_price_class" {
  description = "CloudFront price class (PriceClass_All, PriceClass_200, etc)"
  type        = string
  default     = "PriceClass_All"
}

variable "cf_viewer_certificate" {
  description = "ACM certificate ARN for CloudFront viewer certificate"
  type        = string
  default     = ""
}

variable "cf_alternate_domain_names" {
  description = "Alternate domain names for CloudFront"
  type        = list(string)
  default     = []
}

################################################################################
# Cloudflare Configuration
################################################################################

variable "cloudflare_api_token" {
  description = "Cloudflare API token"
  type        = string
  sensitive   = true
}

variable "cloudflare_zones" {
  description = "Cloudflare zones to manage"
  type        = map(string)
  default     = {
    "barberzap.com" = "zone-id-here"
  }
}

variable "cloudflare_record_proxied" {
  description = "Whether Cloudflare records are proxied"
  type        = bool
  default     = true
}

################################################################################
# Security Configuration
################################################################################

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to access the application"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "ssh_allowed_cidr" {
  description = "CIDR blocks allowed for SSH access"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "enable_waf" {
  description = "Enable AWS WAF"
  type        = bool
  default     = true
}

variable "enable_ddos_protection" {
  description = "Enable DDoS protection (Shield)"
  type        = bool
  default     = true
}

################################################################################
# Monitoring and Logging
################################################################################

variable "enable_monitoring" {
  description = "Enable CloudWatch monitoring"
  type        = bool
  default     = true
}

variable "enable_logging" {
  description = "Enable access and error logging"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "Retention period for logs in days"
  type        = number
  default     = 30
}

variable "enable_xray_tracing" {
  description = "Enable AWS X-Ray tracing"
  type        = bool
  default     = false
}

################################################################################
# Backup Configuration
################################################################################

variable "enable_backups" {
  description = "Enable automated backups"
  type        = bool
  default     = true
}

variable "backup_retention_days" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

variable "backup_window" {
  description = "Backup window (preferred time)"
  type        = string
  default     = "03:00-05:00"
}

################################################################################
# Tags
################################################################################

variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

################################################################################
# Feature Flags
################################################################################

variable "enable_edge_functions" {
  description = "Enable Supabase Edge Functions"
  type        = bool
  default     = true
}

variable "enable_realtime" {
  description = "Enable Supabase Realtime"
  type        = bool
  default     = true
}

variable "enable_storage" {
  description = "Enable Supabase Storage"
  type        = bool
  default     = true
}

variable "enable_auth_providers" {
  description = "Enable additional auth providers"
  type        = list(string)
  default     = ["email", "google", "facebook"]
}
