import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Shield, Key, Users, Check, X, ChevronDown, ChevronRight,
  Save, RotateCcw, AlertTriangle, History, ArrowRightLeft,
  CheckSquare, Square, Search, Filter, Lock, Info
} from "lucide-react";
import { api } from "../../services/api.js";
import { C } from "../../config/theme.js";
import { Btn, Modal, Field, Input, Select, LoadingState, ErrorState, Toast, STitle } from "../../components/ui";

function normalizeMatrix(raw) {
  if (!raw || !raw.modules) return { roles: raw?.roles || [], modules: [] };
  const normalizedModules = raw.modules.map(m => {
    const rawSubs = m.submodules || m.submenus || [];
    return {
      moduleName: m.moduleName || m.module || "General",
      submodules: rawSubs.map(s => {
        const rawPerms = s.permissions || [];
        return {
          submoduleName: s.submoduleName || s.submenu || "Operations",
          permissions: rawPerms.map(p => ({
            id: p.id,
            code: p.code,
            name: p.name,
            actionType: p.actionType || p.action || "View",
            description: p.description || p.name,
            isHighRisk: p.isHighRisk || p.isSensitive || false,
            category: p.category || "General"
          }))
        };
      })
    };
  });
  return { roles: raw.roles || [], modules: normalizedModules };
}

