@echo off
echo ========================================
echo    VaxCare Application Startup
echo ========================================
echo.

echo [1/4] Checking Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not installed or not running
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)
echo ✓ Docker is available

echo.
echo [2/4] Starting backend services...
docker-compose up -d
if errorlevel 1 (
    echo ERROR: Failed to start services
    pause
    exit /b 1
)

echo.
echo [3/4] Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo.
echo [4/4] Running database migrations...
docker-compose exec -T backend npm run migrate
if errorlevel 1 (
    echo WARNING: Migrations may have failed, but continuing...
)

echo.
echo ========================================
echo    VaxCare is now running!
echo ========================================
echo.
echo Backend API: http://localhost:3000
echo Frontend:    Open vaxcare-frontend.html in your browser
echo.
echo To stop VaxCare: docker-compose down
echo.

echo Opening frontend in default browser...
start vaxcare-frontend.html

echo.
echo Press any key to view backend logs (Ctrl+C to exit logs)...
pause >nul
docker-compose logs -f backend