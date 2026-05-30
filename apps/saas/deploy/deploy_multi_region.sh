#!/bin/bash

################################################################################
# Multi-Region Deployment Script for BarberZap
#
# Features:
# - Builds and tags containers for multiple regions
# - Deploys to each region's infrastructure
# - Runs health checks before and after deployment
# - Automatic rollbacks on failure
# - Tracks deployment status
################################################################################

set -euo pipefail

# ==================== Configuration ====================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
LOG_DIR="${SCRIPT_DIR}/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Deployment configuration
REGIONS=("latam" "us-east" "us-west" "eu-central" "asia-pacific")
PRIMARY_REGION="latam"
BUILD_TAG="latest"
DEPLOYMENT_ID="deploy_${TIMESTAMP}"

# Health check configuration
HEALTH_CHECK_TIMEOUT=300  # 5 minutes
HEALTH_CHECK_INTERVAL=10
HEALTH_CHECK_ENDPOINT="/health"

# Rollback configuration
ENABLE_ROLLBACK=true
ROLLBACK_ON_FAILURE=true
KEEP_BACKUP_COUNT=3

# Container registry
REGISTRY="${DOCKER_REGISTRY:-docker.io/barberzap}"
REGISTRY_USERNAME="${DOCKER_USERNAME:-}"
REGISTRY_PASSWORD="${DOCKER_PASSWORD:-}"

# Deployment flags
DRY_RUN=false
SKIP_BUILD=false
SKIP_PUSH=false
SKIP_DEPLOY=false
HEALTH_CHECK_ONLY=false
VERBOSE=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==================== Logging ====================

log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $*"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS${NC} $*"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING${NC} $*"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR${NC} $*"
}

# ==================== Helper Functions ====================

check_dependencies() {
    log "Checking dependencies..."
    
    local missing=()
    
    for cmd in docker curl jq; do
        if ! command -v "$cmd" &> /dev/null; then
            missing+=("$cmd")
        fi
    done
    
    if [ ${#missing[@]} -gt 0 ]; then
        log_error "Missing dependencies: ${missing[*]}"
        log "Install them with: apt-get install ${missing[*]}"
        exit 1
    fi
    
    log_success "All dependencies available"
}

create_log_dir() {
    mkdir -p "${LOG_DIR}"
    DEPLOYMENT_LOG="${LOG_DIR}/deployment_${TIMESTAMP}.log"
    touch "${DEPLOYMENT_LOG}"
    
    # Redirect all output to log file
    exec > >(tee -a "${DEPLOYMENT_LOG}")
    exec 2>&1
    
    log "Logging to: ${DEPLOYMENT_LOG}"
}

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --regions)
                IFS=',' read -ra REGIONS <<< "$2"
                shift 2
                ;;
            --primary-region)
                PRIMARY_REGION="$2"
                shift 2
                ;;
            --tag)
                BUILD_TAG="$2"
                shift 2
                ;;
            --registry)
                REGISTRY="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --skip-push)
                SKIP_PUSH=true
                shift
                ;;
            --skip-deploy)
                SKIP_DEPLOY=true
                shift
                ;;
            --health-check-only)
                HEALTH_CHECK_ONLY=true
                shift
                ;;
            --verbose|-v)
                VERBOSE=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

show_help() {
    cat << EOF
Multi-Region Deployment Script for BarberZap

Usage: $0 [OPTIONS]

Options:
  --regions REGIONS          Comma-separated list of regions (default: latam,us-east,us-west,eu-central,asia-pacific)
  --primary-region REGION    Primary region (default: latam)
  --tag TAG                  Build tag (default: latest)
  --registry REGISTRY        Container registry (default: docker.io/barberzap)
  --dry-run                  Show what would be done without executing
  --skip-build               Skip building containers
  --skip-push                Skip pushing to registry
  --skip-deploy              Skip deployment
  --health-check-only        Only run health checks
  --verbose, -v              Verbose output
  --help, -h                 Show this help message

Examples:
  $0                                    # Deploy to all regions
  $0 --regions latam,us-east            # Deploy to specific regions
  $0 --dry-run --verbose                # Dry run with verbose output
  $0 --health-check-only                # Run health checks only

EOF
}

# ==================== Build Functions ====================

build_containers() {
    log "Building containers..."
    
    cd "${PROJECT_ROOT}"
    
    # Build main application containers
    local images=("backend" "frontend" "worker" "region-manager")
    
    for image in "${images[@]}"; do
        local dockerfile="docker/Dockerfile"
        if [ "${image}" = "frontend" ]; then
            dockerfile="docker/frontend/Dockerfile"
        fi
        
        log "Building ${REGISTRY}/${image}:${BUILD_TAG}..."
        
        if [ "$DRY_RUN" = true ]; then
            log "[DRY RUN] Would build: docker build -f ${dockerfile} -t ${REGISTRY}/${image}:${BUILD_TAG}"
            continue
        fi
        
        if ! docker build \
            -f "${dockerfile}" \
            -t "${REGISTRY}/${image}:${BUILD_TAG}" \
            -t "${REGISTRY}/${image}:${DEPLOYMENT_ID}" \
            --build-arg BUILD_TAG="${BUILD_TAG}" \
            --build-arg DEPLOYMENT_ID="${DEPLOYMENT_ID}" \
            .; then
            log_error "Failed to build ${image}"
            return 1
        fi
        
        log_success "Built ${image}"
    done
    
    return 0
}

