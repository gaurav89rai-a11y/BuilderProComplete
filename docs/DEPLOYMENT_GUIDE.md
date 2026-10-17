# BuilderPro ERP — Deployment Guide

This guide covers deployment options for the BuilderPro ERP platform, including Azure App Service / Static Web Apps, Docker containerization, and GitHub Pages.

---

## Architecture Overview

```
                      +-----------------------------+
                      |   Client (Browser / React)  |
                      +--------------+--------------+
                                     |
                                     | HTTPS / REST
                                     v
                      +-----------------------------+
                      |  BuilderPro Web API (.NET 8)|
                      +--------------+--------------+
                                     |
                         +-----------+-----------+
                         |                       |
                         v                       v
               +------------------+    +-------------------+
               | Azure SQL Server |    | PostgreSQL DB     |
               +------------------+    +-------------------+
```

---

## 1. Local Development Deployment

### Prerequisites
- .NET 8.0 SDK
- Node.js 18+ & npm
- SQL Server (Local / Azure) or PostgreSQL

### Run Backend API
```powershell
cd BuilderProAPI
$env:PORT="5000"
dotnet run
```
API endpoints available at `http://localhost:5000`  
Swagger UI docs at `http://localhost:5000/swagger`  
Health check at `http://localhost:5000/health`

### Run Frontend Client
```powershell
cd buildercrm-updated
npm install
npm run dev
```
Client application accessible at `http://localhost:3000`

---

## 2. Docker Container Deployment

The project includes a production-ready multi-stage `Dockerfile`:

```bash
# Build the container image
docker build -t builderpro-api .

# Run container with SQL Server connection string
docker run -d -p 8080:8080 \
  -e "ConnectionStrings__DefaultConnection=Server=your-sql-server;Database=BuilderProDB;User ID=your-user;Password=your-password;TrustServerCertificate=True;" \
  --name builderpro-api builderpro-api
```

---

## 3. Azure Automated Deployment

The deployment script `scripts/deployment/deploy-azure.ps1` (or `deploy-azure.sh` on Linux/macOS) provisions:
1. Azure Resource Group (`centralindia` or specified region)
2. Azure SQL Database (Basic tier)
3. Azure App Service Plan (.NET 8 Linux)
4. Azure Static Web App for React frontend

### Execution
```powershell
./scripts/deployment/deploy-azure.ps1 `
    -ResourceGroup "builderpro-rg" `
    -Location "centralindia" `
    -AppName "builderpro-api" `
    -FrontendApp "builderpro-web" `
    -SqlServer "builderproserver" `
    -SqlDatabase "BuilderProDB" `
    -SqlAdmin "builderadmin" `
    -SqlPassword "$env:AZURE_SQL_PASSWORD"
```

> [!WARNING]
> Never commit plain-text SQL passwords to version control. Pass passwords via environment variables or Azure Key Vault secrets.

---

## 4. GitHub Pages Deployment (Frontend Demo)

To deploy the static frontend to GitHub Pages:
```powershell
./scripts/deployment/deploy-gh-pages.ps1
```
The script builds the React bundle and pushes to the `gh-pages` branch.
