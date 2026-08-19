import { useState, useEffect } from "react";
import { Search, Package, AlertTriangle, Building, RefreshCw, BarChart2 } from "lucide-react";
import { C } from "../../config/theme.js";
import { Badge, Btn, Select, Stat, STitle, Toast } from "../../components/ui";
import { api } from "../../services/api.js";

const INITIAL_STOCK = [
  { id: 1, name: "OPC 53 Cement", category: "Cement", code: "CEMT-OPC53", brand: "Ultratech Cement", unit: "Bags", currentStock: 800, minStock: 200, warehouse: "WH-Main-01", lastUpdated: "2026-07-06 10:00 AM", project: "Skyline Heights" },
  { id: 2, name: "OPC 43 Cement", category: "Cement", code: "CEMT-OPC43", brand: "Ultratech Cement", unit: "Bags", currentStock: 120, minStock: 300, warehouse: "WH-Main-01", lastUpdated: "2026-07-06 10:15 AM", project: "Green Valley Township" },
  { id: 3, name: "PPC Cement", category: "Cement", code: "CEMT-PPC", brand: "Ambuja Cement", unit: "Bags", currentStock: 1500, minStock: 250, warehouse: "WH-East-02", lastUpdated: "2026-07-05 04:30 PM", project: "Meridian Business Park" },
  { id: 4, name: "TMT Steel 8mm", category: "Steel", code: "STEL-TMT8", brand: "Tata Tiscon", unit: "Tons", currentStock: 12, minStock: 5, warehouse: "WH-Yard-02", lastUpdated: "2026-07-06 09:00 AM", project: "Pearl Residences" },
  { id: 5, name: "TMT Steel 12mm", category: "Steel", code: "STEL-TMT12", brand: "Tata Tiscon", unit: "Tons", currentStock: 4, minStock: 8, warehouse: "WH-Yard-02", lastUpdated: "2026-07-06 09:12 AM", project: "Skyline Heights" },
  { id: 6, name: "River Sand (Coarse)", category: "Sand", code: "SAND-COARSE", brand: "Local Quarry", unit: "Brass", currentStock: 45, minStock: 15, warehouse: "WH-Yard-01", lastUpdated: "2026-07-04 11:00 AM", project: "Green Valley Township" },
  { id: 7, name: "PVC Pipe 25mm", category: "Plumbing", code: "PLUM-PVC25", brand: "Supreme Pipes", unit: "Meters", currentStock: 380, minStock: 100, warehouse: "WH-Basement-01", lastUpdated: "2026-07-05 02:00 PM", project: "Meridian Business Park" },
  { id: 8, name: "AAC Blocks 150mm", category: "Bricks", code: "BRK-AAC150", brand: "Ultratech AAC", unit: "Cubic Meters", currentStock: 3, minStock: 10, warehouse: "WH-Yard-03", lastUpdated: "2026-07-05 03:00 PM", project: "Pearl Residences" },
  { id: 9, name: "Copper Wire 1.5sqmm", category: "Electrical", code: "ELEC-WIRE15", brand: "Finolex Cables", unit: "Coils", currentStock: 100, minStock: 20, warehouse: "WH-Electrical-01", lastUpdated: "2026-07-06 08:30 AM", project: "Skyline Heights" }
];

