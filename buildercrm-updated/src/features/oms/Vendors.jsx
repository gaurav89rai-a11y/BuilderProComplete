import { useState } from "react";
import { Plus, Search, Trash2, Phone, Mail, MapPin, Award, Star } from "lucide-react";
import { C } from "../../config/theme.js";
import { Badge, Btn, Modal, Field, Input, Select, Stat, STitle, Toast } from "../../components/ui";

const INITIAL_VENDORS = [
  { id: 1, name: "Ultratech Cement Ltd", contact: "Suresh Jain", email: "suresh@ultratech.com", phone: "9812345601", city: "Mumbai", category: "Cement", status: "Active", rating: 4.8 },
  { id: 2, name: "Ambuja Cement Ltd", contact: "Rajesh Bhatia", email: "sales@ambuja.com", phone: "9812345602", city: "Pune", category: "Cement", status: "Active", rating: 4.6 },
  { id: 3, name: "Tata Steel Ltd", contact: "Anil Goel", email: "goel.a@tatasteel.com", phone: "9812345603", city: "Kolkata", category: "Steel", status: "Active", rating: 4.9 },
  { id: 4, name: "Supreme Pipes & Fittings", contact: "Vikram Shah", email: "vikram@supreme.com", phone: "9812345604", city: "Thane", category: "Plumbing", status: "Under Review", rating: 4.2 },
  { id: 5, name: "Finolex Cables Ltd", contact: "Nikhil Mehta", email: "m.nikhil@finolex.com", phone: "9812345605", city: "Pune", category: "Electrical", status: "Active", rating: 4.7 },
  { id: 6, name: "Local Quarry Suppliers", contact: "Ramesh Bhoir", email: "ramesh@localquarry.com", phone: "9812345606", city: "Panvel", category: "Sand", status: "Active", rating: 4.0 },
  { id: 7, name: "Birla White Cement", contact: "Karan Johar", email: "karan@birla.com", phone: "9812345607", city: "Mumbai", category: "Cement", status: "Blacklisted", rating: 2.5 }
];

