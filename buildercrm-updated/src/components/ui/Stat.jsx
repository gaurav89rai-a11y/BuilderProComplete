import { TrendingUp, TrendingDown } from "lucide-react";
import { C } from "../../config/theme.js";

export function Stat({ icon: Icon, label, value, change = 0, color = C.blue }) {
  const up = change >= 0;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 14, padding: "20px 22px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, background: color, opacity: 0.06, borderRadius: "0 14px 0 80px" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div style={{ background: `${color}20`, borderRadius: 10, padding: 10, color, display: "flex" }}><Icon size={18} /></div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, color: up ? C.teal : C.red, fontSize: 12, fontWeight: 600 }}>
          {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}{Math.abs(change)}%
        </div>
      </div>
      <div style={{ color: C.txt, fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{value}</div>
      <div style={{ color: C.sub, fontSize: 12 }}>{label}</div>
    </div>
  );
}
