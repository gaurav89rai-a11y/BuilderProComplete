# BuilderPro ERP — System Architecture

## 1. High-Level Architecture

BuilderPro ERP is engineered following clean architecture and separation of concerns principles:

```
+-------------------------------------------------------------------------+
|                              PRESENTATION LAYER                         |
|  React 18 SPA + Vite · Lucide Icons · Recharts · Dark/Light Theme Engine |
|  - Domain Feature Modules (/src/features)                               |
|  - Reusable UI Component Primitives (/src/components/ui)                |
|  - Context Providers (ConfigProvider, Permissions, Theme)               |
+------------------------------------+------------------------------------+
                                     |
                          HTTPS / REST API JSON
                                     v
+-------------------------------------------------------------------------+
|                              API & SERVICE LAYER                        |
|  ASP.NET Core 8 Web API                                                 |
|  - 19 Controllers (Route handling, request validation, HTTP contracts)   |
|  - Middleware Pipeline (Global Exception Handling, CORS, Swagger)      |
|  - Domain Business Services (BookingService, DashboardService)          |
+------------------------------------+------------------------------------+
                                     |
                             Inversion of Control
                                     v
+-------------------------------------------------------------------------+
|                           DATA ACCESS LAYER                             |
|  Entity Framework Core 8.0                                              |
|  - Generic Repository Pattern (IRepository<T>, Repository<T>)           |
|  - Transactional Unit of Work (IUnitOfWork, UnitOfWork)                 |
|  - Dual Database Provider Support (SQL Server & PostgreSQL)             |
+------------------------------------+------------------------------------+
                                     |
                             ADO.NET / SQL Driver
                                     v
+-------------------------------------------------------------------------+
|                              PERSISTENCE LAYER                          |
|  Microsoft SQL Server (Production/Default) / PostgreSQL (Container/Cloud)|
|  - Automated schema initialization via EnsureCreated()                  |
|  - Dynamic Material Master catalog bootstrap via SQL batch scripts      |
+-------------------------------------------------------------------------+
```

---

## 2. Backend Design Patterns

### Repository & Unit of Work Pattern
- `IRepository<T>` defines standard asynchronous CRUD contracts (`GetAllAsync`, `GetByIdAsync`, `GetFirstOrDefaultAsync`, `AddAsync`, `Update`, `Remove`).
- `IUnitOfWork` orchestrates repositories across all 19 domain entities, ensuring single-transaction database commits (`CompleteAsync`).

### Global Exception Handling Middleware
- `ExceptionHandlingMiddleware` intercepts all unhandled exceptions, sanitizes sensitive stack traces for client consumption, logs detailed diagnostics server-side, and emits RFC-compliant structured error payloads:
```json
{
  "success": false,
  "message": "User-friendly error explanation",
  "data": null,
  "errors": ["User-friendly error explanation"]
}
```

### Dynamic Multi-Provider Database Architecture
- `Program.cs` inspects runtime environment variables and connection string schemes:
  1. If `DATABASE_URL` is set with `postgres://` or PostgreSQL parameters, it configures `Npgsql.EntityFrameworkCore.PostgreSQL`.
  2. Otherwise, it verifies connection to SQL Server with fallbacks to local auto-discovery (`SQLEXPRESS`, `(localdb)\MSSQLLocalDB`, `localhost`).
  3. Executes catalog bootstrapping from `BuilderProComplete_MaterialMaster_5000.sql` (or `_pg.sql` for PostgreSQL).

---

## 3. Frontend Architecture

### Resilient API Communication
- `src/services/api.js` provides a dual-mode communication bridge:
  - **Live Mode**: Direct asynchronous HTTP requests to `http://localhost:5000/api` (or `VITE_API_URL`).
  - **Graceful Fallback Mode**: If network errors or server downtime occur, client functions automatically serve verified mock structures from local state to maintain uninterrupted UI demonstration.

### Dynamic Theme & Style System
- Pure CSS design tokens dynamically toggled via `ConfigContext` and `theme.js`:
  - Tokens: `--raise`, `--bord`, `--txt`, `--gold`, `--side`, `--card`
  - Zero heavy CSS framework overhead; maximum render performance and full layout control.

### Role-Based Access Control (RBAC)
- Client permissions mapped in `src/config/permissions.js`:
  - `Super Admin` (all access)
  - `Manager` (projects, inventory, leads, CRM, OMS, HRMS)
  - `Sales Agent` (leads, site visits, customer tracking)
  - `Support Agent` (tickets, customer service)
