import { useState, useEffect, useCallback } from "react";
import { Shield, Plus, Edit, Trash2, Key, Users, CheckCircle2, Lock, AlertCircle, RefreshCw } from "lucide-react";
import { api } from "../../services/api.js";
import { C } from "../../config/theme.js";
import { Badge, Btn, Modal, Field, Input, LoadingState, ErrorState, Toast, STitle } from "../../components/ui";

export function RoleManagement({ onNavigateToPermissions }) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getRoles();
      setRoles(data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleEdit = (role) => {
    setEditingId(role.id);
    setForm({
      name: role.name || "",
      description: role.description || "",
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setForm({ name: "", description: "" });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setToast({ type: "error", message: "Role name is required." });
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await api.updateRole(editingId, form);
        setToast({ type: "success", message: "Role updated successfully." });
      } else {
        await api.createRole(form);
        setToast({ type: "success", message: "New role created successfully." });
      }
      setShowModal(false);
      load();
    } catch (err) {
      setToast({ type: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (role) => {
    if (role.isSystemRole) {
      setToast({ type: "error", message: "System predefined roles cannot be deleted." });
      return;
    }
    if (role.userCount > 0) {
      setToast({ type: "error", message: `Cannot delete role with ${role.userCount} active assigned users.` });
      return;
    }
    if (!window.confirm(`Are you sure you want to delete role '${role.name}'?`)) return;

    try {
      await api.deleteRole(role.id);
      setToast({ type: "success", message: "Role deleted successfully." });
      load();
    } catch (err) {
      setToast({ type: "error", message: err.message });
    }
  };

  if (loading && roles.length === 0) return <LoadingState text="Loading Security Roles..." />;
  if (error && roles.length === 0) return <ErrorState text={error} onRetry={load} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <STitle title="Security Role Administration" sub="Define access tiers, assign granular permissions, and govern CRM security boundaries" />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="outline" onClick={load} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <RefreshCw size={14} /> Refresh
          </Btn>
          <Btn onClick={handleAdd} style={{ display: "flex", alignItems: "center", gap: 6, background: C.gold, color: "#000", fontWeight: 700 }}>
            <Plus size={16} /> Create Custom Role
          </Btn>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        <div style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 12, padding: 18, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ background: `${C.gold}20`, color: C.gold, padding: 12, borderRadius: 10 }}>
            <Shield size={24} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: C.mute, fontWeight: 600 }}>TOTAL ROLES</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.txt }}>{roles.length}</div>
            <div style={{ fontSize: 11, color: C.sub }}>5 Standard + {Math.max(0, roles.length - 5)} Custom</div>
          </div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 12, padding: 18, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", padding: 12, borderRadius: 10 }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: C.mute, fontWeight: 600 }}>ASSIGNED USERS</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.txt }}>
              {roles.reduce((acc, r) => acc + (r.userCount || 0), 0)}
            </div>
            <div style={{ fontSize: 11, color: C.sub }}>Active CRM Personnel</div>
          </div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 12, padding: 18, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ background: "rgba(34, 197, 94, 0.15)", color: "#4ade80", padding: 12, borderRadius: 10 }}>
            <Key size={24} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: C.mute, fontWeight: 600 }}>PERMISSION ACTIONS</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.txt }}>119</div>
            <div style={{ fontSize: 11, color: C.sub }}>Granular Capabilities</div>
          </div>
        </div>
      </div>

      {/* Roles Grid Table */}
      <div style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.bord}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.txt }}>Configured System & Custom Roles</h3>
            <p style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>
              Each role carries default permission policies that can be configured in the Permission Matrix.
            </p>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.raise, borderBottom: `1px solid ${C.bord}` }}>
                <th style={{ padding: "12px 18px", color: C.mute, fontWeight: 600, fontSize: 12 }}>ROLE NAME</th>
                <th style={{ padding: "12px 18px", color: C.mute, fontWeight: 600, fontSize: 12 }}>DESCRIPTION</th>
                <th style={{ padding: "12px 18px", color: C.mute, fontWeight: 600, fontSize: 12 }}>ROLE TYPE</th>
                <th style={{ padding: "12px 18px", color: C.mute, fontWeight: 600, fontSize: 12, textAlign: "center" }}>ASSIGNED USERS</th>
                <th style={{ padding: "12px 18px", color: C.mute, fontWeight: 600, fontSize: 12, textAlign: "center" }}>PERMISSIONS</th>
                <th style={{ padding: "12px 18px", color: C.mute, fontWeight: 600, fontSize: 12, textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => {
                const isSuperAdmin = role.name === "Super Admin";
                return (
                  <tr
                    key={role.id}
                    style={{
                      borderBottom: `1px solid ${C.bord}`,
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = C.raise)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "14px 18px", fontWeight: 700, color: C.txt }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Shield size={16} color={role.isSystemRole ? C.gold : "#38bdf8"} />
                        <span>{role.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 18px", color: C.sub, maxWidth: 360, lineHeight: 1.4 }}>
                      {role.description || "—"}
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      {role.isSystemRole ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "4px 8px",
                            borderRadius: 6,
                            background: `${C.gold}15`,
                            color: C.gold,
                            fontSize: 11,
                            fontWeight: 700,
                            border: `1px solid ${C.gold}35`,
                          }}
                        >
                          <Lock size={11} /> Predefined System
                        </span>
                      ) : (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "4px 8px",
                            borderRadius: 6,
                            background: "rgba(56, 189, 248, 0.12)",
                            color: "#38bdf8",
                            fontSize: 11,
                            fontWeight: 700,
                            border: "1px solid rgba(56, 189, 248, 0.3)",
                          }}
                        >
                          Custom Role
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "14px 18px", textAlign: "center" }}>
                      <span
                        style={{
                          background: C.raise,
                          padding: "4px 10px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 700,
                          color: C.txt,
                          border: `1px solid ${C.bord}`,
                        }}
                      >
                        {role.userCount || 0}
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px", textAlign: "center" }}>
                      <span
                        style={{
                          background: isSuperAdmin ? "rgba(34, 197, 94, 0.15)" : C.raise,
                          color: isSuperAdmin ? "#4ade80" : C.txt,
                          padding: "4px 10px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 700,
                          border: `1px solid ${isSuperAdmin ? "rgba(34, 197, 94, 0.3)" : C.bord}`,
                        }}
                      >
                        {isSuperAdmin ? "ALL (119)" : `${role.permissionCount || 0} / 119`}
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <Btn
                          variant="outline"
                          onClick={() => {
                            if (onNavigateToPermissions) {
                              onNavigateToPermissions(role.id);
                            }
                          }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: 11,
                            padding: "6px 10px",
                            background: `${C.gold}12`,
                            borderColor: `${C.gold}40`,
                            color: C.gold,
                          }}
                          title="Open Permission Matrix for this role"
                        >
                          <Key size={12} /> Matrix
                        </Btn>

                        {!role.isSystemRole && (
                          <>
                            <Btn
                              variant="outline"
                              onClick={() => handleEdit(role)}
                              style={{ padding: "6px 8px", fontSize: 11 }}
                              title="Edit Role details"
                            >
                              <Edit size={12} />
                            </Btn>
                            <Btn
                              variant="outline"
                              onClick={() => handleDelete(role)}
                              style={{
                                padding: "6px 8px",
                                fontSize: 11,
                                color: "#ef4444",
                                borderColor: "rgba(239, 68, 68, 0.3)",
                              }}
                              title="Delete Role"
                            >
                              <Trash2 size={12} />
                            </Btn>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <Modal
          title={editingId ? "Edit Custom Role" : "Create New Custom Role"}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label="Role Name" required>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Regional CRM Auditor"
                required
              />
            </Field>

            <Field label="Description">
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Describe responsibilities and access boundaries of this role..."
                rows={3}
                style={{
                  width: "100%",
                  background: C.raise,
                  border: `1px solid ${C.bord}`,
                  borderRadius: 8,
                  padding: "10px 12px",
                  color: C.txt,
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </Field>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
              <Btn type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Btn>
              <Btn type="submit" disabled={saving} style={{ background: C.gold, color: "#000", fontWeight: 700 }}>
                {saving ? "Saving..." : editingId ? "Update Role" : "Create Role"}
              </Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default RoleManagement;
