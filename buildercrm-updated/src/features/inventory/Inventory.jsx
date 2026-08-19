import { useState, useEffect, useCallback } from "react";
import { Package, Plus, Edit, Trash2, Loader2, X, RefreshCw } from "lucide-react";
import { api } from "../../services/api.js";
import { C } from "../../config/theme.js";
import { fmtCr } from "../../utils/helpers.js";
import { Badge, Btn, Modal, Field, Input, Select, LoadingState, ErrorState, Toast, STitle } from "../../components/ui";
import { useConfig } from "../../config/ConfigContext.jsx";

export function Inventory() {
  const { unitStatus, unitType, getDefault, configs } = useConfig();
  const [units,setUnits]=useState([]);
  const [projects,setProjects]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [flt,setFlt]=useState("All");
  const [selProject,setSelProject]=useState("All");
  const [showModal,setShowModal]=useState(false);
  const [saving,setSaving]=useState(false);
  const [toast,setToast]=useState(null);

  const defaultType = getDefault("unitType", "2BHK");
  const defaultStatus = getDefault("unitStatus", "Available");

  const [form,setForm]=useState({projectId:"",unitNumber:"",floor:1,unitType:defaultType,area:0,price:0,status:defaultStatus,view:""});

  const load=useCallback(async()=>{
    setLoading(true);setError(null);
    try {
      const [u,p]=await Promise.all([api.getUnits(),api.getProjects()]);
      setUnits(u); setProjects(p);
    } catch(e){ setError(e.message); }
    finally { setLoading(false); }
  },[]);
  useEffect(()=>{ load(); },[load]);

  const list=units.filter(u=>(flt==="All"?true:u.status===flt)&&(selProject==="All"?true:u.projectId===parseInt(selProject)));
  const f=(k)=>(v)=>setForm(p=>({...p,[k]:v}));

  const handleSubmit=async()=>{
    if(!form.projectId||!form.unitNumber) return setToast({msg:"Project and Unit Number are required",type:"error"});
    setSaving(true);
    try {
      await api.createUnit({...form,projectId:+form.projectId,floor:+form.floor,area:+form.area,price:+form.price});
      setShowModal(false);
      setForm({projectId:"",unitNumber:"",floor:1,unitType:defaultType,area:0,price:0,status:defaultStatus,view:""});
      setToast({msg:"Unit added successfully!",type:"success"});
      load();
    } catch(e){ setToast({msg:e.message,type:"error"}); }
    finally { setSaving(false); }
  };

  if(loading) return <LoadingState/>;
  if(error) return <ErrorState msg={error} onRetry={load}/>;

  return (
    <div className="fi">
      {toast&&<Toast {...toast} onClose={()=>setToast(null)}/>}
      <STitle title="Inventory Management" sub="Unit tracker"
        action={<Btn icon={Plus} onClick={()=>setShowModal(true)}>Add Unit</Btn>}/>
      <div style={{display:"grid",gridTemplateColumns:`repeat(${unitStatus.length},1fr)`,gap:10,marginBottom:18}}>
        {unitStatus.map(s=>{
          const cfg = configs.unitStatus?.find(c => c.value === s);
          const color = C[cfg?.color] || C.sub;
          return (
            <div key={s} style={{background:C.card,border:`1px solid ${C.bord}`,borderRadius:12,padding:"14px 18px"}}>
              <div style={{color:color,fontSize:22,fontWeight:700}}>{units.filter(u=>u.status===s && (selProject==="All"?true:u.projectId===parseInt(selProject))).length}</div>
              <div style={{color:C.sub,fontSize:11,marginTop:2}}>{s} Units</div>
            </div>
          );
        })}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,gap:12,flexWrap:"wrap"}}>
        <div style={{display:"flex",gap:8}}>
          {["All",...unitStatus].map(o=>(
            <button key={o} onClick={()=>setFlt(o)} style={{background:flt===o?C.gold:C.card,
              color:flt===o?"#000":C.sub,border:`1px solid ${flt===o?C.gold:C.bord}`,
              borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>{o}</button>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{color:C.sub,fontSize:12,fontWeight:600}}>Project:</span>
          <select 
            value={selProject} 
            onChange={(e)=>setSelProject(e.target.value)}
            style={{background:C.card,border:`1px solid ${C.bord}`,borderRadius:8,padding:"6px 12px",color:C.txt,fontSize:12,fontWeight:600,outline:"none",cursor:"pointer"}}
          >
            <option value="All">All Projects</option>
            {projects.map(p=>(
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        {list.map(u=>(
          <div key={u.id} style={{background:C.card,border:`1px solid ${u.status==="Available"?`${C.teal}55`:C.bord}`,borderRadius:12,padding:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <span style={{color:C.txt,fontWeight:700,fontSize:13}}>{u.unitNumber}</span>
              <Badge s={u.status}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
              {[["TYPE",u.unitType],["FLOOR",`F${u.floor}`],["AREA",`${u.area} sq.ft`],["VIEW",u.view||"—"]].map(([l,v])=>(
                <div key={l} style={{background:C.raise,borderRadius:6,padding:"7px 8px"}}>
                  <div style={{color:C.mute,fontSize:9,marginBottom:2}}>{l}</div>
                  <div style={{color:C.txt,fontSize:11,fontWeight:600}}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{color:C.gold,fontWeight:700,fontSize:12}}>{fmtCr(u.price)}</div>
          </div>
        ))}
      </div>

      {showModal&&(
        <Modal title="Add New Unit" onClose={()=>setShowModal(false)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div style={{gridColumn:"1/-1"}}>
              <Field label="Project" required>
                <Select value={form.projectId} onChange={f("projectId")} placeholder="Select Project"
                  options={projects.map(p=>({value:p.id,label:p.name}))}/>
              </Field>
            </div>
            <Field label="Unit Number" required><Input value={form.unitNumber} onChange={f("unitNumber")} placeholder="e.g. A-101"/></Field>
            <Field label="Floor"><Input type="number" value={form.floor} onChange={f("floor")} placeholder="1"/></Field>
            <Field label="Unit Type">
              <Select value={form.unitType} onChange={f("unitType")} options={unitType}/>
            </Field>
            <Field label="View"><Input value={form.view} onChange={f("view")} placeholder="Sea / Garden / Road / City"/></Field>
            <Field label="Area (sq.ft)"><Input type="number" value={form.area} onChange={f("area")} placeholder="987"/></Field>
            <Field label="Price (₹)"><Input type="number" value={form.price} onChange={f("price")} placeholder="12500000"/></Field>
            <Field label="Status">
              <Select value={form.status} onChange={f("status")} options={unitStatus.filter(s => s !== "Sold" && s !== "Booked")}/>
            </Field>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:20,paddingTop:16,borderTop:`1px solid ${C.bord}`}}>
            <Btn v="outline" onClick={()=>setShowModal(false)}>Cancel</Btn>
            <Btn onClick={handleSubmit} disabled={saving} icon={saving?Loader2:Plus}>{saving?"Adding...":"Add Unit"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}