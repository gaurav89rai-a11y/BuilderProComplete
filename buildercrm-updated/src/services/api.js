const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false" || window.location.hostname.includes("github.io") || window.location.hostname.includes("localhost") === false;

// ─── HTTP REQUEST UTILITY ──────────────────────────────────────
async function req(method, path, body, customHeaders = {}) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json", ...customHeaders },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) {
    let errMsg = "";
    try {
      const errJson = await res.json();
      errMsg = errJson.message || errJson.error;
    } catch {}
    if (!errMsg) {
      errMsg = await res.text();
    }
    throw new Error(errMsg || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ─── MOCK DATABASE SYSTEM ──────────────────────────────────────
const SEED_DATA = {
  projects: [
    { id: 1, name: "Skyline Heights", location: "Bandra West, Mumbai", reraNumber: "P51900034682", status: "Active", type: "Residential", totalUnits: 240, constructionPct: 78, totalValue: 4850000000 },
    { id: 2, name: "Green Valley Township", location: "Panvel, Navi Mumbai", reraNumber: "P51900029841", status: "Active", type: "Township", totalUnits: 520, constructionPct: 52, totalValue: 6800000000 },
    { id: 3, name: "Meridian Business Park", location: "BKC, Mumbai", reraNumber: "P51900041236", status: "Nearing Handover", type: "Commercial", totalUnits: 80, constructionPct: 95, totalValue: 4200000000 },
    { id: 4, name: "Pearl Residences", location: "Thane West", reraNumber: "P51900051890", status: "Pre-launch", type: "Residential", totalUnits: 180, constructionPct: 12, totalValue: 2900000000 }
  ],
  units: [
    { id: 1, projectId: 1, unitNumber: "A-101", floor: 1, unitType: "2BHK", area: 987, price: 12500000, status: "Available", view: "Garden" },
    { id: 2, projectId: 1, unitNumber: "A-102", floor: 1, unitType: "3BHK", area: 1350, price: 17200000, status: "Sold", view: "Road" },
    { id: 3, projectId: 1, unitNumber: "B-201", floor: 2, unitType: "2BHK", area: 1010, price: 13100000, status: "Booked", view: "Pool" },
    { id: 4, projectId: 1, unitNumber: "B-202", floor: 2, unitType: "4BHK", area: 1980, price: 28500000, status: "Available", view: "Sea" },
    { id: 5, projectId: 1, unitNumber: "C-301", floor: 3, unitType: "3BHK", area: 1450, price: 18900000, status: "Held", view: "Garden" },
    { id: 6, projectId: 1, unitNumber: "C-302", floor: 3, unitType: "2BHK", area: 950, price: 12100000, status: "Sold", view: "Road" },
    { id: 7, projectId: 1, unitNumber: "D-401", floor: 4, unitType: "4BHK", area: 2100, price: 32000000, status: "Available", view: "Sea" },
    { id: 8, projectId: 1, unitNumber: "D-402", floor: 4, unitType: "3BHK", area: 1380, price: 17800000, status: "Booked", view: "City" }
  ],
  leads: [
    { id: 1, name: "Rahul Sharma", email: "rahul.s@email.com", phone: "9800000001", source: "Website", stage: "New Lead", score: 85, interest: "Skyline Heights 3BHK", assignedTo: "Priya M.", budget: 18000000, projectId: 1, createdAt: "2026-07-01T12:00:00.000Z", nextFollowUpDate: "2026-07-07T12:00:00" },
    { id: 2, name: "Anjali Patel", email: "anjali.p@email.com", phone: "9800000002", source: "Channel Partner", stage: "Contacted", score: 72, interest: "Green Valley 2BHK", assignedTo: "Amit K.", budget: 12000000, projectId: 2, createdAt: "2026-07-02T10:00:00.000Z", nextFollowUpDate: "2026-07-06T15:00:00" },
    { id: 3, name: "Suresh Kumar", email: "suresh.k@email.com", phone: "9800000003", source: "Walk-in", stage: "Site Visit Completed", score: 91, interest: "Skyline Heights 4BHK", assignedTo: "Priya M.", budget: 32000000, projectId: 1, createdAt: "2026-07-03T11:00:00.000Z", nextFollowUpDate: "2026-07-08T11:00:00" },
    { id: 4, name: "Meera Iyer", email: "meera.i@email.com", phone: "9800000004", source: "Referral", stage: "Negotiation", score: 88, interest: "Meridian Business Park", assignedTo: "Vikram S.", budget: 45000000, projectId: 3, createdAt: "2026-07-04T15:00:00.000Z", nextFollowUpDate: null },
    { id: 5, name: "Arun Mehta", email: "arun.m@email.com", phone: "9800000005", source: "Online Ad", stage: "Booking Confirmed", score: 95, interest: "Pearl Residences 3BHK", assignedTo: "Amit K.", budget: 21000000, projectId: 4, createdAt: "2026-07-05T09:00:00.000Z", nextFollowUpDate: null }
  ],
  partners: [
    { id: 1, name: "PropNest Realty", contactPerson: "Sanjay Bhatt", email: "sanjay@propnest.com", phone: "9900000001", city: "Mumbai", status: "Platinum", rating: 4.8, commissionRate: 3.0 },
    { id: 2, name: "HomeFinder Associates", contactPerson: "Rekha Nair", email: "rekha@homefinder.com", phone: "9900000002", city: "Pune", status: "Gold", rating: 4.5, commissionRate: 2.5 },
    { id: 3, name: "DreamKey Properties", contactPerson: "Farhan Khan", email: "farhan@dreamkey.com", phone: "9900000003", city: "Thane", status: "Silver", rating: 4.2, commissionRate: 2.0 }
  ],
  customers: [
    { id: 1, name: "Rajesh Verma", email: "rajesh.v@gmail.com", phone: "9700000001", unitNumber: "B-201", projectId: 1, bookingDate: "2023-08-15T00:00:00", status: "Active", totalAmount: 13100000, paidAmount: 8515000 },
    { id: 2, name: "Sunita Agarwal", email: "sunita.a@gmail.com", phone: "9700000002", unitNumber: "A-102", projectId: 1, bookingDate: "2023-06-22T00:00:00", status: "Possession Given", totalAmount: 17200000, paidAmount: 17200000 },
    { id: 3, name: "Mohan Das", email: "mohan.d@gmail.com", phone: "9700000003", unitNumber: "D-402", projectId: 1, bookingDate: "2023-10-05T00:00:00", status: "Active", totalAmount: 17800000, paidAmount: 9078000 },
    { id: 4, name: "Lakshmi Krishnan", email: "lakshmi.k@gmail.com", phone: "9700000004", unitNumber: "C-301", projectId: 1, bookingDate: "2023-09-18T00:00:00", status: "Overdue", totalAmount: 18900000, paidAmount: 7560000 }
  ],
  bookings: [
    { id: 1, bookingNumber: "BK-2026-000001", customerId: 1, unitId: 3, bookingDate: "2023-08-15T00:00:00", totalAmount: 13100000, tokenAmount: 500000, status: "Confirmed", assignedAgent: "Priya Mehta" },
    { id: 2, bookingNumber: "BK-2026-000002", customerId: 3, unitId: 8, bookingDate: "2023-10-05T00:00:00", totalAmount: 17800000, tokenAmount: 1000000, status: "Agreement Signed", assignedAgent: "Amit Kumar" }
  ],
  payments: [
    { id: 1, customerId: 1, amount: 500000, paymentDate: "2023-08-15T10:00:00", paymentMode: "NEFT", transactionRef: "TXN10008472", status: "Received" },
    { id: 2, customerId: 1, amount: 8015000, paymentDate: "2023-11-20T14:30:00", paymentMode: "RTGS", transactionRef: "TXN10029584", status: "Received" },
    { id: 3, customerId: 2, amount: 17200000, paymentDate: "2023-06-22T11:00:00", paymentMode: "Cheque", transactionRef: "CHQ584920", status: "Received" },
    { id: 4, customerId: 3, amount: 1000000, paymentDate: "2023-10-05T12:00:00", paymentMode: "NEFT", transactionRef: "TXN10018593", status: "Received" },
    { id: 5, customerId: 4, amount: 7560000, paymentDate: "2023-09-18T16:00:00", paymentMode: "RTGS", transactionRef: "TXN10014758", status: "Received" }
  ],
  commissions: [
    { id: 1, partnerId: 1, bookingId: 1, amount: 393000, rate: 3.0, status: "Payable", createdAt: "2023-08-16T12:00:00.000Z" },
    { id: 2, partnerId: 2, bookingId: 2, amount: 445000, rate: 2.5, status: "Paid", createdAt: "2023-10-06T14:00:00.000Z", paidAt: "2023-11-10T10:00:00.000Z" }
  ],
  visits: [
    { id: 1, leadId: 3, projectId: 1, visitDate: "2026-07-02T10:00:00.000Z", status: "Completed", feedback: "Strong interest, requested booking details." },
    { id: 2, leadId: 2, projectId: 2, visitDate: "2026-07-05T14:00:00.000Z", status: "Scheduled", feedback: "" }
  ],
  documents: [
    { id: 1, customerId: 1, name: "PAN Card.pdf", type: "Identity Proof", path: "/docs/pan_rajesh.pdf", uploadedAt: "2023-08-15T14:00:00" },
    { id: 2, customerId: 1, name: "Aadhar Card.pdf", type: "Address Proof", path: "/docs/aadhar_rajesh.pdf", uploadedAt: "2023-08-15T14:05:00" }
  ],
  tickets: [
    { id: 1, customerId: 1, ticketNumber: "TKT-001", subject: "Delay in milestone invoice", category: "Billing", description: "Haven't received the receipt for the last RTGS payment.", status: "Open", priority: "Medium", createdAt: "2026-07-01T10:00:00Z" },
    { id: 2, customerId: 2, ticketNumber: "TKT-002", subject: "Water leakage in balcony", category: "Maintenance", description: "Minor seepage observed near drainage pipe.", status: "Resolved", priority: "High", createdAt: "2026-06-25T11:00:00Z" }
  ],
  users: [
    { id: 1, name: "Arjun Kapoor", email: "arjun@builderpro.com", role: "Super Admin", permissions: "all" },
    { id: 2, name: "Priya Mehta", email: "priya@builderpro.com", role: "Sales Agent", permissions: "view_dashboard,manage_leads,manage_visits" },
    { id: 3, name: "Amit Kumar", email: "amit@builderpro.com", role: "Manager", permissions: "view_dashboard,manage_projects,manage_inventory,manage_leads,manage_partners,manage_customers,manage_visits,manage_bookings,manage_hrms,manage_oms" },
    { id: 4, name: "Vikram Sen", email: "vikram@builderpro.com", role: "Support Agent", permissions: "view_dashboard,manage_support" }
  ],
  employees: [
    { id: 1, employeeCode: "EMP-2026-000001", name: "Raj Patel", email: "raj@builderpro.com", phone: "9812345671", department: "HR", designation: "HR Manager", status: "Active", dateOfJoining: "2024-01-15T00:00:00", salary: 75000 },
    { id: 2, employeeCode: "EMP-2026-000002", name: "Sunil Sharma", email: "sunil@builderpro.com", phone: "9812345672", department: "Construction", designation: "Construction Supervisor", status: "Active", dateOfJoining: "2024-03-10T00:00:00", salary: 60000 },
    { id: 3, employeeCode: "EMP-2026-000003", name: "Pooja Sen", email: "pooja@builderpro.com", phone: "9812345673", department: "Sales", designation: "Sales Lead", status: "Active", dateOfJoining: "2024-02-01T00:00:00", salary: 65000 }
  ],
  attendances: [
    { id: 1, attendanceCode: "ATT-2026-000001", employeeId: 1, date: "2026-07-03", checkIn: "09:15 AM", checkOut: "06:05 PM", status: "Present" },
    { id: 2, attendanceCode: "ATT-2026-000002", employeeId: 2, date: "2026-07-03", checkIn: "08:50 AM", checkOut: "05:30 PM", status: "Present" },
    { id: 3, attendanceCode: "ATT-2026-000003", employeeId: 3, date: "2026-07-03", checkIn: "09:00 AM", checkOut: "06:00 PM", status: "Present" }
  ],
  leaves: [
    { id: 1, leaveCode: "LE-2026-000001", employeeId: 2, leaveType: "Sick", startDate: "2026-07-10", endDate: "2026-07-12", reason: "Fever", status: "Pending" },
    { id: 2, leaveCode: "LE-2026-000002", employeeId: 3, leaveType: "Casual", startDate: "2026-06-05", endDate: "2026-06-06", reason: "Family function", status: "Approved" }
  ],
  orders: [
    { id: 1, orderNumber: "PO-2026-000001", projectId: 1, vendorName: "Ultratech Cement Ltd", orderDate: "2026-06-20", deliveryDate: "2026-06-25", totalAmount: 250000, status: "Delivered", items: [{ itemName: "OPC 53 Grade Cement (bags)", quantity: 500, unitPrice: 500, totalPrice: 250000 }] },
    { id: 2, orderNumber: "PO-2026-000002", projectId: 2, vendorName: "Tata Steel Ltd", orderDate: "2026-07-01", deliveryDate: null, totalAmount: 450000, status: "Pending", items: [{ itemName: "TMT Steel Bars (tons)", quantity: 10, unitPrice: 45000, totalPrice: 450000 }] }
  ],
  materials: [
    { id: 1, name: "OPC 53 Grade Cement", category: "Cement", code: "CEM-OPC-53", brand: "Ultratech", unit: "Bags", hsn: "2523", gst: 28, reorderLevel: 100, warehouse: "Thane Main", vendor: "Ultratech Cement Ltd", status: "Active", price: 420 },
    { id: 2, name: "TMT Steel Bars 12mm", category: "Steel", code: "STL-TMT-12", brand: "Tata Tiscon", unit: "Tons", hsn: "7214", gst: 18, reorderLevel: 5, warehouse: "Panvel Site", vendor: "Tata Steel Ltd", status: "Active", price: 58000 },
    { id: 3, name: "River Sand (Fine)", category: "Aggregate", code: "AGG-SND-RV", brand: "Local", unit: "Brass", hsn: "2505", gst: 5, reorderLevel: 20, warehouse: "Panvel Site", vendor: "M/S Bajrang Traders", status: "Active", price: 6500 },
    { id: 4, name: "Standard Red Clay Bricks", category: "Bricks", code: "BRK-CLY-ST", brand: "Local", unit: "Pieces", hsn: "6901", gst: 12, reorderLevel: 5000, warehouse: "Thane Main", vendor: "M/S Bajrang Traders", status: "Active", price: 8 },
    { id: 5, name: "Premium White Primer (20L)", category: "Paint", code: "PNT-PRM-WH", brand: "Asian Paints", unit: "Cans", hsn: "3208", gst: 18, reorderLevel: 10, warehouse: "Thane Main", vendor: "Asian Paints Depot", status: "Active", price: 3400 }
  ],
  systemConfigs: [
    { id: 1, category: "ProjectStatus", value: "Pre-launch", label: "Pre-launch", color: "blue", isDefault: true, sortOrder: 1 },
    { id: 2, category: "ProjectStatus", value: "Active", label: "Active", color: "teal", isDefault: false, sortOrder: 2 },
    { id: 3, category: "ProjectStatus", value: "Nearing Handover", label: "Nearing Handover", color: "teal", isDefault: false, sortOrder: 3 },
    { id: 4, category: "ProjectStatus", value: "Completed", label: "Completed", color: "teal", isDefault: false, sortOrder: 4 },
    { id: 5, category: "ProjectType", value: "Residential", label: "Residential", isDefault: true, sortOrder: 1 },
    { id: 6, category: "ProjectType", value: "Commercial", label: "Commercial", isDefault: false, sortOrder: 2 },
    { id: 7, category: "ProjectType", value: "Township", label: "Township", isDefault: false, sortOrder: 3 },
    { id: 8, category: "PaymentMode", value: "NEFT", label: "NEFT", isDefault: true, sortOrder: 1 },
    { id: 9, category: "PaymentMode", value: "RTGS", label: "RTGS", isDefault: false, sortOrder: 2 },
    { id: 10, category: "PaymentMode", value: "Cheque", label: "Cheque", isDefault: false, sortOrder: 3 },
    { id: 11, category: "PaymentMode", value: "Cash", label: "Cash", isDefault: false, sortOrder: 4 },
    { id: 12, category: "PaymentMode", value: "UPI", label: "UPI", isDefault: false, sortOrder: 5 },
    { id: 13, category: "PaymentMode", value: "DD", label: "DD", isDefault: false, sortOrder: 6 },
    { id: 14, category: "PaymentStatus", value: "Received", label: "Received", color: "teal", isDefault: true, sortOrder: 1 },
    { id: 15, category: "PaymentStatus", value: "Pending", label: "Pending", color: "amb", isDefault: false, sortOrder: 2 },
    { id: 16, category: "PartnerStatus", value: "Platinum", label: "Platinum", color: "gold", isDefault: false, sortOrder: 1 },
    { id: 17, category: "PartnerStatus", value: "Gold", label: "Gold", color: "amb", isDefault: false, sortOrder: 2 },
    { id: 18, category: "PartnerStatus", value: "Silver", label: "Silver", color: "mute", isDefault: true, sortOrder: 3 },
    { id: 19, category: "OrderStatus", value: "Pending", label: "Pending", color: "amb", isDefault: true, sortOrder: 1 },
    { id: 20, category: "OrderStatus", value: "Shipped", label: "Shipped", color: "blue", isDefault: false, sortOrder: 2 },
    { id: 21, category: "OrderStatus", value: "Delivered", label: "Delivered", color: "teal", isDefault: false, sortOrder: 3 },
    { id: 22, category: "OrderStatus", value: "Cancelled", label: "Cancelled", color: "red", isDefault: false, sortOrder: 4 },
    { id: 23, category: "LeadStage", value: "New Lead", label: "New Lead", color: "sub", isDefault: true, sortOrder: 1 },
    { id: 24, category: "LeadStage", value: "Contacted", label: "Contacted", color: "blue", isDefault: false, sortOrder: 2 },
    { id: 25, category: "LeadStage", value: "Follow-up", label: "Follow-up", color: "amb", isDefault: false, sortOrder: 3 },
    { id: 26, category: "LeadStage", value: "Site Visit Scheduled", label: "Site Visit Scheduled", color: "blue", isDefault: false, sortOrder: 4 },
    { id: 27, category: "LeadStage", value: "Site Visit Completed", label: "Site Visit Completed", color: "teal", isDefault: false, sortOrder: 5 },
    { id: 28, category: "LeadSource", value: "Website", label: "Website", isDefault: true, sortOrder: 1 },
    { id: 29, category: "LeadSource", value: "Channel Partner", label: "Channel Partner", isDefault: false, sortOrder: 2 },
    { id: 30, category: "LeadSource", value: "Walk-in", label: "Walk-in", isDefault: false, sortOrder: 3 },
    { id: 31, category: "LeadSource", value: "Referral", label: "Referral", isDefault: false, sortOrder: 4 },
    { id: 32, category: "LeadSource", value: "Online Ad", label: "Online Ad", isDefault: false, sortOrder: 5 },
    { id: 33, category: "UnitType", value: "1BHK", label: "1BHK", isDefault: false, sortOrder: 1 },
    { id: 34, category: "UnitType", value: "2BHK", label: "2BHK", isDefault: true, sortOrder: 2 },
    { id: 35, category: "UnitType", value: "3BHK", label: "3BHK", isDefault: false, sortOrder: 3 },
    { id: 36, category: "UnitType", value: "4BHK", label: "4BHK", isDefault: false, sortOrder: 4 }
  ]
};

// Local storage helpers
function getMock(key) {
  const data = localStorage.getItem(`bp_${key}`);
  if (!data) {
    localStorage.setItem(`bp_${key}`, JSON.stringify(SEED_DATA[key]));
    return SEED_DATA[key];
  }
  return JSON.parse(data);
}

function setMock(key, data) {
  localStorage.setItem(`bp_${key}`, JSON.stringify(data));
}

// ─── CLIENT-SIDE MOCK SERVICE ──────────────────────────────────
const mockApi = {
  getDashboard: async (params = {}) => {
    const projectId = params.projectId ? parseInt(params.projectId) : null;
    const allProjects = getMock("projects");
    const allUnits = getMock("units").filter(u => !projectId || u.projectId === projectId);
    const allLeads = getMock("leads").filter(l => !projectId || l.projectId === projectId);
    const allCustomers = getMock("customers").filter(c => !projectId || c.projectId === projectId);
    const allBookings = getMock("bookings").filter(b => {
      if (!projectId) return true;
      const unit = getMock("units").find(u => u.id === b.unitId);
      return unit && unit.projectId === projectId;
    });
    const allPartners = getMock("partners");
    const allTickets = getMock("tickets");
    const allVisits = getMock("visits").filter(v => !projectId || v.projectId === projectId);
    const allCommissions = getMock("commissions");

    const totalRevenue = allCustomers.reduce((acc, c) => acc + c.paidAmount, 0);

    // Group leads by source
    const totalLeadCount = allLeads.length;
    const sourceCounts = allLeads.reduce((acc, l) => {
      const src = l.source || "Other";
      acc[src] = (acc[src] || 0) + 1;
      return acc;
    }, {});
    const leadSources = Object.keys(sourceCounts).map(name => ({
      name,
      value: totalLeadCount > 0 ? Math.round(sourceCounts[name] * 100 / totalLeadCount) : 0
    })).sort((a, b) => b.value - a.value);

    // Dynamic target and monthly revenue
    const totalValueSum = allProjects.reduce((acc, p) => acc + p.totalValue, 0);
    const monthlyTargetCr = totalValueSum / 12 / 10000000;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const monthlyRevenue = months.map((m, idx) => {
      const monthIdx = idx + 1;
      // Get sum of customer paid amount where booking date month matches
      const revVal = allCustomers.reduce((sum, c) => {
        const dateMonth = new Date(c.bookingDate).getMonth() + 1;
        return dateMonth === monthIdx ? sum + c.paidAmount : sum;
      }, 0) / 10000000;
      return {
        m,
        rev: Math.round(revVal * 10) / 10,
        tgt: Math.round((monthlyTargetCr * monthIdx / 12) * 10) / 10
      };
    });

    const selectedProject = projectId ? allProjects.find(p => p.id === projectId) : null;

    return {
      activeProjects: allProjects.filter(p => p.status === "Active").length,
      totalRevenue,
      totalUnits: allUnits.length,
      soldUnits: allUnits.filter(u => u.status === "Sold").length,
      availableUnits: allUnits.filter(u => u.status === "Available").length,
      bookedUnits: allUnits.filter(u => u.status === "Booked").length,
      activeLeads: allLeads.filter(l => l.stage !== "Booking Confirmed").length,
      totalCustomers: allCustomers.length,
      overdueCustomers: allCustomers.filter(c => c.status === "Overdue").length,
      totalPartners: allPartners.length,
      openTickets: allTickets.filter(t => t.status === "Open").length,
      totalBookings: allBookings.length,
      pendingCommissions: allCommissions.filter(c => c.status === "Payable").reduce((acc, c) => acc + c.amount, 0),
      scheduledVisits: allVisits.filter(v => v.status === "Scheduled").length,
      selectedProject,
      leadSources,
      monthlyRevenue,
      recentLeads: allLeads.slice().reverse().slice(0, 5),
      recentBookings: allBookings.slice().reverse().slice(0, 5).map(b => {
        const cust = getMock("customers").find(c => c.id === b.customerId);
        return {
          id: b.id,
          bookingNumber: b.bookingNumber,
          customerName: cust ? cust.name : "Unknown",
          totalAmount: b.totalAmount,
          status: b.status
        };
      })
    };
  },

  // Projects
  getProjects: async () => getMock("projects"),
  createProject: async (data) => {
    const list = getMock("projects");
    const newItem = { ...data, id: list.length > 0 ? Math.max(...list.map(x => x.id)) + 1 : 1 };
    list.push(newItem);
    setMock("projects", list);
    return newItem;
  },
  updateProject: async (id, data) => {
    const list = getMock("projects");
    const idx = list.findIndex(x => x.id === parseInt(id));
    if (idx === -1) throw new Error("Project not found");
    list[idx] = { ...list[idx], ...data };
    setMock("projects", list);
    return list[idx];
  },
  deleteProject: async (id) => {
    let list = getMock("projects");
    list = list.filter(x => x.id !== parseInt(id));
    setMock("projects", list);
    return null;
  },

  // Units
  getUnits: async (params = {}) => {
    let list = getMock("units");
    if (params.projectId) {
      list = list.filter(u => u.projectId === parseInt(params.projectId));
    }
    if (params.status) {
      list = list.filter(u => u.status.toLowerCase() === params.status.toLowerCase());
    }
    return list;
  },
  createUnit: async (data) => {
    const list = getMock("units");
    const newItem = { ...data, id: list.length > 0 ? Math.max(...list.map(x => x.id)) + 1 : 1 };
    list.push(newItem);
    setMock("units", list);
    return newItem;
  },
  updateUnit: async (id, data) => {
    const list = getMock("units");
    const idx = list.findIndex(x => x.id === parseInt(id));
    if (idx === -1) throw new Error("Unit not found");
    list[idx] = { ...list[idx], ...data };
    setMock("units", list);
    return list[idx];
  },
  updateUnitStatus: async (id, status) => {
    const list = getMock("units");
    const idx = list.findIndex(x => x.id === parseInt(id));
    if (idx === -1) throw new Error("Unit not found");
    list[idx].status = status;
    setMock("units", list);
    return list[idx];
  },
  deleteUnit: async (id) => {
    let list = getMock("units");
    list = list.filter(x => x.id !== parseInt(id));
    setMock("units", list);
    return null;
  },

  // Leads
  getLeads: async (params = {}) => {
    let list = getMock("leads");
    if (params.stage) {
      list = list.filter(l => l.stage === params.stage);
    }
    return list;
  },
  getLeadsKanban: async () => {
    const leads = getMock("leads");
    const stages = [
      { id: "new", title: "New Leads", stage: "New Lead", color: "text-slate-500 bg-slate-50 border-slate-100" },
      { id: "contacted", title: "Contacted", stage: "Contacted", color: "text-blue-500 bg-blue-50 border-blue-100" },
      { id: "visit_scheduled", title: "Site Visit Scheduled", stage: "Site Visit Scheduled", color: "text-amber-500 bg-amber-50 border-amber-100" },
      { id: "visit_completed", title: "Site Visit Completed", stage: "Site Visit Completed", color: "text-purple-500 bg-purple-50 border-purple-100" },
      { id: "negotiation", title: "Negotiation", stage: "Negotiation", color: "text-rose-500 bg-rose-50 border-rose-100" }
    ];
    return stages.map(st => ({
      ...st,
      leads: leads.filter(l => l.stage === st.stage)
    }));
  },
  createLead: async (data) => {
    const list = getMock("leads");
    const newItem = {
      ...data,
      id: list.length > 0 ? Math.max(...list.map(x => x.id)) + 1 : 1,
      createdAt: new Date().toISOString()
    };
    list.push(newItem);
    setMock("leads", list);
    return newItem;
  },
  updateLead: async (id, data) => {
    const list = getMock("leads");
    const idx = list.findIndex(x => x.id === parseInt(id));
    if (idx === -1) throw new Error("Lead not found");
    list[idx] = { ...list[idx], ...data };
    setMock("leads", list);
    return list[idx];
  },
  updateLeadStage: async (id, stage, comment, role = "Super Admin", name = "Arjun Kapoor", nextFollowUpDate = null) => {
    const list = getMock("leads");
    const idx = list.findIndex(x => x.id === parseInt(id));
    if (idx === -1) throw new Error("Lead not found");
    
    const prevStage = list[idx].stage;
    list[idx].stage = stage;
    if (nextFollowUpDate) list[idx].nextFollowUpDate = nextFollowUpDate;
    setMock("leads", list);

    // Append to timeline
    const timeline = getMock("visits"); // using visits as a general mock log/timeline activity mapping
    const newLog = {
      id: timeline.length > 0 ? Math.max(...timeline.map(x => x.id)) + 1 : 1,
      leadId: parseInt(id),
      projectId: list[idx].projectId || 1,
      visitDate: new Date().toISOString(),
      status: "TimelineLog",
      feedback: `Moved from ${prevStage} to ${stage}. Comment: ${comment || "None"} (By: ${name} - ${role})`
    };
    timeline.push(newLog);
    setMock("visits", timeline);

    return list[idx];
  },
  getLeadTimeline: async (id) => {
    const logs = getMock("visits").filter(v => v.leadId === parseInt(id));
    return logs.map(l => ({
      id: l.id,
      activityIcon: l.status === "TimelineLog" ? "📝" : "🚗",
      activityType: l.status === "TimelineLog" ? "Stage Update" : "Site Visit",
      timestamp: l.visitDate,
      userName: "System Agent",
      comments: l.feedback || "Site Visit activity completed."
    }));
  },
  deleteLead: async (id) => {
    let list = getMock("leads");
    list = list.filter(x => x.id !== parseInt(id));
    setMock("leads", list);
    return null;
  },

  // Channel Partners
  getPartners: async () => getMock("partners"),
  createPartner: async (data) => {
    const list = getMock("partners");
    const newItem = { ...data, id: list.length > 0 ? Math.max(...list.map(x => x.id)) + 1 : 1 };
    list.push(newItem);
    setMock("partners", list);
    return newItem;
  },
  updatePartner: async (id, data) => {
    const list = getMock("partners");
    const idx = list.findIndex(x => x.id === parseInt(id));
    if (idx === -1) throw new Error("Partner not found");
    list[idx] = { ...list[idx], ...data };
    setMock("partners", list);
    return list[idx];
  },
  deletePartner: async (id) => {
    let list = getMock("partners");
    list = list.filter(x => x.id !== parseInt(id));
    setMock("partners", list);
    return null;
  },

  // Customers
  getCustomers: async (params = {}) => {
    let list = getMock("customers");
    if (params.projectId) {
      list = list.filter(c => c.projectId === parseInt(params.projectId));
    }
    return list;
  },
  createCustomer: async (data) => {
    const list = getMock("customers");
    const newItem = { ...data, id: list.length > 0 ? Math.max(...list.map(x => x.id)) + 1 : 1 };
    list.push(newItem);
    setMock("customers", list);
    return newItem;
  },
  updateCustomer: async (id, data) => {
    const list = getMock("customers");
    const idx = list.findIndex(x => x.id === parseInt(id));
    if (idx === -1) throw new Error("Customer not found");
    list[idx] = { ...list[idx], ...data };
    setMock("customers", list);
    return list[idx];
  },
  deleteCustomer: async (id) => {
    let list = getMock("customers");
    list = list.filter(x => x.id !== parseInt(id));
    setMock("customers", list);
    return null;
  },

  // Site Visits
  getVisits: async (params = {}) => {
    let list = getMock("visits").filter(v => v.status !== "TimelineLog");
    if (params.projectId) {
      list = list.filter(v => v.projectId === parseInt(params.projectId));
    }
    return list.map(v => {
      const lead = getMock("leads").find(l => l.id === v.leadId);
      const proj = getMock("projects").find(p => p.id === v.projectId);
      return {
        ...v,
        leadName: lead ? lead.name : "Unknown Lead",
        projectName: proj ? proj.name : "Unknown Project"
      };
    });
  },
  createVisit: async (data) => {
    const list = getMock("visits");
    const newItem = { ...data, id: list.length > 0 ? Math.max(...list.map(x => x.id)) + 1 : 1 };
    list.push(newItem);
    setMock("visits", list);
    return newItem;
  },
  updateVisit: async (id, data) => {
    const list = getMock("visits");
    const idx = list.findIndex(x => x.id === parseInt(id));
    if (idx === -1) throw new Error("Visit not found");
    list[idx] = { ...list[idx], ...data };
    setMock("visits", list);
    return list[idx];
  },
  updateVisitStatus: async (id, status) => {
    const list = getMock("visits");
    const idx = list.findIndex(x => x.id === parseInt(id));
    if (idx === -1) throw new Error("Visit not found");
    list[idx].status = status;
    setMock("visits", list);
    return list[idx];
  },
  deleteVisit: async (id) => {
    let list = getMock("visits");
    list = list.filter(x => x.id !== parseInt(id));
    setMock("visits", list);
    return null;
  },

  // Bookings
  getBookings: async () => {
    const bookings = getMock("bookings");
    return bookings.map(b => {
      const cust = getMock("customers").find(c => c.id === b.customerId);
      const proj = cust ? getMock("projects").find(p => p.id === cust.projectId) : null;
      const unit = getMock("units").find(u => u.id === b.unitId);
      return {
        ...b,
        customer: cust ? { ...cust, project: proj } : null,
        unit
      };
    });
  },
  createBooking: async (data) => {
    const list = getMock("bookings");
    const nextNum = list.length + 1;
    const newItem = {
      ...data,
      id: list.length > 0 ? Math.max(...list.map(x => x.id)) + 1 : 1,
      bookingNumber: `BK-${new Date().getFullYear()}-${nextNum.toString().padStart(6, "0")}`,
      bookingDate: new Date().toISOString()
    };
    list.push(newItem);
    setMock("bookings", list);

    // Update Unit status
    const units = getMock("units");
    const uIdx = units.findIndex(u => u.id === parseInt(data.unitId));
    if (uIdx !== -1) {
      units[uIdx].status = "Booked";
      setMock("units", units);
    }

    return newItem;
  },
  updateBooking: async (id, data) => {
    const list = getMock("bookings");
    const idx = list.findIndex(x => x.id === parseInt(id));
    if (idx === -1) throw new Error("Booking not found");
    list[idx] = { ...list[idx], ...data };
    setMock("bookings", list);
    return list[idx];
  },
  deleteBooking: async (id) => {
    let list = getMock("bookings");
    list = list.filter(x => x.id !== parseInt(id));
    setMock("bookings", list);
    return null;
  },

  // Payments
  getPayments: async (params = {}) => {
    let list = getMock("payments");
    if (params.customerId) {
      list = list.filter(p => p.customerId === parseInt(params.customerId));
    }
    return list.map(p => {
      const cust = getMock("customers").find(c => c.id === p.customerId);
      return {
        ...p,
        customerName: cust ? cust.name : "Unknown Customer",
        unitNumber: cust ? cust.unitNumber : ""
      };
    });
  },
  createPayment: async (data) => {
    const list = getMock("payments");
    const newItem = {
      ...data,
      id: list.length > 0 ? Math.max(...list.map(x => x.id)) + 1 : 1,
      paymentDate: new Date().toISOString(),
      transactionRef: "TXN" + Math.floor(10000000 + Math.random() * 90000000)
    };
    list.push(newItem);
    setMock("payments", list);

    // Update Customer paid amount
    const customers = getMock("customers");
    const cIdx = customers.findIndex(c => c.id === parseInt(data.customerId));
    if (cIdx !== -1) {
      customers[cIdx].paidAmount += parseFloat(data.amount);
      if (customers[cIdx].paidAmount >= customers[cIdx].totalAmount) {
        customers[cIdx].status = "Possession Given";
      } else if (customers[cIdx].status === "Overdue" && customers[cIdx].paidAmount >= customers[cIdx].totalAmount * 0.4) {
        customers[cIdx].status = "Active";
      }
      setMock("customers", customers);
    }
    return newItem;
  },

  // Commissions
  getCommissions: async () => {
    const list = getMock("commissions");
    return list.map(c => {
      const partner = getMock("partners").find(p => p.id === c.partnerId);
      const booking = getMock("bookings").find(b => b.id === c.bookingId);
      return {
        ...c,
        partnerName: partner ? partner.name : "Unknown Partner",
        bookingNumber: booking ? booking.bookingNumber : "Unknown Booking",
        bookingAmount: booking ? booking.totalAmount : 0
      };
    });
  },
  createCommission: async (data) => {
    const list = getMock("commissions");
    const newItem = {
      ...data,
      id: list.length > 0 ? Math.max(...list.map(x => x.id)) + 1 : 1,
      createdAt: new Date().toISOString()
    };
    list.push(newItem);
    setMock("commissions", list);
    return newItem;
  },
  approveCommission: async (id) => {
    const list = getMock("commissions");
    const idx = list.findIndex(c => c.id === parseInt(id));
    if (idx === -1) throw new Error("Commission not found");
    list[idx].status = "Approved";
    setMock("commissions", list);
    return list[idx];
  },
  payCommission: async (id) => {
    const list = getMock("commissions");
    const idx = list.findIndex(c => c.id === parseInt(id));
    if (idx === -1) throw new Error("Commission not found");
    list[idx].status = "Paid";
    list[idx].paidAt = new Date().toISOString();
    setMock("commissions", list);
    return list[idx];
  },

  // Documents
  getDocuments: async (params = {}) => {
    let list = getMock("documents");
    if (params.customerId) {
      list = list.filter(d => d.customerId === parseInt(params.customerId));
    }
    return list.map(d => {
      const cust = getMock("customers").find(c => c.id === d.customerId);
      return {
        ...d,
        customerName: cust ? cust.name : "Unknown Customer"
      };
    });
  },
  createDocument: async (data) => {
    const list = getMock("documents");
    const newItem = {
      ...data,
      id: list.length > 0 ? Math.max(...list.map(x => x.id)) + 1 : 1,
      uploadedAt: new Date().toISOString()
    };
    list.push(newItem);
    setMock("documents", list);
    return newItem;
  },

  // Service Tickets
  getTickets: async (params = {}) => {
    let list = getMock("tickets");
    if (params.customerId) {
      list = list.filter(t => t.customerId === parseInt(params.customerId));
    }
    return list.map(t => {
      const cust = getMock("customers").find(c => c.id === t.customerId);
      return {
        ...t,
        customerName: cust ? cust.name : "Unknown Customer"
      };
    });
  },
  createTicket: async (data) => {
    const list = getMock("tickets");
    const newItem = {
      ...data,
      id: list.length > 0 ? Math.max(...list.map(x => x.id)) + 1 : 1,
      ticketNumber: `TKT-${(list.length + 1).toString().padStart(3, "0")}`,
      createdAt: new Date().toISOString()
    };
    list.push(newItem);
    setMock("tickets", list);
    return newItem;
  },
  updateTicketStatus: async (id, status) => {
    const list = getMock("tickets");
    const idx = list.findIndex(t => t.id === parseInt(id));
    if (idx === -1) throw new Error("Ticket not found");
    list[idx].status = status;
    setMock("tickets", list);
    return list[idx];
  },

  // Users
  getUsers: async () => getMock("users"),
  createUser: async (data) => {
    const list = getMock("users");
    const newItem = { ...data, id: list.length > 0 ? Math.max(...list.map(x => x.id)) + 1 : 1 };
    list.push(newItem);
    setMock("users", list);
    return newItem;
  },
  updateUser: async (id, data) => {
    const list = getMock("users");
    const idx = list.findIndex(u => u.id === parseInt(id));
    if (idx === -1) throw new Error("User not found");
    list[idx] = { ...list[idx], ...data };
    setMock("users", list);
    return list[idx];
  },
  deleteUser: async (id) => {
    let list = getMock("users");
    list = list.filter(u => u.id !== parseInt(id));
    setMock("users", list);
    return null;
  },

  // Employees
  getEmployees: async () => getMock("employees"),
  createEmployee: async (data) => {
    const list = getMock("employees");
    const newItem = {
      ...data,
      id: list.length > 0 ? Math.max(...list.map(x => x.id)) + 1 : 1,
      employeeCode: `EMP-${new Date().getFullYear()}-${(list.length + 1).toString().padStart(6, "0")}`
    };
    list.push(newItem);
    setMock("employees", list);
    return newItem;
  },
  updateEmployee: async (id, data) => {
    const list = getMock("employees");
    const idx = list.findIndex(e => e.id === parseInt(id));
    if (idx === -1) throw new Error("Employee not found");
    list[idx] = { ...list[idx], ...data };
    setMock("employees", list);
    return list[idx];
  },
  deleteEmployee: async (id) => {
    let list = getMock("employees");
    list = list.filter(e => e.id !== parseInt(id));
    setMock("employees", list);
    return null;
  },

  // Attendance
  getAttendances: async (params = {}) => {
    let list = getMock("attendances");
    if (params.employeeId) {
      list = list.filter(a => a.employeeId === parseInt(params.employeeId));
    }
    return list.map(a => {
      const emp = getMock("employees").find(e => e.id === a.employeeId);
      return {
        ...a,
        employeeName: emp ? emp.name : "Unknown Employee",
        employeeCode: emp ? emp.employeeCode : ""
      };
    });
  },
  logAttendance: async (data) => {
    const list = getMock("attendances");
    const newItem = {
      ...data,
      id: list.length > 0 ? Math.max(...list.map(x => x.id)) + 1 : 1,
      attendanceCode: `ATT-${new Date().getFullYear()}-${(list.length + 1).toString().padStart(6, "0")}`,
      date: new Date().toISOString().split("T")[0]
    };
    list.push(newItem);
    setMock("attendances", list);
    return newItem;
  },
  updateAttendance: async (id, data) => {
    const list = getMock("attendances");
    const idx = list.findIndex(a => a.id === parseInt(id));
    if (idx === -1) throw new Error("Attendance record not found");
    list[idx] = { ...list[idx], ...data };
    setMock("attendances", list);
    return list[idx];
  },

  // Leave Requests
  getLeaves: async () => {
    const list = getMock("leaves");
    return list.map(l => {
      const emp = getMock("employees").find(e => e.id === l.employeeId);
      return {
        ...l,
        employeeName: emp ? emp.name : "Unknown Employee",
        employeeCode: emp ? emp.employeeCode : ""
      };
    });
  },
  createLeave: async (data) => {
    const list = getMock("leaves");
    const newItem = {
      ...data,
      id: list.length > 0 ? Math.max(...list.map(x => x.id)) + 1 : 1,
      leaveCode: `LE-${new Date().getFullYear()}-${(list.length + 1).toString().padStart(6, "0")}`
    };
    list.push(newItem);
    setMock("leaves", list);
    return newItem;
  },
  updateLeaveStatus: async (id, status) => {
    const list = getMock("leaves");
    const idx = list.findIndex(l => l.id === parseInt(id));
    if (idx === -1) throw new Error("Leave request not found");
    list[idx].status = status;
    setMock("leaves", list);
    return list[idx];
  },

  // Orders (OMS)
  getOrders: async (params = {}) => {
    let list = getMock("orders");
    if (params.projectId) {
      list = list.filter(o => o.projectId === parseInt(params.projectId));
    }
    return list.map(o => {
      const proj = getMock("projects").find(p => p.id === o.projectId);
      return {
        ...o,
        projectName: proj ? proj.name : "Unknown Project"
      };
    });
  },
  createOrder: async (data) => {
    const list = getMock("orders");
    const nextNum = list.length + 1;
    const newItem = {
      ...data,
      id: list.length > 0 ? Math.max(...list.map(x => x.id)) + 1 : 1,
      orderNumber: `PO-${new Date().getFullYear()}-${nextNum.toString().padStart(6, "0")}`,
      orderDate: new Date().toISOString().split("T")[0]
    };
    list.push(newItem);
    setMock("orders", list);
    return newItem;
  },
  updateOrderStatus: async (id, status) => {
    const list = getMock("orders");
    const idx = list.findIndex(o => o.id === parseInt(id));
    if (idx === -1) throw new Error("Order not found");
    list[idx].status = status;
    if (status === "Delivered") {
      list[idx].deliveryDate = new Date().toISOString().split("T")[0];
    }
    setMock("orders", list);
    return list[idx];
  },
  deleteOrder: async (id) => {
    let list = getMock("orders");
    list = list.filter(o => o.id !== parseInt(id));
    setMock("orders", list);
    return null;
  },

  // Materials
  getMaterials: async () => getMock("materials"),
  createMaterial: async (data) => {
    const list = getMock("materials");
    const newItem = {
      ...data,
      id: list.length > 0 ? Math.max(...list.map(x => x.id)) + 1 : 1,
      status: "Active"
    };
    list.push(newItem);
    setMock("materials", list);
    return newItem;
  },
  deleteMaterial: async (id) => {
    let list = getMock("materials");
    list = list.filter(m => m.id !== parseInt(id));
    setMock("materials", list);
    return null;
  },
  getCategories: async () => {
    const mats = getMock("materials");
    const cats = [...new Set(mats.map(m => m.category))].filter(Boolean);
    return cats.map((name, idx) => ({ id: idx + 1, name, code: name.slice(0, 3).toUpperCase() }));
  },
  getBrands: async () => {
    const mats = getMock("materials");
    const brands = [...new Set(mats.map(m => m.brand))].filter(Boolean);
    return brands.map((name, idx) => ({ id: idx + 1, name, code: name.slice(0, 3).toUpperCase() }));
  },

  // System Configs
  getSystemConfigs: async () => {
    const list = getMock("systemConfigs");
    const grouped = {};
    list.forEach(c => {
      const category = c.category.charAt(0).toLowerCase() + c.category.slice(1);
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push({
        value: c.value,
        label: c.label,
        color: c.color,
        isDefault: c.isDefault
      });
    });
    return grouped;
  },
};

// ─── INTEGRATED API EXPORTS ────────────────────────────────────
export const api = USE_MOCK ? mockApi : {
  getDashboard: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req("GET", `/dashboard${qs ? "?" + qs : ""}`);
  },
  getProjects: () => req("GET", "/projects"),
  createProject: (data) => req("POST", "/projects", data),
  updateProject: (id, data) => req("PUT", `/projects/${id}`, data),
  deleteProject: (id) => req("DELETE", `/projects/${id}`),

  getUnits: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req("GET", `/units${qs ? "?" + qs : ""}`);
  },
  createUnit: (data) => req("POST", "/units", data),
  updateUnit: (id, data) => req("PUT", `/units/${id}`, data),
  updateUnitStatus: (id, status) => req("PATCH", `/units/${id}/status`, { status }),
  deleteUnit: (id) => req("DELETE", `/units/${id}`),

  getLeads: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req("GET", `/leads${qs ? "?" + qs : ""}`);
  },
  getLeadsKanban: () => req("GET", "/leads/kanban"),
  createLead: (data) => req("POST", "/leads", data),
  updateLead: (id, data) => req("PUT", `/leads/${id}`, data),
  updateLeadStage: (id, stage, comment, role = "Super Admin", name = "Arjun Kapoor", nextFollowUpDate = null) => 
    req("PATCH", `/leads/${id}/stage`, { stage, comment, nextFollowUpDate }, { "X-User-Role": role, "X-User-Name": name }),
  getLeadTimeline: (id) => req("GET", `/leads/${id}/timeline`),
  deleteLead: (id) => req("DELETE", `/leads/${id}`),

  getPartners: () => req("GET", "/channelpartners"),
  createPartner: (data) => req("POST", "/channelpartners", data),
  updatePartner: (id, data) => req("PUT", `/channelpartners/${id}`, data),
  deletePartner: (id) => req("DELETE", `/channelpartners/${id}`),

  getCustomers: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req("GET", `/customers${qs ? "?" + qs : ""}`);
  },
  createCustomer: (data) => req("POST", "/customers", data),
  updateCustomer: (id, data) => req("PUT", `/customers/${id}`, data),
  deleteCustomer: (id) => req("DELETE", `/customers/${id}`),

  getVisits: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req("GET", `/sitevisits${qs ? "?" + qs : ""}`);
  },
  createVisit: (data) => req("POST", "/sitevisits", data),
  updateVisit: (id, data) => req("PUT", `/sitevisits/${id}`, data),
  updateVisitStatus: (id, status) => req("PATCH", `/sitevisits/${id}/status`, { status }),
  deleteVisit: (id) => req("DELETE", `/sitevisits/${id}`),

  getBookings: () => req("GET", "/bookings"),
  createBooking: (data) => req("POST", "/bookings", data),
  updateBooking: (id, data) => req("PUT", `/bookings/${id}`, data),
  deleteBooking: (id) => req("DELETE", `/bookings/${id}`),

  getPayments: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req("GET", `/payments${qs ? "?" + qs : ""}`);
  },
  createPayment: (data) => req("POST", "/payments", data),

  getCommissions: () => req("GET", "/commissions"),
  createCommission: (data) => req("POST", "/commissions", data),
  approveCommission: (id) => req("PATCH", `/commissions/${id}/approve`),
  payCommission: (id) => req("PATCH", `/commissions/${id}/pay`),

  getDocuments: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req("GET", `/documents${qs ? "?" + qs : ""}`);
  },
  createDocument: (data) => req("POST", "/documents", data),

  getTickets: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req("GET", `/servicetickets${qs ? "?" + qs : ""}`);
  },
  createTicket: (data) => req("POST", "/servicetickets", data),
  updateTicketStatus: (id, status) => req("PATCH", `/servicetickets/${id}/status`, { status }),

  getUsers: () => req("GET", "/users"),
  createUser: (data) => req("POST", "/users", data),
  updateUser: (id, data) => req("PUT", `/users/${id}`, data),
  deleteUser: (id) => req("DELETE", `/users/${id}`),

  getEmployees: () => req("GET", "/employees"),
  createEmployee: (data) => req("POST", "/employees", data),
  updateEmployee: (id, data) => req("PUT", `/employees/${id}`, data),
  deleteEmployee: (id) => req("DELETE", `/employees/${id}`),

  getAttendances: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req("GET", `/attendances${qs ? "?" + qs : ""}`);
  },
  logAttendance: (data) => req("POST", "/attendances", data),
  updateAttendance: (id, data) => req("PUT", `/attendances/${id}`, data),

  getLeaves: () => req("GET", "/leaverequests"),
  createLeave: (data) => req("POST", "/leaverequests", data),
  updateLeaveStatus: (id, status) => req("PATCH", `/leaverequests/${id}/status`, { status }),

  getOrders: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req("GET", `/orders${qs ? "?" + qs : ""}`);
  },
  createOrder: (data) => req("POST", "/orders", data),
  updateOrderStatus: (id, status) => req("PATCH", `/orders/${id}/status`, { status }),
  deleteOrder: (id) => req("DELETE", `/orders/${id}`),

  getMaterials: () => req("GET", "/materials"),
  createMaterial: (data) => req("POST", "/materials", data),
  deleteMaterial: (id) => req("DELETE", `/materials/${id}`),
  getCategories: () => req("GET", "/materials/categories"),
  getBrands: () => req("GET", "/materials/brands"),

  getSystemConfigs: () => req("GET", "/systemconfigs"),
};
