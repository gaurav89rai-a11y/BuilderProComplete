export const PERMISSIONS = {
  dashboard: "view_dashboard",
  projects: "manage_projects",
  inventory: "manage_inventory",
  users: "manage_users",
  leads: "manage_leads",
  partners: "manage_partners",
  customers: "manage_customers",
  visits: "manage_visits",
  bookings: "manage_bookings",
  payments: "manage_finance",
  commission: "manage_finance",
  rera: "manage_projects",
  ai: "view_dashboard",
  workflow: "manage_projects",
  reports: "view_dashboard",
  
  // New items mapping:
  quotations: "manage_leads",
  pipeline: "manage_leads",
  invoices: "manage_finance",
  refunds: "manage_finance",
  cust_docs: "manage_projects",
  proj_docs: "manage_projects",
  agreements: "manage_projects",
  templates: "manage_projects",
  tickets: "manage_support",
  complaints: "manage_support",
  warranty: "manage_support",
  feedback: "manage_support",
  construction: "manage_projects",
  milestones: "manage_projects",
  contractors: "manage_projects",
  sales_rep: "view_dashboard",
  inventory_rep: "view_dashboard",
  finance_rep: "view_dashboard",
  customer_rep: "view_dashboard",
  notifications: "view_dashboard",
  scheduled_jobs: "manage_users",
  admin_users: "manage_users",
  roles_perms: "manage_users",
  company_settings: "manage_users",
  audit_logs: "manage_users",
  hrms_employees: "manage_hrms",
  hrms_attendance: "manage_hrms",
  hrms_leaves: "manage_hrms",
  orders_oms: "manage_oms"
};

export const hasPermission = (user, itemId) => {
  if (!user) return true;
  // Super Admin: Full access to all modules, users, roles, permissions, reports, and settings
  if (user.role === "Super Admin" || user.permissions === "all") return true;

  // Channel Partner: Access only their own submitted leads, associated customers, bookings, and permitted booking statuses
  if (user.role === "Channel Partner") {
    const partnerAllowed = [
      "dashboard", "leads", "pipeline", "quotations", "customers", "bookings", "visits", "commission", "commissions"
    ];
    return partnerAllowed.includes(itemId);
  }

  // Sales Manager: Manage authorized team leads, agents, follow-ups, site visits, quotations, bookings, and sales reports
  if (user.role === "Sales Manager" || user.role === "Manager") {
    const salesManagerAllowed = [
      "dashboard", "crm", "leads", "pipeline", "follow_up", "visits", "quotations", "bookings",
      "customers", "partners", "commission", "commissions", "projects", "inventory", "reports", "sales_rep"
    ];
    return salesManagerAllowed.includes(itemId);
  }

  // Sales Agent: Access assigned leads, customers, follow-ups, site visits, quotations, and permitted bookings
  if (user.role === "Sales Agent") {
    const salesAgentAllowed = [
      "dashboard", "crm", "leads", "pipeline", "follow_up", "visits", "quotations", "bookings",
      "customers", "projects", "inventory"
    ];
    return salesAgentAllowed.includes(itemId);
  }

  // Accounts: Access authorized payments, receipts, outstanding balances, and financial reports
  if (user.role === "Accounts" || user.role === "Accountant") {
    const accountsAllowed = [
      "dashboard", "finance_group", "payments", "payment_schedule", "invoices", "expenses",
      "reports", "finance_rep", "commission", "commissions", "customers", "bookings"
    ];
    return accountsAllowed.includes(itemId);
  }

  const required = PERMISSIONS[itemId];
  if (!required) return true;
  const userPerms = (user.permissions || "").split(",");
  return userPerms.includes(required);
};
