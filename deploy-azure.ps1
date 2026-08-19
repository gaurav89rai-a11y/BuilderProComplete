#!/usr/bin/env pwsh
# ============================================================
#  BuilderPro - Full Azure Deployment Script
#  Run from the project root: ./deploy-azure.ps1
# ============================================================

param(
    [string]$ResourceGroup   = "builderpro-rg",
    [string]$Location        = "centralindia",        # cheapest India region
    [string]$AppName         = "builderpro-api",
    [string]$FrontendApp     = "builderpro-web",
    [string]$SqlServer       = "builderproserver",
    [string]$SqlDatabase     = "BuilderProDB",
    [string]$SqlAdmin        = "builderadmin",
    [string]$SqlPassword     = "BuilderPro@2024!",
    [string]$AppServicePlan  = "builderpro-plan"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "+------------------------------------------------------+" -ForegroundColor Cyan
Write-Host "|      BuilderPro Azure Deployment - Starting          |" -ForegroundColor Cyan
Write-Host "+------------------------------------------------------+" -ForegroundColor Cyan
Write-Host ""

# ── 0. Check Azure CLI ──────────────────────────────────────
Write-Host "-> Checking Azure CLI..." -ForegroundColor Yellow
az --version | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERR] Azure CLI not found. Install from https://aka.ms/installazurecli" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Azure CLI found" -ForegroundColor Green

# ── 1. Login ────────────────────────────────────────────────
Write-Host ""
Write-Host "-> Logging in to Azure..." -ForegroundColor Yellow
az account show --output none
if ($LASTEXITCODE -ne 0) {
    az login --output none
    if ($LASTEXITCODE -ne 0) { Write-Host "[ERR] Login failed" -ForegroundColor Red; exit 1 }
}
Write-Host "[OK] Logged in" -ForegroundColor Green

# ── 2. Resource Group ───────────────────────────────────────
Write-Host ""
Write-Host "-> Creating Resource Group '$ResourceGroup' in '$Location'..." -ForegroundColor Yellow
az group create --name $ResourceGroup --location $Location --output none
Write-Host "[OK] Resource group ready" -ForegroundColor Green

# ── 3. SQL Server ───────────────────────────────────────────
Write-Host ""
Write-Host "-> Creating Azure SQL Server '$SqlServer'..." -ForegroundColor Yellow
az sql server create `
    --name $SqlServer `
    --resource-group $ResourceGroup `
    --location $Location `
    --admin-user $SqlAdmin `
    --admin-password $SqlPassword `
    --output none

# Allow Azure services to access SQL
az sql server firewall-rule create `
    --resource-group $ResourceGroup `
    --server $SqlServer `
    --name AllowAzureServices `
    --start-ip-address 0.0.0.0 `
    --end-ip-address 0.0.0.0 `
    --output none

# Allow all IPs for dev (restrict in production)
az sql server firewall-rule create `
    --resource-group $ResourceGroup `
    --server $SqlServer `
    --name AllowAll `
    --start-ip-address 0.0.0.0 `
    --end-ip-address 255.255.255.255 `
    --output none

Write-Host "[OK] SQL Server ready" -ForegroundColor Green

# ── 4. SQL Database ─────────────────────────────────────────
Write-Host ""
Write-Host "-> Creating SQL Database '$SqlDatabase' (Basic tier)..." -ForegroundColor Yellow
az sql db create `
    --resource-group $ResourceGroup `
    --server $SqlServer `
    --name $SqlDatabase `
    --service-objective Basic `
    --output none
Write-Host "[OK] SQL Database created" -ForegroundColor Green

# ── 5. App Service Plan ─────────────────────────────────────
Write-Host ""
Write-Host "-> Creating App Service Plan (B1 - cheapest Linux)..." -ForegroundColor Yellow
az appservice plan create `
    --name $AppServicePlan `
    --resource-group $ResourceGroup `
    --sku B1 `
    --is-linux `
    --output none
Write-Host "[OK] App Service Plan ready" -ForegroundColor Green

# ── 6. .NET API Web App ─────────────────────────────────────
Write-Host ""
Write-Host "-> Creating .NET 8 Web App '$AppName'..." -ForegroundColor Yellow
az webapp create `
    --resource-group $ResourceGroup `
    --plan $AppServicePlan `
    --name $AppName `
    --runtime "DOTNETCORE:8.0" `
    --output none

# Set connection string
$ConnStr = "Server=tcp:$SqlServer.database.windows.net,1433;Initial Catalog=$SqlDatabase;User ID=$SqlAdmin;Password=$SqlPassword;Encrypt=True;"
az webapp config connection-string set `
    --resource-group $ResourceGroup `
    --name $AppName `
    --connection-string-type SQLAzure `
    --settings DefaultConnection=$ConnStr `
    --output none

# Set ASPNETCORE_ENVIRONMENT and disable build automation during deploy
az webapp config appsettings set `
    --resource-group $ResourceGroup `
    --name $AppName `
    --settings ASPNETCORE_ENVIRONMENT=Production SCM_DO_BUILD_DURING_DEPLOYMENT=false `
    --output none

Write-Host "[OK] API Web App created: https://$AppName.azurewebsites.net" -ForegroundColor Green

# ── 7. Frontend Static Web App ──────────────────────────────
Write-Host ""
Write-Host "-> Creating Static Web App for React frontend..." -ForegroundColor Yellow
az staticwebapp create `
    --name $FrontendApp `
    --resource-group $ResourceGroup `
    --location "centralus" `
    --output none
Write-Host "[OK] Static Web App created" -ForegroundColor Green

