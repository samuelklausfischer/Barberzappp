#!/bin/bash

# BarberZap UI Enhancement Setup Verification Script
# This script verifies that all UI enhancement components are in place

echo "========================================"
echo "BarberZap UI Enhancement Verification"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter for results
FILES_OK=0
FILES_MISSING=0

# Function to check file
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        ((FILES_OK++))
        return 0
    else
        echo -e "${RED}✗${NC} $1"
        ((FILES_MISSING++))
        return 1
    fi
}

echo "Checking UI Components..."
echo "-------------------------"

# Check UI components
check_file "/root/barber/src/components/ui/AnimatedCard.tsx"
check_file "/root/barber/src/components/ui/PageTransition.tsx"
check_file "/root/barber/src/components/ui/LoadingSkeleton.tsx"
check_file "/root/barber/src/components/ui/ButtonAnimated.tsx"
check_file "/root/barber/src/components/ui/Tooltip.tsx"
check_file "/root/barber/src/components/ui/index.ts"

echo ""
echo "Checking Theme Files..."
echo "-----------------------"

# Check theme files
check_file "/root/barber/src/themes/themeConfig.ts"
check_file "/root/barber/src/themes/ThemeProviderSimple.tsx"
check_file "/root/barber/src/themes/index.ts"

echo ""
echo "Checking Dashboard Enhancement..."
echo "--------------------------------"

# Check dashboard
check_file "/root/barber/src/components/dashboard/DashboardEnhanced.tsx"

echo ""
echo "Checking Updated App..."
echo "-----------------------"

# Check App.tsx
check_file "/root/barber/src/app/App.tsx"

echo ""
echo "Checking Documentation..."
echo "-------------------------"

# Check documentation
check_file "/root/barber/UI_ENHANCEMENTS_README.md"
check_file "/root/barber/MIGRATION_GUIDE.md"

echo ""
echo "========================================"
echo "Summary"
echo "========================================"
echo ""
echo -e "Files found: ${GREEN}${FILES_OK}${NC}"
echo -e "Files missing: ${FILES_MISSING}${FILES_MISSING}"
echo ""

if [ $FILES_MISSING -eq 0 ]; then
    echo -e "${GREEN}✓ All UI enhancement files are in place!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review MIGRATION_GUIDE.md for integration steps"
    echo "2. Start development server: npm run dev"
    echo "3. Test new components in your code"
else
    echo -e "${YELLOW}⚠ Some files are missing. Please review above.${NC}"
fi

echo ""
echo "========================================"
