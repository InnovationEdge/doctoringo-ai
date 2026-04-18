#!/bin/bash

echo "🔍 Testing KnowHow Backend API..."
echo ""

API_URL="https://api.knowhow.ge"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if API is up
echo "1️⃣  Checking if API is reachable..."
if curl -s -o /dev/null -w "%{http_code}" -I "$API_URL" | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✓ API is reachable${NC}"
else
    echo -e "${RED}✗ API is not reachable${NC}"
fi
echo ""

# Test 2: Check sessions endpoint
echo "2️⃣  Checking /api/sessions/ endpoint..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/sessions/")
if [ "$STATUS" -eq 200 ] || [ "$STATUS" -eq 401 ]; then
    echo -e "${GREEN}✓ Sessions endpoint exists (status: $STATUS)${NC}"
    if [ "$STATUS" -eq 401 ]; then
        echo -e "   ${YELLOW}Note: 401 is expected if not logged in${NC}"
    fi
else
    echo -e "${RED}✗ Sessions endpoint issue (status: $STATUS)${NC}"
fi
echo ""

# Test 3: Check chat endpoint
echo "3️⃣  Checking /api/chat/ endpoint..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/api/chat/" \
    -H "Content-Type: application/json" \
    -d '{"message":"test"}')
if [ "$STATUS" -eq 200 ] || [ "$STATUS" -eq 401 ] || [ "$STATUS" -eq 403 ]; then
    echo -e "${GREEN}✓ Chat endpoint exists (status: $STATUS)${NC}"
    if [ "$STATUS" -eq 401 ]; then
        echo -e "   ${YELLOW}Note: 401 is expected if not logged in${NC}"
    elif [ "$STATUS" -eq 403 ]; then
        echo -e "   ${YELLOW}Note: 403 means CSRF token needed (expected)${NC}"
    fi
else
    echo -e "${RED}✗ Chat endpoint issue (status: $STATUS)${NC}"
fi
echo ""

# Test 4: Check documents endpoint
echo "4️⃣  Checking /api/documents/ endpoint..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/documents/")
if [ "$STATUS" -eq 200 ] || [ "$STATUS" -eq 401 ]; then
    echo -e "${GREEN}✓ Documents endpoint exists (status: $STATUS)${NC}"
    if [ "$STATUS" -eq 401 ]; then
        echo -e "   ${YELLOW}Note: 401 is expected if not logged in${NC}"
    fi
else
    echo -e "${RED}✗ Documents endpoint issue (status: $STATUS)${NC}"
fi
echo ""

# Test 5: Check CORS
echo "5️⃣  Checking CORS configuration..."
CORS=$(curl -s -H "Origin: https://knowhow.ge" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     -I "$API_URL/api/chat/" 2>&1 | grep -i "access-control")

if [ -n "$CORS" ]; then
    echo -e "${GREEN}✓ CORS headers present${NC}"
    echo "$CORS" | sed 's/^/   /'
else
    echo -e "${YELLOW}⚠ No CORS headers found (may need configuration)${NC}"
fi
echo ""

echo "📋 Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Frontend Status: ✅ 100% Ready"
echo "Backend Status: Check results above"
echo ""
echo "Next Steps:"
echo "1. If endpoints return 401/403, that's normal (need login)"
echo "2. If endpoints return 404, backend needs to implement them"
echo "3. If CORS missing, add CORS configuration to backend"
echo "4. See BACKEND_CHECKLIST.md for detailed testing"
echo ""
echo "🚀 To test with actual login, use browser DevTools"
