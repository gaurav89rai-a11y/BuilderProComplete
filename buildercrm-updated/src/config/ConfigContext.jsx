import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api.js";
import { C } from "./theme.js";

const ConfigContext = createContext(null);

export function ConfigProvider({ children }) {
  const [configs, setConfigs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadConfigs() {
      try {
        const data = await api.getSystemConfigs();
        setConfigs(data);
      } catch (e) {
        console.error("Failed to load database configurations", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadConfigs();
  }, []);

  // Helper helper to get configurations by category with standard fallback lists
  const getOptions = (category, fallback = []) => {
    const list = configs[category];
    if (!list) return fallback;
    return list.map(item => item.value);
  };

  // Resolve default value for a category
  const getDefault = (category, fallback = "") => {
    const list = configs[category];
    if (!list) return fallback;
    const def = list.find(item => item.isDefault);
    return def ? def.value : (list[0]?.value || fallback);
  };

  // Build badgeColors map dynamically based on configs
  const badgeColors = {};
  Object.values(configs).forEach(categoryConfigs => {
    categoryConfigs.forEach(cfg => {
      if (cfg.color) {
        const text = C[cfg.color] || cfg.color;
        badgeColors[cfg.value] = {
          b: `${text}1a`, // background with 10% opacity
          c: text        // foreground text color
        };
      }
    });
  });

  const value = {
    configs,
    loading,
    error,
    getOptions,
    getDefault,
    badgeColors,
    
    // Explicit lists for ease of use in features
    projectStatus: getOptions("projectStatus", ["Pre-launch", "Active", "Nearing Handover", "Completed"]),
    projectType: getOptions("projectType", ["Residential", "Commercial", "Township"]),
    paymentMode: getOptions("paymentMode", ["NEFT", "RTGS", "Cheque", "Cash", "UPI", "DD"]),
    paymentStatus: getOptions("paymentStatus", ["Received", "Pending"]),
    partnerStatus: getOptions("partnerStatus", ["Platinum", "Gold", "Silver"]),
    orderStatus: getOptions("orderStatus", ["Pending", "Delivered", "Shipped", "Cancelled"]),
    leadStage: getOptions("leadStage", ["New", "Contacted", "Site Visit", "Negotiation", "Booked"]),
    leadSource: getOptions("leadSource", ["Website", "Channel Partner", "Walk-in", "Referral", "Online Ad"]),
    unitType: getOptions("unitType", ["1BHK", "2BHK", "3BHK", "4BHK", "Studio", "Shop", "Office"]),
    unitStatus: getOptions("unitStatus", ["Available", "Booked", "Sold", "Held"]),
    department: getOptions("department", ["Construction", "HR", "Sales", "Finance"]),
    employeeStatus: getOptions("employeeStatus", ["Active", "On Leave", "Terminated"]),
    attendanceStatus: getOptions("attendanceStatus", ["Present", "Absent", "Half-Day", "On Leave"]),
    leaveType: getOptions("leaveType", ["Casual", "Sick", "Earned"]),
    leaveStatus: getOptions("leaveStatus", ["Pending", "Approved", "Rejected"]),
    documentType: getOptions("documentType", ["Agreement", "RERA", "Finance", "Allotment", "NOC", "Other"]),
    documentStatus: getOptions("documentStatus", ["Pending", "Signed", "Active", "Sent"]),
    customerStatus: getOptions("customerStatus", ["Active", "Overdue", "Possession Given"]),
    bookingStatus: getOptions("bookingStatus", ["Confirmed", "Agreement Pending", "Agreement Signed"]),
    userRole: getOptions("userRole", ["Super Admin", "Manager", "Sales Agent", "Support Agent"]),
    supportCategory: getOptions("supportCategory", ["Maintenance", "Documentation", "General", "Finance", "Legal"]),
    supportPriority: getOptions("supportPriority", ["Critical", "High", "Medium", "Low"]),
    siteVisitStatus: getOptions("siteVisitStatus", ["Scheduled", "Completed", "Cancelled"]),
    supportStatus: getOptions("supportStatus", ["Open", "In Progress", "Resolved"]),
    commissionStatus: getOptions("commissionStatus", ["Pending Approval", "Payable", "Paid"]),
    aiReplies: getOptions("aiReply", [
      "Based on current data, Skyline Heights has the best ROI at 32% with 78% construction complete.",
      "Your lead pipeline shows 91 leads in active stages. I recommend following up with the Negotiation stage leads first.",
      "Green Valley Township has 154 available units — consider a targeted campaign for 2BHK inventory.",
      "Payment collection efficiency is at 72% this quarter. Lakshmi Krishnan's account requires immediate attention."
    ])
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context;
}
