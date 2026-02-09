#!/bin/bash

echo "========================================"
echo "    VaxCare Application Startup"
echo "========================================"
echo

echo "[1/4] Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed"
    echo "Please install Docker from https://www.docker.com/products/docker-desktop/"
    exit 1
fi
echo "✓ Docker is available"

echo
echo "[2/4] Starting backend services..."
if ! docker-compose up -d; then
    echo "ERROR: Failed to start services"
    exit 1
fi

echo
echo "[3/4] Waiting for services to be ready..."
sleep 10

echo
echo "[4/4] Running database migrations..."
if ! docker-compose exec -T backend npm run migrate; then
    echo "WARNING: Migrations may have failed, but continuing..."
fi

echo
echo "========================================"
echo "    VaxCare is now running!"
echo "========================================"
echo
echo "Backend API: http://localhost:3000"
echo "Frontend:    Open vaxcare-frontend.html in your browser"
echo
echo "To stop VaxCare: docker-compose down"
echo

# Try to open frontend in browser
if command -v xdg-open &> /dev/null; then
    xdg-open vaxcare-frontend.html
elif command -v open &> /dev/null; then
    open vaxcare-frontend.html
fi

echo
echo "Press Ctrl+C to exit logs..."
docker-compose logs -f backend