const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function req(method, path, body, customHeaders = {}) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json", ...customHeaders },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) {
    // Try to parse JSON error message if possible
    let errMsg = "";
    try {
      const errJson = await res.json();
      errMsg = errJson.message || errJson.error;
    } catch {
      // fallback to text
    }
    if (!errMsg) {
      errMsg = await res.text();
    }
    throw new Error(errMsg || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Dashboard
  getDashboard: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req("GET", `/dashboard${qs ? "?" + qs : ""}`);
  },

  // Projects
  getProjects: () => req("GET", "/projects"),
  createProject: (data) => req("POST", "/projects", data),
  updateProject: (id, data) => req("PUT", `/projects/${id}`, data),
  deleteProject: (id) => req("DELETE", `/projects/${id}`),

  // Units
  getUnits: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req("GET", `/units${qs ? "?" + qs : ""}`);
  },
  createUnit: (data) => req("POST", "/units", data),
  updateUnit: (id, data) => req("PUT", `/units/${id}`, data),
  updateUnitStatus: (id, status) => req("PATCH", `/units/${id}/status`, { status }),
  deleteUnit: (id) => req("DELETE", `/units/${id}`),

  // Leads
  getLeads: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req("GET", `/leads${qs ? "?" + qs : ""}`);
  },
  getLeadsKanban: () => req("GET", "/leads/kanban"),
  createLead: (data) => req("POST", "/leads", data),
  updateLead: (id, data) => req("PUT", `/leads/${id}`, data),
  updateLeadStage: (id, stage, comment, role = "Super Admin", name = "Arjun Kapoor", nextFollowUpDate = null) => req("PATCH", `/leads/${id}/stage`, { stage, comment, nextFollowUpDate }, { "X-User-Role": role, "X-User-Name": name }),
  getLeadTimeline: (id) => req("GET", `/leads/${id}/timeline`),
  deleteLead: (id) => req("DELETE", `/leads/${id}`),

  // Channel Partners
  getPartners: () => req("GET", "/channelpartners"),
  createPartner: (data) => req("POST", "/channelpartners", data),
  updatePartner: (id, data) => req("PUT", `/channelpartners/${id}`, data),
  deletePartner: (id) => req("DELETE", `/channelpartners/${id}`),

  // Customers
  getCustomers: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req("GET", `/customers${qs ? "?" + qs : ""}`);
  },
  createCustomer: (data) => req("POST", "/customers", data),
  updateCustomer: (id, data) => req("PUT", `/customers/${id}`, data),
  deleteCustomer: (id) => req("DELETE", `/customers/${id}`),

  // Site Visits
  getVisits: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req("GET", `/sitevisits${qs ? "?" + qs : ""}`);
  },
  createVisit: (data) => req("POST", "/sitevisits", data),
  updateVisit: (id, data) => req("PUT", `/sitevisits/${id}`, data),
  updateVisitStatus: (id, status) => req("PATCH", `/sitevisits/${id}/status`, { status }),
  deleteVisit: (id) => req("DELETE", `/sitevisits/${id}`),

  // Bookings
  getBookings: () => req("GET", "/bookings"),
  createBooking: (data) => req("POST", "/bookings", data),
  updateBooking: (id, data) => req("PUT", `/bookings/${id}`, data),
  deleteBooking: (id) => req("DELETE", `/bookings/${id}`),

  // Payments
  getPayments: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req("GET", `/payments${qs ? "?" + qs : ""}`);
  },
  createPayment: (data) => req("POST", "/payments", data),

  // Commissions
  getCommissions: () => req("GET", "/commissions"),
  createCommission: (data) => req("POST", "/commissions", data),
  approveCommission: (id) => req("PATCH", `/commissions/${id}/approve`),
  payCommission: (id) => req("PATCH", `/commissions/${id}/pay`),

  // Documents
  getDocuments: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req("GET", `/documents${qs ? "?" + qs : ""}`);
  },
  createDocument: (data) => req("POST", "/documents", data),

  // Service Tickets
  getTickets: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req("GET", `/servicetickets${qs ? "?" + qs : ""}`);
  },
  createTicket: (data) => req("POST", "/servicetickets", data),
  updateTicketStatus: (id, status) => req("PATCH", `/servicetickets/${id}/status`, { status }),

  // Users
  getUsers: () => req("GET", "/users"),
  createUser: (data) => req("POST", "/users", data),
  updateUser: (id, data) => req("PUT", `/users/${id}`, data),
  deleteUser: (id) => req("DELETE", `/users/${id}`),

  // Employees
  getEmployees: () => req("GET", "/employees"),
  createEmployee: (data) => req("POST", "/employees", data),
  updateEmployee: (id, data) => req("PUT", `/employees/${id}`, data),
  deleteEmployee: (id) => req("DELETE", `/employees/${id}`),

  // Attendance
  getAttendances: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req("GET", `/attendances${qs ? "?" + qs : ""}`);
  },
  logAttendance: (data) => req("POST", "/attendances", data),
  updateAttendance: (id, data) => req("PUT", `/attendances/${id}`, data),

  // Leave Requests
  getLeaves: () => req("GET", "/leaverequests"),
  createLeave: (data) => req("POST", "/leaverequests", data),
  updateLeaveStatus: (id, status) => req("PATCH", `/leaverequests/${id}/status`, { status }),

  // Orders (OMS)
  getOrders: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req("GET", `/orders${qs ? "?" + qs : ""}`);
  },
  createOrder: (data) => req("POST", "/orders", data),
  updateOrderStatus: (id, status) => req("PATCH", `/orders/${id}/status`, { status }),
  deleteOrder: (id) => req("DELETE", `/orders/${id}`),

  // Materials
  getMaterials: () => req("GET", "/materials"),
  createMaterial: (data) => req("POST", "/materials", data),
  deleteMaterial: (id) => req("DELETE", `/materials/${id}`),
  getCategories: () => req("GET", "/materials/categories"),
  getBrands: () => req("GET", "/materials/brands"),

  // System Configs
  getSystemConfigs: () => req("GET", "/systemconfigs"),
};
