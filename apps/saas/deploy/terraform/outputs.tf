################################################################################
# Outputs for BarberZap Multi-Region Terraform Deployment
################################################################################

output "project_name" {
  description = "Project name"
  value       = "barberzap"
}

################################################################################
# VPC Outputs
################################################################################

output "vpc_ids" {
  description = "VPC IDs for all regions"
  value = {
    latam        = module.vpc_latam.vpc_id
    us-west      = module.vpc_uswest.vpc_id
    eu-central   = module.vpc_eucentral.vpc_id
    asia-pacific = module.vpc_asiapacific.vpc_id
  }
}

output "vpc_cidr_blocks" {
  description = "VPC CIDR blocks for all regions"
  value = {
    latam        = var.vpc_cidr_latam
    us-west      = var.vpc_cidr_uswest
    eu-central   = var.vpc_cidr_eucentral
    asia-pacific = var.vpc_cidr_asiapacific
  }
}

output "subnet_ids" {
  description = "Subnet IDs for all regions"
  value = {
    latam = {
      public  = module.vpc_latam.public_subnet_ids
      private = module.vpc_latam.private_subnet_ids
    }
    us-west = {
      public  = module.vpc_uswest.public_subnet_ids
      private = module.vpc_uswest.private_subnet_ids
    }
    eu-central = {
      public  = module.vpc_eucentral.public_subnet_ids
      private = module.vpc_eucentral.private_subnet_ids
    }
    asia-pacific = {
      public  = module.vpc_asiapacific.public_subnet_ids
      private = module.vpc_asiapacific.private_subnet_ids
    }
  }
}

################################################################################
# Supabase Outputs
################################################################################

output "supabase_project_refs" {
  description = "Supabase project references"
  value = {
    latam        = module.supabase_latam.project_ref
    us-west      = module.supabase_uswest.project_ref
    eu-central   = module.supabase_eucentral.project_ref
    asia-pacific = module.supabase_asiapacific.project_ref
  }
    sensitive = true
}

output "supabase_api_urls" {
  description = "Supabase API URLs"
  value = {
    latam        = module.supabase_latam.api_url
    us-west      = module.supabase_uswest.api_url
    eu-central   = module.supabase_eucentral.api_url
    asia-pacific = module.supabase_asiapacific.api_url
  }
  sensitive = true
}

output "supabase_anon_keys" {
  description = "Supabase anonymous keys"
  value = {
    latam        = module.supabase_latam.anon_key
    us-west      = module.supabase_uswest.anon_key
    eu-central   = module.supabase_eucentral.anon_key
    asia-pacific = module.supabase_asiapacific.anon_key
  }
  sensitive = true
}

output "supabase_service_role_keys" {
  description = "Supabase service role keys"
  value = {
    latam        = module.supabase_latam.service_role_key
    us-west      = module.supabase_uswest.service_role_key
    eu-central   = module.supabase_eucentral.service_role_key
    asia-pacific = module.supabase_asiapacific.service_role_key
  }
  sensitive = true
}

output "supabase_db_connection_strings" {
  description = "Supabase database connection strings"
  value = {
    latam        = module.supabase_latam.db_connection_string
    us-west      = module.supabase_uswest.db_connection_string
    eu-central   = module.supabase_eucentral.db_connection_string
    asia-pacific = module.supabase_asiapacific.db_connection_string
  }
  sensitive = true
}

################################################################################
# Redis Outputs
################################################################################

output "redis_cluster_endpoints" {
  description = "Redis cluster endpoints"
  value = {
    latam        = module.redis_cluster_latam.cluster_endpoint
    us-west      = module.redis_cluster_uswest.cluster_endpoint
    eu-central   = module.redis_cluster_eucentral.cluster_endpoint
    asia-pacific = module.redis_cluster_asiapacific.cluster_endpoint
  }
}

output "redis_cluster_port" {
  description = "Redis cluster port"
  value       = var.redis_port
}

output "redis_cluster_arns" {
  description = "Redis cluster ARNs"
  value = {
    latam        = module.redis_cluster_latam.cluster_arn
    us-west      = module.redis_cluster_uswest.cluster_arn
    eu-central   = module.redis_cluster_eucentral.cluster_arn
    asia-pacific = module.redis_cluster_asiapacific.cluster_arn
  }
}

################################################################################
# ECS Outputs
################################################################################

output "ecs_cluster_arns" {
  description = "ECS cluster ARNs"
  value = {
    latam        = module.ecs_cluster_latam.cluster_arn
    us-west      = module.ecs_cluster_uswest.cluster_arn
    eu-central   = module.ecs_cluster_eucentral.cluster_arn
    asia-pacific = module.ecs_cluster_asiapacific.cluster_arn
  }
}

output "ecs_cluster_names" {
  description = "ECS cluster names"
  value = {
    latam        = module.ecs_cluster_latam.cluster_name
    us-west      = module.ecs_cluster_uswest.cluster_name
    eu-central   = module.ecs_cluster_eucentral.cluster_name
    asia-pacific = module.ecs_cluster_asiapacific.cluster_name
  }
}

