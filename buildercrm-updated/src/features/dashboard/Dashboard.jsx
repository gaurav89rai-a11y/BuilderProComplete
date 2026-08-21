import { useState, useEffect, useCallback } from "react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { LayoutDashboard, Clock, Target, CreditCard, RefreshCw, Bell, Shield, Building2, Package, Users, Handshake, CalendarCheck, FileText, Headphones, Bot, AlertCircle, DollarSign } from "lucide-react";
import { api } from "../../services/api.js";
import { C } from "../../config/theme.js";
import { fmtCr } from "../../utils/helpers.js";
import { REV_DATA, SRC_DATA } from "../../config/chartData.js";
import { Badge, Btn, Modal, Field, Input, Select, LoadingState, ErrorState, Toast, STitle, Stat } from "../../components/ui";
import { useConfig } from "../../config/ConfigContext.jsx";

/* ─── SIDEBAR ───────────────────────────────────────────────────── */

export function Dashboard() {
  const { configs, badgeColors } = useConfig();
  const [data,setData]=useState(null);
  const [projects,setProjects]=useState([]);
  const [selProject,setSelProject]=useState("All");
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);

  const load=useCallback(async()=>{
    setLoading(true);setError(null);
    try {
      const params = selProject === "All" ? {} : { projectId: selProject };
      setData(await api.getDashboard(params));
    }
    catch(e){ setError(e.message); }
    finally { setLoading(false); }
  },[selProject]);

  useEffect(()=>{
    api.getProjects().then(setProjects).catch(()=>{});
  },[]);

  useEffect(()=>{ load(); },[load]);
  if(loading) return <LoadingState/>;
  if(error) return <ErrorState msg={error} onRetry={load}/>;

  const pc=[C.blue,C.teal,C.amb,C.gold,C.red];
  const proj = data.selectedProject;
  const dashSub = proj
    ? `${proj.name} · ${proj.location} · ${proj.status} · ${proj.constructionPct}% built`
    : "Portfolio-wide business overview";
  const revData = (data.monthlyRevenue?.length ? data.monthlyRevenue : REV_DATA);
  const srcData = (data.leadSources?.length ? data.leadSources : SRC_DATA);

  return (
    <div className="fi">
      <STitle
        title="Executive Dashboard"
        sub={dashSub}
        action={
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{color:C.sub,fontSize:12,fontWeight:600}}>Project:</span>
            <select
              value={selProject}
              onChange={(e)=>setSelProject(e.target.value)}
              style={{background:C.raise,color:C.txt,border:`1px solid ${C.bord}`,borderRadius:8,
                padding:"7px 12px",fontSize:12,fontWeight:600,cursor:"pointer",minWidth:180}}
            >
              <option value="All">All Projects</option>
              {projects.map(p=>(
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        }
      />
      <div className="grid-4" style={{marginBottom:18}}>
        <Stat
          icon={Building2}
          label={proj ? "Construction Progress" : "Active Projects"}
          value={proj ? `${proj.constructionPct}%` : (data.activeProjects||0)}
          change={proj ? 0 : 8}
          color={C.gold}
        />
        <Stat icon={DollarSign} label="Total Revenue" value={fmtCr(data.totalRevenue||0)} change={18} color={C.teal}/>
        <Stat icon={Target} label="Active Leads" value={data.activeLeads||0} change={12} color={C.blue}/>
        <Stat icon={Users} label="Customers" value={data.totalCustomers||0} change={5} color={C.amb}/>
      </div>
      <div className="grid-2-1" style={{marginBottom:14}}>
        <div style={{background:C.card,border:`1px solid ${C.bord}`,borderRadius:14,padding:18}}>
          <STitle title="Revenue vs Target (₹ Cr)" sub={proj ? `${proj.name} — monthly performance` : "Monthly performance"}/>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revData}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.gold} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={C.gold} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.blue} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={C.blue} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.bord}/>
              <XAxis dataKey="m" tick={{fill:C.sub,fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:C.sub,fontSize:10}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{background:C.raise,border:`1px solid ${C.bord}`,borderRadius:8,color:C.txt,fontSize:11}}/>
              <Area type="monotone" dataKey="rev" stroke={C.gold} strokeWidth={2.5} fill="url(#g1)" name="Revenue (₹Cr)"/>
              <Area type="monotone" dataKey="tgt" stroke={C.blue} strokeWidth={2} strokeDasharray="4 4" fill="url(#g2)" name="Target (₹Cr)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:C.card,border:`1px solid ${C.bord}`,borderRadius:14,padding:18}}>
          <STitle title="Lead Sources" sub={proj ? `Leads for ${proj.name}` : "All projects"}/>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={srcData} cx="50%" cy="50%" innerRadius={40} outerRadius={62} paddingAngle={3} dataKey="value">
                {srcData.map((_,i)=><Cell key={i} fill={pc[i % pc.length]}/>)}
              </Pie>
              <Tooltip contentStyle={{background:C.raise,border:`1px solid ${C.bord}`,borderRadius:8,color:C.txt,fontSize:11}}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{display:"flex",flexWrap:"wrap",gap:"6px 12px",marginTop:6}}>
            {srcData.map((d,i)=>(
              <div key={d.name} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:C.sub}}>
                <div style={{width:7,height:7,borderRadius:2,background:pc[i % pc.length]}}/>{d.name}
                <span style={{color:C.txt,fontWeight:600}}>{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid-4" style={{marginBottom:14}}>
        {[
          {l:"Total Units",v:data.totalUnits||0,c:C.sub},
          {l:configs.systemSetting?.find(c => c.value === "SoldUnitStatus")?.label || "Sold",v:data.soldUnits||0,c:badgeColors[configs.systemSetting?.find(c => c.value === "SoldUnitStatus")?.label || "Sold"]?.c || C.red},
          {l:configs.systemSetting?.find(c => c.value === "AvailableUnitStatus")?.label || "Available",v:data.availableUnits||0,c:badgeColors[configs.systemSetting?.find(c => c.value === "AvailableUnitStatus")?.label || "Available"]?.c || C.teal},
          {l:configs.systemSetting?.find(c => c.value === "BookedUnitStatus")?.label || "Booked",v:data.bookedUnits||0,c:badgeColors[configs.systemSetting?.find(c => c.value === "BookedUnitStatus")?.label || "Booked"]?.c || C.amb},
        ].map(s=>(
          <div key={s.l} style={{background:C.card,border:`1px solid ${C.bord}`,borderRadius:12,padding:"14px 18px",textAlign:"center"}}>
            <div style={{color:s.c,fontSize:22,fontWeight:700}}>{s.v}</div>
            <div style={{color:C.sub,fontSize:11,marginTop:2}}>{s.l}</div>
          </div>
        ))}
      </div>
      <div className="grid-2">
        <div style={{background:C.card,border:`1px solid ${C.bord}`,borderRadius:14,padding:18}}>
          <STitle title="Recent Leads" sub={proj ? proj.name : "All projects"}/>
          {(data.recentLeads||[]).length === 0 && (
            <div style={{color:C.sub,fontSize:12,padding:"12px 0"}}>No leads for this selection.</div>
          )}
          {(data.recentLeads||[]).map(l=>(
            <div key={l.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
              padding:"8px 0",borderBottom:`1px solid ${C.bord}`}}>
              <div>
                <div style={{color:C.txt,fontWeight:600,fontSize:12}}>{l.name}</div>
                <div style={{color:C.sub,fontSize:10}}>{l.source} · {l.assignedTo}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <Badge s={l.stage}/>
                <div style={{color:C.gold,fontSize:11,marginTop:3}}>{fmtCr(l.budget)}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{background:C.card,border:`1px solid ${C.bord}`,borderRadius:14,padding:18}}>
          <STitle title="Recent Bookings" sub={proj ? proj.name : "All projects"}/>
          {(data.recentBookings||[]).length === 0 && (
            <div style={{color:C.sub,fontSize:12,padding:"12px 0"}}>No bookings for this selection.</div>
          )}
          {(data.recentBookings||[]).map(b=>(
            <div key={b.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
              padding:"8px 0",borderBottom:`1px solid ${C.bord}`}}>
              <div>
                <div style={{color:C.txt,fontWeight:600,fontSize:12}}>{b.customerName}</div>
                <div style={{color:C.sub,fontSize:10}}>{b.bookingNumber}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <Badge s={b.status}/>
                <div style={{color:C.gold,fontSize:11,marginTop:3}}>{fmtCr(b.totalAmount)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}