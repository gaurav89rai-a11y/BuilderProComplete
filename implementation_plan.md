# Implementation Plan: Full-Stack Enterprise Architecture Refactoring

We will refactor the React frontend into a scalable, feature-based architecture and separate the C# backend into clean controller-service-repository patterns to improve maintainability, readability, and modularity.

---

## Proposed Changes: FRONTEND (React)

We will partition the React workspace (`buildercrm-updated`) into structural directories matching the requested enterprise design layout. No business logic, styling details, or user flows will change.

### 📁 Target Folder Structure

```
buildercrm-updated/src/
├── app/
│   ├── App.jsx                       # Routing setup & Auth boundaries
│   └── main.jsx                      # App root mount loader
├── assets/                           # Image assets (e.g. logo)
├── components/
│   ├── ui/                           # Atoms (Btn, Badge, Input, Modal, Select, etc.)
│   └── navigation/                   # Topbar & Sidebar components
├── config/
│   ├── theme.js                      # Active theme & style tokens context
│   ├── navigation.js                 # Collapsible Sidebar items tree structure
│   └── permissions.js                # Permissions map config rules
├── features/                         # Feature Modules (view + local subcomponents)
│   ├── dashboard/                    # Dashboard.jsx, Stat.jsx
│   ├── projects/                     # Projects.jsx
│   ├── inventory/                    # Inventory.jsx
│   ├── users/                        # UserManagement.jsx
│   ├── leads/                        # Leads.jsx
│   ├── partners/                     # Partners.jsx
│   ├── customers/                    # Customers.jsx
│   ├── visits/                       # SiteVisits.jsx
│   ├── bookings/                     # Bookings.jsx
│   ├── payments/                     # Payments.jsx
│   ├── commissions/                  # Commission.jsx
│   ├── documents/                    # Documents.jsx
│   ├── support/                      # CustomerService.jsx
│   ├── rera/                         # RERACompliance.jsx
│   ├── reports/                      # Reports.jsx
│   └── ai/                           # AIAssistant.jsx, Workflow.jsx
├── services/
│   └── api.js                        # Fetch wrapper client queries mapping
└── utils/
    └── helpers.js                    # Text formatters, math utilities, converters
```

### 🧱 Detailed Refactoring Steps

1. **Configurations & Utilities**:
   - Extract `NAV` sidebar schema, `LABELS`, `PERMISSIONS` logic, and theme mutable variables out of current files and route them into `src/config/navigation.js`, `src/config/permissions.js`, and `src/config/theme.js` respectively.
2. **Global Services**:
   - Move `src/api.js` into `src/services/api.js`.
3. **Features Module Extraction**:
   - Extract each dashboard and ERP admin module (e.g. `Leads`, `Bookings`, `UserManagement`) out of `src/App.jsx` and structure them as standard exports inside their respective folders (e.g. `src/features/leads/Leads.jsx`).
4. **App Initialization & Wrapper Routing**:
   - Re-initialize `src/app/App.jsx` to only house state hooks for active navigation views, user simulators, theme context provider hooks, and session authentication forms.

---

## Proposed Changes: BACKEND (.NET C# Web API)

We will refactor the .NET application (`BuilderProAPI`) to decouple database logic, domain models, and API interfaces into clean Controllers, Services, and Repositories.

### 📁 Target Folder Structure

```
BuilderProAPI/
├── Controllers/                      # Controllers (lightweight API endpoints)
│   ├── BookingsController.cs
│   ├── ChannelPartnersController.cs
│   ├── CustomersController.cs
│   ├── DashboardController.cs        # Extracted from OtherControllers.cs
│   ├── DocumentsController.cs        # Extracted from OtherControllers.cs
│   ├── LeadsController.cs
│   ├── PaymentsController.cs         # Extracted from OtherControllers.cs
│   ├── ProjectsController.cs
│   ├── CommissionsController.cs      # Extracted from OtherControllers.cs
│   ├── ServiceTicketsController.cs   # Extracted from OtherControllers.cs
│   ├── SiteVisitsController.cs
│   ├── UnitsController.cs
│   └── UsersController.cs
├── Models/                           # Database Entities (segregated files)
│   ├── Project.cs
│   ├── Unit.cs
│   ├── Lead.cs
│   ├── ChannelPartner.cs
│   ├── Customer.cs
│   ├── SiteVisit.cs
│   ├── Booking.cs
│   ├── Payment.cs
│   ├── Commission.cs
│   ├── Document.cs
│   ├── ServiceTicket.cs
│   └── User.cs
├── Repositories/                     # Data Access Queries (EF DbContext queries)
│   ├── IRepository.cs                # Generic repository blueprint
│   ├── Repository.cs                 # Generic implementation
│   ├── IUnitOfWork.cs                # UnitOfWork scope wrapper
│   └── UnitOfWork.cs
├── Services/                         # Domain Logic & Business Computations
│   ├── IProjectService.cs
│   ├── ProjectService.cs
│   ├── IDashboardService.cs
│   └── DashboardService.cs           # Metric aggregates and chart generation logic
├── Middlewares/                      # Global Middleware filters
│   └── ExceptionHandlingMiddleware.cs # Global try-catch exception wrapper
├── Data/
│   └── BuilderProDbContext.cs        # Seeder & Fluent-API schema configuration
└── Program.cs                        # DI wiring & CORS pipeline registration
```

### 🧱 Detailed Refactoring Steps

1. **Entity Splitting**:
   - Split `Models.cs` into 12 standalone class files inside `BuilderProAPI/Models/` for readability and compilation scoping. Delete `Models.cs`.
2. **Controller Separation**:
   - Extract and separate the combined classes in `OtherControllers.cs` into individual controller files: `PaymentsController.cs`, `CommissionsController.cs`, `DocumentsController.cs`, `ServiceTicketsController.cs`, and `DashboardController.cs`. Delete `OtherControllers.cs`.
3. **Domain & Data Access Decoupling**:
   - Implement the **Repository** pattern using an Entity Framework generic repository `Repository<T>` and a `UnitOfWork` manager to handle commits.
   - Implement the **Service** layer to move data transformations, calculations (such as target percentage sums, KPI math, status updates), and validation out of controllers.
4. **Middlewares**:
   - Create `ExceptionHandlingMiddleware` to intercept crashes, write logging events, and return standardised API response payloads.
5. **Wired DI Setup**:
   - Inject repository instance scopes and business services in `Program.cs`.

---

## Verification Plan

### Automated Tests
- Run `npm run build` on the React frontend to confirm no compiler errors occur.
- Run `dotnet build` in `BuilderProAPI` to ensure C# compilation is fully green.

### Manual Verification
- Deploy local servers (`npm run dev` and `dotnet run`).
- Validate complete user flows (login authentication, lead addition, site visits, booking workflows, live map coordinate confirms, RERA compliance lists, dark-mode toggle) in the web browser.
