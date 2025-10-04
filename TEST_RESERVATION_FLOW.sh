#!/bin/bash

# Reservations Feature - Quick Test Script
# Run this to verify your setup is working

echo "🧪 Testing Reservations Feature Setup..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is running
echo -n "1. Checking backend server... "
BACKEND_HEALTH=$(curl -s http://localhost:8000/health 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not running${NC}"
    echo "   Start with: cd dashboard/backend && python main.py"
    exit 1
fi

# Check if frontend is running
echo -n "2. Checking frontend server... "
FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
if [ "$FRONTEND" = "200" ]; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not running${NC}"
    echo "   Start with: cd dashboard/frontend && npm run dev"
    exit 1
fi

# Check backend environment variables
echo -n "3. Checking backend env vars... "
if [ -f "dashboard/backend/.env" ]; then
    if grep -q "TWILIO_ACCOUNT_SID=AC" dashboard/backend/.env && \
       grep -q "JWT_SECRET=" dashboard/backend/.env && \
       grep -q "APP_BASE_URL=" dashboard/backend/.env; then
        echo -e "${GREEN}✓ Configured${NC}"
    else
        echo -e "${YELLOW}⚠ Incomplete${NC}"
        echo "   Missing required vars in dashboard/backend/.env"
    fi
else
    echo -e "${RED}✗ Missing .env${NC}"
    echo "   Copy: cp dashboard/backend/.env.example dashboard/backend/.env"
fi

# Check frontend environment variables  
echo -n "4. Checking frontend env vars... "
if [ -f "dashboard/frontend/.env.local" ]; then
    if grep -q "NEXT_PUBLIC_API_BASE_URL=" dashboard/frontend/.env.local; then
        echo -e "${GREEN}✓ Configured${NC}"
    else
        echo -e "${YELLOW}⚠ Incomplete${NC}"
        echo "   Add NEXT_PUBLIC_API_BASE_URL to .env.local"
    fi
else
    echo -e "${YELLOW}⚠ Using defaults${NC}"
    echo "   Create: dashboard/frontend/.env.local"
fi

# Test API endpoint
echo -n "5. Testing backend API... "
API_TEST=$(curl -s http://localhost:8000/api/reservations/send 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Accessible${NC}"
else
    echo -e "${RED}✗ Not accessible${NC}"
fi

# Check database tables
echo -n "6. Checking database tables... "
echo -e "${YELLOW}⚠ Manual verification required${NC}"
echo "   Run SQL: SELECT COUNT(*) FROM reservations;"

echo ""
echo "📋 Next Steps:"
echo "   1. Run SQL migration (see RESERVATIONS_SETUP.md)"
echo "   2. Configure Twilio webhooks"
echo "   3. Test: http://localhost:3000/reservations/new"
echo ""
echo "📖 Full guide: RESERVATIONS_SETUP.md"