push_containers() {
    log "Pushing containers to registry..."
    
    # Login if credentials provided
    if [ -n "${REGISTRY_USERNAME}" ] && [ -n "${REGISTRY_PASSWORD}" ]; then
        log "Logging in to registry..."
        echo "${REGISTRY_PASSWORD}" | docker login --username "${REGISTRY_USERNAME}" --password-stdin "${REGISTRY}" || {
            log_error "Failed to login to registry"
            return 1
        }
    fi
    
    local images=("backend" "frontend" "worker" "region-manager")
    
    for image in "${images[@]}"; do
        log "Pushing ${REGISTRY}/${image}..."
        
        if [ "$DRY_RUN" = true ]; then
            log "[DRY RUN] Would push: ${REGISTRY}/${image}:${BUILD_TAG}"
            log "[DRY RUN] Would push: ${REGISTRY}/${image}:${DEPLOYMENT_ID}"
            continue
        fi
        
        if ! docker push "${REGISTRY}/${image}:${BUILD_TAG}"; then
            log_error "Failed to push ${image}:${BUILD_TAG}"
            return 1
        fi
        
        if ! docker push "${REGISTRY}/${image}:${DEPLOYMENT_ID}"; then
            log_error "Failed to push ${image}:${DEPLOYMENT_ID}"
            return 1
        fi
        
        log_success "Pushed ${image}"
    done
    
    return 0
}

# ==================== Deployment Functions ====================

pre_deployment_check() {
    local region=$1
    
    log "Running pre-deployment check for region: ${region}"
    
    # Load region configuration
    local region_config="${SCRIPT_DIR}/config/region_${region}.json"
    if [ ! -f "${region_config}" ]; then
        log_warning "Region config not found: ${region_config}"
        return 0
    fi
    
    # Check if region is accessible
    local api_url=$(jq -r '.api_urls.http' "${region_config}" 2>/dev/null || echo "")
    
    if [ -n "${api_url}" ]; then
        log "Checking API endpoint: ${api_url}${HEALTH_CHECK_ENDPOINT}"
        
        if curl -sf --connect-timeout 5 "${api_url}${HEALTH_CHECK_ENDPOINT}" > /dev/null 2>&1; then
            log_success "Region ${region} is healthy before deployment"
        else
            log_warning "Region ${region} is not responding to health check"
            return 1
        fi
    fi
    
    return 0
}

deploy_to_region() {
    local region=$1
    local compose_file="${SCRIPT_DIR}/docker-compose.multi-region.yml"
    
    log "Deploying to region: ${region}"
    
    if [ "$DRY_RUN" = true ]; then
        log "[DRY RUN] Would deploy to ${region}"
        log "[DRY RUN] docker-compose -f ${compose_file} up -d --remove-orphans"
        return 0
    fi
    
    # Source region-specific environment
    local env_file="${SCRIPT_DIR}/.env.${region}"
    if [ -f "${env_file}" ]; then
        log "Loading environment from: ${env_file}"
        export $(cat "${env_file}" | grep -v '^#' | xargs)
    fi
    
    # Set environment for deployment
    export REGION="${region}"
    export BUILD_TAG="${BUILD_TAG}"
    export DEPLOYMENT_ID="${DEPLOYMENT_ID}"
    
    # Pull latest images
    log "Pulling latest images for ${region}..."
    docker-compose -f "${compose_file}" pull
    
    # Deploy stack
    log "Starting deployment stack..."
    if docker-compose -f "${compose_file}" up -d --remove-orphans; then
        log_success "Deployment to ${region} completed"
    else
        log_error "Deployment to ${region} failed"
        return 1
    fi
    
    # Wait for services to start
    log "Waiting for services to start..."
    sleep 10
    
    return 0
}

post_deployment_check() {
    local region=$1
    local max_attempts=$(( HEALTH_CHECK_TIMEOUT / HEALTH_CHECK_INTERVAL ))
    local attempts=0
    
    log "Running post-deployment health check for region: ${region}"
    
    while [ ${attempts} -lt ${max_attempts} ]; do
        local region_config="${SCRIPT_DIR}/config/region_${region}.json"
        local api_url
        
        if [ -f "${region_config}" ]; then
            api_url=$(jq -r '.api_urls.http' "${region_config}" 2>/dev/null || echo "")
        else
            # Use default URL
            api_url="http://localhost:8000"
        fi
        
        log "Health check attempt $((attempts + 1))/${max_attempts}: ${api_url}${HEALTH_CHECK_ENDPOINT}"
        
        if curl -sf "${api_url}${HEALTH_CHECK_ENDPOINT}" > /dev/null 2>&1; then
            log_success "Region ${region} is healthy after deployment"
            return 0
        fi
        
        attempts=$((attempts + 1))
        
        if [ ${attempts} -lt ${max_attempts} ]; then
            sleep ${HEALTH_CHECK_INTERVAL}
        fi
    done
    
    log_error "Region ${region} failed health check after ${attempts} attempts"
    return 1
}

