import { useState } from "react";
import { Plus, Search, Trash2, Home, User, MapPin, HardDrive } from "lucide-react";
import { C } from "../../config/theme.js";
import { Badge, Btn, Modal, Field, Input, Select, Stat, STitle, Toast } from "../../components/ui";

const INITIAL_STORES = [
  { id: 1, name: "WH-Main-01", keeper: "Sunil Sharma", location: "Bandra Site, Mumbai", capacity: 15000, currentUse: 12500, status: "Active" },
  { id: 2, name: "WH-East-02", keeper: "Vijay Rathore", location: "Panvel Site, Navi Mumbai", capacity: 20000, currentUse: 18900, status: "Active" },
  { id: 3, name: "WH-North-03", keeper: "Sanjay Dutta", location: "Thane Site Yard", capacity: 10000, currentUse: 1500, status: "Active" },
  { id: 4, name: "WH-Yard-01 (Heavy Sand)", keeper: "Rahul Roy", location: "Panvel Sand Yard", capacity: 100, currentUse: 60, status: "Active" },
  { id: 5, name: "WH-Yard-02 (Steel Yard)", keeper: "Nitin Gadkari", location: "Bandra Steel Yard", capacity: 50, currentUse: 42, status: "Active" },
  { id: 6, name: "WH-Electrical-01", keeper: "Siddharth Malhotra", location: "Thane Electrical Store", capacity: 5000, currentUse: 4100, status: "Active" },
  { id: 7, name: "WH-Basement-01 (Plumbing)", keeper: "Varun Dhawan", location: "Bandra Project Basement", capacity: 8000, currentUse: 2500, status: "Active" }
];

