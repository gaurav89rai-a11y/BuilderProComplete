# BuilderPro ERP — Render Free Cloud Deployment Guide

This guide details the step-by-step process for deploying the **BuilderPro .NET 8 Web API** to **Render** using a free containerized web service and connecting it to a free cloud PostgreSQL database (without Azure and without exposing your local PC's SQL Server).

---

## 1. Architecture & Free Hosting Overview

```
 ┌────────────────────────────────────────────────────────┐
 │                   React Web Frontend                   │
 │     GitHub Pages: https://<user>.github.io/...         │
 └───────────────────────────┬────────────────────────────┘
                             │ HTTPS API Calls (CORS enabled)
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │           BuilderPro Web API (.NET 8 Docker)           │
 │       Render Free Web Service: https://...onrender.com │
 └───────────────────────────┬────────────────────────────┘
                             │ SSL / TLS Database Connection
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │             Cloud PostgreSQL Database (Free)           │
 │     Options: Supabase (500 MB) / Neon (0.5 GB) /       │
 │              Render PostgreSQL (30-day trial)          │
 └────────────────────────────────────────────────────────┘
```

### Local SQL Server Express Security
- **Your local SQL Server Express on your PC remains untouched and offline.**
- It is **never** exposed to the public internet, preventing port 1433 brute-force attacks and IP exposure.
- Local development continues using SQL Server Express, while cloud deployments use the cloud PostgreSQL database.

---

## 2. Choosing a Free Database Provider

| Provider | Free Storage | Inactivity Policy | Expiration | Recommended? |
| :--- | :--- | :--- | :--- | :--- |
| **Supabase** | 500 MB | Pauses after 7 days inactivity (unpauses in 1 click) | **Never expires** | **Yes (Top Choice)** |
| **Neon** | 500 MB | Auto-suspends on idle, wakes instantly on query | **Never expires** | **Yes (Top Choice)** |
| **Render PostgreSQL** | 1 GB | Runs continuously | **Expires in 30 days** | Only for temporary testing |

> [!IMPORTANT]
> **Avoid Render's Free PostgreSQL for permanent projects:** Render deletes free PostgreSQL databases after **30 days**. We strongly recommend **Supabase** or **Neon** because their free tiers never expire.

---

## 3. Step 1: Provision Free PostgreSQL Database

### Option A: Using Supabase (Recommended)
1. Go to [supabase.com](https://supabase.com) and sign in with your GitHub account.
2. Click **"New project"**.
3. Choose a project name (e.g. `builderpro-db`) and generate a strong database password. Save this password.
4. Select a region close to your Render deployment (e.g. `US East / Oregon / Central India`).
5. Choose the **Free Plan**.
6. Once provisioned, go to **Project Settings > Database > Connection string**.
7. Select **URI** (or Transaction Pooler mode) and copy the URI:
   ```
   postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
   *(Ensure you replace `[YOUR-PASSWORD]` with your actual password).*

### Option B: Using Neon (Alternative)
1. Go to [neon.tech](https://neon.tech) and sign in with GitHub.
2. Click **"Create Project"**, name it `builderpro-db`.
3. Copy the provided connection string:
   ```
   postgresql://[user]:[password]@[endpoint].neon.tech/neondb?sslmode=require
   ```

---

## 4. Step 2: Push Repository to GitHub

Ensure all safe local changes are committed and pushed to your GitHub repository:

```bash
git add .
git commit -m "chore: prepare production Dockerfile, render.yaml, and PostgreSQL support"
git push origin master
```

> [!NOTE]
> The updated `.gitignore` prevents `.env`, local settings, secrets, and credentials from ever being committed to GitHub.

---

## 5. Step 3: Deploy to Render

### Method A: Single-Click Blueprint (Using render.yaml)
1. Log in to [render.com](https://render.com) using your GitHub account.
2. Click the **"New +"** button in the dashboard and select **"Blueprint"**.
3. Connect your repository: `gaurav89rai-a11y/BuilderProComplete`.
4. Render detects `render.yaml` automatically and configures:
   - **Service Name**: `builderpro-api`
   - **Runtime**: `Docker`
   - **Plan**: `Free`
   - **Health Check Path**: `/health`
5. Under Environment Variables, input your database connection URI into `DATABASE_URL`.
6. Click **"Apply"**.

---

### Method B: Manual Web Service Setup
1. Log in to [render.com](https://render.com).
2. Click **"New +" > "Web Service"**.
3. Select **"Build and deploy from a Git repository"** and connect `gaurav89rai-a11y/BuilderProComplete`.
4. Configure the settings:
   - **Name**: `builderpro-api` (or custom name)
   - **Region**: Oregon (or your preferred region)
   - **Branch**: `master` (or `main`)
   - **Root Directory**: leave blank (root `.`)
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `./Dockerfile`
   - **Instance Type**: `Free`
5. Expand **"Advanced"** and add Environment Variables:
   - `DATABASE_URL`: `postgresql://user:password@host:port/dbname` *(Your Supabase or Neon connection string)*
   - `ASPNETCORE_ENVIRONMENT`: `Production`
   - `PORT`: `10000`
   - `FRONTEND_URL`: `https://gaurav89rai-a11y.github.io`
   - `Health Check Path`: `/health`
6. Click **"Create Web Service"**.

---

## 6. Step 4: Database Verification & Secondary Schema

When Render builds and starts the container:
1. `Program.cs` automatically detects the PostgreSQL `DATABASE_URL`.
2. `db.Database.EnsureCreated()` automatically generates all base application tables and seeds initial master records.
3. The container executes `scripts/database/BuilderProComplete_MaterialMaster_5000_pg.sql` to seed the complete catalog of 5,000+ items.

### Optional: Run Secondary Database Optimization Script
To add performance indexes, custom reporting views, and automated triggers:
1. Open the SQL Query Editor in **Supabase** or **Neon**.
2. Open [scripts/database/BuilderProDB_Setup_pg.sql](file:///e:/BuilderProComplete/scripts/database/BuilderProDB_Setup_pg.sql).
3. Copy and paste the script into the query editor and click **Run**.
4. This adds:
   - Composite performance indexes on `Units`, `Leads`, `Customers`, `Payments`, and `SiteVisits`.
   - Views: `vw_DashboardSummary`, `vw_ProjectPortfolio`, `vw_CustomerPaymentSummary`, `vw_LeadPipeline`.
   - Functions: `sp_monthly_revenue_report()`, `sp_lead_conversion_report()`, `sp_partner_performance_report()`.
   - Triggers: `trg_booking_created`, `trg_check_overdue`.

---

## 7. Step 5: Test the Live Render API

Once Render completes deployment (usually 2-3 minutes):
1. **Health Check**: Open `https://<your-service-name>.onrender.com/health`  
   Expected response:
   ```json
   {
     "status": "Healthy",
     "database": "connected",
     "provider": "Npgsql.EntityFrameworkCore.PostgreSQL",
     "timestamp": "2026-10-17T06:00:00Z"
   }
   ```
2. **Swagger UI**: Open `https://<your-service-name>.onrender.com/swagger` to interact with all API endpoints directly in your browser.
3. **Data Verification**: Execute `GET /api/Projects` or `GET /api/Materials` to verify seed data is populated.

---

## 8. Step 6: Connect React Frontend

1. Update `buildercrm-updated/.env.production`:
   ```properties
   VITE_API_URL=https://<your-service-name>.onrender.com/api
   ```
2. Deploy the updated frontend to GitHub Pages:
   ```powershell
   ./scripts/deployment/deploy-gh-pages.ps1
   ```
3. Test your live application at:
   `https://gaurav89rai-a11y.github.io/BuilderProComplete/`

---

## 9. Render Free Tier Limitations & Operational Tips

1. **Spin-down on Inactivity (Cold Starts)**:
   - Render's free web services automatically spin down after 15 minutes without incoming HTTP traffic.
   - The first request after a spin-down will take **30 to 50 seconds** to wake up the container. Subsequent requests respond in milliseconds.
   - *Tip*: If you want to keep the service responsive during daytime demonstrations, you can use a free ping monitor (e.g. UptimeRobot, cron-job.org) to ping `/health` every 14 minutes.
2. **Monthly Free Compute Hours**:
   - Render grants 750 free instance hours per month.
   - A single web service running 24/7 uses ~720-744 hours, fitting comfortably within the 750 free hours.
3. **Outbound Bandwidth**:
   - 100 GB/month included on Render Free.