export function MaterialStock() {
  const [stockList, setStockList] = useState(INITIAL_STOCK);
  const [searchTerm, setSearchTerm] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState("All");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [toast, setToast] = useState(null);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await api.getProjects();
        setProjects(data);
      } catch (e) {
        console.error("Failed to load projects for stock page", e);
      }
    };
    loadProjects();
  }, []);

  const triggerReorder = (name, code, qty, unit) => {
    setToast({ type: "success", msg: `Reorder draft created for ${name} (${code}) for 500 ${unit}. Check Procurement Orders.` });
  };

  // Warehouses list
  const warehouses = ["All", "WH-Main-01", "WH-East-02", "WH-Yard-01", "WH-Yard-02", "WH-Yard-03", "WH-Electrical-01", "WH-Basement-01"];

  const filtered = stockList.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.warehouse.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWh = warehouseFilter === "All" || s.warehouse === warehouseFilter;
    const matchesProj = projectFilter === "All" || s.project === projectFilter;
    const isLow = s.currentStock < s.minStock;
    const matchesLowFilter = !showLowStockOnly || isLow;
    return matchesSearch && matchesWh && matchesProj && matchesLowFilter;
  });

  // Metrics
  const totalItemsCount = stockList.length;
  const lowStockItems = stockList.filter(s => s.currentStock < s.minStock);
  const totalStockVal = stockList.reduce((acc, cur) => acc + cur.currentStock, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <STitle title="Material Stock & Inventory" sub="Monitor real-time warehouse volumes and low-stock alerts" />
        <Btn icon={RefreshCw} color="sub" onClick={() => setToast({ type: "success", msg: "Inventory levels synchronized." })}>Sync Stocks</Btn>
      </div>

      {/* Metrics Header */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        <Stat label="Active Stock Items" val={totalItemsCount} icon={Package} color={C.sub} />
        <Stat label="Low Stock Warnings" val={lowStockItems.length} icon={AlertTriangle} color={C.red} />
        <Stat label="Total Physical Units" val={totalStockVal.toLocaleString()} icon={BarChart2} color={C.teal} />
      </div>

      {/* Filter Row */}
      <div style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 12, padding: "14px 18px", display: "flex", gap: 14, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ flex: 1, display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.mute }} />
            <input
              type="text"
              placeholder="Search stock catalog..."
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
              value={warehouseFilter}
              onChange={(val) => setWarehouseFilter(val)}
              options={warehouses.map(wh => ({ value: wh, label: wh === "All" ? "All Warehouses" : wh }))}
            />
          </div>
          <div style={{ width: 180 }}>
            <Select
              value={projectFilter}
              onChange={(val) => setProjectFilter(val)}
              options={["All", ...projects.map(p => p.name)].map(p => ({ value: p, label: p === "All" ? "All Projects" : p }))}
            />
          </div>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8, color: C.txt, fontSize: 12, cursor: "pointer", userSelect: "none" }}>
          <input
            type="checkbox"
            checked={showLowStockOnly}
            onChange={(e) => setShowLowStockOnly(e.target.checked)}
            style={{ width: 14, height: 14, accentColor: C.gold, cursor: "pointer" }}
          />
          <span style={{ color: showLowStockOnly ? C.red : C.mute, fontWeight: showLowStockOnly ? 700 : 500 }}>
            Show Low Stock Alerts Only
          </span>
        </label>
      </div>

      {/* Warning Box if Low Stock */}
      {lowStockItems.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: `${C.red}12`, border: `1px solid ${C.red}33`, borderRadius: 10, padding: "10px 16px", color: C.red, fontSize: 11.5 }}>
          <AlertTriangle size={15} style={{ flexShrink: 0 }} />
          <span><strong>Critical Warning:</strong> {lowStockItems.length} materials have dropped below their minimum safe stock threshold. Please initiate vendor purchase orders immediately.</span>
        </div>
      )}

      {/* Stock Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {filtered.length === 0 ? (
          <div style={{ gridColumn: "span 3", background: C.card, border: `1px solid ${C.bord}`, borderRadius: 12, padding: 40, textAlign: "center", color: C.mute }}>
            No stock listings match your filter selections.
          </div>
        ) : (
          filtered.map(item => {
            const isLow = item.currentStock < item.minStock;
            const pct = Math.min(100, Math.round((item.currentStock / (item.minStock * 3)) * 100));
            return (
              <div key={item.id} style={{ background: C.card, border: `1px solid ${isLow ? C.red : C.bord}`, borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span style={{ color: C.gold, fontWeight: 700, fontSize: 11 }}>{item.code}</span>
                    <h3 style={{ color: C.txt, fontWeight: 700, fontSize: 13, marginTop: 1 }}>{item.name}</h3>
                  </div>
                  <Badge label={isLow ? "Low Stock" : "In Stock"} type={isLow ? "red" : "teal"} />
                </div>

                <div style={{ background: C.raise, borderRadius: 8, padding: 10, display: "flex", flexDirection: "column", gap: 6, fontSize: 11, color: C.sub }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Current Stock:</span>
                    <strong style={{ color: isLow ? C.red : C.txt, fontSize: 12 }}>{item.currentStock} {item.unit}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Min Threshold:</span>
                    <span>{item.minStock} {item.unit}</span>
                  </div>
                </div>

                {/* Progress bar indicating level */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.mute }}>
                    <span>Safety Level Indicator</span>
                    <span>{pct}%</span>
                  </div>
                  <div style={{ width: "100%", height: 6, background: C.raise, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: isLow ? C.red : C.teal, borderRadius: 3 }} />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${C.bord}`, paddingTop: 10, marginTop: 4, fontSize: 10.5, color: C.mute }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Building size={11} />
                      <span>{item.project}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, color: C.mute }}>
                      <Package size={11} />
                      <span>{item.warehouse}</span>
                    </div>
                  </div>
                  <span>{item.lastUpdated}</span>
                </div>

                {isLow && (
                  <button onClick={() => triggerReorder(item.name, item.code, item.minStock * 2, item.unit)} style={{ width: "100%", background: `${C.red}18`, border: `1px solid ${C.red}33`, borderRadius: 8, padding: "7px 10px", color: C.red, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "background 0.15s" }}>
                    <AlertTriangle size={13} />
                    Initiate Purchase Reorder
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {toast && <Toast type={toast.type} msg={toast.msg} onClose={() => setToast(null)} />}
    </div>
  );
}
