import { useState, useEffect, useCallback } from "react";
import { FolderOpen, Plus, Edit, Trash2, Check, RefreshCw, Star, Tag } from "lucide-react";
import { api } from "../../services/api.js";
import { C } from "../../config/theme.js";
import { Btn, Modal, Field, Input, LoadingState, ErrorState, Toast, STitle } from "../../components/ui";

const MASTER_CATEGORIES = [
  { id: "leadStage", label: "Lead Stages" },
  { id: "leadSource", label: "Lead Sources" },
  { id: "bookingStatus", label: "Booking Statuses" },
  { id: "paymentMethod", label: "Payment Modes" },
  { id: "partnerStatus", label: "Channel Partner Statuses" },
  { id: "unitType", label: "Unit Typologies (1BHK, 2BHK...)" },
  { id: "priorityLevel", label: "Support Ticket Priorities" },
];

export function AdminMasters() {
  const [activeCategory, setActiveCategory] = useState("leadStage");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [form, setForm] = useState({
    category: "leadStage",
    value: "",
    label: "",
    color: "#C9A843",
    sortOrder: 1,
    isDefault: false,
    isActive: true,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getRawSystemConfigs(activeCategory);
      setItems(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAdd = () => {
    setEditingItem(null);
    setForm({
      category: activeCategory,
      value: "",
      label: "",
      color: "#C9A843",
      sortOrder: items.length + 1,
      isDefault: false,
      isActive: true,
    });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setForm({
      category: item.category,
      value: item.value,
      label: item.label,
      color: item.color || "#C9A843",
      sortOrder: item.sortOrder || 1,
      isDefault: item.isDefault || false,
      isActive: item.isActive !== false,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.value.trim() || !form.label.trim()) {
      setToast({ type: "error", message: "Value and Label are required." });
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        await api.updateSystemConfig(editingItem.id, form);
        setToast({ type: "success", message: "Master entry updated." });
      } else {
        await api.createSystemConfig(form);
        setToast({ type: "success", message: "Master entry added." });
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      setToast({ type: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete dropdown option '${item.label}'?`)) return;
    try {
      await api.deleteSystemConfig(item.id);
      setToast({ type: "success", message: "Option deleted." });
      loadData();
    } catch (err) {
      setToast({ type: "error", message: err.message });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <STitle title="Master Data & Dropdowns Management" sub="Maintain CRM dropdown lookups, lead stages, payment methods, and taxonomy values" />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="outline" onClick={loadData} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <RefreshCw size={14} /> Refresh
          </Btn>
          <Btn onClick={handleAdd} style={{ display: "flex", alignItems: "center", gap: 6, background: C.gold, color: "#000", fontWeight: 700 }}>
            <Plus size={16} /> Add Option
          </Btn>
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
        {MASTER_CATEGORIES.map((cat) => {
          const isSelected = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: `1px solid ${isSelected ? C.gold : C.bord}`,
                background: isSelected ? `${C.gold}20` : C.card,
                color: isSelected ? C.gold : C.sub,
                fontWeight: isSelected ? 700 : 500,
                fontSize: 12.5,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s",
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 12, overflow: "hidden" }}>
        {loading ? (
          <LoadingState text="Loading master options..." />
        ) : error ? (
          <ErrorState text={error} onRetry={loadData} />
        ) : items.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: C.mute, fontSize: 13 }}>
            No options configured for this category yet. Click &quot;Add Option&quot; above to create one.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: C.raise, borderBottom: `1px solid ${C.bord}` }}>
                  <th style={{ padding: "12px 18px", color: C.mute, textAlign: "left", fontSize: 12 }}>DISPLAY LABEL</th>
                  <th style={{ padding: "12px 18px", color: C.mute, textAlign: "left", fontSize: 12 }}>SYSTEM VALUE (CODE)</th>
                  <th style={{ padding: "12px 18px", color: C.mute, textAlign: "center", fontSize: 12 }}>COLOR BADGE</th>
                  <th style={{ padding: "12px 18px", color: C.mute, textAlign: "center", fontSize: 12 }}>DEFAULT OPTION</th>
                  <th style={{ padding: "12px 18px", color: C.mute, textAlign: "center", fontSize: 12 }}>ORDER</th>
                  <th style={{ padding: "12px 18px", color: C.mute, textAlign: "right", fontSize: 12 }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    style={{ borderBottom: `1px solid ${C.bord}` }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = C.raise)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "14px 18px", fontWeight: 700, color: C.txt }}>
                      {item.label}
                    </td>
                    <td style={{ padding: "14px 18px", color: C.sub, fontFamily: "monospace", fontSize: 12 }}>
                      {item.value}
                    </td>
                    <td style={{ padding: "14px 18px", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "3px 10px",
                          borderRadius: 6,
                          background: `${item.color || C.gold}20`,
                          color: item.color || C.gold,
                          border: `1px solid ${item.color || C.gold}40`,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: item.color || C.gold }} />
                        {item.color || "#C9A843"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px", textAlign: "center" }}>
                      {item.isDefault && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: C.gold, fontSize: 11, fontWeight: 700 }}>
                          <Star size={12} fill={C.gold} /> Default
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "14px 18px", textAlign: "center", color: C.sub }}>
                      {item.sortOrder || 1}
                    </td>
                    <td style={{ padding: "14px 18px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <Btn variant="outline" onClick={() => handleEdit(item)} style={{ padding: "6px 8px", fontSize: 11 }}>
                          <Edit size={12} />
                        </Btn>
                        <Btn
                          variant="outline"
                          onClick={() => handleDelete(item)}
                          style={{ padding: "6px 8px", fontSize: 11, color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.3)" }}
                        >
                          <Trash2 size={12} />
                        </Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <Modal
          title={editingItem ? "Edit Master Option" : "Add Master Option"}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label="Category">
              <input
                type="text"
                disabled
                value={activeCategory}
                style={{
                  width: "100%",
                  background: C.raise,
                  border: `1px solid ${C.bord}`,
                  borderRadius: 8,
                  padding: "8px 12px",
                  color: C.mute,
                  fontSize: 13,
                }}
              />
            </Field>

            <Field label="Display Label" required>
              <Input
                value={form.label}
                onChange={(e) => {
                  const label = e.target.value;
                  const value = form.value || label.toLowerCase().replace(/[^a-z0-9]/g, "_");
                  setForm((p) => ({ ...p, label, value: p.value ? p.value : value }));
                }}
                placeholder="e.g. In Negotiation"
                required
              />
            </Field>

            <Field label="System Value (Code)" required>
              <Input
                value={form.value}
                onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
                placeholder="e.g. in_negotiation"
                required
              />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Badge Color">
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                    style={{ width: 36, height: 36, border: "none", borderRadius: 6, cursor: "pointer", background: "transparent" }}
                  />
                  <Input
                    value={form.color}
                    onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                    placeholder="#C9A843"
                  />
                </div>
              </Field>

              <Field label="Display Sort Order">
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((p) => ({ ...p, sortOrder: parseInt(e.target.value) || 1 }))}
                />
              </Field>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <input
                type="checkbox"
                id="isDefault"
                checked={form.isDefault}
                onChange={(e) => setForm((p) => ({ ...p, isDefault: e.target.checked }))}
                style={{ width: 16, height: 16, cursor: "pointer" }}
              />
              <label htmlFor="isDefault" style={{ fontSize: 13, color: C.txt, cursor: "pointer" }}>
                Make this the default selected option for new records
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
              <Btn type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Btn>
              <Btn type="submit" disabled={saving} style={{ background: C.gold, color: "#000", fontWeight: 700 }}>
                {saving ? "Saving..." : editingItem ? "Update Option" : "Save Option"}
              </Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default AdminMasters;
