import { useState, useEffect, useCallback } from "react";
import { CalendarCheck, Plus, Edit, Trash2, Loader2, X, RefreshCw, Clock, Building2, User } from "lucide-react";
import { api } from "../../services/api.js";
import { C } from "../../config/theme.js";
import { Badge, Btn, Modal, Field, Input, Select, LoadingState, ErrorState, Toast, STitle } from "../../components/ui";

export function SiteVisits() {
  const [visits,setVisits]=useState([]);
  const [leads,setLeads]=useState([]);
  const [projects,setProjects]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [showModal,setShowModal]=useState(false);
  const [saving,setSaving]=useState(false);
  const [toast,setToast]=useState(null);
  const [form,setForm]=useState({leadId:"",projectId:"",visitDate:"",visitTime:"10:00 AM",assignedAgent:"",interest:"",notes:""});

  const load=useCallback(async()=>{
    setLoading(true);setError(null);
    try {
      const [v,l,p]=await Promise.all([api.getVisits(),api.getLeads(),api.getProjects()]);
      setVisits(v); setLeads(l); setProjects(p);
    } catch(e){ setError(e.message); }
    finally { setLoading(false); }
  },[]);
  useEffect(()=>{ load(); },[load]);

  const f=(k)=>(v)=>setForm(p=>({...p,[k]:v}));

  const handleSubmit=async()=>{
    if(!form.leadId||!form.projectId||!form.visitDate) return setToast({msg:"Lead, Project and Visit Date are required",type:"error"});
    setSaving(true);
    try {
      await api.createVisit({...form,leadId:+form.leadId,projectId:+form.projectId,visitDate:new Date(form.visitDate).toISOString()});
      setShowModal(false);
      setForm({leadId:"",projectId:"",visitDate:"",visitTime:"10:00 AM",assignedAgent:"",interest:"",notes:""});
      setToast({msg:"Visit scheduled successfully!",type:"success"});
      load();
    } catch(e){ setToast({msg:e.message,type:"error"}); }
    finally { setSaving(false); }
  };

  if(loading) return <LoadingState/>;
  if(error) return <ErrorState msg={error} onRetry={load}/>;

  return (
    <div className="fi">
      {toast&&<Toast {...toast} onClose={()=>setToast(null)}/>}
      <STitle title="Site Visit Management" sub="Track and schedule visits"
        action={<Btn icon={Plus} onClick={()=>setShowModal(true)}>Schedule Visit</Btn>}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:18}}>
        {[{l:"Scheduled",v:visits.filter(v=>v.status==="Scheduled").length,c:C.blue},
          {l:"Completed",v:visits.filter(v=>v.status==="Completed").length,c:C.teal},
          {l:"Cancelled",v:visits.filter(v=>v.status==="Cancelled").length,c:C.red}].map(s=>(
          <div key={s.l} style={{background:C.card,border:`1px solid ${C.bord}`,borderRadius:12,padding:16,textAlign:"center"}}>
            <div style={{color:s.c,fontSize:26,fontWeight:700}}>{s.v}</div>
            <div style={{color:C.sub,fontSize:12,marginTop:2}}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12}}>
        {visits.map(v=>(
          <div key={v.id} style={{background:C.card,border:`1px solid ${C.bord}`,borderRadius:12,padding:18}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
              <div style={{color:C.txt,fontWeight:600,fontSize:13}}>{v.lead?.name||"—"}</div>
              <Badge s={v.status}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
              {[[CalendarCheck,v.visitDate?.split("T")[0]],[Clock,v.visitTime],[Building2,v.project?.name||"—"],[User,v.assignedAgent]].map(([I,val],i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:6,color:C.sub,fontSize:11}}><I size={11} color={C.mute}/>{val}</div>
              ))}
            </div>
            {v.interest&&<div style={{background:C.raise,borderRadius:6,padding:"6px 10px",fontSize:11,color:C.sub}}>
              Interest: <span style={{color:C.gold,fontWeight:600}}>{v.interest}</span>
            </div>}
            <div style={{display:"flex",gap:8,marginTop:10}}>
              {v.status==="Scheduled"&&<>
                <Btn v="outline" sm onClick={async()=>{ await api.updateVisitStatus(v.id,"Completed"); load(); }}>Mark Complete</Btn>
                <Btn v="danger" sm onClick={async()=>{ await api.updateVisitStatus(v.id,"Cancelled"); load(); }}>Cancel</Btn>
              </>}
            </div>
          </div>
        ))}
      </div>

      {showModal&&(
        <Modal title="Schedule Site Visit" onClose={()=>setShowModal(false)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <Field label="Lead" required>
              <Select value={form.leadId} onChange={f("leadId")} placeholder="Select Lead"
                options={leads.map(l=>({value:l.id,label:l.name}))}/>
            </Field>
            <Field label="Project" required>
              <Select value={form.projectId} onChange={f("projectId")} placeholder="Select Project"
                options={projects.map(p=>({value:p.id,label:p.name}))}/>
            </Field>
            <Field label="Visit Date" required><Input type="date" value={form.visitDate} onChange={f("visitDate")}/></Field>
            <Field label="Visit Time"><Input value={form.visitTime} onChange={f("visitTime")} placeholder="10:00 AM"/></Field>
            <Field label="Assigned Agent"><Input value={form.assignedAgent} onChange={f("assignedAgent")} placeholder="Agent name"/></Field>
            <Field label="Interest"><Input value={form.interest} onChange={f("interest")} placeholder="e.g. 3BHK Sea View"/></Field>
            <div style={{gridColumn:"1/-1"}}>
              <Field label="Notes"><Input value={form.notes} onChange={f("notes")} placeholder="Additional notes..."/></Field>
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:20,paddingTop:16,borderTop:`1px solid ${C.bord}`}}>
            <Btn v="outline" onClick={()=>setShowModal(false)}>Cancel</Btn>
            <Btn onClick={handleSubmit} disabled={saving} icon={saving?Loader2:CalendarCheck}>{saving?"Scheduling...":"Schedule Visit"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}