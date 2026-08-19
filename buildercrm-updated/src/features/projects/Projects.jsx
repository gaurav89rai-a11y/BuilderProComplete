import { useState, useEffect, useCallback } from "react";
import { Building2, Plus, Edit, Trash2, Loader2, X, RefreshCw, MapPin } from "lucide-react";
import { api } from "../../services/api.js";
import { C } from "../../config/theme.js";
import { fmtCr } from "../../utils/helpers.js";
import { Badge, Btn, Modal, Field, Input, Select, LoadingState, ErrorState, Toast, STitle } from "../../components/ui";
import { useConfig } from "../../config/ConfigContext.jsx";

export function Projects() {
  const { projectStatus, projectType, getDefault } = useConfig();
  const [projects,setProjects]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [showModal,setShowModal]=useState(false);
  const [saving,setSaving]=useState(false);
  const [toast,setToast]=useState(null);

  const defaultStatus = getDefault("projectStatus", "Pre-launch");
  const defaultType = getDefault("projectType", "Residential");

  const [form,setForm]=useState({name:"",location:"",reraNumber:"",status:defaultStatus,type:defaultType,totalUnits:0,constructionPct:0,totalValue:0});

  const load=useCallback(async()=>{
    setLoading(true);setError(null);
    try { setProjects(await api.getProjects()); }
    catch(e){ setError(e.message); }
    finally { setLoading(false); }
  },[]);

  useEffect(()=>{ load(); },[load]);

  const handleSubmit=async()=>{
    if(!form.name||!form.location||!form.reraNumber) return setToast({msg:"Name, Location and RERA No. are required",type:"error"});
    setSaving(true);
    try {
      await api.createProject({...form,totalUnits:+form.totalUnits,constructionPct:+form.constructionPct,totalValue:+form.totalValue});
      setShowModal(false);
      setForm({name:"",location:"",reraNumber:"",status:"Pre-launch",type:"Residential",totalUnits:0,constructionPct:0,totalValue:0});
      setToast({msg:"Project created successfully!",type:"success"});
      load();
    } catch(e){ setToast({msg:e.message,type:"error"}); }
    finally { setSaving(false); }
  };

  const f=(k)=>(v)=>setForm(p=>({...p,[k]:v}));

  const totalVal = projects.reduce((s,p)=>s+(p.totalValue||0),0);

  if(loading) return <LoadingState/>;
  if(error) return <ErrorState msg={error} onRetry={load}/>;

  return (
    <div className="fi">
      {toast&&<Toast {...toast} onClose={()=>setToast(null)}/>}
      <STitle title="Project Portfolio" sub={`${projects.length} projects · ${fmtCr(totalVal)} total value`}
        action={<Btn icon={Plus} onClick={()=>setShowModal(true)}>New Project</Btn>}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14}}>
        {projects.map(p=>(
          <div key={p.id} style={{background:C.card,border:`1px solid ${C.bord}`,borderRadius:14,padding:22,position:"relative",overflow:"hidden",cursor:"pointer"}}>
            <div style={{position:"absolute",top:0,right:0,background:`${C.gold}0C`,width:100,height:100,borderRadius:"0 14px 0 100px"}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
              <div>
                <div style={{color:C.txt,fontSize:14,fontWeight:700}}>{p.name}</div>
                <div style={{display:"flex",alignItems:"center",gap:4,color:C.sub,fontSize:11,marginTop:3}}><MapPin size={10}/>{p.location}</div>
              </div>
              <Badge s={p.status}/>
            </div>
            <div style={{background:C.raise,borderRadius:8,padding:"8px 12px",marginBottom:14,display:"flex",justifyContent:"space-between"}}>
              <span style={{color:C.mute,fontSize:11}}>RERA No.</span>
              <span style={{color:C.gold,fontSize:11,fontWeight:600,fontFamily:"monospace"}}>{p.reraNumber}</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14}}>
              {[{l:"Total",v:p.totalUnits,c:C.sub},{l:"Sold",v:p.sold||0,c:C.teal},{l:"Booked",v:p.booked||0,c:C.amb},{l:"Available",v:p.available||0,c:C.blue}].map(s=>(
                <div key={s.l} style={{textAlign:"center",background:C.bg,borderRadius:8,padding:"9px 0"}}>
                  <div style={{color:s.c,fontSize:17,fontWeight:700}}>{s.v}</div>
                  <div style={{color:C.mute,fontSize:10}}>{s.l}</div>
                </div>
              ))}
            </div>
            <div style={{marginBottom:5}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{color:C.sub,fontSize:11}}>Construction</span>
                <span style={{color:p.constructionPct>80?C.teal:p.constructionPct>50?C.gold:C.blue,fontWeight:700,fontSize:12}}>{p.constructionPct}%</span>
              </div>
              <div style={{background:C.raise,borderRadius:6,height:6,overflow:"hidden"}}>
                <div style={{width:`${p.constructionPct}%`,height:"100%",background:p.constructionPct>80?C.teal:p.constructionPct>50?C.gold:C.blue,borderRadius:6}}/>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:14}}>
              <span style={{color:C.gold,fontWeight:700,fontSize:14}}>{fmtCr(p.totalValue)}</span>
              <span style={{color:C.sub,fontSize:11,background:C.raise,padding:"3px 10px",borderRadius:6}}>{p.type}</span>
            </div>
          </div>
        ))}
      </div>

      {showModal&&(
        <Modal title="New Project" onClose={()=>setShowModal(false)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div style={{gridColumn:"1/-1"}}>
              <Field label="Project Name" required><Input value={form.name} onChange={f("name")} placeholder="e.g. Skyline Heights"/></Field>
            </div>
            <Field label="Location" required><Input value={form.location} onChange={f("location")} placeholder="e.g. Bandra West, Mumbai"/></Field>
            <Field label="RERA Number" required><Input value={form.reraNumber} onChange={f("reraNumber")} placeholder="e.g. P51900034682"/></Field>
            <Field label="Status">
              <Select value={form.status} onChange={f("status")} options={projectStatus}/>
            </Field>
            <Field label="Type">
              <Select value={form.type} onChange={f("type")} options={projectType}/>
            </Field>
            <Field label="Total Units">
              <Input type="number" value={form.totalUnits} onChange={f("totalUnits")} placeholder="240"/>
            </Field>
            <Field label="Construction %">
              <Input type="number" value={form.constructionPct} onChange={f("constructionPct")} placeholder="0-100"/>
            </Field>
            <div style={{gridColumn:"1/-1"}}>
              <Field label="Total Value (₹)">
                <Input type="number" value={form.totalValue} onChange={f("totalValue")} placeholder="e.g. 4850000000"/>
              </Field>
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:20,paddingTop:16,borderTop:`1px solid ${C.bord}`}}>
            <Btn v="outline" onClick={()=>setShowModal(false)}>Cancel</Btn>
            <Btn onClick={handleSubmit} disabled={saving} icon={saving?Loader2:Plus}>{saving?"Creating...":"Create Project"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}