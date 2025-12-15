#!/bin/bash

# Quick start script for local development

echo "🚀 Starting Forecastly Development Environment"
echo ""

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: Please run this script from the project root"
    exit 1
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Python
if ! command_exists python3; then
    echo "❌ Python 3 is not installed"
    exit 1
fi

# Check Node.js
if ! command_exists node; then
    echo "❌ Node.js is not installed"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Start backend in background
echo "📦 Starting Backend..."
cd backend
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -q -r requirements.txt > /dev/null 2>&1

echo "✅ Backend dependencies installed"
echo "🌐 Starting backend server on http://localhost:8000"
uvicorn main:app --reload &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 2

# Start frontend
echo ""
echo "📦 Starting Frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install > /dev/null 2>&1
fi

echo "✅ Frontend dependencies installed"
echo "🌐 Starting frontend server on http://localhost:3000"
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✨ Development servers started!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for user interrupt
trap "echo ''; echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT

wait