export function Vendors() {
  const [vendors, setVendors] = useState(INITIAL_VENDORS);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    name: "",
    contact: "",
    email: "",
    phone: "",
    city: "",
    category: "Cement",
    status: "Active",
    rating: "4.5"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.email) {
      setToast({ type: "error", msg: "Please fill in all required fields." });
      return;
    }

    const newVendor = {
      id: Date.now(),
      ...form,
      rating: parseFloat(form.rating || 4.0)
    };

    setVendors([newVendor, ...vendors]);
    setShowAddModal(false);
    setToast({ type: "success", msg: `Vendor ${form.name} added successfully.` });
    setForm({
      name: "",
      contact: "",
      email: "",
      phone: "",
      city: "",
      category: "Cement",
      status: "Active",
      rating: "4.5"
    });
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to remove vendor ${name}?`)) {
      setVendors(vendors.filter(v => v.id !== id));
      setToast({ type: "success", msg: `${name} removed from vendor registry.` });
    }
  };

  const categories = ["All", "Cement", "Steel", "Sand", "Plumbing", "Bricks", "Electrical", "Aggregate"];

  const filtered = vendors.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === "All" || v.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <STitle title="Vendor Registry Directory" sub="Maintain approved ERP supply chain vendor records" />
        <Btn onClick={() => setShowAddModal(true)} icon={Plus}>Add Supplier Vendor</Btn>
      </div>

      {/* Metrics Header */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        <Stat label="Total Registered Vendors" val={vendors.length} icon={Award} color={C.sub} />
        <Stat label="Active Partners" val={vendors.filter(v=>v.status==="Active").length} icon={Star} color={C.teal} />
        <Stat label="Blacklisted Suppliers" val={vendors.filter(v=>v.status==="Blacklisted").length} icon={Trash2} color={C.red} />
      </div>

      {/* Filter Row */}
      <div style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 12, padding: "14px 18px", display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.mute }} />
          <input
            type="text"
            placeholder="Search vendors by name, contact, city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%", background: C.bg, border: `1px solid ${C.bord}`, borderRadius: 8,
              padding: "8px 12px 8px 36px", color: C.txt, outline: "none", fontSize: 13
            }}
          />
        </div>
        <div style={{ width: 180 }}>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={categories.map(c => ({ value: c, label: c === "All" ? "All Supplies" : c }))}
          />
        </div>
      </div>

      {/* Vendors Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {filtered.length === 0 ? (
          <div style={{ gridColumn: "span 3", background: C.card, border: `1px solid ${C.bord}`, borderRadius: 12, padding: 40, textAlign: "center", color: C.mute }}>
            No vendors found matching search filters.
          </div>
        ) : (
          filtered.map(vendor => (
            <div key={vendor.id} style={{ background: C.card, border: `1px solid ${vendor.status === "Blacklisted" ? C.red : C.bord}`, borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <Badge label={vendor.category} type="blue" />
                  <h3 style={{ color: C.txt, fontWeight: 700, fontSize: 13.5, marginTop: 4 }}>{vendor.name}</h3>
                </div>
                <Badge label={vendor.status} type={vendor.status === "Active" ? "teal" : vendor.status === "Blacklisted" ? "red" : "blue"} />
              </div>

              <div style={{ background: C.raise, borderRadius: 8, padding: "8px 12px", display: "flex", flexDirection: "column", gap: 6, fontSize: 11, color: C.sub }}>
                <div style={{ display: "flex", justifyItems: "center", gap: 6 }}>
                  <Award size={12} color={C.gold} />
                  <span>Contact: <strong>{vendor.contact}</strong></span>
                </div>
                <div style={{ display: "flex", justifyItems: "center", gap: 6 }}>
                  <Phone size={12} color={C.gold} />
                  <span>Phone: {vendor.phone}</span>
                </div>
                <div style={{ display: "flex", justifyItems: "center", gap: 6 }}>
                  <Mail size={12} color={C.gold} />
                  <span>Email: {vendor.email}</span>
                </div>
                <div style={{ display: "flex", justifyItems: "center", gap: 6 }}>
                  <MapPin size={12} color={C.gold} />
                  <span>Location: {vendor.city}</span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${C.bord}`, paddingTop: 10, marginTop: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Star size={13} fill={C.gold} color={C.gold} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.txt }}>{vendor.rating} / 5.0</span>
                </div>
                <button onClick={() => handleDelete(vendor.id, vendor.name)} style={{ background: "none", border: "none", color: C.mute, cursor: "pointer", padding: 4 }} onMouseEnter={e=>e.currentTarget.style.color=C.red} onMouseLeave={e=>e.currentTarget.style.color=C.mute}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal - Add Vendor */}
      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)} title="Register Approved ERP Vendor Account">
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Vendor Company Name *">
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Tata Steel Ltd"
                />
              </Field>
              <Field label="Primary Contact Person *">
                <Input
                  required
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  placeholder="Full Name"
                />
              </Field>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Contact Phone *">
                <Input
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Phone Number"
                />
              </Field>
              <Field label="Contact Email *">
                <Input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Email Address"
                />
              </Field>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Field label="Operating City">
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="e.g. Mumbai"
                />
              </Field>
              <Field label="Materials Category">
                <Select
                  value={form.category}
                  onChange={(val) => setForm({ ...form, category: val })}
                  options={categories.filter(c => c !== "All").map(c => ({ value: c, label: c }))}
                />
              </Field>
              <Field label="Initial Rating">
                <Input
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="5.0"
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: e.target.value })}
                  placeholder="e.g. 4.5"
                />
              </Field>
            </div>

            <Field label="Compliance Status">
              <Select
                value={form.status}
                onChange={(val) => setForm({ ...form, status: val })}
                options={[
                  { value: "Active", label: "Active Approved" },
                  { value: "Under Review", label: "Under Review" },
                  { value: "Blacklisted", label: "Blacklisted / Blocked" }
                ]}
              />
            </Field>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
              <Btn type="button" v="outline" onClick={() => setShowAddModal(false)}>Cancel</Btn>
              <Btn type="submit">Register Vendor</Btn>
            </div>
          </form>
        </Modal>
      )}

      {toast && <Toast type={toast.type} msg={toast.msg} onClose={() => setToast(null)} />}
    </div>
  );
}
