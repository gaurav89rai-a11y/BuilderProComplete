import { useState, useEffect } from "react";
import { Shield, FileText, GitBranch, CreditCard, RefreshCw, Bell, Clock, Activity, ShoppingCart, Package, Users, FolderOpen, DollarSign } from "lucide-react";
import { api } from "../services/api.js";

import { C, themes, initialTheme } from "../config/theme.js";
import { hasPermission } from "../config/permissions.js";

import { LoginForm } from "../forms";
import { Sidebar, TopBar } from "../components/navigation";
import { ModuleErrorBoundary } from "../components/ModuleErrorBoundary.jsx";

// Import UI subcomponents
import { AlertCircle } from "lucide-react";

// Import all feature components
import { Dashboard } from "../features/dashboard/Dashboard.jsx";
import { Projects } from "../features/projects/Projects.jsx";
import { Inventory } from "../features/inventory/Inventory.jsx";
import { Leads } from "../features/leads/Leads.jsx";
import { Partners } from "../features/partners/Partners.jsx";
import { Customers } from "../features/customers/Customers.jsx";
import { SiteVisits } from "../features/visits/SiteVisits.jsx";
import { Bookings } from "../features/bookings/Bookings.jsx";
import { Payments } from "../features/payments/Payments.jsx";
import { Commission } from "../features/commissions/Commission.jsx";
import { Documents } from "../features/documents/Documents.jsx";
import { CustomerService } from "../features/support/CustomerService.jsx";
import { UserManagement } from "../features/users/UserManagement.jsx";
import { RERACompliance } from "../features/rera/RERACompliance.jsx";
import { AIAssistant } from "../features/ai/AIAssistant.jsx";
import { Workflow } from "../features/ai/Workflow.jsx";
import { Reports } from "../features/reports/Reports.jsx";
import { HRMS } from "../features/hrms/HRMS.jsx";
import { OMS } from "../features/oms/OMS.jsx";
import { FollowUp } from "../features/leads/FollowUp.jsx";
import { MaterialMaster } from "../features/oms/MaterialMaster.jsx";
import { MaterialStock } from "../features/oms/MaterialStock.jsx";
import { Vendors } from "../features/oms/Vendors.jsx";
import { StoreManagement } from "../features/oms/StoreManagement.jsx";
import { MaterialInventoryDashboard } from "../features/oms/MaterialInventoryDashboard.jsx";

/* ─── ACCESS DENIED ──────────────────────────────────────────────── */
function AccessDeniedView() {
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:80,flexDirection:"column",gap:16,background:C.card,border:`1px solid ${C.bord}`,borderRadius:16,textAlign:"center"}}>
      <div style={{background:`${C.red}18`,borderRadius:12,padding:16,color:C.red,display:"flex"}}><Shield size={36}/></div>
      <div>
        <div style={{color:C.txt,fontSize:18,fontWeight:700}}>Access Denied</div>
        <div style={{color:C.sub,fontSize:13,marginTop:6,maxWidth:380,lineHeight:1.5}}>
          You do not have permissions to view this module. Please switch to a user with higher privileges or contact the Super Admin for access.
        </div>
      </div>
    </div>
  );
}

/* ─── PLACEHOLDER VIEW ───────────────────────────────────────────── */
function PlaceholderView({ featureName, icon: Icon }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center", padding: 80,
      flexDirection: "column", gap: 16, background: C.card, border: `1px solid ${C.bord}`,
      borderRadius: 16, textAlign: "center", minHeight: "60vh"
    }}>
      <div style={{ background: `${C.gold}18`, borderRadius: "50%", padding: 20, color: C.gold, display: "flex" }}>
        <Icon size={48} />
      </div>
      <div>
        <div style={{ color: C.txt, fontSize: 20, fontWeight: 800 }}>{featureName} Dashboard</div>
        <div style={{ color: C.sub, fontSize: 13, marginTop: 8, maxWidth: 420, lineHeight: 1.6 }}>
          This feature is currently under active development. Our engineering team is integrating it with the Matrix Group core ERP module. Check back soon for real-time updates!
        </div>
      </div>
      <div style={{ background: C.raise, border: `1px solid ${C.bord}`, borderRadius: 10, padding: "10px 20px", display: "flex", alignItems: "center", gap: 8, color: C.mute, fontSize: 11, fontWeight: 600 }}>
        <AlertCircle size={14} color={C.gold} />
        ESTIMATED DEPLOYMENT: Q3 2026
      </div>
    </div>
  );
}

