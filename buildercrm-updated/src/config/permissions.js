export const PERMISSIONS = {
  dashboard: "Dashboard.View",
  leads: "Leads.View",
  follow_up: "Leads.View",
  pipeline: "Leads.View",
  quotations: "Leads.View",
  visits: "SiteVisits.View",
  bookings: "Bookings.View",
  customers: "Customers.View",
  partners: "ChannelPartners.View",
  projects: "Projects.View",
  inventory: "Inventory.View",
  construction: "Projects.View",
  engineers: "Projects.View",
  labour: "Projects.View",
  equipment: "Projects.View",

  payments: "Payments.View",
  payment_schedule: "Payments.View",
  invoices: "Payments.View",
  expenses: "Payments.View",
  commission: "Commissions.View",
  commissions: "Commissions.View",

  material_master: "OMS.View",
  stock: "OMS.View",
  orders_oms: "OMS.View",
  vendors: "OMS.View",
  store: "OMS.View",
  inventory_oms: "OMS.View",

  hrms_employees: "HRMS.View",
  hrms_attendance: "HRMS.View",
  hrms_leaves: "HRMS.View",
  payroll: "HRMS.View",
  performance: "HRMS.View",

  tickets: "Support.View",
  reports: "Reports.View",
  finance_rep: "Reports.View",

  // Administration items
  admin_users: "Admin.Users.View",
  admin_roles: "Admin.Roles.View",
  roles_perms: "Admin.Roles.View",
  permissions_admin: "Admin.Permissions.View",
  masters_admin: "Admin.Masters.View",
  company_settings: "Admin.Settings.View",
  audit_logs: "Admin.Audit.View",
  workflow: "Admin.Workflow.View",
  rera: "Admin.Settings.View",
  ai: "Dashboard.View"
};

export const hasPermission = (user, itemId) => {
  if (!user) return true;
  // Super Admin: Full unconditional access to all modules, users, roles, permissions, reports, and settings
  if (user.role === "Super Admin" || user.permissions === "all" || user.isSuperAdmin) return true;

  // Channel Partner: Access only their own submitted leads, bookings, customer directory, visits, and commissions
  if (user.role === "Channel Partner") {
    const partnerAllowed = [
      "dashboard", "leads", "pipeline", "quotations", "customers", "bookings", "visits", "commission", "commissions", "partners"
    ];
    return partnerAllowed.includes(itemId);
  }

  // Sales Agent: Access assigned leads, customers, follow-ups, site visits, quotations, bookings, projects, units
  if (user.role === "Sales Agent") {
    const salesAgentAllowed = [
      "dashboard", "crm", "leads", "pipeline", "follow_up", "visits", "quotations", "bookings",
      "customers", "projects", "inventory"
    ];
    return salesAgentAllowed.includes(itemId);
  }

  // Accounts: Access authorized payments, receipts, payment schedules, invoices, expenses, reports, commissions
  if (user.role === "Accounts" || user.role === "Accountant") {
    const accountsAllowed = [
      "dashboard", "finance_group", "payments", "payment_schedule", "invoices", "expenses",
      "reports", "finance_rep", "commission", "commissions", "customers", "bookings"
    ];
    return accountsAllowed.includes(itemId);
  }

  // Sales Manager: Manage team leads, agents, follow-ups, site visits, bookings, customers, partners, reports
  if (user.role === "Sales Manager" || user.role === "Manager") {
    const salesManagerAllowed = [
      "dashboard", "crm", "leads", "pipeline", "follow_up", "visits", "quotations", "bookings",
      "customers", "partners", "commission", "commissions", "projects", "inventory", "reports", "sales_rep", "tickets"
    ];
    return salesManagerAllowed.includes(itemId);
  }

  // Check granular permission code if mapped
  const required = PERMISSIONS[itemId];
  if (!required) return true;

  // If user has effective permissions dictionary (from /my-permissions)
  if (user.effectivePermissions && typeof user.effectivePermissions === "object") {
    if (user.effectivePermissions[required] === true) return true;
    if (user.effectivePermissions[required] === false) return false;
  }

  // Comma-separated string permissions fallback
  if (user.permissions) {
    const userPerms = user.permissions.split(",").map(p => p.trim());
    return userPerms.includes(required) || userPerms.includes(itemId);
  }

  return false;
};
