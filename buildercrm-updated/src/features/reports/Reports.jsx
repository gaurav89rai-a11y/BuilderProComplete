import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, Download } from "lucide-react";
import { C } from "../../config/theme.js";
import { REV_DATA } from "../../config/chartData.js";
import { Btn, STitle } from "../../components/ui";
import { useConfig } from "../../config/ConfigContext.jsx";

export function Reports() {
  const { leadStage: stages, configs } = useConfig();
  
  const funnel = stages.map(s => {
    let mockVal = 10;
    if (s === "New" || s === "Leads") mockVal = 248;
    else if (s === "Contacted") mockVal = 180;
    else if (s === "Site Visit") mockVal = 92;
    else if (s === "Negotiation") mockVal = 45;
    else if (s === "Booked") mockVal = 18;
    return { stage: s === "New" ? "Leads" : s, value: mockVal };
  });

  const fc = stages.map(s => {
    const cfg = configs.leadStage?.find(c => c.value === s);
    return C[cfg?.color] || C.sub;
  });

  const kpis=[
    {l:"Total Revenue",v:"₹142 Cr",d:"+18%",up:true},{l:"Units Sold",v:"609",d:"+23%",up:true},
    {l:"Avg. Realization",v:"₹23.3 L",d:"+8%",up:true},{l:"Lead Conversion",v:"7.3%",d:"+1.2%",up:true},
    {l:"Avg. Sales Cycle",v:"47 days",d:"-5d",up:true},{l:"NPS Score",v:"72",d:"+4",up:true},
  ];

  const handleExport = () => {
    const rows = [
      ["Reports & Analytics - Business Intelligence Dashboard"],
      ["Generated Date", new Date().toLocaleString()],
      [],
      ["Lead Conversion Funnel"],
      ["Stage", "Leads Count", "Percentage"],
      ...funnel.map(d => [d.stage, d.value, `${(d.value / 248 * 100).toFixed(0)}%`]),
      [],
      ["Key Performance Metrics"],
      ["Metric", "Value", "Change", "Trend"],
      ...kpis.map(k => [k.l, k.v, k.d, k.up ? "Up" : "Down"]),
      [],
      ["Revenue Trend (Last 6 Months)"],
      ["Month", "Revenue (Cr)", "Target (Cr)"],
      ...REV_DATA.slice(-6).map(r => [r.m, r.rev, r.tgt])
    ];

    const csvContent = "\uFEFF" + rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `BuilderPro_Analytics_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fi">
      <STitle title="Reports & Analytics" sub="Business intelligence dashboard" action={<Btn icon={Download} onClick={handleExport} v="outline">Export</Btn>}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        <div style={{background:C.card,border:`1px solid ${C.bord}`,borderRadius:14,padding:18}}>
          <STitle title="Lead Conversion Funnel"/>
          {funnel.map((d,i)=>{
            const w=(d.value/248*100).toFixed(0);
            return (
              <div key={d.stage} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{color:C.sub,fontSize:12}}>{d.stage}</span>
                  <span style={{color:C.txt,fontSize:12,fontWeight:600}}>{d.value}</span>
                </div>
                <div style={{background:C.raise,borderRadius:4,height:26,overflow:"hidden"}}>
                  <div style={{width:`${w}%`,height:"100%",background:fc[i],borderRadius:4,display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:8}}>
                    <span style={{color:"rgba(255,255,255,0.85)",fontSize:10,fontWeight:600}}>{w}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{background:C.card,border:`1px solid ${C.bord}`,borderRadius:14,padding:18}}>
          <STitle title="Revenue Trend" sub="Last 6 months"/>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={REV_DATA.slice(-6)}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.bord}/>
              <XAxis dataKey="m" tick={{fill:C.sub,fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:C.sub,fontSize:10}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{background:C.raise,border:`1px solid ${C.bord}`,borderRadius:8,color:C.txt,fontSize:11}}/>
              <Line type="monotone" dataKey="rev" stroke={C.gold} strokeWidth={2.5} dot={{fill:C.gold,r:4}} name="Revenue (₹Cr)"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{background:C.card,border:`1px solid ${C.bord}`,borderRadius:14,padding:20}}>
        <STitle title="Key Performance Metrics"/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:12}}>
          {kpis.map(k=>(
            <div key={k.l} style={{background:C.raise,borderRadius:10,padding:"14px 12px",textAlign:"center"}}>
              <div style={{color:C.txt,fontSize:16,fontWeight:700}}>{k.v}</div>
              <div style={{color:C.sub,fontSize:10,marginTop:3,marginBottom:6}}>{k.l}</div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:3,color:k.up?C.teal:C.red,fontSize:11}}>
                {k.up?<TrendingUp size={10}/>:<TrendingDown size={10}/>}{k.d}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
