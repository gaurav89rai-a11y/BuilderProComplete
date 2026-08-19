export const fmtCr = n => {
  if (!n) return "₹0";
  if (n >= 10000000) return `₹${(n/10000000).toFixed(1)} Cr`;
  if (n >= 100000) return `₹${(n/100000).toFixed(1)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
};

export const BM = {
  Available:{b:"#0A2E1F",c:"#0EC8A4"},Sold:{b:"#2E0A0A",c:"#FF4F4F"},
  Booked:{b:"#2E1F0A",c:"#FF9F43"},Held:{b:"#0A152E",c:"#4B8CF5"},
  Active:{b:"#0A2E1F",c:"#0EC8A4"},"Nearing Handover":{b:"#0A2E1F",c:"#0EC8A4"},
  "Pre-launch":{b:"#0A152E",c:"#4B8CF5"},Compliant:{b:"#0A2E1F",c:"#0EC8A4"},
  "Action Required":{b:"#2E0A0A",c:"#FF4F4F"},"Expiring Soon":{b:"#2E1F0A",c:"#FF9F43"},
  "Recently Registered":{b:"#0A152E",c:"#4B8CF5"},Overdue:{b:"#2E0A0A",c:"#FF4F4F"},
  Confirmed:{b:"#0A2E1F",c:"#0EC8A4"},"Agreement Pending":{b:"#2E1F0A",c:"#FF9F43"},
  "Agreement Signed":{b:"#0A152E",c:"#4B8CF5"},"Possession Given":{b:"#201535",c:"#C9A843"},
  Open:{b:"#2E0A0A",c:"#FF4F4F"},"In Progress":{b:"#2E1F0A",c:"#FF9F43"},
  Resolved:{b:"#0A2E1F",c:"#0EC8A4"},Critical:{b:"#2E0A0A",c:"#FF4F4F"},
  High:{b:"#2E1A0A",c:"#FF7043"},Medium:{b:"#2E1F0A",c:"#FF9F43"},Low:{b:"#0A2E1F",c:"#0EC8A4"},
  Platinum:{b:"#201535",c:"#C9A843"},Gold:{b:"#2E1F0A",c:"#FF9F43"},Silver:{b:"#151A2E",c:"#8897B8"},
  Payable:{b:"#2E1F0A",c:"#FF9F43"},"Pending Approval":{b:"#0A152E",c:"#4B8CF5"},Paid:{b:"#0A2E1F",c:"#0EC8A4"},
  Scheduled:{b:"#0A152E",c:"#4B8CF5"},Completed:{b:"#0A2E1F",c:"#0EC8A4"},Cancelled:{b:"#2E0A0A",c:"#FF4F4F"},
  Signed:{b:"#0A2E1F",c:"#0EC8A4"},Sent:{b:"#0A152E",c:"#4B8CF5"},Pending:{b:"#2E1F0A",c:"#FF9F43"},
  Filed:{b:"#0A2E1F",c:"#0EC8A4"},"N/A":{b:"#151A2E",c:"#8897B8"},
};

export const allPermissionsList = [
  {key:"view_dashboard",label:"Dashboard",desc:"View dashboard graphs, reports and AI Assistant"},
  {key:"manage_projects",label:"Projects & Compliance",desc:"Manage project details, documents and RERA"},
  {key:"manage_inventory",label:"Inventory",desc:"Add and view units inventory"},
  {key:"manage_leads",label:"Leads CRM",desc:"Manage leads pipeline and contact logs"},
  {key:"manage_partners",label:"Channel Partners",desc:"View and edit partner brokers"},
  {key:"manage_customers",label:"Customers",desc:"Manage clients and payment progress"},
  {key:"manage_visits",label:"Site Visits",desc:"Schedule and cancel client site visits"},
  {key:"manage_bookings",label:"Bookings",desc:"Create and view bookings"},
  {key:"manage_finance",label:"Finance & Commissions",desc:"Manage payments and commissions approval"},
  {key:"manage_support",label:"Customer Service",desc:"Manage and resolve client support tickets"},
  {key:"manage_users",label:"User Management",desc:"Create and edit user accounts & permissions"},
];

export const numberToWords = (num) => {
  if (num === 0) return "Zero";
  if (!num || isNaN(num)) return "";
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  
  const convertLessThanOneThousand = (n) => {
    if (n === 0) return "";
    if (n < 20) return a[n];
    const digit = n % 10;
    if (n < 100) return b[Math.floor(n / 10)] + (digit ? " " + a[digit] : "");
    return a[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " and " + convertLessThanOneThousand(n % 100) : "");
  };
  
  let n = parseInt(num);
  if (isNaN(n)) return "";
  
  let result = "";
  // Crores (10,000,000)
  if (n >= 10000000) {
    result += convertLessThanOneThousand(Math.floor(n / 10000000)) + " Crore ";
    n %= 10000000;
  }
  // Lakhs (100,000)
  if (n >= 100000) {
    result += convertLessThanOneThousand(Math.floor(n / 100000)) + " Lakh ";
    n %= 100000;
  }
  // Thousands (1,000)
  if (n >= 1000) {
    result += convertLessThanOneThousand(Math.floor(n / 1000)) + " Thousand ";
    n %= 1000;
  }
  // Hundreds
  if (n > 0) {
    result += convertLessThanOneThousand(n);
  }
  
  return result.trim() + " Rupees Only";
};
