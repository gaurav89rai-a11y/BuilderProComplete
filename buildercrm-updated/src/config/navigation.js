import {
  LayoutDashboard, Target, ShoppingCart, Building2, DollarSign, Users, Handshake, Headphones, BarChart3, Shield
} from "lucide-react";

export const NAV = [
  {
    sec: "Dashboard",
    id: "dashboard",
    icon: LayoutDashboard,
    isGroup: false
  },
  {
    sec: "CRM",
    id: "crm",
    icon: Target,
    isGroup: true,
    items: [
      { id: "leads", label: "Leads" },
      { id: "bookings", label: "Booking" },
      { id: "customers", label: "Customers" }
    ]
  },
  {
    sec: "OMS",
    id: "oms",
    icon: ShoppingCart,
    isGroup: true,
    items: [
      { id: "material_master", label: "Material Master" },
      { id: "stock", label: "Stock" },
      { id: "orders_oms", label: "Purchase" },
      { id: "vendors", label: "Vendors" },
      { id: "store", label: "Store" },
      { id: "inventory_oms", label: "Inventory" }
    ]
  },
  {
    sec: "Construction",
    id: "construction_group",
    icon: Building2,
    isGroup: true,
    items: [
      { id: "projects", label: "Projects" },
      { id: "inventory", label: "Units" },
      { id: "construction", label: "Daily Progress" },
      { id: "engineers", label: "Engineers" },
      { id: "labour", label: "Labour" },
      { id: "equipment", label: "Equipment" }
    ]
  },
  {
    sec: "Finance",
    id: "finance_group",
    icon: DollarSign,
    isGroup: true,
    items: [
      { id: "payments", label: "Receipts" },
      { id: "payment_schedule", label: "Payment Schedule" },
      { id: "invoices", label: "Invoice" },
      { id: "expenses", label: "Expenses" },
      { id: "reports", label: "Reports" }
    ]
  },
  {
    sec: "HRMS",
    id: "hrms_group",
    icon: Users,
    isGroup: true,
    items: [
      { id: "hrms_employees", label: "Employees" },
      { id: "hrms_attendance", label: "Attendance" },
      { id: "hrms_leaves", label: "Leave" },
      { id: "payroll", label: "Payroll" },
      { id: "performance", label: "Performance" }
    ]
  },
  {
    sec: "Channel Partners",
    id: "partners",
    icon: Handshake,
    isGroup: false
  },
  {
    sec: "Customer Support",
    id: "tickets",
    icon: Headphones,
    isGroup: false
  },
  {
    sec: "Reports",
    id: "reports",
    icon: BarChart3,
    isGroup: false
  },
  {
    sec: "Administration",
    id: "administration_group",
    icon: Shield,
    isGroup: true,
    items: [
      { id: "admin_users", label: "Users" },
      { id: "roles_perms", label: "Roles" },
      { id: "permissions_admin", label: "Permissions" },
      { id: "masters_admin", label: "Masters" },
      { id: "company_settings", label: "Settings" }
    ]
  }
];

export const LABELS = {
  dashboard: "Executive Dashboard",
  leads: "Leads CRM",
  follow_up: "Follow-up & Site Visit Tracker",
  bookings: "Booking Registry",
  customers: "Customer Directory",
  material_master: "Material Master Register",
  stock: "Material Stock Levels",
  orders_oms: "Material Procurement Orders",
  vendors: "Vendor Directory",
  store: "Store Management",
  inventory_oms: "OMS Material Inventory",
  projects: "Project Portfolio",
  inventory: "Units & Inventory Management",
  construction: "Daily Progress Logs",
  engineers: "Site Engineers Registry",
  labour: "Daily Labour Logs",
  equipment: "Heavy Equipment Tracking",
  payments: "Receipts & Payment Ledger",
  payment_schedule: "Installment Schedules",
  invoices: "Invoice Register",
  expenses: "Expenses Tracker",
  hrms_employees: "Employee Directory",
  hrms_attendance: "Attendance Register",
  hrms_leaves: "Leave Management",
  payroll: "Salary & Payroll processing",
  performance: "Employee Performance Evaluations",
  partners: "Channel Partners CRM",
  tickets: "Customer Support Tickets",
  reports: "Business Intelligence & Reports",
  admin_users: "User Account Administration",
  roles_perms: "User Role Assignments",
  permissions_admin: "Permissions Map Setup",
  masters_admin: "ERP Core Masters",
  company_settings: "ERP System Settings"
};
