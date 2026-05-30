################################################################################
# Main Terraform Configuration for BarberZap Multi-Region Deployment
#
# This file defines the overall multi-region infrastructure including:
# - VPCs in each region
# - Supabase regional instances
# - Redis clusters
# - Compute instances (ECS/EKS)
# - CDN distribution (CloudFront/Cloudflare)
################################################################################

terraform {
  required_version = ">= 1.3.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
    
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }
    
    database = {
      source  = "cyrilgdn/postgresql"
      version = "~> 1.21"
    }
  }
  
  backend "s3" {
    bucket         = "barberzap-terraform-state"
    key            = "barberzap/multi-region/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "barberzap-terraform-locks"
  }
}

# Provider configuration for each region
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "BarberZap"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

provider "aws" {
  alias  = "latam"
  region = "us-east-1"  # Using US East as nearest
  
  default_tags {
    tags = {
      Project     = "BarberZap"
      Region      = "latam"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

provider "aws" {
  alias  = "us-west"
  region = "us-west-2"
  
  default_tags {
    tags = {
      Project     = "BarberZap"
      Region      = "us-west"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

provider "aws" {
  alias  = "eu-central"
  region = "eu-central-1"
  
  default_tags {
    tags = {
      Project     = "BarberZap"
      Region      = "eu-central"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

provider "aws" {
  alias  = "asia-pacific"
  region = "ap-northeast-1"
  
  default_tags {
    tags = {
      Project     = "BarberZap"
      Region      = "asia-pacific"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

################################################################################
# Data Sources
################################################################################

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
data "aws_availability_zones" "available" {}

# Get existing VPC (if deploying to existing infrastructure)
data "aws_vpc" "existing" {
  count = var.use_existing_vpc ? 1 : 0
  id    = var.existing_vpc_id
}

################################################################################
# Local Variables
################################################################################

locals {
  project_name = "barberzap"
  
  regions = {
    latam        = "us-east-1"
    us-east      = "us-east-1"
    us-west      = "us-west-2"
    eu-central   = "eu-central-1"
    asia-pacific = "ap-northeast-1"
  }
  
  supabase_regions = {
    latam        = "iad"
    us-east      = "iad"
    us-west      = "sfo"
    eu-central   = "fra"
    asia-pacific = "tok"
  }
  
  tags = {
    Project     = local.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

################################################################################
# VPC and Networking - LATAM (Primary)
################################################################################

module "vpc_latam" {
  source = "./modules/vpc"
  
  providers = {
    aws = aws.latam
  }
  
  region_name    = "latam"
  cidr_block     = var.vpc_cidr_latam
  availability_zones = var.availability_zones_latam
  
  public_subnet_cidrs  = var.public_subnet_cidrs_latam
  private_subnet_cidrs = var.private_subnet_cidrs_latam
  
  enable_nat_gateway = var.enable_nat_gateway
  
  tags = local.tags
}

################################################################################
# VPC and Networking - US West
################################################################################

module "vpc_uswest" {
  source = "./modules/vpc"
  
  providers = {
    aws = aws.us-west
  }
  
  region_name    = "us-west"
  cidr_block     = var.vpc_cidr_uswest
  
  public_subnet_cidrs  = var.public_subnet_cidrs_uswest
  private_subnet_cidrs = var.private_subnet_cidrs_uswest
  
  enable_nat_gateway = var.enable_nat_gateway
  single_nat_gateway = true
  
  tags = local.tags
}

################################################################################
# VPC and Networking - Europe Central
################################################################################

module "vpc_eucentral" {
  source = "./modules/vpc"
  
  providers = {
    aws = aws.eu-central
  }
  
  region_name    = "eu-central"
  cidr_block     = var.vpc_cidr_eucentral
  
  public_subnet_cidrs  = var.public_subnet_cidrs_eucentral
  private_subnet_cidrs = var.private_subnet_cidrs_eucentral
  
  enable_nat_gateway = var.enable_nat_gateway
  single_nat_gateway = true
  
  tags = local.tags
}

################################################################################
# VPC and Networking - Asia Pacific
################################################################################

module "vpc_asiapacific" {
  source = "./modules/vpc"
  
  providers = {
    aws = aws.asia-pacific
  }
  
  region_name    = "asia-pacific"
  cidr_block     = var.vpc_cidr_asiapacific
  
  public_subnet_cidrs  = var.public_subnet_cidrs_asiapacific
  private_subnet_cidrs = var.private_subnet_cidrs_asiapacific
  
  enable_nat_gateway = var.enable_nat_gateway
  single_nat_gateway = true
  
  tags = local.tags
}

################################################################################
# Supabase Projects (Regional)
################################################################################

# Supabase - LATAM (Primary)
module "supabase_latam" {
  source = "./modules/supabase"
  
  project_name     = "${local.project_name}-latam"
  supabase_region  = local.supabase_regions.latam
  db_password      = var.supabase_db_password
  organization_id  = var.supabase_organization_id
  
  enable_api       = true
  enable_edge_functions = true
  
  tags = local.tags
}

# Supabase - US West
module "supabase_uswest" {
  source = "./modules/supabase"
  
  project_name     = "${local.project_name}-uswest"
  supabase_region  = local.supabase_regions.us-west
  db_password      = var.supabase_db_password
  organization_id  = var.supabase_organization_id
  
  # Make this a read replica of LATAM
  is_read_replica  = true
  primary_ref      = module.supabase_latam.project_ref
  
  enable_api       = true
  
  tags = local.tags
}

# Supabase - Europe Central
module "supabase_eucentral" {
  source = "./modules/supabase"
  
  project_name     = "${local.project_name}-eucentral"
  supabase_region  = local.supabase_regions.eu-central
  db_password      = var.supabase_db_password
  organization_id  = var.supabase_organization_id
  
  is_read_replica  = true
  primary_ref      = module.supabase_latam.project_ref
  
  enable_api       = true
  
  tags = local.tags
}

# Supabase - Asia Pacific
module "supabase_asiapacific" {
  source = "./modules/supabase"
  
  project_name     = "${local.project_name}-asiapacific"
  supabase_region  = local.supabase_regions.asia-pacific
  db_password      = var.supabase_db_password
  organization_id  = var.supabase_organization_id
  
  is_read_replica  = true
  primary_ref      = module.supabase_latam.project_ref
  
  enable_api       = true
  
  tags = local.tags
}

################################################################################
# Redis Clusters (Regional)
################################################################################

# Redis - LATAM (Primary)
module "redis_cluster_latam" {
  source = "./modules/redis_cluster"
  
  providers = {
    aws = aws.latam
  }
  
  cluster_name     = "${local.project_name}-latam"
  vpc_id           = module.vpc_latam.vpc_id
  private_subnet_ids = module.vpc_latam.private_subnet_ids
  
  node_size        = var.redis_node_size
  num_cache_nodes  = var.redis_num_nodes_latam
  replication_group_desc = "BarberZap Redis cluster - LATAM"
  
  automatic_failover_enabled = true
  multi_az_enabled          = var.redis_multi_az
  
  tags = local.tags
}

# Redis - US West
module "redis_cluster_uswest" {
  source = "./modules/redis_cluster"
  
  providers = {
    aws = aws.us-west
  }
  
  cluster_name     = "${local.project_name}-uswest"
  vpc_id           = module.vpc_uswest.vpc_id
  private_subnet_ids = module.vpc_uswest.private_subnet_ids
  
  node_size        = var.redis_node_size
  num_cache_nodes  = var.redis_num_nodes_uswest
  replication_group_desc = "BarberZap Redis cluster - US West"
  
  automatic_failover_enabled = true
  multi_az_enabled          = true
  
  # Cross-region replication from LATAM
  global_datastore     = true
  primary_cluster_arn  = module.redis_cluster_latam.cluster_arn
  
  tags = local.tags
}

# Redis - Europe Central
module "redis_cluster_eucentral" {
  source = "./modules/redis_cluster"
  
  providers = {
    aws = aws.eu-central
  }
  
  cluster_name     = "${local.project_name}-eucentral"
  vpc_id           = module.vpc_eucentral.vpc_id
  private_subnet_ids = module.vpc_eucentral.private_subnet_ids
  
  node_size        = var.redis_node_size
  num_cache_nodes  = 2
  replication_group_desc = "BarberZap Redis cluster - EU Central"
  
  automatic_failover_enabled = true
  multi_az_enabled          = true
  
  global_datastore     = true
  primary_cluster_arn  = module.redis_cluster_latam.cluster_arn
  
  tags = local.tags
}

# Redis - Asia Pacific
module "redis_cluster_asiapacific" {
  source = "./modules/redis_cluster"
  
  providers = {
    aws = aws.asia-pacific
  }
  
  cluster_name     = "${local.project_name}-asiapacific"
  vpc_id           = module.vpc_asiapacific.vpc_id
  private_subnet_ids = module.vpc_asiapacific.private_subnet_ids
  
  node_size        = var.redis_node_size
  num_cache_nodes  = 2
  replication_group_desc = "BarberZap Redis cluster - Asia Pacific"
  
  automatic_failover_enabled = true
  multi_az_enabled          = true
  
  global_datastore     = true
  primary_cluster_arn  = module.redis_cluster_latam.cluster_arn
  
  tags = local.tags
}

################################################################################
# ECS/EKS Clusters (Compute)
################################################################################

# ECS - LATAM
module "ecs_cluster_latam" {
  source = "./modules/ecs"
  
  providers = {
    aws = aws.latam
  }
  
  cluster_name    = "${local.project_name}-latam"
  vpc_id          = module.vpc_latam.vpc_id
  subnet_ids      = module.vpc_latam.private_subnet_ids
  
  instance_type   = var.ecs_instance_type
  min_capacity    = var.ecs_min_capacity
  max_capacity    = var.ecs_max_capacity
  desired_capacity = var.ecs_desired_capacity
  
  redis_endpoint  = module.redis_cluster_latam.cluster_endpoint
  supabase_url    = module.supabase_latam.api_url
  supabase_key    = module.supabase_latam.anon_key
  
  tags = local.tags
}

# ECS - US West
module "ecs_cluster_uswest" {
  source = "./modules/ecs"
  
  providers = {
    aws = aws.us-west
  }
  
  cluster_name    = "${local.project_name}-uswest"
  vpc_id          = module.vpc_uswest.vpc_id
  subnet_ids      = module.vpc_uswest.private_subnet_ids
  
  instance_type   = var.ecs_instance_type
  min_capacity    = 2
  max_capacity    = 10
  desired_capacity = 2
  
  redis_endpoint  = module.redis_cluster_uswest.cluster_endpoint
  supabase_url    = module.supabase_uswest.api_url
  supabase_key    = module.supabase_uswest.anon_key
  
  tags = local.tags
}

################################################################################
# CloudFront CDN (Global)
################################################################################

module "cloudfront_distribution" {
  source = "./modules/cloudfront"
  
  primary_origin_id = "latam-origin"
  
  origins = {
    latam = {
      domain_name = "${module.ecs_cluster_latam.alb_dns_name}"
      origin_id   = "latam-origin"
    }
    us-west = {
      domain_name = "${module.ecs_cluster_uswest.alb_dns_name}"
      origin_id   = "uswest-origin"
    }
  }
  
  cache_behaviors = {
    "/api/*" = {
      target_origin_id = "latam-origin"
      allowed_methods  = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
      cached_methods   = ["GET", "HEAD"]
      cache_policy_id  = data.aws_cloudfront_cache_policy.optimized.id
      origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_query.id
    }
  }
  
  default_ttl = 3600
  max_ttl     = 86400
  min_ttl     = 0
  
  price_class = var.cf_price_class
  
  tags = local.tags
}

################################################################################
# Cloudflare DNS and WAF (Edge)
################################################################################

module "cloudflare" {
  source = "./modules/cloudflare"
  
  domain         = var.domain
  zones          = var.cloudflare_zones
  
  # Regional CNAMEs
  regional_records = {
    "api-latam" = {
      name   = "api-latam"
      value  = module.ecs_cluster_latam.alb_dns_name
      type   = "CNAME"
      proxied = true
    }
    "api-useast" = {
      name   = "api-useast"
      value  = module.ecs_cluster_latam.alb_dns_name
      type   = "CNAME"
      proxied = true
    }
    "api-uswest" = {
      name   = "api-uswest"
      value  = module.ecs_cluster_uswest.alb_dns_name
      type   = "CNAME"
      proxied = true
    }
  }
  
  # Latency-based routing
  load_balancing = {
    "api" = {
      name      = "api"
      default_pool = [
        module.ecs_cluster_latam.alb_dns_name,
        module.ecs_cluster_uswest.alb_dns_name,
      ]
      region_pools = {
        "NA" = [
          module.ecs_cluster_latam.alb_dns_name,
          module.ecs_cluster_uswest.alb_dns_name,
        ]
        "EU" = [module.ecs_cluster_eucentral.alb_dns_name]
        "ASIA" = [module.ecs_cluster_asiapacific.alb_dns_name]
      }
    }
  }
}

################################################################################
# Security
################################################################################

module "security_groups" {
  source = "./modules/security"
  
  vpc_id          = module.vpc_latam.vpc_id
  vpc_cidr_blocks = ["10.0.0.0/16"]
  
  tags = local.tags
}

################################################################################
# Outputs
################################################################################

output "vpcs" {
  description = "VPC IDs for all regions"
  value = {
    latam        = module.vpc_latam.vpc_id
    us-west      = module.vpc_uswest.vpc_id
    eu-central   = module.vpc_eucentral.vpc_id
    asia-pacific = module.vpc_asiapacific.vpc_id
  }
}

output "supabase_projects" {
  description = "Supabase project references"
  value = {
    latam        = module.supabase_latam.project_ref
    us-west      = module.supabase_uswest.project_ref
    eu-central   = module.supabase_eucentral.project_ref
    asia-pacific = module.supabase_asiapacific.project_ref
  }
}

output "redis_clusters" {
  description = "Redis cluster endpoints"
  value = {
    latam        = module.redis_cluster_latam.cluster_endpoint
    us-west      = module.redis_cluster_uswest.cluster_endpoint
    eu-central   = module.redis_cluster_eucentral.cluster_endpoint
    asia-pacific = module.redis_cluster_asiapacific.cluster_endpoint
  }
}

output ecs_clusters = {
  description = "ECS cluster ARNs"
  value = {
    latam   = module.ecs_cluster_latam.cluster_arn
    us-west = module.ecs_cluster_uswest.cluster_arn
  }
}

output "cloudfront_url" {
  description = "CloudFront distribution URL"
  value       = module.cloudfront_distribution.domain_name
}
