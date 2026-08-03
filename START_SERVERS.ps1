# Start both Django and Frontend servers with ngrok tunnels

Write-Host "Starting Portfolio Website with ngrok tunnels..." -ForegroundColor Green

# Kill any existing Python/ngrok processes
Write-Host "`nStopping previous processes..."
Get-Process python -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.Id -Force 2>$null }
Get-Process ngrok -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.Id -Force 2>$null }
Start-Sleep -Seconds 2

# Start Django backend
Write-Host "Starting Django backend on port 8000..."
$djangoPath = "C:\Users\J.I TRADERS\OneDrive\Desktop\My Portfolio Website\backend_django"
$djangoJob = Start-Process -FilePath python -ArgumentList "manage.py", "runserver", "8000" -WorkingDirectory $djangoPath -PassThru -WindowStyle Minimized
Write-Host "Django started (PID: $($djangoJob.Id))"

# Start Frontend server
Write-Host "Starting Frontend on port 3000..."
$frontendPath = "C:\Users\J.I TRADERS\OneDrive\Desktop\My Portfolio Website\frontend"
$frontendJob = Start-Process -FilePath python -ArgumentList "-m", "http.server", "3000" -WorkingDirectory $frontendPath -PassThru -WindowStyle Minimized
Write-Host "Frontend started (PID: $($frontendJob.Id))"

Start-Sleep -Seconds 5

# Start ngrok
Write-Host "Starting ngrok tunnel on port 3000..."
Start-Process ngrok -ArgumentList "http", "3000" -WindowStyle Minimized

Start-Sleep -Seconds 3

Write-Host "`nServers running!" -ForegroundColor Green
Write-Host "Django Backend: http://localhost:8000"
Write-Host "Frontend: http://localhost:3000"
Write-Host "`nNgrok tunnel URL will be displayed in ngrok window"
Write-Host "Press Ctrl+C to stop servers..."

# Keep script running
while ($true) {
    Start-Sleep -Seconds 10
}