output "alb_dns_names" {
  description = "Application Load Balancer DNS names"
  value = {
    latam        = module.ecs_cluster_latam.alb_dns_name
    us-west      = module.ecs_cluster_uswest.alb_dns_name
    eu-central   = module.ecs_cluster_eucentral.alb_dns_name
    asia-pacific = module.ecs_cluster_asiapacific.alb_dns_name
  }
}

output "alb_arns" {
  description = "Application Load Balancer ARNs"
  value = {
    latam        = module.ecs_cluster_latam.alb_arn
    us-west      = module.ecs_cluster_uswest.alb_arn
    eu-central   = module.ecs_cluster_eucentral.alb_arn
    asia-pacific = module.ecs_cluster_asiapacific.alb_arn
  }
}

################################################################################
# CloudFront Outputs
################################################################################

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.cloudfront_distribution.distribution_id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = module.cloudfront_distribution.domain_name
}

output "cloudfront_hosted_zone_id" {
  description = "CloudFront hosted zone ID"
  value       = module.cloudfront_distribution.hosted_zone_id
}

################################################################################
# Cloudflare Outputs
################################################################################

output "cloudflare_dns_records" {
  description = "Cloudflare DNS records"
  value       = module.cloudflare.dns_records
}

################################################################################
# Security Outputs
################################################################################

output "security_group_ids" {
  description = "Security group IDs"
  value = {
    alb          = module.security_groups.alb_sg_id
    ecs          = module.security_groups.ecs_sg_id
    redis        = module.security_groups.redis_sg_id
    database     = module.security_groups.db_sg_id
    vpn          = module.security_groups.vpn_sg_id
  }
}

################################################################################
# Monitoring Outputs
################################################################################

output "cloudwatch_log_groups" {
  description = "CloudWatch log groups"
  value = {
    application = module.ecs_cluster_latam.application_log_group
    nginx       = module.ecs_cluster_latam.nginx_log_group
    redis       = module.aws_cloudwatch_log_group.redis_cluster.id
  }
}

################################################################################
# Configuration File Output (for deployment scripts)
################################################################################

output "deployment_config" {
  description = "Deployment configuration for scripts"
  value = {
    regions = {
      latam = {
        vpc_id           = module.vpc_latam.vpc_id
        subnet_ids       = module.vpc_latam.private_subnet_ids
        security_group_id = module.security_groups.ecs_sg_id
        redis_endpoint   = module.redis_cluster_latam.cluster_endpoint
        supabase_api_url = module.supabase_latam.api_url
        supabase_key     = module.supabase_latam.anon_key
        ecs_cluster_name = module.ecs_cluster_latam.cluster_name
        alb_domain       = module.ecs_cluster_latam.alb_dns_name
      }
      us-west = {
        vpc_id           = module.vpc_uswest.vpc_id
        subnet_ids       = module.vpc_uswest.private_subnet_ids
        security_group_id = module.security_groups.ecs_sg_id
        redis_endpoint   = module.redis_cluster_uswest.cluster_endpoint
        supabase_api_url = module.supabase_uswest.api_url
        supabase_key     = module.supabase_uswest.anon_key
        ecs_cluster_name = module.ecs_cluster_uswest.cluster_name
        alb_domain       = module.ecs_cluster_uswest.alb_dns_name
      }
      eu-central = {
        vpc_id           = module.vpc_eucentral.vpc_id
        subnet_ids       = module.vpc_eucentral.private_subnet_ids
        security_group_id = module.security_groups.ecs_sg_id
        redis_endpoint   = module.redis_cluster_eucentral.cluster_endpoint
        supabase_api_url = module.supabase_eucentral.api_url
        supabase_key     = module.supabase_eucentral.anon_key
        ecs_cluster_name = module.ecs_cluster_eucentral.cluster_name
        alb_domain       = module.ecs_cluster_eucentral.alb_dns_name
      }
      asia-pacific = {
        vpc_id           = module.vpc_asiapacific.vpc_id
        subnet_ids       = module.vpc_asiapacific.private_subnet_ids
        security_group_id = module.security_groups.ecs_sg_id
        redis_endpoint   = module.redis_cluster_asiapacific.cluster_endpoint
        supabase_api_url = module.supabase_asiapacific.api_url
        supabase_key     = module.supabase_asiapacific.anon_key
        ecs_cluster_name = module.ecs_cluster_asiapacific.cluster_name
        alb_domain       = module.ecs_cluster_asiapacific.alb_dns_name
      }
    }
    cdn = {
      domain_name          = module.cloudfront_distribution.domain_name
      distribution_id       = module.cloudfront_distribution.distribution_id
      api_endpoint          = "https://api.${var.domain}"
      web_endpoint          = "https://www.${var.domain}"
    }
  }
}

################################################################################
# Connection info for developers
################################################################################

output "connection_info" {
  description = "Connection information for developers"
  value = {
    api_url         = "https://api.${var.domain}"
    ws_url          = "wss://ws.${var.domain}"
    realtime_url    = "wss://realtime.${var.domain}"
    supabase_project = "https://supabase.com/dashboard/project/${module.supabase_latam.project_ref}"
    docs_url        = "https://docs.barberzap.com"
  }
}
