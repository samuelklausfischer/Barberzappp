#!/bin/bash

# BarberZap Test Runner
# Easy test execution script

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print banner
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   BarberZap Test Runner${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Default command
PYTEST_CMD="pytest"

# Parse arguments
case "$1" in
    'unit')
        echo -e "${GREEN}Running unit tests...${NC}"
        PYTEST_CMD="pytest -m unit"
        ;;
    'integration')
        echo -e "${GREEN}Running integration tests...${NC}"
        PYTEST_CMD="pytest -m integration"
        ;;
    'wrapper')
        echo -e "${GREEN}Running wrapper tests...${NC}"
        PYTEST_CMD="pytest -m wrapper"
        ;;
    'core')
        echo -e "${GREEN}Running core tests...${NC}"
        PYTEST_CMD="pytest -m core"
        ;;
    'agent')
        echo -e "${GREEN}Running agent tests...${NC}"
        PYTEST_CMD="pytest -m agent"
        ;;
    'crm')
        echo -e "${GREEN}Running CRM tests...${NC}"
        PYTEST_CMD="pytest -m crm"
        ;;
    'placeholder')
        echo -e "${GREEN}Running placeholder tests...${NC}"
        PYTEST_CMD="pytest -m placeholder"
        ;;
    'fast')
        echo -e "${GREEN}Running fast tests...${NC}"
        PYTEST_CMD="pytest -m 'fast and not slow'"
        ;;
    'coverage')
        echo -e "${GREEN}Running tests with coverage...${NC}"
        PYTEST_CMD="pytest --cov=barberzap_python --cov-report=html --cov-report=term-missing"
        ;;
    'help')
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  (none)       Run all tests (default)"
        echo "  unit         Run unit tests only"
        echo "  integration  Run integration tests only"
        echo "  wrapper      Run wrapper tests only"
        echo "  core         Run core tests only"
        echo "  agent        Run agent tests only"
        echo "  crm          Run CRM tests only"
        echo "  placeholder  Run placeholder tests only"
        echo "  fast         Run fast tests only"
        echo "  coverage     Run tests with coverage report"
        echo "  help         Show this help message"
        exit 0
        ;;
    *)
        echo -e "${GREEN}Running all tests...${NC}"
        ;;
esac

# Store current directory
ORIGINAL_DIR=$(pwd)

# Change to test directory if needed
if [ -d "tests" ]; then
    cd "$(dirname "$0")"
fi

echo -e "${BLUE}Command: ${PYTEST_CMD}${NC}"
echo ""

# Run the command
eval $PYTEST_CMD

# Return to original directory
cd $ORIGINAL_DIR

echo ""
echo -e "${GREEN}✓ Tests completed${NC}"
