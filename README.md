# BuilderPro ERP — Full Stack Setup Guide

Complete Real Estate ERP with React frontend + .NET 8 API + Azure SQL.

---

## Project Structure

```
BuilderPro/
├── BuilderProAPI/              ← .NET 8 Web API (Backend)
│   ├── Controllers/            ← 11 API controllers
│   ├── Models/Models.cs        ← All database models
│   ├── Data/BuilderProDbContext.cs  ← EF Core + Seed data
│   ├── Migrations/             ← EF migrations
│   ├── Program.cs              ← App startup + CORS + Swagger
│   ├── appsettings.json        ← DB connection string
│   └── BuilderProAPI.csproj
│
├── buildercrm-updated/         ← React 18 Frontend
│   ├── src/
│   │   ├── App.jsx             ← Full app with all modals & API calls
│   │   ├── api.js              ← API service layer
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
│
├── BuilderProDB_Setup.sql      ← SQL indexes, views, stored procedures
├── deploy-azure.ps1            ← Windows/PowerShell deployment
├── deploy-azure.sh             ← Linux/Mac deployment
└── README.md
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Dashboard stats |
| GET/POST | `/api/projects` | List / Create projects |
| PUT/DELETE | `/api/projects/{id}` | Update / Delete project |
| GET/POST | `/api/units` | List / Add units (filter: ?projectId=&status=) |
| PATCH | `/api/units/{id}/status` | Update unit status |
| GET/POST | `/api/leads` | List / Create leads |
| GET | `/api/leads/kanban` | Kanban board data |
| PATCH | `/api/leads/{id}/stage` | Move lead stage |
| GET/POST | `/api/channelpartners` | List / Add partners |
| GET/POST | `/api/customers` | List / Add customers |
| GET/POST | `/api/sitevisits` | List / Schedule visits |
| PATCH | `/api/sitevisits/{id}/status` | Update visit status |
| GET/POST | `/api/bookings` | List / Create bookings |
| GET/POST | `/api/payments` | List / Record payments |
| GET/POST | `/api/commissions` | List / Add commissions |
| PATCH | `/api/commissions/{id}/approve` | Approve commission |
| PATCH | `/api/commissions/{id}/pay` | Mark commission paid |
| GET/POST | `/api/documents` | List / Add documents |
| GET/POST | `/api/servicetickets` | List / Create tickets |
| PATCH | `/api/servicetickets/{id}/status` | Update ticket status |

---

## Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| .NET SDK | 8.0+ | https://dotnet.microsoft.com/download |
| Node.js | 18+ | https://nodejs.org |
| Azure CLI | Latest | https://aka.ms/installazurecli |
| SQL Server | Any (local/Azure) | https://www.microsoft.com/sql-server |

---

## Local Development Setup

### Step 1 — Run the Backend

```bash
cd BuilderProAPI

# Restore packages
dotnet restore

# Apply migrations & seed database (auto-runs on startup)
# Make sure SQL Server is running locally, then update connection string:
# In appsettings.json change to:
# "DefaultConnection": "Server=localhost;Database=BuilderProDB;Trusted_Connection=True;TrustServerCertificate=True;"

# Run the API
dotnet run

# API will start at: http://localhost:5000
# Swagger docs at:   http://localhost:5000/swagger
```

### Step 2 — Run the Frontend

```bash
cd buildercrm-updated

# Install dependencies
npm install

# Start dev server (proxies /api to localhost:5000 automatically)
npm run dev

# Open http://localhost:3000
```

### Step 3 — Test API

Visit http://localhost:5000/swagger to see all endpoints and test them interactively.

---

## Azure Deployment (One Command)

### Option A — Windows (PowerShell)

```powershell
# Open PowerShell as Administrator
cd C:\path\to\BuilderPro

# Run deployment script
.\deploy-azure.ps1

