#!/bin/bash

# Start Forecastly Application
# This script starts both backend and frontend

echo "🚀 Starting Forecastly Application..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Redis
echo -e "${BLUE}Checking Redis...${NC}"
if ! docker ps | grep -q tsfaas-redis; then
    echo "Starting Redis container..."
    docker run -d -p 6379:6379 --name tsfaas-redis redis:7-alpine 2>/dev/null || docker start tsfaas-redis 2>/dev/null
    sleep 2
fi
echo -e "${GREEN}✅ Redis is running${NC}"
echo ""

# Start Backend
echo -e "${BLUE}Starting Backend...${NC}"
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..
sleep 3

# Check if backend started
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running on http://localhost:8000${NC}"
else
    echo -e "${YELLOW}⚠️ Backend may still be starting...${NC}"
fi
echo ""

# Start Frontend
echo -e "${BLUE}Starting Frontend...${NC}"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..
sleep 5

# Check if frontend started
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is running on http://localhost:3000${NC}"
else
    echo -e "${YELLOW}⚠️ Frontend may still be starting...${NC}"
fi
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Application Started!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for user interrupt
trap "echo ''; echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; docker stop tsfaas-redis 2>/dev/null; exit" INT

wait
