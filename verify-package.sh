#!/bin/bash

# Package verification script
# Run this before publishing to npm

set -e

echo "================================================"
echo "  @tempyemail/e2e-testing - Package Verification"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_passed=0
check_failed=0

# Function to check a condition
check() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} $1"
    ((check_passed++))
  else
    echo -e "${RED}✗${NC} $1"
    ((check_failed++))
  fi
}

# Check Node version
echo "Checking Node.js version..."
node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$node_version" -ge 16 ]; then
  check "Node.js version >= 16 (found: v$node_version)"
else
  false
  check "Node.js version >= 16 (found: v$node_version)"
fi

# Check required files exist
echo ""
echo "Checking required files..."
test -f package.json && check "package.json exists" || check "package.json exists"
test -f tsconfig.json && check "tsconfig.json exists" || check "tsconfig.json exists"
test -f README.md && check "README.md exists" || check "README.md exists"
test -f LICENSE && check "LICENSE exists" || check "LICENSE exists"
test -f .gitignore && check ".gitignore exists" || check ".gitignore exists"
test -f .npmignore && check ".npmignore exists" || check ".npmignore exists"

# Check source files
echo ""
echo "Checking source files..."
test -f src/index.ts && check "src/index.ts exists" || check "src/index.ts exists"
test -f src/client.ts && check "src/client.ts exists" || check "src/client.ts exists"
test -f src/mailbox.ts && check "src/mailbox.ts exists" || check "src/mailbox.ts exists"
test -f src/types.ts && check "src/types.ts exists" || check "src/types.ts exists"
test -f src/parsers/otp.ts && check "src/parsers/otp.ts exists" || check "src/parsers/otp.ts exists"
test -f src/parsers/links.ts && check "src/parsers/links.ts exists" || check "src/parsers/links.ts exists"
test -f src/utils/polling.ts && check "src/utils/polling.ts exists" || check "src/utils/polling.ts exists"

# Check examples exist
echo ""
echo "Checking examples..."
test -d examples/basic && check "examples/basic exists" || check "examples/basic exists"
test -d examples/playwright && check "examples/playwright exists" || check "examples/playwright exists"
test -d examples/cypress && check "examples/cypress exists" || check "examples/cypress exists"
test -d examples/jest && check "examples/jest exists" || check "examples/jest exists"
test -d examples/vitest && check "examples/vitest exists" || check "examples/vitest exists"

# Check package.json fields
echo ""
echo "Checking package.json configuration..."
grep -q '"name": "@tempyemail/e2e-testing"' package.json && check "Package name is correct" || check "Package name is correct"
grep -q '"version"' package.json && check "Version field exists" || check "Version field exists"
grep -q '"license": "MIT"' package.json && check "License is MIT" || check "License is MIT"
grep -q '"main": "dist/index.js"' package.json && check "Main entry point is correct" || check "Main entry point is correct"
grep -q '"types": "dist/index.d.ts"' package.json && check "Types entry point is correct" || check "Types entry point is correct"

# Build the project
echo ""
echo "Building TypeScript..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
  check "TypeScript build successful"
else
  false
  check "TypeScript build successful"
fi

# Check dist directory
echo ""
echo "Checking build output..."
test -d dist && check "dist directory exists" || check "dist directory exists"
test -f dist/index.js && check "dist/index.js exists" || check "dist/index.js exists"
test -f dist/index.d.ts && check "dist/index.d.ts exists" || check "dist/index.d.ts exists"
test -f dist/client.js && check "dist/client.js exists" || check "dist/client.js exists"
test -f dist/mailbox.js && check "dist/mailbox.js exists" || check "dist/mailbox.js exists"

# Test exports
echo ""
echo "Testing package exports..."
node test-exports.js > /dev/null 2>&1
if [ $? -eq 0 ]; then
  check "All exports working"
else
  false
  check "All exports working"
fi

# Check package size
echo ""
echo "Checking package size..."
npm pack --dry-run > /dev/null 2>&1
if [ $? -eq 0 ]; then
  check "Package can be packed"
else
  false
  check "Package can be packed"
fi

# Summary
echo ""
echo "================================================"
echo "  Verification Summary"
echo "================================================"
echo ""
echo -e "${GREEN}Passed: $check_passed${NC}"
if [ $check_failed -gt 0 ]; then
  echo -e "${RED}Failed: $check_failed${NC}"
else
  echo -e "${GREEN}Failed: $check_failed${NC}"
fi
echo ""

if [ $check_failed -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed! Package is ready to publish.${NC}"
  echo ""
  echo "To publish:"
  echo "  npm publish"
  echo ""
  exit 0
else
  echo -e "${RED}❌ Some checks failed. Please fix the issues before publishing.${NC}"
  echo ""
  exit 1
fi