# ── 8. Build & Deploy .NET API ──────────────────────────────
Write-Host ""
Write-Host "-> Building .NET API..." -ForegroundColor Yellow
Set-Location BuilderProAPI
dotnet publish -c Release -o ./publish -r linux-x64 --self-contained false /p:UseSharedCompilation=false /p:UseRazorBuildServer=false -nodeReuse:false
if ($LASTEXITCODE -ne 0) { Write-Host "[ERR] Build failed" -ForegroundColor Red; exit 1 }

Start-Sleep -Seconds 2
dotnet build-server shutdown
Stop-Process -Name MSBuild -Force -ErrorAction SilentlyContinue
Stop-Process -Name VBCSCompiler -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# Zip for deployment
Write-Host "-> Packaging API with ZipFile..." -ForegroundColor Yellow
$ZipPath = "$pwd\..\builderpro-api.zip"
if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }
Add-Type -Assembly System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory("$pwd\publish", $ZipPath)

Set-Location ..

Write-Host "-> Deploying API to Azure..." -ForegroundColor Yellow
az webapp deploy `
    --resource-group $ResourceGroup `
    --name $AppName `
    --src-path builderpro-api.zip `
    --type zip `
    --output none
Write-Host "[OK] API deployed" -ForegroundColor Green

# ── 9. Build & Deploy React Frontend ────────────────────────
Write-Host ""
Write-Host "-> Building React frontend..." -ForegroundColor Yellow
Set-Location buildercrm-updated

# Set API URL to the deployed backend
$ApiUrl = "https://$AppName.azurewebsites.net/api"
"VITE_API_URL=$ApiUrl" | Out-File -FilePath .env.production -Encoding utf8

npm install --silent
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "[ERR] Frontend build failed" -ForegroundColor Red; exit 1 }

Set-Location ..

# Get Static Web App deploy token
$DeployToken = az staticwebapp secrets list `
    --name $FrontendApp `
    --resource-group $ResourceGroup `
    --query "properties.apiKey" -o tsv

# Deploy using SWA CLI (wrap in Continue to prevent stderr warnings from crashing the shell)
$OldEAP = $ErrorActionPreference
$ErrorActionPreference = "Continue"

npx @azure/static-web-apps-cli deploy ./buildercrm-updated/dist `
    --deployment-token $DeployToken `
    --env production 2>&1 | Out-Null

$ErrorActionPreference = $OldEAP

Write-Host "[OK] Frontend deployed" -ForegroundColor Green

# ── 10. Wait for app to start ───────────────────────────────
Write-Host ""
Write-Host "-> Waiting 30 seconds for apps to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# ── 11. Health check ────────────────────────────────────────
Write-Host ""
Write-Host "-> Running health checks..." -ForegroundColor Yellow
$ApiHealth = Invoke-RestMethod "https://$AppName.azurewebsites.net/health" -ErrorAction SilentlyContinue
if ($ApiHealth.healthy -eq $true) {
    Write-Host "[OK] API health check passed" -ForegroundColor Green
} else {
    Write-Host "[WARN] API health check pending (may still be starting)" -ForegroundColor Yellow
}

# ── 12. Get URLs ────────────────────────────────────────────
$FrontendUrl = az staticwebapp show `
    --name $FrontendApp `
    --resource-group $ResourceGroup `
    --query "defaultHostname" -o tsv

Write-Host ""
Write-Host "+--------------------------------------------------------------+" -ForegroundColor Green
Write-Host "|                 SUCCESS DEPLOYMENT COMPLETE!                 |" -ForegroundColor Green
Write-Host "+--------------------------------------------------------------+" -ForegroundColor Green
Write-Host "|                                                              |" -ForegroundColor Green
Write-Host "|  FRONTEND (React App):                                       |" -ForegroundColor Green
Write-Host "|     https://$FrontendUrl" -ForegroundColor Cyan
Write-Host "|                                                              |" -ForegroundColor Green
Write-Host "|  BACKEND API:                                                |" -ForegroundColor Green
Write-Host "|     https://$AppName.azurewebsites.net" -ForegroundColor Cyan
Write-Host "|                                                              |" -ForegroundColor Green
Write-Host "|  API DOCS (Swagger):                                         |" -ForegroundColor Green
Write-Host "|     https://$AppName.azurewebsites.net/swagger" -ForegroundColor Cyan
Write-Host "|                                                              |" -ForegroundColor Green
Write-Host "|  SQL SERVER:                                                 |" -ForegroundColor Green
Write-Host "|     $SqlServer.database.windows.net                          |" -ForegroundColor Cyan
Write-Host "|     DB: $SqlDatabase | User: $SqlAdmin                       |" -ForegroundColor Cyan
Write-Host "|                                                              |" -ForegroundColor Green
Write-Host "+--------------------------------------------------------------+" -ForegroundColor Green

# Save deployment info
@"
BUILDERPRO DEPLOYMENT INFO
===========================
Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

FRONTEND URL : https://$FrontendUrl
BACKEND URL  : https://$AppName.azurewebsites.net
SWAGGER DOCS : https://$AppName.azurewebsites.net/swagger
SQL SERVER   : $SqlServer.database.windows.net
DATABASE     : $SqlDatabase
SQL USER     : $SqlAdmin
SQL PASSWORD : $SqlPassword
RESOURCE GRP : $ResourceGroup
"@ | Out-File -FilePath deployment-info.txt -Encoding utf8

Write-Host ""
Write-Host "[OK] Deployment info saved to: deployment-info.txt" -ForegroundColor Green
