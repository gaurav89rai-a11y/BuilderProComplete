# SQL Server Reporting Services (SSRS) Integration & Deployment Guide

## Overview
BuilderPro ERP incorporates an enterprise **SQL Server Reporting Services (SSRS)** reporting suite combined with a high-performance **Direct SQL Stored Procedure Engine** for mission-critical real estate ERP operations.

The system delivers:
- **SSRS Report Definitions (.rdl)** compatible with SSRS 2016, 2017, 2019, 2022 and Power BI Report Server.
- **Server-Side Security & Proxy Architecture**: All communication with SSRS occurs securely server-to-server; report server URLs and network credentials are never exposed to the client browser.
- **Role-Based Report Access Control (RBAC)**: Reports are automatically filtered based on system role (Super Admin, Manager, Sales Agent, Accounts, Channel Partner).
- **Strict Channel Partner Tenant Isolation**: Channel Partner accounts are strictly restricted to their own performance and commission ledger; parameter tampering is blocked both on the client and server.
- **Multi-Format Exporting & Printing**: Direct export to **PDF**, **Excel (.xlsx)**, **Word (.docx)**, and **CSV (.csv)** with formatted numeric and currency values, totals rows, and dedicated print styles (`@media print`).
- **Resilient Fallback Engine**: If SSRS is unreachable, undergoing maintenance, or in the process of deployment, the built-in SQL stored procedure engine executes with sub-second response times, generating real-time tabular data, summary KPIs, and file exports without application downtime.

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 BuilderPro React Frontend                   │
│   (Report Catalog, Dynamic Filters, Viewer, Export & Print) │
└──────────────────────────────┬──────────────────────────────┘
                               │
               HTTP / REST API (JSON / Export Stream)
               Headers: X-User-Role, X-Channel-Partner-Id
                               │
┌──────────────────────────────▼──────────────────────────────┐
│             ASP.NET Core Web API (ReportsController)        │
│   - Role-Based Authorization & Parameter Sanitization       │
│   - SSRS Health Diagnostics & Latency Monitoring            │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
     (If SSRS is Online)             (If SSRS is Standby/Offline)
               │                              │
┌──────────────▼──────────────┐  ┌────────────▼──────────────┐
│  Microsoft SSRS Web Service │  │  Enterprise SQL Engine    │
│  (ReportServer URL Access)  │  │  (Stored Procedures / SPs)│
│  HTTP NTLM / Windows Auth   │  │  Multi-format Exporters   │
└──────────────┬──────────────┘  └────────────┬──────────────┘
               │                              │
               └──────────────┬───────────────┘
                              │
               ┌──────────────▼──────────────┐
               │    SQL Server: BuilderProDB │
               │  Tables, Views, Procedures  │
               └─────────────────────────────┘
```

---

## 2. Report Catalog & Stored Procedures

| Report ID | Title | Category | Stored Procedure | SSRS RDL File | Permitted Roles |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `executive-summary` | Executive Portfolio & Financial Summary | Executive | `sp_Rpt_ExecutiveSummary` | `ExecutiveSummaryReport.rdl` | Super Admin, Manager, Accounts |
| `lead-pipeline` | Lead Conversion & Pipeline Funnel | Sales & CRM | `sp_Rpt_LeadConversionPipeline` | `LeadPipelineReport.rdl` | Super Admin, Manager, Sales Agent |
| `site-visits` | Site Visits & Prospect Engagement Log | Sales & CRM | `sp_Rpt_SiteVisits` | `SiteVisitsReport.rdl` | Super Admin, Manager, Sales Agent |
| `financial-collections` | Collections & Realization Ledger | Financial | `sp_Rpt_FinancialCollections` | `FinancialCollectionsReport.rdl` | Super Admin, Manager, Accounts |
| `customer-receivables` | Customer Receivables & Aging Analysis | Financial | `sp_Rpt_CustomerReceivables` | `CustomerReceivablesReport.rdl` | Super Admin, Manager, Accounts |
| `partner-commission` | Channel Partner Commission Ledger | Channel Partners | `sp_Rpt_ChannelPartnerCommission` | `ChannelPartnerCommissionReport.rdl` | Super Admin, Manager, Channel Partner |
| `unit-inventory` | Unit Inventory & Availability Matrix | Operational | `sp_Rpt_UnitInventoryStatus` | `UnitInventoryReport.rdl` | Super Admin, Manager, Sales Agent |
| `user-role-audit` | User Security, Roles & Permissions Audit | Governance | `sp_Rpt_UserRoleAudit` | `UserRoleAuditReport.rdl` | Super Admin |

---

## 3. Database Deployment (SQL Server)

To deploy or update all report stored procedures in your SQL Server database:

1. Open **SQL Server Management Studio (SSMS)** or Azure Data Studio.
2. Connect to your SQL Server instance (e.g. `localhost\SQLEXPRESS`).
3. Open and execute the script:
   ```sql
   e:\BuilderProComplete\scripts\database\BuilderPro_SSRS_Reports.sql
   ```
4. Or execute via PowerShell:
   ```powershell
   powershell -ExecutionPolicy Bypass -File "e:\BuilderProComplete\scripts\database\deploy_ssrs_procs.ps1"
   ```

---

## 4. Microsoft SSRS Installation & Setup

If SQL Server Reporting Services is not yet installed on the server:

### Step 4.1: Install SSRS
1. Download **Microsoft SQL Server Reporting Services** (2019 or 2022) installer:
   [https://www.microsoft.com/en-us/download/details.aspx?id=100122](https://www.microsoft.com/en-us/download/details.aspx?id=100122)
2. Run the installer and choose **Install Reporting Services**.
3. Select **Developer** or **Standard** edition and complete installation.

### Step 4.2: Configure Report Server
1. Launch **Report Server Configuration Manager**.
2. Connect to your Report Server instance.
3. **Database**: Click **Change Database** -> Create a new report server database (`ReportServer`, `ReportServerTempDB`) with Windows Service credentials.
4. **Web Service URL**: Set Virtual Directory to `ReportServer` (default port 80). Click **Apply**.
5. **Web Portal URL**: Set Virtual Directory to `Reports`. Click **Apply**.
6. Verify URL in browser: `http://localhost/ReportServer` should load the SSRS directory interface.

