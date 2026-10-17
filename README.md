# BuilderPro ERP — Real Estate Management Platform

[![.NET 8](https://img.shields.io/badge/.NET-8.0-blue.svg)](https://dotnet.microsoft.com/)
[![React 18](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![EF Core](https://img.shields.io/badge/EF%20Core-8.0-purple.svg)](https://learn.microsoft.com/ef/core/)
[![Vite](https://img.shields.io/badge/Vite-5.4-yellow.svg)](https://vitejs.dev/)
[![Tests](https://img.shields.io/badge/Tests-Passing-success.svg)]()

A comprehensive, enterprise-grade Real Estate ERP system designed for builders, developers, and property aggregators. Built with a robust **ASP.NET Core 8 Web API** backend and a high-performance **React 18** client powered by Vite.

---

## Architecture & Technology Stack

```
BuilderProComplete/
├── BuilderProAPI/                 # ASP.NET Core 8 Web API (Backend)
│   ├── Controllers/               # 19 REST Controllers (Leads, Projects, Bookings, OMS, etc.)
│   ├── Data/                      # EF Core DbContext & Schema Seeding
│   ├── Middlewares/               # Global Exception Handling & Logging
│   ├── Models/                    # 19 Domain Entities (Projects, Units, Bookings, etc.)
│   ├── Repositories/              # Generic Repository & Transactional Unit of Work
│   ├── Services/                  # Business Logic Services (BookingService, DashboardService)
│   ├── Properties/                # Launch profiles & environment bindings
│   ├── appsettings.json           # Runtime configuration & database connection
│   ├── appsettings.Example.json   # Template configuration for production/staging
│   └── BuilderProAPI.csproj       # .NET 8 project definition
│
├── BuilderProAPI.Tests/           # xUnit Automated Test Suite
│   ├── AttendanceTests.cs         # HRMS attendance integration tests
│   ├── EmployeeTests.cs           # Employee lifecycle and user provisioning tests
│   ├── OrderTests.cs              # Material order procurement tests
│   └── BuilderProAPI.Tests.csproj # .NET 8 test project definition
│
├── buildercrm-updated/            # React 18 Single Page Application (Frontend)
│   ├── public/                    # Static branding & logo assets
│   ├── src/
│   │   ├── app/                   # App shell, responsive layouts, router mapping
│   │   ├── components/            # Navigation (Sidebar, TopBar) & UI primitives
│   │   ├── config/                # Dynamic theme tokens, permissions, navigation tree
│   │   ├── features/              # 18 Domain features (Dashboard, Leads, OMS, HRMS, etc.)
│   │   ├── forms/                 # Customer, booking, partner, feedback forms
│   │   ├── services/              # Dual-mode HTTP service layer + offline mock fallback
│   │   └── utils/                 # Formatting, currency, badge helpers
│   ├── package.json               # Frontend dependencies & scripts
│   └── vite.config.js             # Vite configuration with automatic API proxy
│
├── scripts/
│   ├── database/                  # SQL setup scripts & 5,000+ item material catalog
│   │   ├── BuilderProDB_Setup.sql
│   │   ├── BuilderProComplete_MaterialMaster_5000.sql
│   │   └── BuilderProComplete_MaterialMaster_5000_pg.sql
│   └── deployment/                # Cloud provisioning & deployment automation
│       ├── deploy-azure.ps1       # Automated Azure Resource Group, SQL, App Service deployment
│       ├── deploy-azure.sh        # Linux/macOS deployment script
│       └── deploy-gh-pages.ps1    # Automated GitHub Pages static deployer
│
├── docs/                          # Architecture, API specifications, deployment guides
│   ├── ARCHITECTURE.md            # System architecture and design patterns
│   ├── API_DOCUMENTATION.md       # Complete 19-controller REST endpoint reference
│   └── DEPLOYMENT_GUIDE.md        # Detailed Azure, Docker, and GitHub Pages guide
│
├── BuilderPro.sln                 # Root Visual Studio solution file
├── Dockerfile                     # Multi-stage production container build
├── .gitignore                     # Comprehensive repository exclusion rules
└── README.md                      # Project documentation
```

---

## Core Modules & Features

| Module | Features Included |
| :--- | :--- |
| **Executive Dashboard** | Real-time project metrics, financial summaries, lead conversion sources, inventory breakdowns |
| **Sales CRM** | Multi-stage lead management, interactive Kanban board, timeline audit tracking |
| **Site Visits** | Schedule, track, and record feedback for prospective property buyer site visits |
| **Bookings & Units** | Complete unit inventory management, automated token-to-booking transitions, unit status locking |
| **Finance & Ledger** | Receipts tracking, installment schedules, invoices, payment receipts |
| **Order Management (OMS)** | 5,000+ material master catalog, stock levels, purchase orders, store management, vendor directory |
| **Human Resources (HRMS)** | Employee directory, daily attendance check-in, leave requests and approvals |
| **Channel Partners** | Broker registrations, tier ranking (Platinum/Gold/Silver), commission claims & payouts |
| **Customer Support** | Customer grievance ticketing, priority escalation, issue resolution logs |
| **RERA & Compliance** | Project regulatory tracking, documentation verification |
| **Security & RBAC** | Role-based permission controls (`Super Admin`, `Manager`, `Sales Agent`, `Support Agent`) |

---

## Prerequisites

- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 18+](https://nodejs.org) & npm
- [SQL Server](https://www.microsoft.com/sql-server) (Local / Azure) or [PostgreSQL](https://www.postgresql.org/)

---

## Quickstart (Run Locally)

### 1. Start the Backend API

```powershell
cd BuilderProAPI
$env:PORT="5000"
dotnet run
```

- **Backend API**: `http://localhost:5000`
- **Swagger Documentation**: `http://localhost:5000/swagger`
- **Health Check**: `http://localhost:5000/health`

### 2. Start the Frontend Client

In a separate terminal:

```powershell
cd buildercrm-updated
npm install
npm run dev
```

- **Frontend Client**: `http://localhost:3000`

---

## Automated Testing

Run the full suite of unit and integration tests from the root directory:

```powershell
# Run all tests via the root solution
dotnet test BuilderPro.sln

# Run frontend production build validation
cd buildercrm-updated
npm run build
```

---

## Database Configuration

The application supports both **Microsoft SQL Server** and **PostgreSQL** with automatic provider detection:

### SQL Server (Default)
In `BuilderProAPI/appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=BuilderProDB;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

### PostgreSQL (or Cloud / Container)
Set the `DATABASE_URL` environment variable:
```bash
export DATABASE_URL="postgres://username:password@hostname:5432/builderprodb"
```
On startup, EF Core automatically initializes the database schema (`EnsureCreated()`) and seeds the Material Master catalog from `scripts/database/BuilderProComplete_MaterialMaster_5000.sql`.

---

## Container Deployment (Docker)

Build and run the containerized backend:

```bash
# Build Docker image
docker build -t builderpro-api .

# Run container
docker run -d -p 8080:8080 \
  -e "ConnectionStrings__DefaultConnection=Server=your-sql-server;Database=BuilderProDB;User ID=your-user;Password=your-password;TrustServerCertificate=True;" \
  --name builderpro-api builderpro-api
```

---

## Cloud Deployment (Azure)

Deploy the entire infrastructure (Azure SQL + App Service + Static Web App) in one command:

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

For detailed deployment guides and configurations, see [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md).

---

## Documentation

- **System Architecture & Design**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Complete REST API Reference**: [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)
- **Deployment Manual**: [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)

---

## License

Proprietary enterprise software built for Abhay Buildcon / Matrix Group. All rights reserved.
