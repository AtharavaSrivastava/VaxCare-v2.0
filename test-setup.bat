@echo off
echo ========================================
echo    VaxCare Setup Verification
echo ========================================
echo.

echo Checking prerequisites...
echo.

echo [1/3] Checking Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is NOT installed
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop/
) else (
    echo ✅ Docker is installed
    docker --version
)

echo.
echo [2/3] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is NOT installed
    echo Please install Node.js from https://nodejs.org/
) else (
    echo ✅ Node.js is installed
    node --version
)

echo.
echo [3/3] Checking required files...
if exist ".env.example" (
    echo ✅ .env.example found
) else (
    echo ❌ .env.example missing
)

if exist "docker-compose.yml" (
    echo ✅ docker-compose.yml found
) else (
    echo ❌ docker-compose.yml missing
)

if exist "vaxcare-frontend.html" (
    echo ✅ vaxcare-frontend.html found
) else (
    echo ❌ vaxcare-frontend.html missing
)

if exist "package.json" (
    echo ✅ package.json found
) else (
    echo ❌ package.json missing
)

echo.
echo ========================================
echo    Setup Status
echo ========================================
echo.
echo If all items show ✅, you're ready to run VaxCare!
echo.
echo Next steps:
echo 1. Copy .env.example to .env: copy .env.example .env
echo 2. Edit .env with secure passwords
echo 3. Run: start-vaxcare.bat
echo.
pause