---

## 5. Automated Report Deployment to SSRS

BuilderPro ERP includes an automated PowerShell deployment script that creates the `/BuilderPro` folder on the Report Server, sets up the shared data source, and publishes all `.rdl` reports.

### Run Deployment Script:
```powershell
powershell -ExecutionPolicy Bypass -File "e:\BuilderProComplete\scripts\deployment\Deploy-SSRS-Reports.ps1" `
    -ReportServerUri "http://localhost/ReportServer" `
    -TargetFolder "/BuilderPro" `
    -DataSourceName "BuilderProDataSource" `
    -ConnectionString "Data Source=localhost\SQLEXPRESS;Initial Catalog=BuilderProDB;Integrated Security=True"
```

### Manual Deployment Option:
1. Open SSRS Web Portal: `http://localhost/Reports`
2. Create folder: `BuilderPro`
3. Inside `BuilderPro`, create Data Source:
   - Name: `BuilderProDataSource`
   - Connection string: `Data Source=localhost\SQLEXPRESS;Initial Catalog=BuilderProDB;Integrated Security=True`
4. Click **Upload** and upload each file from `e:\BuilderProComplete\BuilderProAPI\Reports\*.rdl`.
5. Under each report's **Manage** -> **Data Sources**, set reference to `BuilderProDataSource`.

---

## 6. Application Configuration (`appsettings.json`)

Configure the SSRS server settings in `BuilderProAPI/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost\\SQLEXPRESS;Database=BuilderProDB;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "SSRS": {
    "Enabled": true,
    "ReportServerUrl": "http://localhost/ReportServer",
    "ReportFolder": "/BuilderPro",
    "ReportPath": "/BuilderPro/AgreementReport",
    "Username": "",
    "Password": "",
    "Domain": "",
    "UseDefaultCredentials": true,
    "TimeoutSeconds": 15
  }
}
```

- `Enabled`: Enables or disables SSRS Report Server calls.
- `ReportServerUrl`: Web Service URL for SSRS.
- `ReportFolder`: Target directory on SSRS where RDL reports are published.
- `UseDefaultCredentials`: Set to `true` when running under Windows Integrated Authentication or IIS Application Pool identity.
- `Username` / `Password` / `Domain`: Used when specific service account credentials are required for SSRS.
- `TimeoutSeconds`: Maximum wait time before automatically activating the local high-performance fallback engine.

---

## 7. Role-Based Permissions & Tenant Isolation

### Permission Matrix
- **Super Admin**: Unrestricted access to all 8 operational, financial, and governance reports.
- **Manager / Sales Manager**: Access to Dashboard, Lead Pipeline, Site Visits, and Unit Inventory.
- **Sales Agent**: Access to Lead Pipeline, Site Visits, and Unit Inventory.
- **Accounts**: Access to Dashboard, Financial Collections, and Customer Receivables.
- **Channel Partner**: Strictly restricted to **Channel Partner Commission Ledger** (`partner-commission`).
  - The backend server inspects `X-Channel-Partner-Id`.
  - The query parameter `@PartnerId` is forcefully locked to the caller's assigned ID.
  - Attempts to view other reports or modify the partner ID return `403 Forbidden`.

---

## 8. Channel Partner Inline Creation (System Role)

Per requirements, the standalone "Channel Partners" sidebar navigation item has been removed.
When a Super User navigates to **Administration -> Users** and clicks **New User**:
1. Selecting **System Role -> Channel Partner** opens an inline Channel Partner details panel directly inside the user modal.
2. The user enters the firm name, contact person, phone, email, city, tier status, and commission rate.
3. Submitting the form automatically creates both the Channel Partner record and links the newly created User account in a single operation.
