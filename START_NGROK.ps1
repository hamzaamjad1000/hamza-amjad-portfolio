# START_NGROK.ps1 - Start ngrok tunnels for testing

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   NGROK TUNNEL STARTUP FOR TESTING       " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if ngrok is installed
if (!(Get-Command ngrok -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Ngrok is not installed!" -ForegroundColor Red
    Write-Host "Download from: https://ngrok.com/download" -ForegroundColor Yellow
    exit
}

Write-Host "Starting ngrok tunnels..." -ForegroundColor Green
Write-Host ""

# Start ngrok for Backend (Port 8000)
Write-Host "[1/2] Starting ngrok tunnel for Backend (Port 8000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "ngrok http 8000 --region us --log=stdout"

# Wait a moment
Start-Sleep -Seconds 2

# Start ngrok for Frontend (Port 3000)
Write-Host "[2/2] Starting ngrok tunnel for Frontend (Port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "ngrok http 3000 --region us --log=stdout"

Write-Host ""
Write-Host "------------------------------------------" -ForegroundColor Gray
Write-Host "NGROK TUNNELS STARTING                   " -ForegroundColor Green
Write-Host "------------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "📍 Check the ngrok terminals for public URLs:" -ForegroundColor White
Write-Host "   - Backend tunnel will show: https://xxxx-xxxx-xxxx.ngrok.io" -ForegroundColor Cyan
Write-Host "   - Frontend tunnel will show: https://yyyy-yyyy-yyyy.ngrok.io" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔍 Monitor ngrok traffic at: http://127.0.0.1:4040" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  IMPORTANT NOTES:" -ForegroundColor Yellow
Write-Host "   - Keep both ngrok terminal windows OPEN" -ForegroundColor Yellow
Write-Host "   - URLs will change each time you restart ngrok" -ForegroundColor Yellow
Write-Host "   - Update API URLs in frontend code if needed" -ForegroundColor Yellow
Write-Host ""
Write-Host "📚 For more details, read: NGROK_SETUP.md" -ForegroundColor Cyan
Write-Host "------------------------------------------" -ForegroundColor Gray