export function RolesAndPermissions({ initialRoleId = null }) {
  // Mode: "role" or "user"
  const [configMode, setConfigMode] = useState("role");
  
  // Selection
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(initialRoleId || 1);
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Matrix and permissions data
  const [matrixData, setMatrixData] = useState({ roles: [], modules: [] });
  const [activePermissions, setActivePermissions] = useState(new Set());
  const [initialPermissions, setInitialPermissions] = useState(new Set());
  const [userOverrides, setUserOverrides] = useState({}); // code -> true/false
  const [initialUserOverrides, setInitialUserOverrides] = useState({});
  const [userBaseRolePermissions, setUserBaseRolePermissions] = useState(new Set());

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedModules, setExpandedModules] = useState({});
  const [filterAction, setFilterAction] = useState("all");

  // Modals
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareRoleA, setCompareRoleA] = useState(1);
  const [compareRoleB, setCompareRoleB] = useState(2);
  const [comparePermissionsA, setComparePermissionsA] = useState(new Set());
  const [comparePermissionsB, setComparePermissionsB] = useState(new Set());

  const [highRiskPrompt, setHighRiskPrompt] = useState(null);
  const [saveReason, setSaveReason] = useState("");
  const [showConfirmSaveModal, setShowConfirmSaveModal] = useState(false);

  // 1. Initial Load of Roles, Users, and Permissions Matrix
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rolesRes, usersRes, matrixRes] = await Promise.all([
        api.getRoles(),
        api.getUsers(),
        api.getPermissionsMatrix(),
      ]);
      setRoles(rolesRes || []);
      setUsers(usersRes || []);
      const normalizedMatrix = normalizeMatrix(matrixRes);
      setMatrixData(normalizedMatrix);

      // Auto-expand all modules initially
      if (normalizedMatrix && normalizedMatrix.modules) {
        const exp = {};
        normalizedMatrix.modules.forEach(m => { exp[m.moduleName] = true; });
        setExpandedModules(exp);
      }

      const defaultRole = (rolesRes && rolesRes.length > 0) ? (initialRoleId || rolesRes[0].id) : 1;
      setSelectedRoleId(defaultRole);
      if (usersRes && usersRes.length > 0) {
        setSelectedUserId(usersRes[0].id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [initialRoleId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // 2. Load Role Permissions when selectedRoleId changes
  const loadRolePermissions = useCallback(async (roleId) => {
    if (!roleId) return;
    try {
      const res = await api.getRolePermissions(roleId);
      const permList = res?.permissions || [];
      const permSet = new Set(permList);
      setActivePermissions(permSet);
      setInitialPermissions(new Set(permList));
    } catch (err) {
      setToast({ type: "error", message: `Failed to load role permissions: ${err.message}` });
    }
  }, []);

  // 3. Load User Overrides when selectedUserId changes
  const loadUserPermissions = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const res = await api.getUserPermissions(userId);
      const basePerms = new Set(res?.rolePermissions || []);
      setUserBaseRolePermissions(basePerms);

      const overrides = {};
      (res?.userOverrides || []).forEach(o => {
        overrides[o.permissionCode] = o.isGranted;
      });
      setUserOverrides(overrides);
      setInitialUserOverrides({ ...overrides });
    } catch (err) {
      setToast({ type: "error", message: `Failed to load user permissions: ${err.message}` });
    }
  }, []);

  useEffect(() => {
    if (configMode === "role") {
      loadRolePermissions(selectedRoleId);
    } else {
      loadUserPermissions(selectedUserId);
    }
  }, [configMode, selectedRoleId, selectedUserId, loadRolePermissions, loadUserPermissions]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (configMode === "role") {
      if (activePermissions.size !== initialPermissions.size) return true;
      for (const p of activePermissions) {
        if (!initialPermissions.has(p)) return true;
      }
      return false;
    } else {
      const curKeys = Object.keys(userOverrides);
      const initKeys = Object.keys(initialUserOverrides);
      if (curKeys.length !== initKeys.length) return true;
      return curKeys.some(k => userOverrides[k] !== initialUserOverrides[k]);
    }
  }, [configMode, activePermissions, initialPermissions, userOverrides, initialUserOverrides]);

  // Toggle Module Accordion
  const toggleModule = (moduleName) => {
    setExpandedModules(p => ({ ...p, [moduleName]: !p[moduleName] }));
  };

  // Current Role Object
  const currentRole = useMemo(() => {
    return roles.find(r => r.id === parseInt(selectedRoleId)) || null;
  }, [roles, selectedRoleId]);

  const isSuperAdminRole = currentRole?.name === "Super Admin";

  // Permission Toggle Handlers for Role Mode
  const handleToggleRolePermission = (perm) => {
    if (isSuperAdminRole) return; // Super Admin cannot be restricted

    const code = perm.code;
    const isAdding = !activePermissions.has(code);

    if (isAdding && perm.isHighRisk) {
      setHighRiskPrompt({
        perm,
        onConfirm: () => {
          setActivePermissions(prev => {
            const next = new Set(prev);
            next.add(code);
            return next;
          });
          setHighRiskPrompt(null);
        }
      });
      return;
    }

    setActivePermissions(prev => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  // User Override Handler
  // Cycles: Inherited -> Explicit Grant (true) -> Explicit Deny (false) -> Inherited (remove override)
  const handleToggleUserPermission = (perm) => {
    const code = perm.code;
    const currentOverride = userOverrides[code];

    setUserOverrides(prev => {
      const next = { ...prev };
      if (currentOverride === undefined) {
        // Step 1: Explicit Grant
        next[code] = true;
      } else if (currentOverride === true) {
        // Step 2: Explicit Deny
        next[code] = false;
      } else {
        // Step 3: Remove override (back to Inherited)
        delete next[code];
      }
      return next;
    });
  };

  // Bulk Select / Deselect for a Module
  const handleModuleSelectAll = (moduleObj, selectAll) => {
    if (isSuperAdminRole && configMode === "role") return;

    const codes = [];
    moduleObj.submodules.forEach(sub => {
      sub.permissions.forEach(p => codes.push(p.code));
    });

    if (configMode === "role") {
      setActivePermissions(prev => {
        const next = new Set(prev);
        codes.forEach(c => {
          if (selectAll) next.add(c);
          else next.delete(c);
        });
        return next;
      });
    } else {
      setUserOverrides(prev => {
        const next = { ...prev };
        codes.forEach(c => {
          if (selectAll) next[c] = true;
          else delete next[c];
        });
        return next;
      });
    }
  };

  // Bulk Select / Deselect for a Submodule
  const handleSubmoduleSelectAll = (submoduleObj, selectAll) => {
    if (isSuperAdminRole && configMode === "role") return;

    const codes = submoduleObj.permissions.map(p => p.code);
    if (configMode === "role") {
      setActivePermissions(prev => {
        const next = new Set(prev);
        codes.forEach(c => {
          if (selectAll) next.add(c);
          else next.delete(c);
        });
        return next;
      });
    } else {
      setUserOverrides(prev => {
        const next = { ...prev };
        codes.forEach(c => {
          if (selectAll) next[c] = true;
          else delete next[c];
        });
        return next;
      });
    }
  };

  // Global Select All / None
  const handleGlobalSelectAll = (selectAll) => {
    if (isSuperAdminRole && configMode === "role") return;

    const allCodes = [];
    matrixData.modules.forEach(m => {
      m.submodules.forEach(s => {
        s.permissions.forEach(p => allCodes.push(p.code));
      });
    });

    if (configMode === "role") {
      setActivePermissions(selectAll ? new Set(allCodes) : new Set());
    } else {
      if (selectAll) {
        const overrides = {};
        allCodes.forEach(c => { overrides[c] = true; });
        setUserOverrides(overrides);
      } else {
        setUserOverrides({});
      }
    }
  };

  // Reset to initial
  const handleReset = () => {
    if (configMode === "role") {
      setActivePermissions(new Set(initialPermissions));
    } else {
      setUserOverrides({ ...initialUserOverrides });
    }
    setToast({ type: "info", message: "Changes reset to saved state." });
  };

  // Trigger Save with optional reason prompt
  const handleSaveClick = () => {
    setSaveReason(`Updated permissions for ${configMode === "role" ? currentRole?.name : "user"}`);
    setShowConfirmSaveModal(true);
  };

  const executeSave = async () => {
    setShowConfirmSaveModal(false);
    setSaving(true);
    try {
      if (configMode === "role") {
        await api.saveRolePermissions(selectedRoleId, {
          permissions: Array.from(activePermissions),
          reason: saveReason,
        });
        setInitialPermissions(new Set(activePermissions));
        setToast({ type: "success", message: `Role permissions for '${currentRole?.name}' updated successfully.` });
      } else {
        const overridesArray = Object.entries(userOverrides).map(([permissionCode, isGranted]) => ({
          permissionCode,
          isGranted,
        }));
        await api.saveUserPermissions(selectedUserId, {
          overrides: overridesArray,
          reason: saveReason,
        });
        setInitialUserOverrides({ ...userOverrides });
        setToast({ type: "success", message: "User permission overrides saved successfully." });
      }
    } catch (err) {
      setToast({ type: "error", message: `Save failed: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  // Audit Logs
  const handleOpenAudit = async () => {
    setShowAuditModal(true);
    setLoadingAudit(true);
    try {
      const logs = await api.getPermissionAuditLogs();
      setAuditLogs(logs || []);
    } catch (err) {
      setToast({ type: "error", message: `Failed to fetch audit trail: ${err.message}` });
    } finally {
      setLoadingAudit(false);
    }
  };

  // Compare Permissions
  const handleOpenCompare = async () => {
    setShowCompareModal(true);
    try {
      const [resA, resB] = await Promise.all([
        api.getRolePermissions(compareRoleA),
        api.getRolePermissions(compareRoleB),
      ]);
      setComparePermissionsA(new Set(resA?.permissions || []));
      setComparePermissionsB(new Set(resB?.permissions || []));
    } catch (err) {
      setToast({ type: "error", message: err.message });
    }
  };

  const handleUpdateCompareRoles = async (roleA, roleB) => {
    setCompareRoleA(roleA);
    setCompareRoleB(roleB);
    try {
      const [resA, resB] = await Promise.all([
        api.getRolePermissions(roleA),
        api.getRolePermissions(roleB),
      ]);
      setComparePermissionsA(new Set(resA?.permissions || []));
      setComparePermissionsB(new Set(resB?.permissions || []));
    } catch (err) {
      setToast({ type: "error", message: err.message });
    }
  };

  // Filtered Matrix Data
  const filteredModules = useMemo(() => {
    if (!matrixData.modules) return [];
    const query = searchQuery.trim().toLowerCase();

    return matrixData.modules.map(mod => {
      const filteredSubmodules = mod.submodules.map(sub => {
        const filteredPerms = sub.permissions.filter(p => {
          // Action filter
          if (filterAction !== "all" && p.actionType.toLowerCase() !== filterAction.toLowerCase()) {
            return false;
          }
          // Search query
          if (query) {
            const matchesCode = p.code.toLowerCase().includes(query);
            const matchesName = p.name.toLowerCase().includes(query);
            const matchesDesc = (p.description || "").toLowerCase().includes(query);
            return matchesCode || matchesName || matchesDesc;
          }
          return true;
        });

        return { ...sub, permissions: filteredPerms };
      }).filter(sub => sub.permissions.length > 0);

      return { ...mod, submodules: filteredSubmodules };
    }).filter(mod => mod.submodules.length > 0);
  }, [matrixData, searchQuery, filterAction]);

  if (loading && roles.length === 0) return <LoadingState text="Loading Permission Hierarchy Matrix..." />;
  if (error && roles.length === 0) return <ErrorState text={error} onRetry={loadInitialData} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
        <div>
          <STitle
            title="Permission Administration & Access Control Matrix"
            sub="Configure 119 granular action permissions, enforce zero-trust role boundaries, and manage user overrides"
          />
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Btn variant="outline" onClick={handleOpenCompare} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <ArrowRightLeft size={14} /> Compare Roles
          </Btn>
          <Btn variant="outline" onClick={handleOpenAudit} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <History size={14} /> Audit Trail
          </Btn>
        </div>
      </div>

      {/* Control Banner: Mode Switcher & Selector */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.bord}`,
          borderRadius: 14,
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          {/* Mode Switcher Tabs */}
          <div style={{ display: "flex", background: C.raise, borderRadius: 10, padding: 4, border: `1px solid ${C.bord}` }}>
            <button
              onClick={() => setConfigMode("role")}
              style={{
                padding: "8px 18px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                background: configMode === "role" ? C.gold : "transparent",
                color: configMode === "role" ? "#000" : C.txt,
                fontWeight: 700,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.15s",
              }}
            >
              <Shield size={16} /> Role Baseline Configuration
            </button>
            <button
              onClick={() => setConfigMode("user")}
              style={{
                padding: "8px 18px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                background: configMode === "user" ? C.gold : "transparent",
                color: configMode === "user" ? "#000" : C.txt,
                fontWeight: 700,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.15s",
              }}
            >
              <Users size={16} /> User-Specific Overrides
            </button>
          </div>

          {/* Target Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: C.sub, fontWeight: 600 }}>
              {configMode === "role" ? "TARGET ROLE:" : "TARGET USER:"}
            </span>

            {configMode === "role" ? (
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(parseInt(e.target.value))}
                style={{
                  background: C.raise,
                  border: `1px solid ${C.gold}`,
                  color: C.txt,
                  padding: "8px 16px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  outline: "none",
                  cursor: "pointer",
                  minWidth: 200,
                }}
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} {r.isSystemRole ? "(System)" : "(Custom)"}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={selectedUserId || ""}
                onChange={(e) => setSelectedUserId(parseInt(e.target.value))}
                style={{
                  background: C.raise,
                  border: `1px solid ${C.gold}`,
                  color: C.txt,
                  padding: "8px 16px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  outline: "none",
                  cursor: "pointer",
                  minWidth: 240,
                }}
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — [{u.role || "No Role"}]
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Informational Subtext */}
        {configMode === "role" && isSuperAdminRole ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "rgba(201, 168, 67, 0.1)",
              border: `1px solid ${C.gold}40`,
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 12,
              color: C.gold,
            }}
          >
            <Lock size={16} />
            <span>
              <strong>Super Admin Protection:</strong> The Super Admin role possesses full unconditional access to all 119 actions and system configurations. Permissions for this role cannot be restricted.
            </span>
          </div>
        ) : configMode === "user" ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "rgba(59, 130, 246, 0.1)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 12,
              color: "#93c5fd",
            }}
          >
            <Info size={16} />
            <span>
              <strong>User Overrides Legend:</strong> Click permission badge to cycle state:
              <span style={{ margin: "0 6px", color: "#9ca3af" }}>• Inherited from Role</span>
              <span style={{ margin: "0 6px", color: "#4ade80" }}>• Explicitly Granted</span>
              <span style={{ margin: "0 6px", color: "#ef4444" }}>• Explicitly Denied</span>
            </span>
          </div>
        ) : null}

        {/* Search, Filter & Bulk Actions Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, paddingTop: 10, borderTop: `1px solid ${C.bord}` }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flex: 1, minWidth: 280 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: C.mute }} />
              <input
                type="text"
                placeholder="Search by permission code, action or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  background: C.raise,
                  border: `1px solid ${C.bord}`,
                  borderRadius: 8,
                  padding: "8px 12px 8px 32px",
                  color: C.txt,
                  fontSize: 12,
                  outline: "none",
                }}
              />
            </div>

            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              style={{
                background: C.raise,
                border: `1px solid ${C.bord}`,
                color: C.txt,
                padding: "8px 12px",
                borderRadius: 8,
                fontSize: 12,
                outline: "none",
              }}
            >
              <option value="all">All Actions (17 Types)</option>
              <option value="View">View</option>
              <option value="Create">Create</option>
              <option value="Edit">Edit</option>
              <option value="Update">Update</option>
              <option value="Delete">Delete</option>
              <option value="ApproveReject">Approve/Reject</option>
              <option value="ChangeStatus">Change Status</option>
              <option value="ImportExport">Import/Export</option>
              <option value="ViewSensitiveData">Sensitive Data</option>
              <option value="ManagePermissions">Permissions Admin</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Btn
              variant="outline"
              disabled={isSuperAdminRole && configMode === "role"}
              onClick={() => handleGlobalSelectAll(true)}
              style={{ fontSize: 11, padding: "6px 12px" }}
            >
              <CheckSquare size={13} style={{ marginRight: 5 }} /> Select All (119)
            </Btn>
            <Btn
              variant="outline"
              disabled={isSuperAdminRole && configMode === "role"}
              onClick={() => handleGlobalSelectAll(false)}
              style={{ fontSize: 11, padding: "6px 12px" }}
            >
              <Square size={13} style={{ marginRight: 5 }} /> Deselect All
            </Btn>
          </div>
        </div>
      </div>

      {/* Permissions Tree Matrix */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {filteredModules.map((moduleObj) => {
          const isExpanded = !!expandedModules[moduleObj.moduleName];
          
          // Calculate active count for this module
          let moduleTotal = 0;
          let moduleActive = 0;
          moduleObj.submodules.forEach(sub => {
            sub.permissions.forEach(p => {
              moduleTotal++;
              if (configMode === "role") {
                if (isSuperAdminRole || activePermissions.has(p.code)) moduleActive++;
              } else {
                const override = userOverrides[p.code];
                if (override === true) moduleActive++;
                else if (override === false) { /* revoked */ }
                else if (userBaseRolePermissions.has(p.code)) moduleActive++;
              }
            });
          });

          return (
            <div
              key={moduleObj.moduleName}
              style={{
                background: C.card,
                border: `1px solid ${C.bord}`,
                borderRadius: 12,
                overflow: "hidden",
                transition: "all 0.2s",
              }}
            >
              {/* Module Header Bar */}
              <div
                style={{
                  padding: "14px 18px",
                  background: C.raise,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  userSelect: "none",
                }}
                onClick={() => toggleModule(moduleObj.moduleName)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {isExpanded ? <ChevronDown size={18} color={C.gold} /> : <ChevronRight size={18} color={C.mute} />}
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.txt }}>
                    {moduleObj.moduleName}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 12,
                      background: moduleActive > 0 ? `${C.gold}20` : C.bord,
                      color: moduleActive > 0 ? C.gold : C.mute,
                    }}
                  >
                    {moduleActive} / {moduleTotal} Enabled
                  </span>
                </div>

                <div
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    disabled={isSuperAdminRole && configMode === "role"}
                    onClick={() => handleModuleSelectAll(moduleObj, true)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: C.sub,
                      fontSize: 11,
                      cursor: "pointer",
                      padding: "4px 8px",
                    }}
                  >
                    Grant All
                  </button>
                  <span style={{ color: C.mute, fontSize: 11 }}>|</span>
                  <button
                    disabled={isSuperAdminRole && configMode === "role"}
                    onClick={() => handleModuleSelectAll(moduleObj, false)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: C.sub,
                      fontSize: 11,
                      cursor: "pointer",
                      padding: "4px 8px",
                    }}
                  >
                    Revoke All
                  </button>
                </div>
              </div>

              {/* Module Content: Submodules & Actions */}
              {isExpanded && (
                <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 18 }}>
                  {moduleObj.submodules.map((submoduleObj) => (
                    <div
                      key={submoduleObj.submoduleName}
                      style={{
                        background: "rgba(255, 255, 255, 0.015)",
                        border: `1px solid ${C.bord}`,
                        borderRadius: 10,
                        padding: 14,
                      }}
                    >
                      {/* Submodule Header */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 12,
                          paddingBottom: 8,
                          borderBottom: `1px solid ${C.bord}`,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Key size={14} color={C.gold} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: C.txt }}>
                            {submoduleObj.submoduleName}
                          </span>
                        </div>

                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            disabled={isSuperAdminRole && configMode === "role"}
                            onClick={() => handleSubmoduleSelectAll(submoduleObj, true)}
                            style={{
                              background: C.raise,
                              border: `1px solid ${C.bord}`,
                              color: C.sub,
                              borderRadius: 4,
                              fontSize: 10,
                              cursor: "pointer",
                              padding: "2px 8px",
                            }}
                          >
                            + All
                          </button>
                          <button
                            disabled={isSuperAdminRole && configMode === "role"}
                            onClick={() => handleSubmoduleSelectAll(submoduleObj, false)}
                            style={{
                              background: C.raise,
                              border: `1px solid ${C.bord}`,
                              color: C.sub,
                              borderRadius: 4,
                              fontSize: 10,
                              cursor: "pointer",
                              padding: "2px 8px",
                            }}
                          >
                            - None
                          </button>
                        </div>
                      </div>

                      {/* Permissions Grid */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                          gap: 10,
                        }}
                      >
                        {submoduleObj.permissions.map((perm) => {
                          const isHighRisk = perm.isHighRisk;

                          if (configMode === "role") {
                            const isGranted = isSuperAdminRole || activePermissions.has(perm.code);
                            return (
                              <div
                                key={perm.id}
                                onClick={() => handleToggleRolePermission(perm)}
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: 10,
                                  padding: "10px 12px",
                                  borderRadius: 8,
                                  cursor: isSuperAdminRole ? "not-allowed" : "pointer",
                                  background: isGranted ? `${C.gold}14` : C.raise,
                                  border: `1px solid ${isGranted ? `${C.gold}50` : C.bord}`,
                                  transition: "all 0.15s",
                                }}
                              >
                                <div
                                  style={{
                                    width: 18,
                                    height: 18,
                                    borderRadius: 4,
                                    marginTop: 1,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: isGranted ? C.gold : "transparent",
                                    border: `1px solid ${isGranted ? C.gold : C.mute}`,
                                    color: "#000",
                                    flexShrink: 0,
                                  }}
                                >
                                  {isGranted && <Check size={12} strokeWidth={3} />}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: C.txt }}>
                                      {perm.actionType}
                                    </span>
                                    {isHighRisk && (
                                      <span
                                        style={{
                                          fontSize: 9,
                                          fontWeight: 800,
                                          padding: "1px 5px",
                                          borderRadius: 4,
                                          background: "rgba(239, 68, 68, 0.2)",
                                          color: "#ef4444",
                                          border: "1px solid rgba(239, 68, 68, 0.4)",
                                        }}
                                      >
                                        HIGH RISK
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>
                                    {perm.description || perm.name}
                                  </div>
                                  <div style={{ fontSize: 10, color: C.mute, marginTop: 4, fontFamily: "monospace" }}>
                                    {perm.code}
                                  </div>
                                </div>
                              </div>
                            );
                          } else {
                            // User Overrides Mode
                            const overrideVal = userOverrides[perm.code]; // undefined, true, or false
                            const isInheritedGranted = userBaseRolePermissions.has(perm.code);
                            const effectiveGranted = overrideVal !== undefined ? overrideVal : isInheritedGranted;

                            let badgeBg = C.raise;
                            let badgeBorder = C.bord;
                            let badgeLabel = isInheritedGranted ? "Inherited (Allow)" : "Inherited (Deny)";
                            let badgeColor = C.mute;

                            if (overrideVal === true) {
                              badgeBg = "rgba(34, 197, 94, 0.15)";
                              badgeBorder = "rgba(34, 197, 94, 0.4)";
                              badgeLabel = "Explicitly Granted";
                              badgeColor = "#4ade80";
                            } else if (overrideVal === false) {
                              badgeBg = "rgba(239, 68, 68, 0.15)";
                              badgeBorder = "rgba(239, 68, 68, 0.4)";
                              badgeLabel = "Explicitly Denied";
                              badgeColor = "#ef4444";
                            }

                            return (
                              <div
                                key={perm.id}
                                onClick={() => handleToggleUserPermission(perm)}
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 6,
                                  padding: "10px 12px",
                                  borderRadius: 8,
                                  cursor: "pointer",
                                  background: effectiveGranted ? "rgba(201, 168, 67, 0.08)" : C.raise,
                                  border: `1px solid ${overrideVal !== undefined ? badgeBorder : C.bord}`,
                                  transition: "all 0.15s",
                                }}
                              >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: C.txt }}>
                                    {perm.actionType}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 700,
                                      padding: "2px 6px",
                                      borderRadius: 4,
                                      background: badgeBg,
                                      color: badgeColor,
                                      border: `1px solid ${badgeBorder}`,
                                    }}
                                  >
                                    {badgeLabel}
                                  </span>
                                </div>
                                <div style={{ fontSize: 11, color: C.sub }}>
                                  {perm.description || perm.name}
                                </div>
                                <div style={{ fontSize: 10, color: C.mute, fontFamily: "monospace" }}>
                                  {perm.code}
                                </div>
                              </div>
                            );
                          }
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Sticky Action Bar when there are unsaved changes */}
      {hasUnsavedChanges && (
        <div
          style={{
            position: "sticky",
            bottom: 20,
            background: "#0c1322",
            border: `1px solid ${C.gold}`,
            boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
            borderRadius: 12,
            padding: "14px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 14,
            zIndex: 100,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <AlertTriangle size={18} color={C.gold} />
            <span style={{ fontSize: 13, fontWeight: 600, color: C.txt }}>
              You have unsaved permission modifications for{" "}
              <strong>{configMode === "role" ? currentRole?.name : "selected user"}</strong>.
            </span>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="outline" onClick={handleReset} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <RotateCcw size={14} /> Reset Changes
            </Btn>
            <Btn
              disabled={saving}
              onClick={handleSaveClick}
              style={{
                background: C.gold,
                color: "#000",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Save size={14} /> {saving ? "Saving..." : "Save Policy Changes"}
            </Btn>
          </div>
        </div>
      )}

      {/* High Risk Confirmation Modal */}
      {highRiskPrompt && (
        <Modal title="High-Risk Permission Confirmation" onClose={() => setHighRiskPrompt(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                display: "flex",
                gap: 12,
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                padding: 16,
                borderRadius: 10,
              }}
            >
              <AlertTriangle size={24} color="#ef4444" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>
                  Granting High-Risk Capability: {highRiskPrompt.perm.code}
                </div>
                <div style={{ fontSize: 12, color: "#fca5a5", marginTop: 4, lineHeight: 1.5 }}>
                  This permission permits permanent modifications, data deletion, financial alterations, or security privilege delegation. Ensuring principle of least privilege is strictly advised.
                </div>
              </div>
            </div>

            <div style={{ fontSize: 13, color: C.sub }}>
              Are you sure you want to grant this capability to role <strong>{currentRole?.name}</strong>?
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
              <Btn variant="outline" onClick={() => setHighRiskPrompt(null)}>
                Cancel
              </Btn>
              <Btn
                onClick={highRiskPrompt.onConfirm}
                style={{ background: "#ef4444", color: "#fff", fontWeight: 700 }}
              >
                Confirm & Grant
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm Save & Audit Reason Modal */}
      {showConfirmSaveModal && (
        <Modal title="Confirm Permission Updates" onClose={() => setShowConfirmSaveModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 13, color: C.txt }}>
              You are about to commit permission updates for{" "}
              <strong>{configMode === "role" ? `Role: ${currentRole?.name}` : "User Overrides"}</strong>. This action will be logged in the immutable security audit trail.
            </p>

            <Field label="Audit Reason / Justification" required>
              <Input
                value={saveReason}
                onChange={(e) => setSaveReason(e.target.value)}
                placeholder="e.g. Q4 sales team role update or access review..."
                required
              />
            </Field>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
              <Btn variant="outline" onClick={() => setShowConfirmSaveModal(false)}>
                Cancel
              </Btn>
              <Btn
                onClick={executeSave}
                disabled={saving || !saveReason.trim()}
                style={{ background: C.gold, color: "#000", fontWeight: 700 }}
              >
                {saving ? "Commiting..." : "Confirm & Save"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Audit Logs Modal */}
      {showAuditModal && (
        <Modal title="Permission Security Audit Trail" onClose={() => setShowAuditModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: "70vh", overflowY: "auto" }}>
            <p style={{ fontSize: 12, color: C.sub }}>
              Every modification to roles, granular permissions, and user overrides is recorded with user identity and rationale.
            </p>

            {loadingAudit ? (
              <LoadingState text="Loading audit logs..." />
            ) : auditLogs.length === 0 ? (
              <div style={{ textAlign: "center", padding: 30, color: C.mute, fontSize: 13 }}>
                No permission modification events recorded yet.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      background: C.raise,
                      border: `1px solid ${C.bord}`,
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 12,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", color: C.txt, fontWeight: 700 }}>
                      <span>
                        {log.action} on {log.targetType}: <strong>{log.targetName}</strong>
                      </span>
                      <span style={{ fontSize: 11, color: C.mute }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ color: C.sub, marginTop: 4 }}>
                      Performed by: <strong>{log.performedBy}</strong>
                    </div>
                    {log.reason && (
                      <div style={{ color: C.gold, fontSize: 11, marginTop: 2 }}>
                        Reason: {log.reason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Compare Roles Modal */}
      {showCompareModal && (
        <Modal title="Compare Role Permissions Side-by-Side" onClose={() => setShowCompareModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, maxHeight: "75vh", overflowY: "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: C.mute, fontWeight: 600 }}>ROLE A</label>
                <select
                  value={compareRoleA}
                  onChange={(e) => handleUpdateCompareRoles(parseInt(e.target.value), compareRoleB)}
                  style={{
                    width: "100%",
                    background: C.raise,
                    border: `1px solid ${C.bord}`,
                    color: C.txt,
                    padding: "8px 12px",
                    borderRadius: 8,
                    fontSize: 13,
                    marginTop: 4,
                  }}
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, color: C.mute, fontWeight: 600 }}>ROLE B</label>
                <select
                  value={compareRoleB}
                  onChange={(e) => handleUpdateCompareRoles(compareRoleA, parseInt(e.target.value))}
                  style={{
                    width: "100%",
                    background: C.raise,
                    border: `1px solid ${C.bord}`,
                    color: C.txt,
                    padding: "8px 12px",
                    borderRadius: 8,
                    fontSize: 13,
                    marginTop: 4,
                  }}
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Differences Table */}
            <div style={{ border: `1px solid ${C.bord}`, borderRadius: 8, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: C.raise, borderBottom: `1px solid ${C.bord}` }}>
                    <th style={{ padding: "8px 12px", textAlign: "left", color: C.mute }}>PERMISSION CODE</th>
                    <th style={{ padding: "8px 12px", textAlign: "center", color: C.mute }}>ROLE A</th>
                    <th style={{ padding: "8px 12px", textAlign: "center", color: C.mute }}>ROLE B</th>
                  </tr>
                </thead>
                <tbody>
                  {matrixData.modules?.flatMap(m => m.submodules.flatMap(s => s.permissions)).map(perm => {
                    const hasA = compareRoleA === 1 || comparePermissionsA.has(perm.code);
                    const hasB = compareRoleB === 1 || comparePermissionsB.has(perm.code);
                    const isDiff = hasA !== hasB;

                    return (
                      <tr
                        key={perm.id}
                        style={{
                          borderBottom: `1px solid ${C.bord}`,
                          background: isDiff ? "rgba(201, 168, 67, 0.08)" : "transparent",
                        }}
                      >
                        <td style={{ padding: "8px 12px", color: C.txt }}>
                          <span style={{ fontWeight: 600 }}>{perm.code}</span>
                          <span style={{ display: "block", fontSize: 10, color: C.mute }}>{perm.name}</span>
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "center" }}>
                          {hasA ? <Check size={16} color="#4ade80" /> : <X size={16} color="#ef4444" />}
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "center" }}>
                          {hasB ? <Check size={16} color="#4ade80" /> : <X size={16} color="#ef4444" />}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default RolesAndPermissions;
