import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { api } from "../services/api.js";

const PermissionsContext = createContext(null);

export function PermissionsProvider({ children, currentUser }) {
  const [permissionsMap, setPermissionsMap] = useState({});
  const [isSuperAdmin, setIsSuperAdmin] = useState(currentUser?.role === "Super Admin");
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    if (!currentUser) {
      setPermissionsMap({});
      setIsSuperAdmin(false);
      setLoading(false);
      return;
    }

    if (currentUser.role === "Super Admin") {
      setIsSuperAdmin(true);
      setPermissionsMap({});
      setLoading(false);
      return;
    }

    setIsSuperAdmin(false);
    try {
      const res = await api.getMyPermissions();
      if (res && res.permissions) {
        setPermissionsMap(res.permissions);
        setIsSuperAdmin(!!res.isSuperAdmin);
      } else {
        // Fallback for mock mode or simple string permissions
        const perms = {};
        if (currentUser.permissions && currentUser.permissions !== "all") {
          currentUser.permissions.split(",").forEach(p => {
            perms[p.trim()] = true;
          });
        }
        setPermissionsMap(perms);
      }
    } catch (err) {
      console.warn("Failed to load permissions from API, falling back to local user role rules:", err);
      // Local fallback based on role
      const perms = {};
      if (currentUser.permissions && currentUser.permissions !== "all") {
        currentUser.permissions.split(",").forEach(p => {
          perms[p.trim()] = true;
        });
      }
      setPermissionsMap(perms);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const hasPermission = useCallback((code) => {
    if (!code) return true;
    if (isSuperAdmin || currentUser?.role === "Super Admin") return true;

    // Direct match in permission map
    if (permissionsMap[code] === true) return true;
    if (permissionsMap[code] === false) return false;

    // Check module-level wildcard or prefix (e.g., "Leads.*" or "Leads.View")
    const parts = code.split(".");
    if (parts.length > 1) {
      const moduleWildcard = `${parts[0]}.*`;
      if (permissionsMap[moduleWildcard] === true) return true;
      if (permissionsMap[moduleWildcard] === false) return false;
    }

    // Role-based baseline checks
    const role = currentUser?.role;
    if (role === "Sales Manager" || role === "Manager") {
      const allowedPrefixes = ["Dashboard", "Leads", "SiteVisits", "Bookings", "Customers", "ChannelPartners", "Commissions", "Projects", "Inventory", "Reports", "Support"];
      if (allowedPrefixes.some(p => code.startsWith(p))) {
        // Disallow high risk unless specifically granted
        if (code.includes("ManagePermissions") || code.includes("ConfigureSettings") || code.startsWith("Admin.")) {
          return false;
        }
        return true;
      }
    } else if (role === "Sales Agent") {
      const allowedPrefixes = ["Dashboard", "Leads", "SiteVisits", "Bookings", "Customers", "Projects", "Inventory"];
      if (allowedPrefixes.some(p => code.startsWith(p))) {
        if (code.includes("Delete") || code.includes("Approve") || code.includes("ManagePermissions") || code.startsWith("Admin.")) {
          return false;
        }
        return true;
      }
    } else if (role === "Accounts" || role === "Accountant") {
      const allowedPrefixes = ["Dashboard", "Payments", "Invoices", "Commissions", "Customers", "Bookings", "Reports"];
      if (allowedPrefixes.some(p => code.startsWith(p))) {
        if (code.includes("ManagePermissions") || code.startsWith("Admin.")) {
          return false;
        }
        return true;
      }
    } else if (role === "Channel Partner") {
      const allowedPrefixes = ["Dashboard", "Leads", "SiteVisits", "Bookings", "Customers", "Commissions"];
      if (allowedPrefixes.some(p => code.startsWith(p))) {
        if (code.includes("Delete") || code.includes("Approve") || code.includes("ManagePermissions") || code.startsWith("Admin.")) {
          return false;
        }
        return true;
      }
    }

    return false;
  }, [isSuperAdmin, currentUser, permissionsMap]);

  const hasAnyPermission = useCallback((codes = []) => {
    if (isSuperAdmin || currentUser?.role === "Super Admin") return true;
    return codes.some(c => hasPermission(c));
  }, [hasPermission, isSuperAdmin, currentUser]);

  const hasAllPermissions = useCallback((codes = []) => {
    if (isSuperAdmin || currentUser?.role === "Super Admin") return true;
    return codes.every(c => hasPermission(c));
  }, [hasPermission, isSuperAdmin, currentUser]);

  const value = {
    permissionsMap,
    isSuperAdmin,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refreshPermissions: fetchPermissions,
    currentUser,
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext);
  if (!ctx) {
    // Return safe fallback if not wrapped in provider
    return {
      permissionsMap: {},
      isSuperAdmin: true,
      loading: false,
      hasPermission: () => true,
      hasAnyPermission: () => true,
      hasAllPermissions: () => true,
      refreshPermissions: () => {},
      currentUser: null,
    };
  }
  return ctx;
}
