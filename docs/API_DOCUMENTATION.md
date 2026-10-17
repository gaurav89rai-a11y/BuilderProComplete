# BuilderPro ERP — API Endpoints Reference

The backend exposes a full suite of RESTful API endpoints at `/api/*`. Interactive OpenAPI documentation is accessible at `/swagger` when running in any environment.

---

## Endpoint Catalog

| Module | Method | Route | Description |
| :--- | :--- | :--- | :--- |
| **System** | `GET` | `/` | API status and version string |
| **System** | `GET` | `/health` | Diagnostic health check (DB connectivity & provider) |
| **Dashboard** | `GET` | `/api/dashboard?projectId={id}` | Aggregated metrics, revenue, unit summary, lead stats |
| **Projects** | `GET` | `/api/projects` | List all real estate projects |
| **Projects** | `POST` | `/api/projects` | Register a new project |
| **Projects** | `PUT` | `/api/projects/{id}` | Update existing project details |
| **Projects** | `DELETE` | `/api/projects/{id}` | Remove a project |
| **Units** | `GET` | `/api/units?projectId={id}&status={status}` | List project units with optional filters |
| **Units** | `POST` | `/api/units` | Add a new unit |
| **Units** | `PUT` | `/api/units/{id}` | Modify unit details |
| **Units** | `PATCH` | `/api/units/{id}/status` | Update unit status (`Available`, `Booked`, `Sold`, `Held`) |
| **Units** | `DELETE` | `/api/units/{id}` | Delete a unit |
| **Leads** | `GET` | `/api/leads?projectId={id}` | List prospective buyer leads |
| **Leads** | `GET` | `/api/leads/kanban` | Kanban-grouped lead stages |
| **Leads** | `POST` | `/api/leads` | Create a new lead |
| **Leads** | `PUT` | `/api/leads/{id}` | Update lead information |
| **Leads** | `PATCH` | `/api/leads/{id}/stage` | Transition lead stage with audit log tracking |
| **Leads** | `GET` | `/api/leads/{id}/timeline` | Audit trail of stage transitions |
| **Leads** | `DELETE` | `/api/leads/{id}` | Remove lead |
| **Site Visits** | `GET` | `/api/sitevisits?projectId={id}` | List scheduled and completed site visits |
| **Site Visits** | `POST` | `/api/sitevisits` | Schedule a site visit |
| **Site Visits** | `PUT` | `/api/sitevisits/{id}` | Update site visit details |
| **Site Visits** | `PATCH` | `/api/sitevisits/{id}/status` | Update visit status (`Scheduled`, `Completed`, `Cancelled`) |
| **Site Visits** | `DELETE` | `/api/sitevisits/{id}` | Delete a visit |
| **Bookings** | `GET` | `/api/bookings?status={status}` | Retrieve customer unit bookings |
| **Bookings** | `POST` | `/api/bookings` | Create a booking (auto-updates unit status and logs audit) |
| **Bookings** | `PUT` | `/api/bookings/{id}` | Update booking details |
| **Bookings** | `DELETE` | `/api/bookings/{id}` | Cancel / remove booking |
| **Customers** | `GET` | `/api/customers?projectId={id}` | Customer roster and payment summaries |
| **Customers** | `POST` | `/api/customers` | Register customer |
| **Customers** | `PUT` | `/api/customers/{id}` | Modify customer record |
| **Customers** | `DELETE` | `/api/customers/{id}` | Delete customer record |
| **Payments** | `GET` | `/api/payments?customerId={id}` | List recorded payment transactions |
| **Payments** | `POST` | `/api/payments` | Record receipt / payment |
| **Commissions**| `GET` | `/api/commissions` | Channel partner commission claims |
| **Commissions**| `POST` | `/api/commissions` | File commission claim |
| **Commissions**| `PATCH` | `/api/commissions/{id}/approve` | Approve commission |
| **Commissions**| `PATCH` | `/api/commissions/{id}/pay` | Mark commission disbursed |
| **Partners** | `GET` | `/api/channelpartners` | List channel partners / brokers |
| **Partners** | `POST` | `/api/channelpartners` | Add channel partner |
| **Partners** | `PUT` | `/api/channelpartners/{id}` | Update partner details |
| **Partners** | `DELETE` | `/api/channelpartners/{id}` | Delete partner |
| **Documents** | `GET` | `/api/documents?customerId={id}` | Registry of customer & project documents |
| **Documents** | `POST` | `/api/documents` | Upload document metadata |
| **Tickets** | `GET` | `/api/servicetickets?customerId={id}` | Support & grievance tickets |
| **Tickets** | `POST` | `/api/servicetickets` | Log support ticket |
| **Tickets** | `PATCH` | `/api/servicetickets/{id}/status` | Update ticket status (`Open`, `In Progress`, `Resolved`) |
| **HRMS** | `GET` | `/api/employees` | Employee directory |
| **HRMS** | `POST` | `/api/employees` | Onboard employee (auto-provisions user account) |
| **HRMS** | `PUT` | `/api/employees/{id}` | Update employee profile |
| **HRMS** | `DELETE` | `/api/employees/{id}` | Offboard employee |
| **Attendance** | `GET` | `/api/attendances?employeeId={id}` | Daily attendance logs |
| **Attendance** | `POST` | `/api/attendances` | Check-in / log attendance |
| **Attendance** | `PUT` | `/api/attendances/{id}` | Correct attendance entry |
| **Leaves** | `GET` | `/api/leaverequests` | Leave applications |
| **Leaves** | `POST` | `/api/leaverequests` | Submit leave request |
| **Leaves** | `PATCH` | `/api/leaverequests/{id}/status` | Approve or reject leave request |
| **OMS (Orders)**| `GET` | `/api/orders?projectId={id}` | Material procurement orders |
| **OMS (Orders)**| `POST` | `/api/orders` | Issue purchase order |
| **OMS (Orders)**| `PATCH` | `/api/orders/{id}/status` | Update PO status (`Pending`, `Delivered`, `Shipped`) |
| **OMS (Orders)**| `DELETE` | `/api/orders/{id}` | Delete purchase order |
| **Materials** | `GET` | `/api/materials` | 5,000+ item material master catalog |
| **Materials** | `POST` | `/api/materials` | Create material item |
| **Materials** | `DELETE` | `/api/materials/{id}` | Delete material |
| **Materials** | `GET` | `/api/materials/categories` | Distinct material categories |
| **Materials** | `GET` | `/api/materials/brands` | Distinct supplier brands |
| **Users** | `GET` | `/api/users` | List ERP user accounts |
| **Users** | `POST` | `/api/users` | Create user account |
| **Users** | `PUT` | `/api/users/{id}` | Update user permissions / role |
| **Users** | `DELETE` | `/api/users/{id}` | Deactivate user account |
| **Config** | `GET` | `/api/systemconfigs` | Dynamic dropdown configurations & statuses |