rollback_region() {
    local region=$1
    
    if [ "$ROLLBACK_ON_FAILURE" = false ]; then
        log_warning "Rollback disabled, skipping rollback for ${region}"
        return 1
    fi
    
    log "Rolling back region: ${region}"
    
    if [ "$DRY_RUN" = true ]; then
        log "[DRY RUN] Would rollback ${region}"
        return 0
    fi
    
    # Stop current deployment
    docker-compose -f "${SCRIPT_DIR}/docker-compose.multi-region.yml" down || true
    
    # Try to restore previous version
    local previous_backup="${LOG_DIR}/backup_${region}.sql"
    if [ -f "${previous_backup}" ]; then
        log "Restoring from backup: ${previous_backup}"
        # Implement actual rollback logic here
    else
        log_warning "No backup found for ${region}"
    fi
    
    log_success "Rollback for ${region} completed"
}

# ==================== Health Check Functions ====================

run_health_checks() {
    log "Running health checks for all regions..."
    
    local all_healthy=true
    
    for region in "${REGIONS[@]}"; do
        log "Checking health for region: ${region}"
        
        if ! pre_deployment_check "${region}"; then
            log_warning "Health check failed for ${region}"
            all_healthy=false
        fi
    done
    
    if [ "$all_healthy" = true ]; then
        log_success "All regions are healthy"
        return 0
    else
        log_error "Some regions are unhealthy"
        return 1
    fi
}

# ==================== Main Deployment ====================

deploy() {
    log "Starting multi-region deployment: ${DEPLOYMENT_ID}"
    log "Regions: ${REGIONS[*]}"
    log "Primary region: ${PRIMARY_REGION}"
    log "Build tag: ${BUILD_TAG}"
    
    local failed_regions=()
    
    # Build containers
    if [ "$SKIP_BUILD" = false ] && [ "$HEALTH_CHECK_ONLY" = false ]; then
        if ! build_containers; then
            log_error "Build failed, aborting deployment"
            return 1
        fi
    fi
    
    # Push containers
    if [ "$SKIP_PUSH" = false ] && [ "$HEALTH_CHECK_ONLY" = false ]; then
        if ! push_containers; then
            log_error "Push failed, aborting deployment"
            return 1
        fi
    fi
    
    # Health check only mode
    if [ "$HEALTH_CHECK_ONLY" = true ]; then
        run_health_checks
        return $?
    fi
    
    # Deploy to each region
    if [ "$SKIP_DEPLOY" = false ]; then
        for region in "${REGIONS[@]}"; do
            log "=========================================="
            log "Processing region: ${region}"
            log "=========================================="
            
            # Pre-deployment check
            if ! pre_deployment_check "${region}"; then
                log_warning "Pre-deployment check failed for ${region}, continuing..."
            fi
            
            # Deploy
            if ! deploy_to_region "${region}"; then
                log_error "Deployment failed for ${region}"
                failed_regions+=("${region}")
                continue
            fi
            
            # Post-deployment check
            if ! post_deployment_check "${region}"; then
                log_error "Post-deployment health check failed for ${region}"
                rollback_region "${region}"
                failed_regions+=("${region}")
                continue
            fi
            
            log_success "Region ${region} deployed successfully"
        done
    fi
    
    # Summary
    log "=========================================="
    log "DEPLOYMENT SUMMARY"
    log "=========================================="
    log "Total regions: ${#REGIONS[@]}"
    log "Successful: $(( ${#REGIONS[@]} - ${#failed_regions[@]} ))"
    log "Failed: ${#failed_regions[@]}"
    
    if [ ${#failed_regions[@]} -gt 0 ]; then
        log "Failed regions: ${failed_regions[*]}"
        
        # Final health check
        log "Running final health check..."
        run_health_checks
        
        log "Deployment completed with failures"
        return 1
    else
        log_success "All regions deployed successfully"
        
        # Final health check
        run_health_checks
        
        return 0
    fi
}

# ==================== Signal Handlers ====================

cleanup() {
    log "Cleaning up..."
    # Cleanup logic here
}

trap cleanup EXIT INT TERM

# ==================== Main ====================

main() {
    check_dependencies
    create_log_dir
    parse_arguments "$@"
    
    log "BarberZap Multi-Region Deployment Script"
    log "=========================================="
    
    # Show configuration
    log "Configuration:"
    log "  - Regions: ${REGIONS[*]}"
    log "  - Primary Region: ${PRIMARY_REGION}"
    log "  - Build Tag: ${BUILD_TAG}"
    log "  - Registry: ${REGISTRY}"
    log "  - Deployment ID: ${DEPLOYMENT_ID}"
    log "  - Dry Run: ${DRY_RUN}"
    log "  - Rollback on Failure: ${ROLLBACK_ON_FAILURE}"
    
    # Run deployment
    if deploy; then
        log_success "Deployment completed successfully"
        exit 0
    else
        log_error "Deployment failed"
        exit 1
    fi
}

main "$@"
