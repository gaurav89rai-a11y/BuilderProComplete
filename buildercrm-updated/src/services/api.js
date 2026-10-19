let currentBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

// Helper to find alternative local port (e.g. 5000 <-> 8080)
function getAlternativeBaseUrl(url) {
  if (url.includes(":5000")) return url.replace(":5000", ":8080");
  if (url.includes(":8080")) return url.replace(":8080", ":5000");
  return null;
}

// Global connection state
let connectionState = {
  isConnected: USE_MOCK ? false : null,
  url: currentBaseUrl,
  isMock: USE_MOCK,
  error: null,
};
const connectionListeners = new Set();
function notifyConnectionChange() {
  connectionListeners.forEach(cb => {
    try { cb({ ...connectionState }); } catch (e) { console.error(e); }
  });
}

// ─── HTTP REQUEST UTILITY (WITH DYNAMIC PORT PROBING) ─────────
async function req(method, path, body, customHeaders = {}) {
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const headers = isFormData ? { ...customHeaders } : { "Content-Type": "application/json", ...customHeaders };
  try {
    const role = localStorage.getItem("current_user_role");
    const name = localStorage.getItem("current_user_name");
    const uid = localStorage.getItem("current_user_id");
    const cpId = localStorage.getItem("current_channel_partner_id");
    if (role && !headers["X-User-Role"]) headers["X-User-Role"] = role;
    if (name && !headers["X-User-Name"]) headers["X-User-Name"] = name;
    if (uid && !headers["X-User-Id"]) headers["X-User-Id"] = uid;
    if (cpId && !headers["X-Channel-Partner-Id"]) headers["X-Channel-Partner-Id"] = cpId;
  } catch {}
  const opts = {
    method,
    headers,
  };
  if (body) {
    opts.body = isFormData ? body : JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${currentBaseUrl}${path}`, opts);
  } catch (networkErr) {
    // If local fetch failed, try failover to the alternative local port (5000 vs 8080)
    const altUrl = getAlternativeBaseUrl(currentBaseUrl);
    if (altUrl) {
      try {
        res = await fetch(`${altUrl}${path}`, opts);
        // Failover worked! Update currentBaseUrl so future calls use this port directly
        console.log(`🔄 API connected via fallback port: ${altUrl}`);
        currentBaseUrl = altUrl;
        connectionState = { isConnected: true, url: currentBaseUrl, isMock: false, error: null };
        notifyConnectionChange();
      } catch (altErr) {
        connectionState = { isConnected: false, url: currentBaseUrl, isMock: true, error: networkErr.message };
        notifyConnectionChange();
        throw networkErr;
      }
    } else {
      connectionState = { isConnected: false, url: currentBaseUrl, isMock: true, error: networkErr.message };
      notifyConnectionChange();
      throw networkErr;
    }
  }

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

  // Request succeeded: mark as live connected
  if (connectionState.isConnected !== true) {
    connectionState = { isConnected: true, url: currentBaseUrl, isMock: false, error: null };
    notifyConnectionChange();
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
    { id: 1, projectId: 1, unitNumber: "A-101", floor: 1, unitType: "2BHK", area: 987, price: 12500000, status: "Booked", view: "Garden" },
    { id: 2, projectId: 1, unitNumber: "A-102", floor: 1, unitType: "3BHK", area: 1350, price: 17200000, status: "Sold", view: "Road" },
    { id: 3, projectId: 1, unitNumber: "B-201", floor: 2, unitType: "2BHK", area: 1010, price: 13100000, status: "Booked", view: "Pool" },
    { id: 4, projectId: 1, unitNumber: "B-202", floor: 2, unitType: "4BHK", area: 1980, price: 28500000, status: "Available", view: "Sea" },
    { id: 5, projectId: 1, unitNumber: "C-301", floor: 3, unitType: "3BHK", area: 1450, price: 18900000, status: "Held", view: "Garden" },
    { id: 6, projectId: 1, unitNumber: "C-302", floor: 3, unitType: "2BHK", area: 950, price: 12100000, status: "Sold", view: "Road" },
    { id: 7, projectId: 1, unitNumber: "D-401", floor: 4, unitType: "4BHK", area: 2100, price: 32000000, status: "Available", view: "Sea" },
    { id: 8, projectId: 1, unitNumber: "D-402", floor: 4, unitType: "3BHK", area: 1380, price: 17800000, status: "Booked", view: "City" },
    { id: 9, projectId: 2, unitNumber: "GV-A101", floor: 1, unitType: "2BHK", area: 850, price: 8500000, status: "Available", view: "Garden" },
    { id: 10, projectId: 2, unitNumber: "GV-A102", floor: 1, unitType: "3BHK", area: 1200, price: 12000000, status: "Available", view: "Pool" },
    { id: 11, projectId: 2, unitNumber: "GV-B201", floor: 2, unitType: "2BHK", area: 880, price: 8800000, status: "Available", view: "Clubhouse" },
    { id: 12, projectId: 2, unitNumber: "GV-C401", floor: 4, unitType: "2BHK", area: 900, price: 9000000, status: "Booked", view: "Hill" },
    { id: 13, projectId: 2, unitNumber: "GV-B202", floor: 2, unitType: "3BHK", area: 1250, price: 12500000, status: "Sold", view: "Garden" },
    { id: 14, projectId: 3, unitNumber: "MBP-101", floor: 1, unitType: "Commercial", area: 1500, price: 25000000, status: "Available", view: "Highway" },
    { id: 15, projectId: 3, unitNumber: "MBP-201", floor: 2, unitType: "Commercial", area: 2000, price: 35000000, status: "Available", view: "City" },
    { id: 16, projectId: 4, unitNumber: "PR-101", floor: 1, unitType: "2BHK", area: 800, price: 9500000, status: "Available", view: "Garden" },
    { id: 17, projectId: 4, unitNumber: "PR-201", floor: 2, unitType: "3BHK", area: 1100, price: 13500000, status: "Booked", view: "Sea" },
    { id: 18, projectId: 4, unitNumber: "PR-301", floor: 3, unitType: "3BHK", area: 1150, price: 14000000, status: "Available", view: "City" },
    { id: 19, projectId: 1, unitNumber: "A-103", floor: 1, unitType: "3BHK", area: 1500, price: 19000000, status: "Available", view: "Garden" },
    { id: 20, projectId: 1, unitNumber: "A-104", floor: 1, unitType: "2BHK", area: 1200, price: 15500000, status: "Available", view: "Pool" }
  ],
  leads: [
    { id: 1, name: "Rahul Sharma", email: "rahul.s@email.com", phone: "9800000001", source: "Website", stage: "Site Visit Scheduled", interest: "Skyline Heights 3BHK", assignedTo: "Priya Mehta", agentId: 2, budget: 18000000, projectId: 1, unitId: 1, flatNo: "A-101", createdAt: "2026-07-01T12:00:00.000Z", nextFollowUpDate: "2026-07-07T12:00:00" },
    { id: 2, name: "Anjali Patel", email: "anjali.p@email.com", phone: "9800000002", source: "Channel Partner", channelPartnerId: 1, stage: "Follow-up", interest: "Green Valley 2BHK", assignedTo: "Amit Kumar", agentId: 3, budget: 12000000, projectId: 2, unitId: 9, flatNo: "GV-A101", createdAt: "2026-07-02T10:00:00.000Z", nextFollowUpDate: "2026-07-06T15:00:00" },
    { id: 3, name: "Suresh Kumar", email: "suresh.k@email.com", phone: "9800000003", source: "Walk-in", stage: "Follow-up", interest: "Skyline Heights 4BHK", assignedTo: "Priya Mehta", agentId: 2, budget: 32000000, projectId: 1, unitId: 7, flatNo: "D-401", createdAt: "2026-07-03T11:00:00.000Z", nextFollowUpDate: "2026-07-08T11:00:00" },
    { id: 4, name: "Meera Iyer", email: "meera.i@email.com", phone: "9800000004", source: "Referral", stage: "Negotiation", interest: "Meridian Business Park", assignedTo: "Vikram Sen", agentId: 4, budget: 45000000, projectId: 3, unitId: 15, flatNo: "MBP-201", createdAt: "2026-07-04T15:00:00.000Z", nextFollowUpDate: null },
    { id: 5, name: "Arun Mehta", email: "arun.m@email.com", phone: "9800000005", source: "Online Ad", stage: "Booking Confirmed", interest: "Pearl Residences 3BHK", assignedTo: "Amit Kumar", agentId: 3, budget: 21000000, projectId: 4, unitId: 18, flatNo: "PR-301", createdAt: "2026-07-05T09:00:00.000Z", nextFollowUpDate: null },
    { id: 6, name: "Test Database Persistence Lead", email: "test.persist@builderpro.com", phone: "9000000009", source: "Website", stage: "Follow-up", interest: "Skyline Heights 2BHK", assignedTo: "Priya Mehta", agentId: 2, budget: 15000000, projectId: 1, unitId: 3, flatNo: "B-201", createdAt: "2026-07-07T14:59:48.000Z", nextFollowUpDate: null },
    { id: 7, name: "Rahul", email: "rahul@gmail.com", phone: "9090909090", source: "Channel Partner", channelPartnerId: 1, stage: "Site Visit Scheduled", interest: "Green Valley 3BHK", assignedTo: "Vinod Sharma", agentId: 5, budget: 50000000, projectId: 2, unitId: 13, flatNo: "GV-B202", createdAt: "2026-08-08T05:01:40.000Z", nextFollowUpDate: "2026-08-08T06:30:00" },
    { id: 8, name: "Verification Lead", email: "verify@builderpro.com", phone: "9876543210", source: "Website", stage: "Contacted", interest: "Skyline Heights 2BHK", assignedTo: "Unassigned", agentId: null, budget: 15000000, projectId: 1, unitId: 6, flatNo: "C-302", createdAt: "2026-08-20T04:49:51.000Z", nextFollowUpDate: null },
    { id: 9, name: "dinker", email: "gaurav89rai@gmail.com", phone: "9999999999", source: "Walk-in", stage: "Contacted", interest: "Green Valley 2BHK", assignedTo: "Vishal Verma", agentId: 6, budget: 5000000, projectId: 2, unitId: 12, flatNo: "GV-C401", createdAt: "2026-08-20T05:35:06.000Z", nextFollowUpDate: null },
    { id: 11, name: "Akash Gupta", email: "akash@gmail.com", phone: "8282828282", source: "Referral", stage: "Booking Confirmed", interest: "Skyline Heights 3BHK", assignedTo: "Vinod Sharma", agentId: 5, budget: 50000000, projectId: 1, unitId: null, flatNo: "B-502", createdAt: "2026-09-23T07:41:18.000Z", nextFollowUpDate: null }
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
    { id: 1, bookingNumber: "BK-2026-000001", customerId: 1, unitId: 3, bookingDate: "2023-08-15T00:00:00", totalAmount: 13100000, tokenAmount: 500000, status: "Confirmed", assignedAgent: "Priya Mehta", agentId: 2, agreementFileName: null },
    { id: 2, bookingNumber: "BK-2026-000002", customerId: 3, unitId: 8, bookingDate: "2023-10-05T00:00:00", totalAmount: 17800000, tokenAmount: 1000000, status: "Agreement Signed", assignedAgent: "Amit Kumar", agentId: 3, agreementFileName: "Flat_Purchase_Agreement_BK-2026-000002.pdf", agreementUploadedAt: "2023-10-06T11:00:00.000Z" },
    { id: 3, bookingNumber: "BK2026003", customerId: 1, unitId: 1, bookingDate: "2026-09-23T08:00:00", totalAmount: 13125000, tokenAmount: 250000, status: "Confirmed", assignedAgent: "Vinod Sharma", agentId: 5, agreementFileName: null },
    { id: 4, bookingNumber: "BK2026004", customerId: 4, unitId: 12, bookingDate: "2026-09-24T10:00:00", totalAmount: 9000000, tokenAmount: 200000, status: "Confirmed", assignedAgent: "Arjun Kapoor", agentId: 1, agreementFileName: null }
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
    { id: 2, name: "Priya Mehta", email: "priya@builderpro.com", role: "Sales Agent", permissions: "view_dashboard,manage_leads,manage_customers,manage_visits,manage_bookings,manage_projects,manage_inventory" },
    { id: 3, name: "Amit Kumar", email: "amit@builderpro.com", role: "Sales Manager", permissions: "view_dashboard,manage_projects,manage_inventory,manage_leads,manage_partners,manage_customers,manage_visits,manage_bookings" },
    { id: 4, name: "Vikram Sen", email: "vikram@builderpro.com", role: "Support Agent", permissions: "view_dashboard,manage_support" },
    { id: 5, name: "Vinod Sharma", email: "vinod@builderpro.com", role: "Sales Agent", permissions: "view_dashboard,manage_leads,manage_customers,manage_visits,manage_bookings,manage_projects,manage_inventory" },
    { id: 6, name: "Vishal Verma", email: "vishal@builderpro.com", role: "Sales Agent", permissions: "view_dashboard,manage_leads,manage_customers,manage_visits,manage_bookings,manage_projects,manage_inventory" },
    { id: 7, name: "Sanjay Bhatt", email: "sanjay@propnest.com", role: "Channel Partner", permissions: "view_dashboard,manage_leads,manage_customers,manage_bookings,manage_visits", channelPartnerId: 1 },
    { id: 8, name: "Rekha Nair", email: "rekha@homefinder.com", role: "Channel Partner", permissions: "view_dashboard,manage_leads,manage_customers,manage_bookings,manage_visits", channelPartnerId: 2 },
    { id: 9, name: "Rohan Gupta", email: "rohan@builderpro.com", role: "Accounts", permissions: "view_dashboard,manage_finance,manage_customers,manage_bookings" }
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
    { id: 36, category: "UnitType", value: "4BHK", label: "4BHK", isDefault: false, sortOrder: 4 },
    { id: 77, category: "UserRole", value: "Super Admin", label: "Super Admin", isDefault: false, sortOrder: 1 },
    { id: 78, category: "UserRole", value: "Sales Manager", label: "Sales Manager", isDefault: false, sortOrder: 2 },
    { id: 79, category: "UserRole", value: "Sales Agent", label: "Sales Agent", isDefault: true, sortOrder: 3 },
    { id: 80, category: "UserRole", value: "Accounts", label: "Accounts", isDefault: false, sortOrder: 4 },
    { id: 301, category: "UserRole", value: "Channel Partner", label: "Channel Partner", isDefault: false, sortOrder: 5 }
  ]
};

// Local storage versioning & helpers
const DATA_VERSION = "2.6.0_roles_permissions";

function initStorageVersion() {
  try {
    const currentVersion = localStorage.getItem("bp_data_version");
    if (currentVersion !== DATA_VERSION) {
      const keysToRemove = [
        "bp_leads", "bp_bookings", "bp_users", "bp_customers", "bp_partners", 
        "bp_payments", "bp_projects", "bp_units", "bp_visits", "bp_commissions",
        "bp_documents", "bp_tickets", "bp_employees", "bp_attendances", "bp_leaves",
        "bp_orders", "bp_materials", "bp_systemConfigs"
      ];
      keysToRemove.forEach(k => localStorage.removeItem(k));
      localStorage.setItem("bp_data_version", DATA_VERSION);
    }
  } catch (e) {
    console.warn("Storage versioning check warning:", e);
  }
}
initStorageVersion();

function getMock(key) {
  try {
    const data = localStorage.getItem(`bp_${key}`);
    if (!data) {
      if (SEED_DATA[key] !== undefined) {
        localStorage.setItem(`bp_${key}`, JSON.stringify(SEED_DATA[key]));
        return JSON.parse(JSON.stringify(SEED_DATA[key]));
      }
      return [];
    }
    return JSON.parse(data);
  } catch {
    return SEED_DATA[key] ? JSON.parse(JSON.stringify(SEED_DATA[key])) : [];
  }
}

function setMock(key, data) {
  try {
    localStorage.setItem(`bp_${key}`, JSON.stringify(data));
  } catch (e) {
    console.warn("Failed to save to localStorage:", e);
  }
}

// ─── CLIENT-SIDE MOCK SERVICE ──────────────────────────────────
const mockApi = {
  getDashboard: async (params = {}) => {
    const role = localStorage.getItem("current_user_role");
    const cpId = params.channelPartnerId || localStorage.getItem("current_channel_partner_id");
    const isChannelPartner = role === "Channel Partner" && cpId;
    const parsedCp = isChannelPartner ? parseInt(cpId) : null;

    const projectId = params.projectId ? parseInt(params.projectId) : null;
    const allProjects = getMock("projects");
    let allUnits = getMock("units").filter(u => !projectId || u.projectId === projectId);
    let allLeads = getMock("leads").filter(l => !projectId || l.projectId === projectId);
    let allCustomers = getMock("customers").filter(c => !projectId || c.projectId === projectId);
    let allBookings = getMock("bookings").filter(b => {
      if (!projectId) return true;
      const unit = getMock("units").find(u => u.id === b.unitId);
      return unit && unit.projectId === projectId;
    });

    if (isChannelPartner && parsedCp) {
      allLeads = allLeads.filter(l => l.channelPartnerId === parsedCp);
      const leadPhones = new Set(allLeads.map(l => l.phone).filter(Boolean));
      const leadEmails = new Set(allLeads.map(l => (l.email || "").toLowerCase()).filter(Boolean));
      const commList = getMock("commissions").filter(c => c.partnerId === parsedCp);
      const commBookingIds = new Set(commList.map(c => c.bookingId));
      allBookings = allBookings.filter(b => commBookingIds.has(b.id) || b.channelPartnerId === parsedCp);
      const commCustIds = new Set(allBookings.map(b => b.customerId));
      allCustomers = allCustomers.filter(c => leadPhones.has(c.phone) || leadEmails.has((c.email || "").toLowerCase()) || commCustIds.has(c.id));
      // Channel partners only access permitted booking statuses
      allBookings = allBookings.filter(b => ["Confirmed", "Agreement Pending", "Agreement Signed"].includes(b.status));
    }

    const allPartners = getMock("partners");
    const allTickets = isChannelPartner ? [] : getMock("tickets");
    const allVisits = getMock("visits").filter(v => !projectId || v.projectId === projectId);
    const allCommissions = isChannelPartner ? getMock("commissions").filter(c => c.partnerId === parsedCp) : getMock("commissions");

    const totalRevenue = allBookings.reduce((acc, b) => acc + (b.totalAmount || 0), 0);

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
      // Get sum of booking total amount where booking date month matches
      const revVal = allBookings.reduce((sum, b) => {
        if (!b.bookingDate) return sum;
        const dateMonth = new Date(b.bookingDate).getMonth() + 1;
        return dateMonth === monthIdx ? sum + (b.totalAmount || 0) : sum;
      }, 0) / 10000000;
      return {
        m,
        rev: Math.round(revVal * 10) / 10,
        tgt: Math.round((monthlyTargetCr * monthIdx / 12) * 10) / 10
      };
    });

    const selectedProject = projectId ? allProjects.find(p => p.id === projectId) : null;
    const allPayments = getMock("payments") || [];
    const totalOutstandingBalance = allCustomers.reduce((acc, c) => {
      const custPayments = allPayments.filter(p => p.customerId === c.id && (p.status === "Received" || !p.status)).reduce((s, p) => s + (p.amount || 0), 0);
      const paid = Math.max(c.paidAmount || 0, custPayments);
      return acc + Math.max(0, (c.totalAmount || 0) - paid);
    }, 0);

    return {
      activeProjects: allProjects.filter(p => p.status === "Active").length,
      totalRevenue,
      totalOutstandingBalance,
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
      const incId = params.includeUnitId ? parseInt(params.includeUnitId) : null;
      list = list.filter(u => u.status.toLowerCase() === params.status.toLowerCase() || (incId && u.id === incId));
    }
    return list.sort((a, b) => (a.unitNumber || "").localeCompare(b.unitNumber || ""));
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
    const role = localStorage.getItem("current_user_role");
    const uid = localStorage.getItem("current_user_id");
    const uname = localStorage.getItem("current_user_name");
    const cpId = params.channelPartnerId || localStorage.getItem("current_channel_partner_id");

    if (role === "Accounts" || role === "Accountant") {
      return [];
    }

    if ((role === "Channel Partner" || params.channelPartnerId) && cpId) {
      list = list.filter(l => l.channelPartnerId === parseInt(cpId));
    } else if (role === "Sales Agent") {
      list = list.filter(l => (uid && l.agentId === parseInt(uid)) || (uname && l.assignedTo === uname));
    }

    if (params.stage) {
      list = list.filter(l => l.stage === params.stage);
    }
    const projects = getMock("projects");
    const partners = getMock("partners");
    const users = getMock("users");
    const visits = getMock("visits");
    const units = getMock("units");
    return list.map(l => ({
      ...l,
      project: projects.find(p => p.id === l.projectId) || null,
      channelPartner: l.channelPartnerId ? (partners.find(p => p.id === l.channelPartnerId) || null) : null,
      agent: l.agentId ? (users.find(u => u.id === l.agentId) || null) : null,
      siteVisits: visits.filter(v => v.leadId === l.id) || [],
      unit: l.unitId ? (units.find(u => u.id === l.unitId) || null) : (l.flatNo ? (units.find(u => u.unitNumber === l.flatNo && (!l.projectId || u.projectId === l.projectId)) || null) : null)
    }));
  },
  getLeadsKanban: async (params = {}) => {
    let rawLeads = getMock("leads");
    const role = localStorage.getItem("current_user_role");
    const uid = localStorage.getItem("current_user_id");
    const uname = localStorage.getItem("current_user_name");
    const cpId = params?.channelPartnerId || localStorage.getItem("current_channel_partner_id");

    if (role === "Accounts" || role === "Accountant") {
      return {};
    }

    if ((role === "Channel Partner" || params?.channelPartnerId) && cpId) {
      rawLeads = rawLeads.filter(l => l.channelPartnerId === parseInt(cpId));
    } else if (role === "Sales Agent") {
      rawLeads = rawLeads.filter(l => (uid && l.agentId === parseInt(uid)) || (uname && l.assignedTo === uname));
    }

    const projects = getMock("projects");
    const partners = getMock("partners");
    const users = getMock("users");
    const visits = getMock("visits");
    const units = getMock("units");

    const enrichedLeads = rawLeads.map(l => ({
      ...l,
      project: projects.find(p => p.id === l.projectId) || null,
      channelPartner: l.channelPartnerId ? (partners.find(p => p.id === l.channelPartnerId) || null) : null,
      agent: l.agentId ? (users.find(u => u.id === l.agentId) || null) : null,
      siteVisits: visits.filter(v => v.leadId === l.id) || [],
      unit: l.unitId ? (units.find(u => u.id === l.unitId) || null) : (l.flatNo ? (units.find(u => u.unitNumber === l.flatNo && (!l.projectId || u.projectId === l.projectId)) || null) : null)
    }));

    const stages = [
      "New Lead", "Contacted", "Follow-up", "Site Visit Scheduled", "Site Visit Completed",
      "Quotation Sent", "Negotiation", "Booking Token Received", "Booking Confirmed",
      "Documentation", "Agreement Signed", "Home Loan Processing", "Registration",
      "Closed Won", "Closed Lost"
    ];

    const kanban = {};
    stages.forEach(st => {
      kanban[st] = enrichedLeads.filter(l => l.stage === st);
    });

    return kanban;
  },
  createLead: async (data) => {
    const list = getMock("leads");
    const users = getMock("users");
    const units = getMock("units");
    let assignedTo = data.assignedTo || "";
    let agentId = data.agentId ? parseInt(data.agentId) : null;
    if (agentId && !assignedTo) {
      const u = users.find(x => x.id === agentId);
      if (u) assignedTo = u.name;
    } else if (assignedTo && !agentId) {
      const u = users.find(x => x.name.toLowerCase() === assignedTo.toLowerCase());
      if (u) agentId = u.id;
    }

    let unitId = data.unitId ? parseInt(data.unitId) : (data.flatId ? parseInt(data.flatId) : null);
    let flatNo = data.flatNo || "";
    if (unitId) {
      const u = units.find(x => x.id === unitId);
      if (u) {
        flatNo = u.unitNumber;
        if (u.status === "Sold" || u.status === "Booked") {
          throw new Error(`Flat ${u.unitNumber} is no longer available. Please select another flat.`);
        }
      }
    }

    const role = localStorage.getItem("current_user_role");
    const storedCpId = localStorage.getItem("current_channel_partner_id");
    let channelPartnerId = data.channelPartnerId ? parseInt(data.channelPartnerId) : null;
    let source = data.source || "";
    if (role === "Channel Partner" && storedCpId) {
      channelPartnerId = parseInt(storedCpId);
      source = "Channel Partner";
    }

    const newItem = {
      ...data,
      id: list.length > 0 ? Math.max(...list.map(x => x.id)) + 1 : 1,
      source: source || data.source,
      assignedTo,
      agentId,
      unitId,
      flatNo,
      channelPartnerId,
      projectId: data.projectId ? parseInt(data.projectId) : null,
      budget: parseFloat(data.budget || 0),
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
    const users = getMock("users");
    const units = getMock("units");
    let assignedTo = data.assignedTo !== undefined ? data.assignedTo : list[idx].assignedTo;
    let agentId = data.agentId !== undefined ? (data.agentId ? parseInt(data.agentId) : null) : list[idx].agentId;
    if (agentId && !assignedTo) {
      const u = users.find(x => x.id === agentId);
      if (u) assignedTo = u.name;
    } else if (assignedTo && !agentId) {
      const u = users.find(x => x.name.toLowerCase() === assignedTo.toLowerCase());
      if (u) agentId = u.id;
    }

    let unitId = data.unitId !== undefined ? (data.unitId ? parseInt(data.unitId) : null) : list[idx].unitId;
    let flatNo = data.flatNo !== undefined ? data.flatNo : list[idx].flatNo;
    if (unitId && unitId !== list[idx].unitId) {
      const u = units.find(x => x.id === unitId);
      if (u) {
        flatNo = u.unitNumber;
        if (u.status === "Sold" || u.status === "Booked") {
          throw new Error(`Flat ${u.unitNumber} is no longer available. Please select another flat.`);
        }
      }
    } else if (unitId) {
      const u = units.find(x => x.id === unitId);
      if (u) flatNo = u.unitNumber;
    }

    list[idx] = { 
      ...list[idx], 
      ...data,
      assignedTo,
      agentId,
      unitId,
      flatNo,
      channelPartnerId: data.channelPartnerId !== undefined ? (data.channelPartnerId ? parseInt(data.channelPartnerId) : null) : list[idx].channelPartnerId,
      projectId: data.projectId !== undefined ? (data.projectId ? parseInt(data.projectId) : null) : list[idx].projectId,
      budget: data.budget !== undefined ? parseFloat(data.budget || 0) : list[idx].budget
    };
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
      icon: l.status === "TimelineLog" ? "📝" : "🚗",
      activity: l.status === "TimelineLog" ? "Stage Update" : "Site Visit",
      dateTime: l.visitDate,
      performedBy: l.agent || "Sales Agent",
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
    const role = localStorage.getItem("current_user_role");
    const uid = localStorage.getItem("current_user_id");
    const uname = localStorage.getItem("current_user_name");
    const cpId = params.channelPartnerId || localStorage.getItem("current_channel_partner_id");
    if ((role === "Channel Partner" || params.channelPartnerId) && cpId) {
      const parsedCp = parseInt(cpId);
      const leads = getMock("leads").filter(l => l.channelPartnerId === parsedCp);
      const leadPhones = new Set(leads.map(l => l.phone).filter(Boolean));
      const leadEmails = new Set(leads.map(l => (l.email || "").toLowerCase()).filter(Boolean));
      const commissions = getMock("commissions").filter(c => c.partnerId === parsedCp);
      const commBookingIds = new Set(commissions.map(c => c.bookingId));
      const bookings = getMock("bookings").filter(b => commBookingIds.has(b.id));
      const commCustIds = new Set(bookings.map(b => b.customerId));
      list = list.filter(c => leadPhones.has(c.phone) || leadEmails.has((c.email || "").toLowerCase()) || commCustIds.has(c.id));
    } else if (role === "Sales Agent") {
      const leads = getMock("leads").filter(l => (uid && l.agentId === parseInt(uid)) || (uname && l.assignedTo === uname));
      const leadPhones = new Set(leads.map(l => l.phone).filter(Boolean));
      const leadEmails = new Set(leads.map(l => (l.email || "").toLowerCase()).filter(Boolean));
      const bookings = getMock("bookings").filter(b => (uid && b.agentId === parseInt(uid)) || (uname && b.assignedAgent === uname));
      const bookingCustIds = new Set(bookings.map(b => b.customerId));
      list = list.filter(c => leadPhones.has(c.phone) || leadEmails.has((c.email || "").toLowerCase()) || bookingCustIds.has(c.id));
    }
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
    const role = localStorage.getItem("current_user_role");
    if (role === "Channel Partner" || role === "Sales Agent" || role === "Accounts" || role === "Accountant") {
      throw new Error(`${role}s are not authorized to delete customers.`);
    }
    let list = getMock("customers");
    list = list.filter(x => x.id !== parseInt(id));
    setMock("customers", list);
    return null;
  },

  // Site Visits
  getVisits: async (params = {}) => {
    let list = getMock("visits").filter(v => v.status !== "TimelineLog");
    const role = localStorage.getItem("current_user_role");
    const uid = localStorage.getItem("current_user_id");
    const uname = localStorage.getItem("current_user_name");

    if (role === "Accounts" || role === "Accountant") {
      return [];
    }

    if (role === "Sales Agent") {
      const leads = getMock("leads").filter(l => (uid && l.agentId === parseInt(uid)) || (uname && l.assignedTo === uname));
      const leadIds = new Set(leads.map(l => l.id));
      list = list.filter(v => (uid && v.agentId === parseInt(uid)) || (uname && v.assignedAgent === uname) || leadIds.has(v.leadId));
    }
    if (params.projectId) {
      list = list.filter(v => v.projectId === parseInt(params.projectId));
    }
    const leads = getMock("leads");
    const projs = getMock("projects");
    const users = getMock("users");
    return list.map(v => {
      const lead = leads.find(l => l.id === v.leadId);
      const proj = projs.find(p => p.id === v.projectId);
      const agent = v.agentId ? (users.find(u => u.id === v.agentId) || null) : null;
      return {
        ...v,
        leadName: lead ? lead.name : "Unknown Lead",
        projectName: proj ? proj.name : "Unknown Project",
        agent: agent || null
      };
    });
  },
  createVisit: async (data) => {
    const list = getMock("visits");
    const users = getMock("users");
    let assignedAgent = data.assignedAgent || "";
    let agentId = data.agentId ? parseInt(data.agentId) : null;
    if (agentId && !assignedAgent) {
      const u = users.find(x => x.id === agentId);
      if (u) assignedAgent = u.name;
    } else if (assignedAgent && !agentId) {
      const u = users.find(x => x.name.toLowerCase() === assignedAgent.toLowerCase());
      if (u) agentId = u.id;
    }
    const newItem = {
      ...data,
      id: list.length > 0 ? Math.max(...list.map(x => x.id)) + 1 : 1,
      assignedAgent,
      agentId
    };
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
    const role = localStorage.getItem("current_user_role");
    if (role === "Channel Partner" || role === "Sales Agent" || role === "Accounts" || role === "Accountant") {
      throw new Error(`${role}s are not authorized to delete site visits.`);
    }
    let list = getMock("visits");
    list = list.filter(x => x.id !== parseInt(id));
    setMock("visits", list);
    return null;
  },

  // Bookings
  getBookings: async (params = {}) => {
    let bookings = getMock("bookings");
    const permittedStatuses = ["Confirmed", "Agreement Pending", "Agreement Signed"];
    const role = localStorage.getItem("current_user_role");
    const uid = localStorage.getItem("current_user_id");
    const uname = localStorage.getItem("current_user_name");
    const cpId = params?.channelPartnerId || localStorage.getItem("current_channel_partner_id");
    if ((role === "Channel Partner" || params?.channelPartnerId) && cpId) {
      const parsedCp = parseInt(cpId);
      const leads = getMock("leads").filter(l => l.channelPartnerId === parsedCp);
      const leadPhones = new Set(leads.map(l => l.phone).filter(Boolean));
      const leadEmails = new Set(leads.map(l => (l.email || "").toLowerCase()).filter(Boolean));
      const commissions = getMock("commissions").filter(c => c.partnerId === parsedCp);
      const commBookingIds = new Set(commissions.map(c => c.bookingId));
      const allCustomers = getMock("customers");
      bookings = bookings.filter(b => {
        if (!permittedStatuses.includes(b.status)) return false;
        if (commBookingIds.has(b.id)) return true;
        const cust = allCustomers.find(c => c.id === b.customerId);
        if (cust && (leadPhones.has(cust.phone) || leadEmails.has((cust.email || "").toLowerCase()))) return true;
        return false;
      });
    } else if (role === "Sales Agent") {
      bookings = bookings.filter(b => (uid && b.agentId === parseInt(uid)) || (uname && b.assignedAgent === uname));
    }
    const users = getMock("users");
    return bookings.map(b => {
      const cust = getMock("customers").find(c => c.id === b.customerId);
      const proj = cust ? getMock("projects").find(p => p.id === cust.projectId) : null;
      const unit = getMock("units").find(u => u.id === b.unitId);
      const agent = b.agentId ? (users.find(u => u.id === b.agentId) || null) : null;
      return {
        ...b,
        customer: cust ? { ...cust, project: proj } : null,
        unit,
        agent: agent || null
      };
    });
  },
  createBooking: async (data) => {
    const list = getMock("bookings");
    const users = getMock("users");
    const nextNum = list.length + 1;
    let assignedAgent = data.assignedAgent || "";
    let agentId = data.agentId ? parseInt(data.agentId) : null;
    if (agentId && !assignedAgent) {
      const u = users.find(x => x.id === agentId);
      if (u) assignedAgent = u.name;
    } else if (assignedAgent && !agentId) {
      const u = users.find(x => x.name.toLowerCase() === assignedAgent.toLowerCase());
      if (u) agentId = u.id;
    }
    const newItem = {
      ...data,
      id: list.length > 0 ? Math.max(...list.map(x => x.id)) + 1 : 1,
      bookingNumber: `BK-${new Date().getFullYear()}-${nextNum.toString().padStart(6, "0")}`,
      bookingDate: data.bookingDate || new Date().toISOString(),
      assignedAgent,
      agentId,
      customerId: parseInt(data.customerId),
      unitId: parseInt(data.unitId),
      totalAmount: parseFloat(data.totalAmount || 0),
      tokenAmount: parseFloat(data.tokenAmount || 0),
      status: data.status || "Confirmed"
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

    const role = localStorage.getItem("current_user_role");
    if (role === "Channel Partner") {
      const permittedStatuses = ["Confirmed", "Agreement Pending", "Agreement Signed"];
      if (data.status && !permittedStatuses.includes(data.status)) {
        throw new Error("Channel Partners are only permitted to update to statuses: Confirmed, Agreement Pending, Agreement Signed.");
      }
    }

    list[idx] = { ...list[idx], ...data };
    setMock("bookings", list);
    return list[idx];
  },
  deleteBooking: async (id) => {
    const role = localStorage.getItem("current_user_role");
    if (role === "Channel Partner" || role === "Sales Agent" || role === "Accounts" || role === "Accountant") {
      throw new Error(`${role}s are not authorized to delete bookings.`);
    }
    let list = getMock("bookings");
    list = list.filter(x => x.id !== parseInt(id));
    setMock("bookings", list);
    return null;
  },
  downloadBookingAgreement: async (id, bookingNumber = "Agreement") => {
    const b = getMock("bookings").find(x => x.id === parseInt(id));
    const cust = b ? getMock("customers").find(c => c.id === b.customerId) : null;
    const dummyContent = `ABHAY BUILDCON ERP - ALLOTMENT AGREEMENT\n\nBooking: ${bookingNumber}\nCustomer: ${cust ? cust.name : "N/A"}\nStatus: Confirmed\nDate: ${new Date().toLocaleDateString()}\n`;
    const blob = new Blob([dummyContent], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Agreement_${bookingNumber}.txt`;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      window.URL.revokeObjectURL(url);
    }, 2000);
    return true;
  },
  uploadBookingAgreement: async (id, file) => {
    const list = getMock("bookings");
    const idx = list.findIndex(x => x.id === parseInt(id));
    if (idx === -1) throw new Error("Booking not found");
    list[idx].agreementFileName = file.name;
    list[idx].agreementPath = `/mock/agreements/${file.name}`;
    list[idx].agreementUploadedAt = new Date().toISOString();
    list[idx].status = "Agreement Signed";
    setMock("bookings", list);
    return {
      message: "Agreement uploaded successfully",
      fileName: file.name,
      uploadedAt: list[idx].agreementUploadedAt,
      status: list[idx].status
    };
  },
  deleteBookingAgreement: async (id) => {
    const list = getMock("bookings");
    const idx = list.findIndex(x => x.id === parseInt(id));
    if (idx !== -1) {
      delete list[idx].agreementFileName;
      delete list[idx].agreementPath;
      delete list[idx].agreementUploadedAt;
      setMock("bookings", list);
    }
    return { message: "Uploaded agreement removed successfully." };
  },

  // Payments
  getPayments: async (params = {}) => {
    const role = localStorage.getItem("current_user_role");
    if (role === "Channel Partner") {
      return [];
    }
    let list = getMock("payments");
    if (params.customerId) {
      list = list.filter(p => p.customerId === parseInt(params.customerId));
    }
    const bookings = getMock("bookings");
    return list.map(p => {
      const cust = getMock("customers").find(c => c.id === p.customerId);
      const b = bookings.find(x => x.id === p.bookingId || x.customerId === p.customerId);
      return {
        ...p,
        customer: cust || null,
        booking: b || null,
        customerName: cust ? cust.name : "Unknown Customer",
        unitNumber: cust ? cust.unitNumber : ""
      };
    });
  },
  createPayment: async (data) => {
    const role = localStorage.getItem("current_user_role");
    if (role === "Channel Partner" || role === "Sales Agent") {
      throw new Error("You are not authorized to record payments.");
    }
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
  deletePayment: async (id) => {
    const role = localStorage.getItem("current_user_role");
    if (role === "Channel Partner" || role === "Sales Agent") {
      throw new Error("You are not authorized to delete payments.");
    }
    let list = getMock("payments");
    list = list.filter(x => x.id !== parseInt(id));
    setMock("payments", list);
    return null;
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

  // Roles & Permissions Mock
  getRoles: async () => [
    { id: 1, name: "Super Admin", description: "Full system administrative access", isSystemRole: true, userCount: 1, permissionCount: 119 },
    { id: 2, name: "Sales Manager", description: "Manages sales teams, leads, pipeline, approvals and bookings", isSystemRole: true, userCount: 1, permissionCount: 42 },
    { id: 3, name: "Sales Agent", description: "Direct customer interaction, site visits, lead follow-ups and bookings", isSystemRole: true, userCount: 2, permissionCount: 28 },
    { id: 4, name: "Accounts", description: "Financial management, payment receipts, ledgers and commission disbursements", isSystemRole: true, userCount: 1, permissionCount: 25 },
    { id: 5, name: "Channel Partner", description: "External broker portal access for client submissions and commission tracking", isSystemRole: true, userCount: 1, permissionCount: 15 }
  ],
  getRole: async (id) => {
    const roles = await mockApi.getRoles();
    return roles.find(r => r.id === parseInt(id));
  },
  createRole: async (data) => ({ id: Date.now(), ...data, isSystemRole: false, userCount: 0, permissionCount: 0 }),
  updateRole: async (id, data) => ({ id: parseInt(id), ...data }),
  deleteRole: async (id) => true,

  getPermissionsMatrix: async () => ({
    totalPermissions: 119,
    modules: [
      {
        module: "CRM",
        submenus: [
          {
            submenu: "Leads",
            permissions: [
              { id: 1, code: "crm.leads.view", action: "View", name: "View Leads", description: "View leads and pipeline data", isSensitive: false },
              { id: 2, code: "crm.leads.create", action: "Create", name: "Create Leads", description: "Add new sales leads into CRM", isSensitive: false },
              { id: 3, code: "crm.leads.edit", action: "Edit", name: "Edit Leads", description: "Update lead details, notes and call history", isSensitive: false },
              { id: 4, code: "crm.leads.delete", action: "Delete", name: "Delete Leads", description: "Permanently delete leads", isSensitive: true },
              { id: 5, code: "crm.leads.search_filter", action: "Search / Filter", name: "Search & Filter Leads", description: "Filter leads by project, budget, stage", isSensitive: false },
              { id: 6, code: "crm.leads.assign_reassign", action: "Assign / Reassign", name: "Assign & Reassign Leads", description: "Transfer lead ownership to sales agents", isSensitive: false },
              { id: 7, code: "crm.leads.change_status", action: "Change Status", name: "Change Lead Stage", description: "Transition lead through pipeline stages", isSensitive: false },
              { id: 8, code: "crm.leads.import_export", action: "Import / Export", name: "Import & Export Leads", description: "Bulk CSV export/import of leads", isSensitive: false },
              { id: 9, code: "crm.leads.upload_download", action: "Upload / Download", name: "Upload & Download Lead Files", description: "Attach KYC and documents to leads", isSensitive: false },
              { id: 10, code: "crm.leads.view_sensitive_data", action: "View Sensitive Data", name: "View Sensitive Lead Data", description: "View client PAN, budget, confidential notes", isSensitive: true }
            ]
          },
          {
            submenu: "Bookings",
            permissions: [
              { id: 11, code: "crm.bookings.view", action: "View", name: "View Bookings", description: "View active customer flat bookings and registry", isSensitive: false },
              { id: 12, code: "crm.bookings.create", action: "Create", name: "Create Booking", description: "Create new unit flat bookings", isSensitive: false },
              { id: 13, code: "crm.bookings.edit", action: "Edit", name: "Edit Booking", description: "Modify booking pricing, terms, agent assignments", isSensitive: false },
              { id: 14, code: "crm.bookings.delete", action: "Delete", name: "Cancel & Delete Booking", description: "Revoke or cancel bookings", isSensitive: true },
              { id: 15, code: "crm.bookings.search_filter", action: "Search / Filter", name: "Search Bookings", description: "Search bookings by unit, buyer, project", isSensitive: false },
              { id: 16, code: "crm.bookings.approve_reject", action: "Approve / Reject", name: "Approve & Confirm Booking", description: "Approve booking discounts and confirmation", isSensitive: false },
              { id: 17, code: "crm.bookings.change_status", action: "Change Status", name: "Change Booking Status", description: "Transition booking status", isSensitive: false },
              { id: 18, code: "crm.bookings.print", action: "Print", name: "Print Booking Agreement", description: "Generate formal PDF booking agreements", isSensitive: false },
              { id: 19, code: "crm.bookings.upload_download", action: "Upload / Download", name: "Upload Signed Agreement", description: "Upload client-signed agreement copies", isSensitive: false },
              { id: 20, code: "crm.bookings.view_sensitive_data", action: "View Sensitive Data", name: "View Sensitive Financial Data", description: "Access discount overrides and customer PAN details", isSensitive: true }
            ]
          },
          {
            submenu: "Customers",
            permissions: [
              { id: 21, code: "crm.customers.view", action: "View", name: "View Customers", description: "Access master customer list and buyer ledger", isSensitive: false },
              { id: 22, code: "crm.customers.create", action: "Create", name: "Create Customer", description: "Register new customer profiles", isSensitive: false },
              { id: 23, code: "crm.customers.edit", action: "Edit", name: "Edit Customer", description: "Update customer contact, KYC, and details", isSensitive: false },
              { id: 24, code: "crm.customers.delete", action: "Delete", name: "Delete Customer", description: "Purge customer profile records", isSensitive: true },
              { id: 25, code: "crm.customers.search_filter", action: "Search / Filter", name: "Search Customers", description: "Query customer registry by name, project, unit", isSensitive: false },
              { id: 26, code: "crm.customers.import_export", action: "Import / Export", name: "Export Customer Directory", description: "Download CSV customer roster", isSensitive: false },
              { id: 27, code: "crm.customers.view_sensitive_data", action: "View Sensitive Data", name: "View Customer Financials", description: "View sensitive Aadhaar, PAN, and payment totals", isSensitive: true }
            ]
          },
          {
            submenu: "Site Visits",
            permissions: [
              { id: 28, code: "crm.site_visits.view", action: "View", name: "View Site Visits", description: "View schedule of client property visits", isSensitive: false },
              { id: 29, code: "crm.site_visits.create", action: "Create", name: "Schedule Site Visit", description: "Book new project site visit for lead", isSensitive: false },
              { id: 30, code: "crm.site_visits.edit", action: "Edit", name: "Edit Site Visit", description: "Reschedule or update visit details", isSensitive: false },
              { id: 31, code: "crm.site_visits.delete", action: "Delete", name: "Cancel Site Visit", description: "Cancel scheduled property tour", isSensitive: false },
              { id: 32, code: "crm.site_visits.change_status", action: "Change Status", name: "Mark Visit Outcome", description: "Record Completed / No-Show / Follow-Up status", isSensitive: false }
            ]
          },
          {
            submenu: "Channel Partners",
            permissions: [
              { id: 33, code: "crm.channel_partners.view", action: "View", name: "View Channel Partners", description: "Access broker network directory", isSensitive: false },
              { id: 34, code: "crm.channel_partners.create", action: "Create", name: "Onboard Partner", description: "Register new broker firm or agent", isSensitive: false },
              { id: 35, code: "crm.channel_partners.edit", action: "Edit", name: "Edit Partner Details", description: "Update RERA number, tier, contacts", isSensitive: false },
              { id: 36, code: "crm.channel_partners.delete", action: "Delete", name: "Delete Partner", description: "De-register channel partner firm", isSensitive: true },
              { id: 37, code: "crm.channel_partners.approve_reject", action: "Approve / Reject", name: "Approve Partner Registration", description: "Authorize broker KYC and agreement", isSensitive: false },
              { id: 38, code: "crm.channel_partners.change_status", action: "Change Status", name: "Change Tier / Status", description: "Promote or demote tier (Silver/Gold/Platinum)", isSensitive: false },
              { id: 39, code: "crm.channel_partners.view_sensitive_data", action: "View Sensitive Data", name: "View Contracted Commission Rate", description: "Inspect broker negotiated commission percentages", isSensitive: true }
            ]
          }
        ]
      },
      {
        module: "Finance",
        submenus: [
          {
            submenu: "Receipts & Payments",
            permissions: [
              { id: 40, code: "finance.receipts.view", action: "View", name: "View Payment Receipts", description: "Inspect realized payment collections", isSensitive: false },
              { id: 41, code: "finance.receipts.create", action: "Create", name: "Record Payment", description: "Issue authorized transaction receipt", isSensitive: false },
              { id: 42, code: "finance.receipts.edit", action: "Edit", name: "Edit Payment Record", description: "Update instrument or reference number", isSensitive: false },
              { id: 43, code: "finance.receipts.delete", action: "Delete", name: "Void Payment Receipt", description: "Nullify or void bounced cheque receipt", isSensitive: true },
              { id: 44, code: "finance.receipts.approve_reject", action: "Approve / Reject", name: "Clear / Approve Payment", description: "Bank realization sign-off", isSensitive: false },
              { id: 45, code: "finance.receipts.print", action: "Print", name: "Print Payment Receipt", description: "Download stamped official payment receipt PDF", isSensitive: false },
              { id: 46, code: "finance.receipts.view_sensitive_data", action: "View Sensitive Data", name: "View Bank Account Details", description: "Inspect builder escrow accounts and payment refs", isSensitive: true }
            ]
          },
          {
            submenu: "Invoices",
            permissions: [
              { id: 47, code: "finance.invoices.view", action: "View", name: "View Invoices", description: "Access demand letters and installment bills", isSensitive: false },
              { id: 48, code: "finance.invoices.create", action: "Create", name: "Generate Demand Notice", description: "Issue construction milestone invoice", isSensitive: false },
              { id: 49, code: "finance.invoices.edit", action: "Edit", name: "Modify Demand Notice", description: "Adjust late fee interest or milestone dues", isSensitive: false },
              { id: 50, code: "finance.invoices.delete", action: "Delete", name: "Cancel Invoice", description: "Revoke milestone demand bill", isSensitive: true },
              { id: 51, code: "finance.invoices.print", action: "Print", name: "Print Demand Invoice", description: "Download printable PDF demand letter", isSensitive: false }
            ]
          },
          {
            submenu: "Commission Management",
            permissions: [
              { id: 52, code: "finance.commissions.view", action: "View", name: "View Broker Commissions", description: "Track partner commission liabilities", isSensitive: false },
              { id: 53, code: "finance.commissions.create", action: "Create", name: "Calculate Commission", description: "Compute commission on booking milestone", isSensitive: false },
              { id: 54, code: "finance.commissions.edit", action: "Edit", name: "Adjust Commission", description: "Update payout calculation or TDS deductions", isSensitive: false },
              { id: 55, code: "finance.commissions.approve_reject", action: "Approve / Reject", name: "Approve Commission Payout", description: "Authorize broker commission disbursement", isSensitive: false },
              { id: 56, code: "finance.commissions.submit_cancel", action: "Submit / Cancel", name: "Process Payout Disbursement", description: "Release NEFT/Cheque commission payment", isSensitive: true }
            ]
          }
        ]
      },
      {
        module: "Administration",
        submenus: [
          {
            submenu: "User Management",
            permissions: [
              { id: 57, code: "administration.user_management.view", action: "View", name: "View Users", description: "View internal CRM staff and broker accounts", isSensitive: false },
              { id: 58, code: "administration.user_management.create", action: "Create", name: "Create User", description: "Create login account for sales, accounts, agents", isSensitive: false },
              { id: 59, code: "administration.user_management.edit", action: "Edit", name: "Edit User", description: "Modify user profile, role, and channel partner association", isSensitive: false },
              { id: 60, code: "administration.user_management.delete", action: "Delete", name: "Delete User", description: "Permanently delete CRM user profile", isSensitive: true },
              { id: 61, code: "administration.user_management.activate_deactivate", action: "Activate / Deactivate", name: "Deactivate User", description: "Suspend account login access", isSensitive: true }
            ]
          },
          {
            submenu: "Role Management",
            permissions: [
              { id: 62, code: "administration.role_management.view", action: "View", name: "View Roles", description: "Inspect defined security tiers", isSensitive: false },
              { id: 63, code: "administration.role_management.create", action: "Create", name: "Create Role", description: "Define custom organizational role", isSensitive: false },
              { id: 64, code: "administration.role_management.edit", action: "Edit", name: "Edit Role", description: "Update role description and attributes", isSensitive: false },
              { id: 65, code: "administration.role_management.delete", action: "Delete", name: "Delete Role", description: "Remove custom security role", isSensitive: true }
            ]
          },
          {
            submenu: "Permission Management",
            permissions: [
              { id: 66, code: "administration.permissions.view", action: "View", name: "View Matrix", description: "Inspect 119 granular action permissions", isSensitive: false },
              { id: 67, code: "administration.permissions.manage_permissions", action: "Manage Permissions", name: "Update Policies", description: "Grant or revoke granular action privileges", isSensitive: true }
            ]
          },
          {
            submenu: "Master Data & Dropdowns",
            permissions: [
              { id: 68, code: "administration.masters.view", action: "View", name: "View Masters", description: "View dropdown taxonomy and lookup tables", isSensitive: false },
              { id: 69, code: "administration.masters.configure_settings", action: "Configure Settings", name: "Manage Lookups", description: "Add/edit lead stages, sources, payment modes", isSensitive: false }
            ]
          },
          {
            submenu: "Audit Logs",
            permissions: [
              { id: 70, code: "administration.audit_logs.view", action: "View", name: "View Audit Trail", description: "Inspect immutable security audit log entries", isSensitive: false },
              { id: 71, code: "administration.audit_logs.import_export", action: "Import / Export", name: "Export Audit Logs", description: "Download compliance security audit trail", isSensitive: false }
            ]
          },
          {
            submenu: "System Settings",
            permissions: [
              { id: 72, code: "administration.system_settings.view", action: "View", name: "View System Settings", description: "View enterprise branding and ERP preferences", isSensitive: false },
              { id: 73, code: "administration.system_settings.configure_settings", action: "Configure Settings", name: "Configure System Settings", description: "Update company logo, fiscal year, defaults", isSensitive: true }
            ]
          }
        ]
      }
    ]
  }),
  getRolePermissions: async (roleId) => {
    if (roleId === 1) {
      return [
        "crm.leads.view", "crm.leads.create", "crm.leads.edit", "crm.leads.delete", "crm.leads.search_filter", "crm.leads.assign_reassign", "crm.leads.change_status", "crm.leads.import_export", "crm.leads.upload_download", "crm.leads.view_sensitive_data",
        "crm.bookings.view", "crm.bookings.create", "crm.bookings.edit", "crm.bookings.delete", "crm.bookings.search_filter", "crm.bookings.approve_reject", "crm.bookings.change_status", "crm.bookings.print", "crm.bookings.upload_download", "crm.bookings.view_sensitive_data",
        "crm.customers.view", "crm.customers.create", "crm.customers.edit", "crm.customers.delete", "crm.customers.search_filter", "crm.customers.import_export", "crm.customers.view_sensitive_data",
        "crm.site_visits.view", "crm.site_visits.create", "crm.site_visits.edit", "crm.site_visits.delete", "crm.site_visits.change_status",
        "crm.channel_partners.view", "crm.channel_partners.create", "crm.channel_partners.edit", "crm.channel_partners.delete", "crm.channel_partners.approve_reject", "crm.channel_partners.change_status", "crm.channel_partners.view_sensitive_data",
        "finance.receipts.view", "finance.receipts.create", "finance.receipts.edit", "finance.receipts.delete", "finance.receipts.approve_reject", "finance.receipts.print", "finance.receipts.view_sensitive_data",
        "finance.invoices.view", "finance.invoices.create", "finance.invoices.edit", "finance.invoices.delete", "finance.invoices.print",
        "finance.commissions.view", "finance.commissions.create", "finance.commissions.edit", "finance.commissions.approve_reject", "finance.commissions.submit_cancel",
        "administration.user_management.view", "administration.user_management.create", "administration.user_management.edit", "administration.user_management.delete", "administration.user_management.activate_deactivate",
        "administration.role_management.view", "administration.role_management.create", "administration.role_management.edit", "administration.role_management.delete",
        "administration.permissions.view", "administration.permissions.manage_permissions",
        "administration.masters.view", "administration.masters.configure_settings",
        "administration.audit_logs.view", "administration.audit_logs.import_export",
        "administration.system_settings.view", "administration.system_settings.configure_settings"
      ];
    } else if (roleId === 2) { // Sales Manager
      return [
        "crm.leads.view", "crm.leads.create", "crm.leads.edit", "crm.leads.search_filter", "crm.leads.assign_reassign", "crm.leads.change_status", "crm.leads.upload_download",
        "crm.bookings.view", "crm.bookings.create", "crm.bookings.edit", "crm.bookings.search_filter", "crm.bookings.approve_reject", "crm.bookings.change_status", "crm.bookings.print",
        "crm.customers.view", "crm.customers.create", "crm.customers.edit", "crm.customers.search_filter",
        "crm.site_visits.view", "crm.site_visits.create", "crm.site_visits.edit", "crm.site_visits.change_status",
        "crm.channel_partners.view", "crm.channel_partners.create", "crm.channel_partners.edit"
      ];
    } else if (roleId === 3) { // Sales Agent
      return [
        "crm.leads.view", "crm.leads.create", "crm.leads.edit", "crm.leads.search_filter", "crm.leads.change_status",
        "crm.bookings.view", "crm.bookings.create", "crm.bookings.search_filter", "crm.bookings.print",
        "crm.customers.view", "crm.customers.search_filter",
        "crm.site_visits.view", "crm.site_visits.create", "crm.site_visits.edit", "crm.site_visits.change_status"
      ];
    } else if (roleId === 4) { // Accounts
      return [
        "finance.receipts.view", "finance.receipts.create", "finance.receipts.edit", "finance.receipts.approve_reject", "finance.receipts.print", "finance.receipts.view_sensitive_data",
        "finance.invoices.view", "finance.invoices.create", "finance.invoices.edit", "finance.invoices.print",
        "finance.commissions.view", "finance.commissions.create", "finance.commissions.edit", "finance.commissions.approve_reject",
        "crm.bookings.view", "crm.customers.view"
      ];
    } else if (roleId === 5) { // Channel Partner
      return [
        "crm.leads.view", "crm.leads.create",
        "crm.bookings.view", "crm.bookings.create",
        "crm.customers.view",
        "crm.site_visits.view", "crm.site_visits.create",
        "finance.commissions.view"
      ];
    }
    return [];
  },
  saveRolePermissions: async (roleId, data) => ({ success: true, count: data.permissions ? data.permissions.length : 0 }),
  getUserPermissions: async (userId) => ({ userId, rolePermissions: await mockApi.getRolePermissions(1), userOverrides: [] }),
  saveUserPermissions: async (userId, data) => ({ success: true, count: data.overrides ? data.overrides.length : 0 }),
  getPermissionAuditLogs: async () => [
    { id: 1, action: "Role Permissions Updated", targetType: "Role", targetName: "Sales Manager", performedBy: "Arjun Kapoor", reason: "Standard Q4 Sales policy update", createdAt: new Date().toISOString() },
    { id: 2, action: "User Override Added", targetType: "User", targetName: "Priya Sharma", performedBy: "Arjun Kapoor", reason: "Granted temporary booking print access", createdAt: new Date(Date.now() - 86400000).toISOString() }
  ],
  getMyPermissions: async () => {
    const role = localStorage.getItem("current_user_role") || "Super Admin";
    return { role, isSuperAdmin: role === "Super Admin", permissions: {} };
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
  getRawSystemConfigs: async (category = "") => {
    let list = getMock("systemConfigs");
    if (category) {
      list = list.filter(c => c.category.toLowerCase() === category.toLowerCase());
    }
    return list;
  },
  createSystemConfig: async (data) => {
    const list = getMock("systemConfigs");
    const newItem = { id: Date.now(), sortOrder: list.length + 1, isActive: true, isDefault: false, ...data };
    list.push(newItem);
    setMock("systemConfigs", list);
    return newItem;
  },
  updateSystemConfig: async (id, data) => {
    const list = getMock("systemConfigs");
    const idx = list.findIndex(c => c.id === parseInt(id));
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data };
      setMock("systemConfigs", list);
      return list[idx];
    }
    return data;
  },
  deleteSystemConfig: async (id) => {
    let list = getMock("systemConfigs");
    list = list.filter(c => c.id !== parseInt(id));
    setMock("systemConfigs", list);
    return true;
  },

  // Reporting Module Mock Fallbacks
  getReportCategories: async () => [
    { id: "dashboard", name: "Executive & Dashboard", description: "High-level portfolio performance, revenue velocity and operational indicators.", icon: "LayoutDashboard" },
    { id: "sales", name: "Sales & CRM Reports", description: "Lead progression, conversion funnel, site visit tracking and sales representative activity.", icon: "Target" },
    { id: "financial", name: "Financial & Accounts", description: "Collections realization, payment ledgers, receivables aging and project revenue analysis.", icon: "DollarSign" },
    { id: "partners", name: "Channel Partner Reports", description: "Partner deal closures, commission calculations, payout statuses and sourcing rankings.", icon: "Handshake" },
    { id: "operations", name: "Operational & Inventory", description: "Unit inventory matrix, availability by project/typology and construction progress.", icon: "Building2" },
    { id: "governance", name: "Security & Governance", description: "User accounts, role permission mappings, access control matrix and system audit logs.", icon: "Shield" }
  ],
  getReportCatalog: async () => {
    const role = localStorage.getItem("current_user_role") || "Super Admin";
    const cpId = localStorage.getItem("current_channel_partner_id");

    const allReports = [
      {
        id: "executive-summary",
        title: "Executive Portfolio & Financial Summary",
        description: "Comprehensive overview of construction projects, unit availability, total booked revenue, realized collections, and outstanding receivables.",
        categoryId: "dashboard",
        rdlReportName: "ExecutiveSummaryReport",
        allowedRoles: ["Super Admin", "Manager", "Sales Manager", "Accounts", "Accountant"],
        parameters: [
          { name: "ProjectId", label: "Select Project", type: "select" },
          { name: "FromDate", label: "From Date", type: "date" },
          { name: "ToDate", label: "To Date", type: "date" }
        ]
      },
      {
        id: "lead-pipeline",
        title: "Lead Conversion & Sales Pipeline Funnel",
        description: "Detailed lead progression audit analyzing lead sources, current stages, budget qualification, assigned sales agents, and conversion outcomes.",
        categoryId: "sales",
        rdlReportName: "LeadPipelineReport",
        allowedRoles: ["Super Admin", "Manager", "Sales Manager", "Sales Agent"],
        parameters: [
          { name: "ProjectId", label: "Project", type: "select" },
          { name: "Stage", label: "Lead Stage", type: "select" },
          { name: "AssignedTo", label: "Assigned Sales Agent", type: "select" },
          { name: "FromDate", label: "From Date", type: "date" },
          { name: "ToDate", label: "To Date", type: "date" },
          { name: "Search", label: "Search Prospect / Contact", type: "text" }
        ]
      },
      {
        id: "site-visits",
        title: "Site Visits & Prospect Engagement Log",
        description: "Audit of scheduled, completed, and missed on-site customer visits, interest levels, notes, and representative interactions.",
        categoryId: "sales",
        rdlReportName: "SiteVisitsReport",
        allowedRoles: ["Super Admin", "Manager", "Sales Manager", "Sales Agent"],
        parameters: [
          { name: "ProjectId", label: "Project", type: "select" },
          { name: "Status", label: "Visit Status", type: "select" },
          { name: "AssignedAgent", label: "Assigned Agent", type: "select" },
          { name: "FromDate", label: "From Date", type: "date" },
          { name: "ToDate", label: "To Date", type: "date" }
        ]
      },
      {
        id: "financial-collections",
        title: "Collections & Financial Realization Ledger",
        description: "Detailed payment receipt transactions, payment instruments (NEFT, Cheque, Cash), linked customers, and realization status.",
        categoryId: "financial",
        rdlReportName: "FinancialCollectionsReport",
        allowedRoles: ["Super Admin", "Manager", "Accounts", "Accountant"],
        parameters: [
          { name: "ProjectId", label: "Project", type: "select" },
          { name: "PaymentMode", label: "Payment Mode", type: "select" },
          { name: "Status", label: "Payment Status", type: "select" },
          { name: "FromDate", label: "From Date", type: "date" },
          { name: "ToDate", label: "To Date", type: "date" },
          { name: "Search", label: "Search Customer / Receipt", type: "text" }
        ]
      },
      {
        id: "customer-receivables",
        title: "Customer Receivables & Outstanding Aging",
        description: "Customer payment balances, collection percentages, payment history, and aging analysis of pending installments.",
        categoryId: "financial",
        rdlReportName: "CustomerReceivablesReport",
        allowedRoles: ["Super Admin", "Manager", "Accounts", "Accountant"],
        parameters: [
          { name: "ProjectId", label: "Project", type: "select" },
          { name: "Status", label: "Customer Status", type: "select" },
          { name: "Search", label: "Search Customer / Unit", type: "text" }
        ]
      },
      {
        id: "partner-commission",
        title: "Channel Partner Performance & Commission Ledger",
        description: "Channel partner sourcing productivity, booked transactions, contracted commission rates, paid disbursements, and payable balances.",
        categoryId: "partners",
        rdlReportName: "ChannelPartnerCommissionReport",
        allowedRoles: ["Super Admin", "Manager", "Sales Manager", "Accounts", "Channel Partner"],
        parameters: [
          { name: "PartnerId", label: "Channel Partner Firm", type: "select" },
          { name: "Status", label: "Commission Status", type: "select" },
          { name: "FromDate", label: "From Date", type: "date" },
          { name: "ToDate", label: "To Date", type: "date" }
        ]
      },
      {
        id: "unit-inventory",
        title: "Unit Inventory & Availability Matrix",
        description: "Project unit matrix covering typology (1BHK/2BHK/3BHK), carpet area, base pricing, floor level, and booking availability status.",
        categoryId: "operations",
        rdlReportName: "UnitInventoryReport",
        allowedRoles: ["Super Admin", "Manager", "Sales Manager", "Sales Agent"],
        parameters: [
          { name: "ProjectId", label: "Project", type: "select" },
          { name: "Status", label: "Unit Status", type: "select" },
          { name: "UnitType", label: "Unit Typology", type: "select" }
        ]
      },
      {
        id: "user-role-audit",
        title: "User Security, Roles & Permissions Audit",
        description: "Enterprise security directory documenting active user accounts, system role assignments, granular permissions, and channel partner associations.",
        categoryId: "governance",
        rdlReportName: "UserRoleAuditReport",
        allowedRoles: ["Super Admin"],
        parameters: [
          { name: "Role", label: "System Role", type: "select" },
          { name: "Search", label: "Search User / Email", type: "text" }
        ]
      }
    ];

    if (role === "Super Admin") {
      return allReports;
    }

    if (role === "Channel Partner") {
      return allReports.filter(r => r.id === "partner-commission");
    }

    return allReports.filter(r => (r.allowedRoles || []).some(ar => ar.toLowerCase() === role.toLowerCase()));
  },
  getReportParameters: async (reportId) => {
    const catalog = await mockApi.getReportCatalog();
    const rep = catalog.find(r => r.id === reportId);
    if (!rep) return [];

    const projects = (getMock("projects") || []).map(p => ({ value: p.id.toString(), label: p.name }));
    const partners = (getMock("channelPartners") || []).map(cp => ({ value: cp.id.toString(), label: cp.name }));
    const employees = (getMock("employees") || []).map(e => ({ value: e.name, label: e.name }));

    return (rep.parameters || []).map(param => {
      const copy = { ...param, options: [] };
      if (param.name === "ProjectId") {
        copy.options = [{ value: "", label: "-- All Projects --" }, ...projects];
      } else if (param.name === "PartnerId") {
        copy.options = [{ value: "", label: "-- All Channel Partners --" }, ...partners];
      } else if (param.name === "Stage") {
        copy.options = [
          { value: "", label: "-- All Stages --" },
          { value: "New Lead", label: "New Lead" },
          { value: "Contacted", label: "Contacted" },
          { value: "Site Visit Scheduled", label: "Site Visit Scheduled" },
          { value: "Negotiation", label: "Negotiation" },
          { value: "Booking Done", label: "Booking Done" },
          { value: "Lost", label: "Lost" }
        ];
      } else if (param.name === "AssignedTo" || param.name === "AssignedAgent") {
        copy.options = [{ value: "", label: "-- All Agents --" }, ...employees];
      } else if (param.name === "Status" && rep.id === "site-visits") {
        copy.options = [
          { value: "", label: "-- All Statuses --" },
          { value: "Scheduled", label: "Scheduled" },
          { value: "Completed", label: "Completed" },
          { value: "Cancelled", label: "Cancelled" },
          { value: "No Show", label: "No Show" }
        ];
      } else if (param.name === "PaymentMode") {
        copy.options = [
          { value: "", label: "-- All Modes --" },
          { value: "NEFT/RTGS", label: "NEFT / RTGS" },
          { value: "Cheque", label: "Cheque" },
          { value: "UPI", label: "UPI" },
          { value: "Cash", label: "Cash" }
        ];
      } else if (param.name === "Status" && rep.id === "customer-receivables") {
        copy.options = [
          { value: "", label: "-- All Statuses --" },
          { value: "Current", label: "Current" },
          { value: "Overdue", label: "Overdue" },
          { value: "Paid", label: "Fully Paid" }
        ];
      } else if (param.name === "Status" && rep.id === "unit-inventory") {
        copy.options = [
          { value: "", label: "-- All Statuses --" },
          { value: "Available", label: "Available" },
          { value: "Booked", label: "Booked" },
          { value: "Sold", label: "Sold" }
        ];
      } else if (param.name === "UnitType") {
        copy.options = [
          { value: "", label: "-- All Typologies --" },
          { value: "1 BHK", label: "1 BHK" },
          { value: "2 BHK", label: "2 BHK" },
          { value: "3 BHK", label: "3 BHK" },
          { value: "Penthouse", label: "Penthouse" },
          { value: "Commercial Shop", label: "Commercial Shop" }
        ];
      } else if (param.name === "Role") {
        copy.options = [
          { value: "", label: "-- All Roles --" },
          { value: "Super Admin", label: "Super Admin" },
          { value: "Manager", label: "Manager" },
          { value: "Sales Agent", label: "Sales Agent" },
          { value: "Accounts", label: "Accounts" },
          { value: "Channel Partner", label: "Channel Partner" }
        ];
      }
      return copy;
    });
  },
  renderReport: async ({ reportId, parameters = {} }) => {
    const catalog = await mockApi.getReportCatalog();
    const rep = catalog.find(r => r.id === reportId);
    const title = rep ? rep.title : reportId.replace("-", " ").toUpperCase();
    const generatedAt = new Date().toISOString();

    if (reportId === "site-visits") {
      const visits = getMock("siteVisits") || [];
      const rows = visits.map((v, i) => {
        const lead = (getMock("leads") || []).find(l => l.id === v.leadId);
        const proj = (getMock("projects") || []).find(p => p.id === v.projectId);
        return {
          id: v.id || i + 1,
          customerName: lead ? lead.customerName : "Prospect " + (i + 1),
          projectName: proj ? proj.name : "Skyline Heights",
          visitDate: v.visitDate || "2026-10-15",
          assignedAgent: v.assignedTo || "Arjun Kapoor",
          status: v.status || "Completed",
          feedback: v.feedback || "Interested in 3BHK higher floor"
        };
      });
      return {
        reportId,
        reportTitle: title,
        category: "sales",
        generatedAt,
        executionEngine: "Enterprise Mock Fallback Engine",
        kpis: [
          { label: "Total Site Visits", value: rows.length.toString(), subtext: "Audited prospect visits", color: "blue" },
          { label: "Completed Visits", value: rows.filter(r => r.status === "Completed").length.toString(), subtext: "Successful inspections", color: "teal" },
          { label: "Upcoming / Scheduled", value: rows.filter(r => r.status === "Scheduled").length.toString(), subtext: "Pending execution", color: "gold" }
        ],
        columns: [
          { key: "id", label: "Visit ID", dataType: "number", align: "center" },
          { key: "customerName", label: "Prospect Name", dataType: "string", align: "left" },
          { key: "projectName", label: "Project", dataType: "string", align: "left" },
          { key: "visitDate", label: "Visit Date", dataType: "date", align: "center" },
          { key: "assignedAgent", label: "Assigned Agent", dataType: "string", align: "left" },
          { key: "status", label: "Status", dataType: "badge", align: "center" },
          { key: "feedback", label: "Prospect Feedback", dataType: "string", align: "left" }
        ],
        rows,
        totalRows: rows.length
      };
    }

    if (reportId === "customer-receivables") {
      const customers = getMock("customers") || [];
      const rows = customers.map((c, i) => {
        const proj = (getMock("projects") || []).find(p => p.id === c.projectId);
        const total = c.budget || 8500000;
        const paid = Math.round(total * 0.4);
        const outstanding = total - paid;
        return {
          id: c.id || i + 1,
          customerName: c.name,
          projectName: proj ? proj.name : "Green Valley Phase 2",
          unitNumber: c.unitNumber || `A-${100 + i}`,
          totalContractValue: total,
          totalPaid: paid,
          outstandingBalance: outstanding,
          customerStatus: outstanding > 4000000 ? "Overdue" : "Current"
        };
      });
      return {
        reportId,
        reportTitle: title,
        category: "financial",
        generatedAt,
        executionEngine: "Enterprise Mock Fallback Engine",
        kpis: [
          { label: "Total Receivables Outstanding", value: "₹ 14.85 Cr", subtext: "Balance due across customers", color: "gold" },
          { label: "Total Realized Collections", value: "₹ 9.90 Cr", subtext: "40.0% of contract value", color: "teal" },
          { label: "Overdue Accounts", value: rows.filter(r => r.customerStatus === "Overdue").length.toString(), subtext: "Requires urgent reminder", color: "red" }
        ],
        columns: [
          { key: "id", label: "Customer ID", dataType: "number", align: "center" },
          { key: "customerName", label: "Customer Name", dataType: "string", align: "left" },
          { key: "projectName", label: "Project", dataType: "string", align: "left" },
          { key: "unitNumber", label: "Unit / Flat", dataType: "string", align: "center" },
          { key: "totalContractValue", label: "Contract Value", dataType: "currency", align: "right" },
          { key: "totalPaid", label: "Paid to Date", dataType: "currency", align: "right" },
          { key: "outstandingBalance", label: "Outstanding Balance", dataType: "currency", align: "right" },
          { key: "customerStatus", label: "Status", dataType: "badge", align: "center" }
        ],
        rows,
        totalRows: rows.length
      };
    }

    // Default mock renderer for other reports
    return {
      reportId,
      reportTitle: title,
      category: rep ? rep.categoryId : "general",
      generatedAt,
      executionEngine: "Enterprise Mock Fallback Engine",
      kpis: [
        { label: "Total Records", value: "18", subtext: "Active portfolio records", color: "blue" },
        { label: "Realized Volume", value: "₹ 4.28 Cr", subtext: "Realized in financial year", color: "teal" },
        { label: "Active Operational Items", value: "8", subtext: "In progress", color: "gold" }
      ],
      columns: [
        { key: "id", label: "ID", dataType: "number", align: "center" },
        { key: "name", label: "Item / Entity", dataType: "string", align: "left" },
        { key: "category", label: "Category", dataType: "string", align: "left" },
        { key: "date", label: "Timestamp", dataType: "date", align: "center" },
        { key: "status", label: "Status", dataType: "badge", align: "center" },
        { key: "value", label: "Amount (₹)", dataType: "currency", align: "right" }
      ],
      rows: [
        { id: 1, name: "Skyline Heights Tower A", category: "Residential", date: "2026-10-18", status: "Active", value: 18660000 },
        { id: 2, name: "Green Valley Township", category: "Township", date: "2026-10-17", status: "Active", value: 50800000 },
        { id: 3, name: "Meridian Business Park", category: "Commercial", date: "2026-10-16", status: "Nearing Handover", value: 60000000 },
        { id: 4, name: "Pearl Residences", category: "Residential", date: "2026-10-15", status: "Pre-launch", value: 37000000 }
      ],
      totalRows: 4
    };
  },
  getReportHealth: async () => ({
    isConnected: false,
    serverUrl: "http://localhost/ReportServer",
    message: "SSRS Fallback Engine active",
    isFallbackActive: true
  }),
  getReportExportUrl: (id, params = {}, format = "PDF") => `/api/reports/${id}/export?format=${format}`,
  downloadReportFile: async (reportId, params = {}, format = "PDF") => {
    const normFormat = (format || "PDF").toUpperCase();
    const spec = REPORT_FORMAT_SPECS[normFormat] || REPORT_FORMAT_SPECS.PDF;
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `BuilderPro_${reportId}_${dateStr}.${spec.ext}`;

    let content = "";
    let mime = spec.mime;

    if (normFormat === "CSV") {
      mime = "text/csv;charset=utf-8";
      content = "\uFEFF\"Report\",\"" + reportId + "\"\n\"Generated At\",\"" + new Date().toISOString() + "\"\n\n\"ID\",\"Name\",\"Status\",\"Date\",\"Amount\"\n\"1\",\"Skyline Heights Villa\",\"Active\",\"" + dateStr + "\",\"15000000\"\n\"2\",\"Green Valley Phase 2\",\"Confirmed\",\"" + dateStr + "\",\"8500000\"\n";
    } else if (normFormat === "EXCEL" || normFormat === "XLSX" || normFormat === "XLS") {
      mime = "text/csv;charset=utf-8";
      content = "\uFEFF\"Report\",\"" + reportId + " (Mock Export)\"\n\"Generated At\",\"" + new Date().toISOString() + "\"\n\n\"ID\",\"Title\",\"Status\",\"Date\",\"Amount (INR)\"\n\"1\",\"Skyline Heights Villa\",\"Active\",\"" + dateStr + "\",\"15000000\"\n\"2\",\"Green Valley Phase 2\",\"Confirmed\",\"" + dateStr + "\",\"8500000\"\n";
    } else if (normFormat === "WORD" || normFormat === "DOCX" || normFormat === "DOC") {
      mime = "application/msword";
      content = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>" + reportId + "</title></head><body style='font-family: Arial;'><h2>BuilderPro ERP Report: " + reportId + "</h2><p>Generated: " + new Date().toLocaleString() + "</p><table border='1' cellpadding='6' style='border-collapse:collapse;width:100%;'><tr><th>Item</th><th>Description</th><th>Value</th></tr><tr><td>1</td><td>Operational Milestone</td><td>Completed</td></tr></table></body></html>";
    } else {
      mime = "application/pdf";
      content = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n180\n%%EOF";
    }

    triggerBrowserFileDownload(content, filename, mime);
    return { success: true, filename };
  },
};

