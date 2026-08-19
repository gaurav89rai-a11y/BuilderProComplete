import { useState, useEffect } from "react";
import { 
  Package, AlertTriangle, TrendingUp, DollarSign, Activity, FileText, ArrowRight, ShieldCheck
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { api } from "../../services/api.js";
import { C } from "../../config/theme.js";
import { Badge, Btn, Stat, STitle } from "../../components/ui";

const INITIAL_STOCK = [
  { id: 1, name: "OPC 53 Cement", category: "Cement", code: "CEMT-OPC53", brand: "Ultratech Cement", unit: "Bags", currentStock: 800, minStock: 200, warehouse: "WH-Main-01", project: "Skyline Heights" },
  { id: 2, name: "OPC 43 Cement", category: "Cement", code: "CEMT-OPC43", brand: "Ultratech Cement", unit: "Bags", currentStock: 120, minStock: 300, warehouse: "WH-Main-01", project: "Green Valley Township" },
  { id: 3, name: "PPC Cement", category: "Cement", code: "CEMT-PPC", brand: "Ambuja Cement", unit: "Bags", currentStock: 1500, minStock: 250, warehouse: "WH-East-02", project: "Meridian Business Park" },
  { id: 4, name: "TMT Steel 8mm", category: "Steel", code: "STEL-TMT8", brand: "Tata Tiscon", unit: "Tons", currentStock: 12, minStock: 5, warehouse: "WH-Yard-02", project: "Pearl Residences" },
  { id: 5, name: "TMT Steel 12mm", category: "Steel", code: "STEL-TMT12", brand: "Tata Tiscon", unit: "Tons", currentStock: 4, minStock: 8, warehouse: "WH-Yard-02", project: "Skyline Heights" },
  { id: 6, name: "River Sand (Coarse)", category: "Sand", code: "SAND-COARSE", brand: "Local Quarry", unit: "Brass", currentStock: 45, minStock: 15, warehouse: "WH-Yard-01", project: "Green Valley Township" },
  { id: 7, name: "PVC Pipe 25mm", category: "Plumbing", code: "PLUM-PVC25", brand: "Supreme Pipes", unit: "Meters", currentStock: 380, minStock: 100, warehouse: "WH-Basement-01", project: "Meridian Business Park" },
  { id: 8, name: "AAC Blocks 150mm", category: "Bricks", code: "BRK-AAC150", brand: "Ultratech AAC", unit: "Cubic Meters", currentStock: 3, minStock: 10, warehouse: "WH-Yard-03", project: "Pearl Residences" },
  { id: 9, name: "Copper Wire 1.5sqmm", category: "Electrical", code: "ELEC-WIRE15", brand: "Finolex Cables", unit: "Coils", currentStock: 100, minStock: 20, warehouse: "WH-Electrical-01", project: "Skyline Heights" }
];

export function MaterialInventoryDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [orders, setOrders] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [mats, ords, projs] = await Promise.all([
          api.getMaterials(),
          api.getOrders(),
          api.getProjects()
        ]);
        setMaterials(mats);
        setOrders(ords);
        setProjects(projs);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300, color: C.sub }}>
        <Activity size={24} className="animate-spin" />
        <span style={{ marginLeft: 8 }}>Loading Inventory Dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, background: `${C.red}10`, border: `1px solid ${C.red}20`, borderRadius: 10, color: C.red }}>
        Error loading inventory analytics: {error}
      </div>
    );
  }

  // Calculate pricing valuations dynamically
  const stockWithPrice = INITIAL_STOCK.map(item => {
    // Attempt to match base price in the dynamic materials list
    const matchedMat = materials.find(m => m.code === item.code || m.name.toLowerCase().includes(item.name.toLowerCase()));
    const unitPrice = matchedMat ? matchedMat.price : 150; // default fallback unit price
    const valuation = item.currentStock * unitPrice;
    return { ...item, unitPrice, valuation };
  });

  const totalValuation = stockWithPrice.reduce((acc, item) => acc + item.valuation, 0);
  const lowStockAlerts = stockWithPrice.filter(s => s.currentStock < s.minStock);
  const safeStockCount = stockWithPrice.length - lowStockAlerts.length;

  // Chart data 1: Category-wise stock volume and valuation
  const categoriesMap = {};
  stockWithPrice.forEach(item => {
    if (!categoriesMap[item.category]) {
      categoriesMap[item.category] = { category: item.category, itemsCount: 0, valuation: 0 };
    }
    categoriesMap[item.category].itemsCount += 1;
    categoriesMap[item.category].valuation += item.valuation;
  });
  const categoryChartData = Object.values(categoriesMap);

  // Chart data 2: Safe vs Alert stock distribution
  const distributionData = [
    { name: "Safe Level Items", value: safeStockCount, color: C.teal },
    { name: "Critical Low Stock", value: lowStockAlerts.length, color: C.red }
  ];

  // Projects distribution
  const projectValMap = {};
  stockWithPrice.forEach(item => {
    if (!projectValMap[item.project]) {
      projectValMap[item.project] = 0;
    }
    projectValMap[item.project] += item.valuation;
  });
  const projectChartData = Object.keys(projectValMap).map(k => ({
    name: k,
    value: projectValMap[k]
  }));

  const recentOrders = orders.slice(0, 4);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <STitle title="Material Inventory & Analytics" sub="Real-time stock valuation, category breakdowns, and safety threshold alerts" />
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <Stat label="Total Inventory Value" val={`₹${totalValuation.toLocaleString("en-IN")}`} icon={DollarSign} color={C.gold} />
        <Stat label="Active Catalog Items" val={stockWithPrice.length} icon={Package} color={C.blue} />
        <Stat label="Safety Threshold Alerts" val={lowStockAlerts.length} icon={AlertTriangle} color={C.red} />
        <Stat label="Total Purchase Cost" val={`₹${orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0).toLocaleString("en-IN")}`} icon={TrendingUp} color={C.teal} />
      </div>

      {/* Charts Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }}>
        {/* Category-wise Valuation */}
        <div style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 14, padding: 18 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: C.txt, marginBottom: 16 }}>Inventory Valuation by Category</h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData}>
                <XAxis dataKey="category" stroke={C.sub} fontSize={11} tickLine={false} />
                <YAxis stroke={C.sub} fontSize={11} tickLine={false} tickFormatter={(v) => `₹${(v/1000)}k`} />
                <Tooltip 
                  contentStyle={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 8 }}
                  labelStyle={{ color: C.txt, fontWeight: 700 }}
                  itemStyle={{ color: C.gold }}
                  formatter={(value) => [`₹${value.toLocaleString()}`, "Valuation"]}
                />
                <Bar dataKey="valuation" fill={C.blue} radius={[6, 6, 0, 0]} maxBarSize={45}>
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={[C.blue, C.teal, C.gold, C.amb, C.sub][index % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Status Distribution */}
        <div style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 14, padding: 18, display: "flex", flexDirection: "column" }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: C.txt, marginBottom: 12 }}>Stock Safety Levels</h3>
          <div style={{ height: 200, position: "relative" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, "Items count"]} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: C.txt }}>
                {Math.round((safeStockCount / stockWithPrice.length) * 100)}%
              </span>
              <span style={{ fontSize: 10, display: "block", color: C.mute }}>Safe Stock</span>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-around", fontSize: 11.5, marginTop: 10 }}>
            {distributionData.map((d, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.color }} />
                <span style={{ color: C.sub }}>{d.name}: <strong>{d.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lower Section */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
        {/* Critical Low Stock list */}
        <div style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 14, padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: C.txt, display: "flex", alignItems: "center", gap: 6 }}>
              <AlertTriangle size={15} style={{ color: C.red }} />
              Critical Reorder Requests
            </h3>
            <span style={{ fontSize: 11, color: C.red, fontWeight: 600 }}>{lowStockAlerts.length} Action Needed</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {lowStockAlerts.map(item => (
              <div key={item.id} style={{ background: C.raise, border: `1px solid ${C.bord}`, borderRadius: 10, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, color: C.txt, fontSize: 12.5 }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: C.sub }}>Project: {item.project} | Wh: {item.warehouse}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.red }}>
                    {item.currentStock} / {item.minStock} {item.unit}
                  </div>
                  <div style={{ fontSize: 10, color: C.mute }}>Current Stock / Limit</div>
                </div>
              </div>
            ))}
            {lowStockAlerts.length === 0 && (
              <div style={{ padding: 24, textAlign: "center", color: C.teal, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <ShieldCheck size={28} />
                <span style={{ fontSize: 12.5, fontWeight: 600 }}>All materials stock thresholds are within safe levels.</span>
              </div>
            )}
          </div>
        </div>

        {/* Recent Purchase Orders */}
        <div style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 14, padding: 18 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: C.txt, marginBottom: 14 }}>Recent Purchase Orders</h3>
          <div style={{ border: `1px solid ${C.bord}`, borderRadius: 10, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: C.raise, borderBottom: `1px solid ${C.bord}` }}>
                  <th style={{ padding: "8px 12px", textAlign: "left", color: C.mute }}>PO No.</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", color: C.mute }}>Vendor</th>
                  <th style={{ padding: "8px 12px", textAlign: "right", color: C.mute }}>Amount</th>
                  <th style={{ padding: "8px 12px", textAlign: "center", color: C.mute }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(o => (
                  <tr key={o.id} style={{ borderBottom: `1px solid ${C.bord}` }}>
                    <td style={{ padding: "10px 12px", fontFamily: "monospace", fontWeight: 600, color: C.gold }}>{o.orderNumber}</td>
                    <td style={{ padding: "10px 12px", color: C.txt }}>{o.vendorName}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600 }}>₹{o.totalAmount.toLocaleString()}</td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}><Badge s={o.status} /></td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: 20, textAlign: "center", color: C.mute }}>No purchase orders recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
