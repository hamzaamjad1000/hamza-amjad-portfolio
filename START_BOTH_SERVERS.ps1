# Start both Django and Frontend servers with ngrok tunnels

Write-Host "🚀 Starting Portfolio Website with ngrok tunnels..." -ForegroundColor Green

# Kill any existing Python processes
Write-Host "`n[1/5] Stopping previous processes..."
Get-Process python -ErrorAction SilentlyContinue | ForEach-Object { 
    Stop-Process -Id $_.Id -Force 2>$null 
}
Start-Sleep -Seconds 2

# Start Django backend
Write-Host "`n[2/5] Starting Django backend on port 8000..."
cd "C:\Users\J.I TRADERS\OneDrive\Desktop\My Portfolio Website\backend_django"
$djangoJob = Start-Process python -ArgumentList "manage.py", "runserver", "8000" -PassThru -WindowStyle Minimized
Write-Host "✓ Django PID: $($djangoJob.Id)"

# Start Frontend server
Write-Host "`n[3/5] Starting Frontend on port 3000..."
cd "C:\Users\J.I TRADERS\OneDrive\Desktop\My Portfolio Website\frontend"
$frontendJob = Start-Process python -ArgumentList "-m", "http.server", "3000" -PassThru -WindowStyle Minimized
Write-Host "✓ Frontend PID: $($frontendJob.Id)"

Start-Sleep -Seconds 5

# Start ngrok tunnels
Write-Host "`n[4/5] Starting ngrok tunnels..."
Write-Host "  - Frontend: port 3000 → ngrok"
Start-Process ngrok -ArgumentList "http", "3000" -WindowStyle Minimized

Start-Sleep -Seconds 3

Write-Host "`n[5/5] Getting ngrok URLs..."
try {
    $tunnels = curl -s http://localhost:4040/api/tunnels 2>&1 | ConvertFrom-Json
    $tunnels.tunnels | ForEach-Object {
        Write-Host "  📡 $($_.name): $($_.public_url)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "  (Waiting for ngrok to initialize...)" -ForegroundColor Yellow
}

Write-Host "`n✅ All servers running!" -ForegroundColor Green
Write-Host "`n📝 Django Backend: http://localhost:8000"
Write-Host "📝 Frontend: http://localhost:3000"
Write-Host "🌐 Live Website: Check ngrok tunnel URL above"
Write-Host "`n[TIP] The frontend will auto-detect ngrok URL for contact form"
Write-Host "`nPress Ctrl+C to stop servers..."

# Keep script running
while ($true) {
    Start-Sleep -Seconds 10
}
