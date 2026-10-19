$gitCmd = Get-Command git -ErrorAction SilentlyContinue
$git = if ($gitCmd) { $gitCmd.Source } else { "E:\BuilderProComplete\.tools\git\cmd\git.exe" }
$repo = "https://github.com/gaurav89rai-a11y/BuilderProComplete.git"
$rootDir = (Resolve-Path "$PSScriptRoot\..\..").Path

Write-Host ""
Write-Host "+---------------------------------------------------+" -ForegroundColor Cyan
Write-Host "|    BuilderPro GitHub Pages Deployer - Starting    |" -ForegroundColor Cyan
Write-Host "+---------------------------------------------------+" -ForegroundColor Cyan
Write-Host ""

# 1. Build
Write-Host "-> Building React Frontend..." -ForegroundColor Yellow
Set-Location "$rootDir\buildercrm-updated"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERR] Build failed!" -ForegroundColor Red
    exit 1
}

# 2. Deploy
Write-Host ""
Write-Host "-> Preparing dist folder..." -ForegroundColor Yellow
Set-Location "dist"

if (Test-Path ".git") {
    Remove-Item ".git" -Recurse -Force
}

& $git init
& $git config user.name "Gaurav Rai"
& $git config user.email "gaurav89rai@gmail.com"
& $git config --add safe.directory (Get-Location).Path

& $git add .
& $git commit -m "Deploy to GitHub Pages"

Write-Host ""
Write-Host "-> Pushing to GitHub (this may prompt you to sign in)..." -ForegroundColor Yellow
& $git push -f $repo HEAD:gh-pages

Write-Host ""
Write-Host "+---------------------------------------------------+" -ForegroundColor Green
Write-Host "|               DEPLOYMENT SUCCESS!                 |" -ForegroundColor Green
Write-Host "+---------------------------------------------------+" -ForegroundColor Green
Write-Host "|  Your live website link:                          |" -ForegroundColor Green
Write-Host "|  https://gaurav89rai-a11y.github.io/BuilderProComplete/ |" -ForegroundColor Cyan
Write-Host "+---------------------------------------------------+" -ForegroundColor Green
Write-Host ""