export function StoreManagement() {
  const [stores, setStores] = useState(INITIAL_STORES);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    name: "",
    keeper: "",
    location: "",
    capacity: "",
    currentUse: "0",
    status: "Active"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.keeper || !form.capacity) {
      setToast({ type: "error", msg: "Please fill in all required fields." });
      return;
    }

    const capacityVal = parseInt(form.capacity);
    const currentUseVal = parseInt(form.currentUse || 0);

    if (isNaN(capacityVal) || capacityVal <= 0) {
      setToast({ type: "error", msg: "Total Capacity must be a valid number greater than 0." });
      return;
    }

    if (isNaN(currentUseVal) || currentUseVal < 0) {
      setToast({ type: "error", msg: "Current Utilization must be a valid non-negative number." });
      return;
    }

    if (currentUseVal > capacityVal) {
      setToast({ type: "error", msg: "Current Utilization cannot exceed Total Capacity." });
      return;
    }

    const newStore = {
      id: Date.now(),
      name: form.name,
      keeper: form.keeper,
      location: form.location,
      capacity: capacityVal,
      currentUse: currentUseVal,
      status: form.status
    };

    setStores([...stores, newStore]);
    setShowAddModal(false);
    setToast({ type: "success", msg: `Warehouse ${form.name} registered.` });
    setForm({
      name: "",
      keeper: "",
      location: "",
      capacity: "",
      currentUse: "0",
      status: "Active"
    });
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to decommission store warehouse ${name}?`)) {
      setStores(stores.filter(s => s.id !== id));
      setToast({ type: "success", msg: `${name} decommissioned successfully.` });
    }
  };

  const filtered = stores.filter(s => {
    return s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           s.keeper.toLowerCase().includes(searchTerm.toLowerCase()) ||
           s.location.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <STitle title="Store & Warehouse Management" sub="Register raw material stockpiles and log warehouse locations" />
        <Btn onClick={() => setShowAddModal(true)} icon={Plus}>Register Store Warehouse</Btn>
      </div>

      {/* Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        <Stat label="Total Warehouses" val={stores.length} icon={Home} color={C.sub} />
        <Stat label="Global Stock Capacity" val={stores.reduce((acc,cur)=>acc+cur.capacity,0).toLocaleString()} icon={HardDrive} color={C.blue} />
        <Stat label="Average Occupancy Rate" val={`${Math.round((stores.reduce((acc,cur)=>acc+cur.currentUse,0) / stores.reduce((acc,cur)=>acc+cur.capacity,0)) * 100)}%`} icon={MapPin} color={C.teal} />
      </div>

      {/* Search Header */}
      <div style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 12, padding: "14px 18px", display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.mute }} />
          <input
            type="text"
            placeholder="Search stores by name, storekeeper, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%", background: C.bg, border: `1px solid ${C.bord}`, borderRadius: 8,
              padding: "8px 12px 8px 36px", color: C.txt, outline: "none", fontSize: 13
            }}
          />
        </div>
      </div>

      {/* Warehouse Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {filtered.length === 0 ? (
          <div style={{ gridColumn: "span 3", background: C.card, border: `1px solid ${C.bord}`, borderRadius: 12, padding: 40, textAlign: "center", color: C.mute }}>
            No registered stores match search query.
          </div>
        ) : (
          filtered.map(store => {
            const usePct = Math.min(100, Math.round((store.currentUse / store.capacity) * 100));
            const barColor = usePct > 90 ? C.red : usePct > 70 ? C.gold : C.teal;

            return (
              <div key={store.id} style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${C.gold}12`, color: C.gold, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Home size={16} />
                    </div>
                    <div>
                      <h3 style={{ color: C.txt, fontWeight: 700, fontSize: 13.5 }}>{store.name}</h3>
                      <div style={{ color: C.mute, fontSize: 10.5, display: "flex", alignItems: "center", gap: 4, marginTop: 1 }}>
                        <MapPin size={10} />
                        <span>{store.location}</span>
                      </div>
                    </div>
                  </div>
                  <Badge label={store.status} type="teal" />
                </div>

                <div style={{ background: C.raise, borderRadius: 8, padding: 10, display: "flex", flexDirection: "column", gap: 6, fontSize: 11, color: C.sub }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <User size={12} color={C.gold} />
                    <span>Storekeeper: <strong>{store.keeper}</strong></span>
                  </div>
                </div>

                {/* Utilization Progress */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.mute }}>
                    <span>Capacity Occupancy</span>
                    <strong>{store.currentUse.toLocaleString()} / {store.capacity.toLocaleString()} ({usePct}%)</strong>
                  </div>
                  <div style={{ width: "100%", height: 6, background: C.raise, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${usePct}%`, height: "100%", background: barColor, borderRadius: 3 }} />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", borderTop: `1px solid ${C.bord}`, paddingTop: 10, marginTop: 4 }}>
                  <button onClick={() => handleDelete(store.id, store.name)} style={{ background: "none", border: "none", color: C.mute, cursor: "pointer", padding: 4 }} onMouseEnter={e=>e.currentTarget.style.color=C.red} onMouseLeave={e=>e.currentTarget.style.color=C.mute}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal - Add Warehouse */}
      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)} title="Register Approved Store Warehouse Site">
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Warehouse Name *">
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. WH-Yard-04"
                />
              </Field>
              <Field label="Assigned Storekeeper *">
                <Input
                  required
                  value={form.keeper}
                  onChange={(e) => setForm({ ...form, keeper: e.target.value })}
                  placeholder="Full Name"
                />
              </Field>
            </div>

            <Field label="Physical Location Address">
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Panvel Site, Sector 5 Yard"
              />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Total Capacity Vol (Units) *">
                <Input
                  required
                  type="number"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  placeholder="e.g. 10000"
                />
              </Field>
              <Field label="Current Utilization">
                <Input
                  type="number"
                  value={form.currentUse}
                  onChange={(e) => setForm({ ...form, currentUse: e.target.value })}
                  placeholder="Initial load volume (default 0)"
                />
              </Field>
            </div>

            <Field label="Warehouse Status">
              <Select
                value={form.status}
                onChange={(val) => setForm({ ...form, status: val })}
                options={[
                  { value: "Active", label: "Active Operational" },
                  { value: "Inactive", label: "Inactive / Suspended" }
                ]}
              />
            </Field>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
              <Btn type="button" v="outline" onClick={() => setShowAddModal(false)}>Cancel</Btn>
              <Btn type="submit">Register Store</Btn>
            </div>
          </form>
        </Modal>
      )}

      {toast && <Toast type={toast.type} msg={toast.msg} onClose={() => setToast(null)} />}
    </div>
  );
}