# Custom parameters (optional):
.\deploy-azure.ps1 -ResourceGroup "my-rg" -Location "westindia" -AppName "my-builderpro-api"
```

### Option B — Linux / Mac (Bash)

```bash
cd /path/to/BuilderPro
chmod +x deploy-azure.sh
./deploy-azure.sh
```

### What the script does automatically:

1. ✅ Logs in to Azure
2. ✅ Creates Resource Group in Central India
3. ✅ Creates Azure SQL Server + Database (Basic tier ~$5/month)
4. ✅ Sets firewall rules
5. ✅ Creates App Service Plan (B1 Linux ~$13/month)
6. ✅ Creates .NET Web App with connection string injected
7. ✅ Creates Azure Static Web App (free tier)
8. ✅ Builds .NET API → publishes → deploys via zip
9. ✅ Builds React frontend with Azure API URL baked in
10. ✅ Deploys frontend to Static Web App CDN
11. ✅ Health checks both services
12. ✅ Prints live URLs

---

## Manual Azure SQL Setup (Alternative)

If you prefer to set up the database manually:

```bash
# 1. Create SQL Server
az sql server create \
  --name builderproserver \
  --resource-group builderpro-rg \
  --location centralindia \
  --admin-user builderadmin \
  --admin-password "BuilderPro@2024!"

# 2. Create Database
az sql db create \
  --server builderproserver \
  --resource-group builderpro-rg \
  --name BuilderProDB \
  --service-objective Basic

# 3. Open firewall
az sql server firewall-rule create \
  --server builderproserver \
  --resource-group builderpro-rg \
  --name AllowAll \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 255.255.255.255

# 4. Run the SQL setup script in Azure Portal Query Editor
# Upload BuilderProDB_Setup.sql and execute it
```

---

## Changing the Connection String

Edit `BuilderProAPI/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=tcp:YOUR_SERVER.database.windows.net,1433;Initial Catalog=BuilderProDB;User ID=builderadmin;Password=YOUR_PASSWORD;Encrypt=True;"
  }
}
```

For local SQL Server Express:
```json
"DefaultConnection": "Server=.\\SQLEXPRESS;Database=BuilderProDB;Trusted_Connection=True;TrustServerCertificate=True;"
```

---

## Features Implemented

### Frontend (React 18)
- ✅ Dashboard with live stats from API
- ✅ Projects — Add/View/Edit with modal
- ✅ Inventory — Add units, filter by status
- ✅ Leads — Kanban board, Add lead modal
- ✅ Channel Partners — Add/View partners
- ✅ Customers — Add/View with payment tracker
- ✅ Site Visits — Schedule, Complete, Cancel
- ✅ Bookings — Create bookings
- ✅ Payments — Record payments
- ✅ Commission — Approve/Pay commissions
- ✅ Documents — Add document records
- ✅ Customer Service — Create/Resolve tickets
- ✅ RERA Compliance — Status tracker
- ✅ AI Assistant (ARIA) — Chat interface
- ✅ Workflows — Process visualizer
- ✅ Reports — Revenue charts, KPIs

### Backend (.NET 8)
- ✅ 11 full CRUD controllers
- ✅ Entity Framework Core + MS SQL
- ✅ Auto-migration on startup
- ✅ Seed data (4 projects, 8 units, 5 leads, 3 partners, 4 customers)
- ✅ Swagger / OpenAPI documentation
- ✅ CORS configured for any origin
- ✅ Health check endpoint

### Database
- ✅ 11 tables with proper FK relationships
- ✅ Performance indexes
- ✅ 4 SQL Views (Dashboard, Portfolio, Payments, Lead Pipeline)
- ✅ 3 Stored Procedures (Revenue, Lead Conversion, Partner Performance)
- ✅ 2 Triggers (Booking auto-update, Overdue detection)

---

## Estimated Azure Cost

| Resource | Tier | Monthly Cost |
|----------|------|-------------|
| App Service (API) | B1 | ~$13 |
| Azure SQL Database | Basic 5 DTU | ~$5 |
| Static Web App (Frontend) | Free | $0 |
| **Total** | | **~$18/month** |

---

## Troubleshooting

**API returns 500 errors?**
- Check connection string in App Service → Configuration → Connection Strings
- Check App Service logs: `az webapp log tail --name builderpro-api --resource-group builderpro-rg`

**Frontend shows "Failed to load data"?**
- Check `VITE_API_URL` in `.env.production` matches your API URL
- Verify CORS is enabled (it is by default in Program.cs)

**Database migration errors?**
- Run `dotnet ef database update` from the BuilderProAPI folder
- Or delete the database and let auto-migrate recreate it

**Swagger not showing?**
- Visit `https://your-api.azurewebsites.net/swagger`
- Swagger is enabled in both Development and Production

---

## Login Credentials (Demo)

The app currently uses a static demo user. Auth can be added via ASP.NET Core Identity.

- **Username:** Arjun Kapoor
- **Role:** Super Admin