/* ─── MODULE MAP ─────────────────────────────────────────────────── */
const MODULES = {
  dashboard: Dashboard,
  leads: Leads,
  visits: SiteVisits,
  bookings: Bookings,
  customers: Customers,
  orders_oms: OMS,
  projects: Projects,
  inventory: Inventory,
  construction: Projects,
  payments: Payments,
  finance_rep: Reports,
  hrms_employees: HRMS,
  hrms_attendance: HRMS,
  hrms_leaves: HRMS,
  partners: Partners,
  tickets: CustomerService,
  reports: Reports,
  admin_users: UserManagement,
  roles_perms: UserManagement,

  // Functional views loaded with data:
  follow_up: FollowUp,
  material_master: MaterialMaster,
  stock: MaterialStock,
  vendors: Vendors,
  store: StoreManagement,
  inventory_oms: MaterialInventoryDashboard,
  engineers: (props) => <PlaceholderView featureName="Site Engineers Directory" icon={Users} {...props} />,
  labour: (props) => <PlaceholderView featureName="Labour Log Book" icon={Users} {...props} />,
  equipment: (props) => <PlaceholderView featureName="Heavy Equipment Tracker" icon={Activity} {...props} />,
  payment_schedule: (props) => <PlaceholderView featureName="Installments & Payment Schedule" icon={Clock} {...props} />,
  invoices: (props) => <PlaceholderView featureName="Invoices Registry" icon={CreditCard} {...props} />,
  expenses: (props) => <PlaceholderView featureName="Construction Expenses Log" icon={DollarSign} {...props} />,
  payroll: (props) => <PlaceholderView featureName="Payroll Registry" icon={DollarSign} {...props} />,
  performance: (props) => <PlaceholderView featureName="Employee Performance Evaluations" icon={Activity} {...props} />,
  permissions_admin: (props) => <PlaceholderView featureName="Roles & Permissions Control" icon={Shield} {...props} />,
  masters_admin: (props) => <PlaceholderView featureName="System Masters Registries" icon={FolderOpen} {...props} />,
  company_settings: (props) => <PlaceholderView featureName="Company Global Settings" icon={Activity} {...props} />,
};

/* ─── MAIN APP ───────────────────────────────────────────────────── */
export default function App() {
  const [mod,setMod]=useState("dashboard");
  const [col,setCol]=useState(false);
  const [theme,setTheme]=useState(initialTheme);
  const [currentUser, setCurrentUser] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const loadUsers = async () => {
    try {
      const u = await api.getUsers();
      setUsersList(u);
      const savedUserId = localStorage.getItem("current_user_id");
      const match = u.find(x => x.id === parseInt(savedUserId));
      if (match) {
        setCurrentUser(match);
        setIsAuthenticated(true);
      } else {
        setCurrentUser(u[0] || { id: 1, name: "Arjun Kapoor", email: "arjun@builderpro.com", role: "Super Admin", permissions: "all" });
      }
    } catch(e) {
      console.error(e);
      const fallback = { id: 1, name: "Arjun Kapoor", email: "arjun@builderpro.com", role: "Super Admin", permissions: "all" };
      setUsersList([fallback]);
      const savedUserId = localStorage.getItem("current_user_id");
      if (savedUserId === "1") {
        setCurrentUser(fallback);
        setIsAuthenticated(true);
      } else {
        setCurrentUser(fallback);
      }
    }
  };

  useEffect(() => {
    loadUsers();
  }, [mod]);

  const handleUserChange = (u) => {
    setCurrentUser(u);
    localStorage.setItem("current_user_id", u.id);
    if (!hasPermission(u, mod)) {
      setMod("dashboard");
    }
  };

  const handleLogin = (userObj) => {
    setCurrentUser(userObj);
    setIsAuthenticated(true);
    localStorage.setItem("current_user_id", userObj.id);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem("current_user_id");
  };

  const toggleTheme=()=>{
    const next=theme==="dark"?"light":"dark";
    Object.assign(C,themes[next]);
    setTheme(next);
    localStorage.setItem("theme",next);
  };

  useEffect(()=>{
    document.body.style.background=C.bg;
    document.body.style.color=C.txt;
    const root = document.documentElement;
    root.style.setProperty('--raise', C.raise);
    root.style.setProperty('--bord', C.bord);
    root.style.setProperty('--txt', C.txt);
  },[theme]);

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  const ActiveModule=MODULES[mod]||Dashboard;
  const isAllowed = hasPermission(currentUser, mod);
  return (
    <div style={{display:"flex",height:"100vh",background:C.bg,overflow:"hidden",color:C.txt}}>
      <Sidebar active={mod} setActive={setMod} col={col} setCol={setCol} user={currentUser} usersList={usersList} onSelectUser={handleUserChange} onLogout={handleLogout}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
        <TopBar mod={mod} theme={theme} toggleTheme={toggleTheme} user={currentUser}/>
        <main style={{flex:1,overflowY:"auto",overflowX:"hidden",padding:22}}>
          {isAllowed ? (
            <ModuleErrorBoundary moduleKey={mod}>
              <ActiveModule key={mod} activeModule={mod} currentUser={currentUser}/>
            </ModuleErrorBoundary>
          ) : <AccessDeniedView />}
        </main>
      </div>
    </div>
  );
}