// ─── ROBUST FILE DOWNLOAD & FILENAME HELPERS ───────────────────────
const REPORT_FORMAT_SPECS = {
  PDF: { ext: "pdf", mime: "application/pdf" },
  EXCEL: { ext: "xlsx", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  XLSX: { ext: "xlsx", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  XLS: { ext: "xlsx", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  CSV: { ext: "csv", mime: "text/csv;charset=utf-8" },
  WORD: { ext: "doc", mime: "application/msword" },
  DOCX: { ext: "doc", mime: "application/msword" },
  DOC: { ext: "doc", mime: "application/msword" }
};

function extractFilenameFromHeader(disposition, fallbackName) {
  if (!disposition || typeof disposition !== "string") return fallbackName;

  // 1. Try RFC 5987 / RFC 6266 filename* with charset
  const rfcMatch = disposition.match(/filename\*\s*=\s*(?:UTF-8|iso-8859-1)?''?([^;\r\n]+)/i);
  if (rfcMatch && rfcMatch[1]) {
    try {
      const decoded = decodeURIComponent(rfcMatch[1].trim().replace(/^["']|["']$/g, ""));
      if (decoded && decoded.trim().length > 0) return decoded.trim();
    } catch {
      const clean = rfcMatch[1].trim().replace(/^["']|["']$/g, "");
      if (clean.length > 0) return clean;
    }
  }

  // 2. Try standard filename="value" or filename=value
  const stdMatch = disposition.match(/filename\s*=\s*(?:"([^"]+)"|'([^']+)'|([^;\s\r\n]+))/i);
  if (stdMatch) {
    const raw = stdMatch[1] || stdMatch[2] || stdMatch[3];
    if (raw) {
      let cleaned = raw.trim().replace(/^["']|["']$/g, "").trim();
      if (cleaned.includes("%")) {
        try {
          cleaned = decodeURIComponent(cleaned);
        } catch {}
      }
      if (cleaned.length > 0) return cleaned;
    }
  }

  return fallbackName;
}

function ensureFileExtension(filename, expectedExt) {
  if (!filename) return `file.${expectedExt}`;
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex === -1 || dotIndex === filename.length - 1) {
    return `${filename}.${expectedExt}`;
  }
  return filename;
}

function triggerBrowserFileDownload(data, filename, mimeType) {
  // Ensure we have a Blob with the designated MIME type without unnecessary File wrapping
  const blob = data instanceof Blob
    ? (data.type ? data : new Blob([data], { type: mimeType }))
    : new Blob([data], { type: mimeType });

  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.position = "fixed";
  a.style.top = "-9999px";
  a.style.left = "-9999px";
  a.style.opacity = "0";
  a.href = blobUrl;
  a.download = filename;
  a.setAttribute("download", filename);
  document.body.appendChild(a);

  // Trigger download natively
  try {
    a.click();
  } catch {
    a.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
  }

  // Retain element in DOM and defer URL revocation so browser download thread has fully consumed stream & headers
  setTimeout(() => {
    try {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
      window.URL.revokeObjectURL(blobUrl);
    } catch {}
  }, 30000);
}

// ─── INTEGRATED API EXPORTS ────────────────────────────────────
const realApi = {
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
  getLeadsKanban: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req("GET", `/leads/kanban${qs ? "?" + qs : ""}`);
  },
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

  getBookings: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req("GET", `/bookings${qs ? "?" + qs : ""}`);
  },
  createBooking: (data) => req("POST", "/bookings", data),
  updateBooking: (id, data) => req("PUT", `/bookings/${id}`, data),
  deleteBooking: (id) => req("DELETE", `/bookings/${id}`),
  downloadBookingAgreement: async (id, bookingNumber = "Agreement") => {
    const cleanNumber = (bookingNumber || "Agreement").toString().replace(/[^a-zA-Z0-9_-]/g, "_");
    const defaultFileName = `Agreement_${cleanNumber}.pdf`;
    const endpointUrl = `${currentBaseUrl}/bookings/${id}/agreement`;

    const role = localStorage.getItem("current_user_role") || "Super Admin";
    const name = localStorage.getItem("current_user_name");
    const uid = localStorage.getItem("current_user_id");
    const token = localStorage.getItem("auth_token") || localStorage.getItem("token");

    const headers = {};
    if (role) headers["X-User-Role"] = role;
    if (name) headers["X-User-Name"] = name;
    if (uid) headers["X-User-Id"] = uid;
    if (token) headers["Authorization"] = `Bearer ${token}`;

    console.info(`[Booking Agreement Download Request] Endpoint: ${endpointUrl}`);
    const res = await fetch(endpointUrl, { method: "GET", headers });
    console.info(`[Booking Agreement Download Response] HTTP ${res.status} ${res.statusText}`);

    if (!res.ok) {
      let errText = `Server error (${res.status})`;
      try {
        const errJson = await res.json();
        errText = errJson.message || errJson.error || errText;
      } catch {}
      throw new Error(errText);
    }

    const contentType = res.headers.get("Content-Type") || "application/pdf";
    const disposition = res.headers.get("Content-Disposition") || "";
    const filename = extractFilenameFromHeader(disposition, defaultFileName);
    const arrayBuffer = await res.arrayBuffer();

    triggerBrowserFileDownload(new Blob([arrayBuffer], { type: contentType }), filename, contentType);
    return { success: true, filename };
  },
  uploadBookingAgreement: (id, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return req("POST", `/bookings/${id}/agreement/upload`, formData);
  },
  deleteBookingAgreement: (id) => req("DELETE", `/bookings/${id}/agreement`),
  viewBookingAgreementUrl: (id) => `/api/bookings/${id}/agreement/view`,

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

  // Roles Management
  getRoles: () => req("GET", "/roles"),
  getRole: (id) => req("GET", `/roles/${id}`),
  createRole: (data) => req("POST", "/roles", data),
  updateRole: (id, data) => req("PUT", `/roles/${id}`, data),
  deleteRole: (id) => req("DELETE", `/roles/${id}`),

  // Permissions System
  getPermissionsMatrix: () => req("GET", "/permissions/matrix"),
  getRolePermissions: (roleId) => req("GET", `/permissions/role/${roleId}`),
  saveRolePermissions: (roleId, data) => req("POST", `/permissions/role/${roleId}`, data),
  getUserPermissions: (userId) => req("GET", `/permissions/user/${userId}`),
  saveUserPermissions: (userId, data) => req("POST", `/permissions/user/${userId}`, data),
  getPermissionAuditLogs: () => req("GET", "/permissions/audit"),
  getMyPermissions: () => req("GET", "/permissions/my-permissions"),

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
  getRawSystemConfigs: (category = "") => req("GET", `/systemconfigs/raw${category ? `?category=${category}` : ""}`),
  createSystemConfig: (data) => req("POST", "/systemconfigs", data),
  updateSystemConfig: (id, data) => req("PUT", `/systemconfigs/${id}`, data),
  deleteSystemConfig: (id) => req("DELETE", `/systemconfigs/${id}`),

  // SSRS & Enterprise Reporting Module
  getReportCategories: () => req("GET", "/reports/categories"),
  getReportCatalog: () => req("GET", "/reports/catalog"),
  getReportParameters: (id) => req("GET", `/reports/${id}/parameters`),
  renderReport: (data) => req("POST", "/reports/render", data),
  getReportHealth: () => req("GET", "/reports/health"),
  getReportExportUrl: (id, params = {}, format = "PDF") => {
    const role = localStorage.getItem("current_user_role") || "Super Admin";
    const channelPartnerId = localStorage.getItem("current_channel_partner_id");
    const qs = new URLSearchParams({ format, role, ...(channelPartnerId ? { channelPartnerId } : {}), ...params }).toString();
    return `${currentBaseUrl}/reports/${id}/export?${qs}`;
  },
  downloadReportFile: async (reportId, params = {}, format = "PDF") => {
    const cleanParams = {};
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
          cleanParams[k] = v;
        }
      });
    }

    const role = localStorage.getItem("current_user_role") || "Super Admin";
    const channelPartnerId = localStorage.getItem("current_channel_partner_id");
    const name = localStorage.getItem("current_user_name");
    const uid = localStorage.getItem("current_user_id");
    const token = localStorage.getItem("auth_token") || localStorage.getItem("token");

    const normFormat = (format || "PDF").toUpperCase();
    const spec = REPORT_FORMAT_SPECS[normFormat] || REPORT_FORMAT_SPECS.PDF;

    const query = new URLSearchParams({
      format: normFormat,
      role,
      ...(channelPartnerId ? { channelPartnerId } : {}),
      ...cleanParams
    }).toString();

    const headers = {};
    if (role) headers["X-User-Role"] = role;
    if (name) headers["X-User-Name"] = name;
    if (uid) headers["X-User-Id"] = uid;
    if (channelPartnerId) headers["X-Channel-Partner-Id"] = channelPartnerId;
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const requestUrl = `${currentBaseUrl}/reports/${reportId}/export?${query}`;

    // Diagnostic Logging: Requested API endpoint
    console.info(`[Report Export Request] Endpoint: ${requestUrl} | Format: ${normFormat}`);

    let res;
    try {
      res = await fetch(requestUrl, {
        method: "GET",
        headers
      });
    } catch (netErr) {
      const altUrl = getAlternativeBaseUrl(currentBaseUrl);
      if (altUrl) {
        currentBaseUrl = altUrl;
        const retryUrl = `${currentBaseUrl}/reports/${reportId}/export?${query}`;
        console.warn(`[Report Export Retry] Trying alternative base: ${retryUrl}`);
        res = await fetch(retryUrl, {
          method: "GET",
          headers
        });
      } else {
        console.error(`[Report Export Network Error]`, netErr);
        throw netErr;
      }
    }

    // Diagnostic Logging: HTTP Status and Headers
    const contentTypeHeader = res.headers.get("Content-Type") || "";
    const dispositionHeader = res.headers.get("Content-Disposition") || "";
    console.info(`[Report Export Response] HTTP ${res.status} ${res.statusText} | Content-Type: ${contentTypeHeader} | Content-Disposition: ${dispositionHeader}`);

    // Check response.ok
    if (!res.ok) {
      let errorMsg = `Server error (${res.status})`;
      try {
        if (contentTypeHeader.includes("application/json")) {
          const errJson = await res.json();
          errorMsg = errJson.error || errJson.details || errJson.message || errorMsg;
        } else {
          const errText = await res.text();
          if (errText) errorMsg = errText.slice(0, 200);
        }
      } catch {}
      console.error(`[Report Export Failed] Status ${res.status}: ${errorMsg}`);
      throw new Error(errorMsg);
    }

    // Detect if server returned 200 OK but with JSON or HTML error payload instead of genuine binary
    if (contentTypeHeader.includes("application/json") || contentTypeHeader.includes("text/html")) {
      if (normFormat !== "WORD" && normFormat !== "DOC" && normFormat !== "DOCX") {
        const textPayload = await res.text();
        console.error(`[Report Export Error] Received text/JSON response with HTTP 200 for binary format ${normFormat}:`, textPayload.slice(0, 300));
        let errorDetail = "Server returned an invalid non-binary response.";
        try {
          const parsed = JSON.parse(textPayload);
          if (parsed.error || parsed.message) errorDetail = parsed.error || parsed.message;
        } catch {}
        throw new Error(errorDetail);
      }
    }

    // Read full binary ArrayBuffer
    const arrayBuffer = await res.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      console.error(`[Report Export Error] Received empty 0-byte binary response from server.`);
      throw new Error("Exported file is empty (0 bytes).");
    }

    console.info(`[Report Export Success] Received ${arrayBuffer.byteLength} bytes binary payload.`);

    // Extract filename safely from Content-Disposition
    const dateStr = new Date().toISOString().slice(0, 10);
    const defaultFallbackName = `BuilderPro_${reportId}_${dateStr}.${spec.ext}`;
    let filename = extractFilenameFromHeader(dispositionHeader, defaultFallbackName);
    filename = ensureFileExtension(filename, spec.ext);

    // MIME type
    const finalMime = spec.mime || contentTypeHeader || "application/octet-stream";

    // Trigger browser file download with pure typed Blob
    const blob = new Blob([arrayBuffer], { type: finalMime });
    triggerBrowserFileDownload(blob, filename, finalMime);

    return { success: true, filename, byteLength: arrayBuffer.byteLength };
  },
};

// Create fallback API wrapper
const createFallbackApi = () => {
  const fallbackApi = {};
  const allMethods = new Set([...Object.keys(mockApi), ...Object.keys(realApi)]);

  allMethods.forEach(methodName => {
    fallbackApi[methodName] = async (...args) => {
      if (USE_MOCK) {
        return mockApi[methodName] ? mockApi[methodName](...args) : null;
      }
      
      try {
        if (realApi[methodName]) {
          return await realApi[methodName](...args);
        }
      } catch (err) {
        // Critical: Do NOT silently replace failed production export/download with mock data!
        if (methodName === "downloadReportFile" || methodName.startsWith("download")) {
          console.error(`❌ Export/Download operation '${methodName}' failed:`, err);
          throw err;
        }

        console.warn(`⚠️ API call failed for '${methodName}'. Falling back to local mock data. Error:`, err);
        connectionState = { isConnected: false, url: currentBaseUrl, isMock: true, error: err.message };
        notifyConnectionChange();
        if (mockApi[methodName]) {
          return mockApi[methodName](...args);
        }
        throw err;
      }
    };
  });

  // Health and connection inspection helpers
  fallbackApi.getConnectionStatus = () => ({ ...connectionState });
  fallbackApi.onConnectionChange = (listener) => {
    connectionListeners.add(listener);
    listener({ ...connectionState });
    return () => connectionListeners.delete(listener);
  };
  fallbackApi.checkBackendHealth = async () => {
    const urlsToTry = [currentBaseUrl];
    const alt = getAlternativeBaseUrl(currentBaseUrl);
    if (alt) urlsToTry.push(alt);

    for (const base of urlsToTry) {
      try {
        const rootUrl = base.replace(/\/api\/?$/, "");
        const res = await fetch(`${rootUrl}/health`, { method: "GET" });
        if (res.ok) {
          currentBaseUrl = base;
          connectionState = { isConnected: true, url: base, isMock: false, error: null };
          notifyConnectionChange();
          return connectionState;
        }
      } catch {}
    }
    connectionState = { isConnected: false, url: currentBaseUrl, isMock: true, error: "Backend not reachable on 5000 or 8080" };
    notifyConnectionChange();
    return connectionState;
  };
  fallbackApi.getBaseUrl = () => currentBaseUrl;
  
  return fallbackApi;
};

export const api = createFallbackApi();
