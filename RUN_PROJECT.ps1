# RUN_PROJECT.ps1
# This script starts both the Django backend and the static frontend server.

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   HAMZA AMJAD PORTFOLIO SYSTEM STARTUP   " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Check for Python
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Python is not installed or not in your PATH." -ForegroundColor Red
    Write-Host "Please install Python from https://www.python.org/" -ForegroundColor Yellow
    exit
}

Write-Host "[1/3] Verifying Backend Dependencies..." -ForegroundColor Cyan
cd backend_django
python -m pip install -r requirements.txt --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Failed to install some dependencies. Continuing anyway..." -ForegroundColor Yellow
}
python manage.py migrate --noinput
cd ..

# Start Backend (Django)
Write-Host "[2/3] Launching Django Backend on http://localhost:8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend_django; Write-Host 'Starting Django Server...'; python manage.py runserver 8000"

# Wait a moment for backend to initialize
Start-Sleep -Seconds 2

# Start Frontend (Static Server)
Write-Host "[3/3] Launching Frontend on http://localhost:3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; Write-Host 'Starting Static Frontend Server...'; python -m http.server 3000"

Write-Host ""
Write-Host "------------------------------------------" -ForegroundColor Gray
Write-Host "SYSTEMS ACTIVE // READY" -ForegroundColor Green
Write-Host "------------------------------------------" -ForegroundColor Gray
Write-Host "Frontend:    http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:8000/api" -ForegroundColor Cyan
Write-Host "------------------------------------------" -ForegroundColor Gray
Write-Host "Keep the newly opened terminal windows open to keep the project running."
Write-Host "You can now open your browser and go to http://localhost:3000" -ForegroundColor White

