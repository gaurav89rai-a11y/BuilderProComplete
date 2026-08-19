import { useState, useEffect, useCallback } from "react";
import { Headphones, Plus, Loader2, X, RefreshCw } from "lucide-react";
import { api } from "../../services/api.js";
import { C } from "../../config/theme.js";
import { Badge, Btn, Modal, Field, Input, Select, LoadingState, ErrorState, Toast, STitle } from "../../components/ui";
import { useConfig } from "../../config/ConfigContext.jsx";

export function CustomerService() {
  const { supportCategory: categories, supportPriority: priorities, getDefault } = useConfig();
  const [tickets,setTickets]=useState([]);
  const [customers,setCustomers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [showModal,setShowModal]=useState(false);
  const [saving,setSaving]=useState(false);
  const [toast,setToast]=useState(null);

  const defaultCategory = getDefault("supportCategory", "Maintenance");
  const defaultPriority = getDefault("supportPriority", "Medium");

  const [form,setForm]=useState({customerId:"",subject:"",category:defaultCategory,priority:defaultPriority,notes:""});

  const load=useCallback(async()=>{
    setLoading(true);setError(null);
    try {
      const [t,c]=await Promise.all([api.getTickets(),api.getCustomers()]);
      setTickets(t); setCustomers(c);
    } catch(e){ setError(e.message); }
    finally { setLoading(false); }
  },[]);
  useEffect(()=>{ load(); },[load]);

  const f=(k)=>(v)=>setForm(p=>({...p,[k]:v}));

  const handleSubmit=async()=>{
    if(!form.customerId||!form.subject) return setToast({msg:"Customer and Subject are required",type:"error"});
    setSaving(true);
    try {
      await api.createTicket({...form,customerId:+form.customerId});
      setShowModal(false);
      setForm({customerId:"",subject:"",category:defaultCategory,priority:defaultPriority,notes:""});
      setToast({msg:"Ticket created!",type:"success"});
      load();
    } catch(e){ setToast({msg:e.message,type:"error"}); }
    finally { setSaving(false); }
  };

  if(loading) return <LoadingState/>;
  if(error) return <ErrorState msg={error} onRetry={load}/>;

  return (
    <div className="fi">
      {toast&&<Toast {...toast} onClose={()=>setToast(null)}/>}
      <STitle title="Customer Service" sub="Support tickets"
        action={<Btn icon={Plus} onClick={()=>setShowModal(true)}>New Ticket</Btn>}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:18}}>
        {[{l:"Open",v:tickets.filter(t=>t.status==="Open").length,c:C.red},
          {l:"In Progress",v:tickets.filter(t=>t.status==="In Progress").length,c:C.amb},
          {l:"Resolved",v:tickets.filter(t=>t.status==="Resolved").length,c:C.teal}].map(s=>(
          <div key={s.l} style={{background:C.card,border:`1px solid ${C.bord}`,borderRadius:12,padding:16,textAlign:"center"}}>
            <div style={{color:s.c,fontSize:26,fontWeight:700}}>{s.v}</div>
            <div style={{color:C.sub,fontSize:12,marginTop:2}}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gap:10}}>
        {tickets.map(t=>(
          <div key={t.id} style={{background:C.card,border:`1px solid ${C.bord}`,borderRadius:12,padding:16,
            display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{background:`${C.red}15`,borderRadius:10,padding:10,color:C.red,display:"flex"}}><Headphones size={16}/></div>
              <div>
                <div style={{color:C.txt,fontWeight:600,fontSize:13}}>{t.subject}</div>
                <div style={{color:C.sub,fontSize:11,marginTop:2}}>{t.ticketNumber} · {t.customer?.name||"—"} · {t.category}</div>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <Badge s={t.priority}/>
              <Badge s={t.status}/>
              {t.status!=="Resolved"&&<Btn sm v="outline" onClick={async()=>{ await api.updateTicketStatus(t.id,"Resolved"); load(); }}>Resolve</Btn>}
            </div>
          </div>
        ))}
      </div>

      {showModal&&(
        <Modal title="New Support Ticket" onClose={()=>setShowModal(false)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <Field label="Customer" required>
              <Select value={form.customerId} onChange={f("customerId")} placeholder="Select Customer"
                options={customers.map(c=>({value:c.id,label:c.name}))}/>
            </Field>
            <Field label="Category">
              <Select value={form.category} onChange={f("category")} options={categories}/>
            </Field>
            <div style={{gridColumn:"1/-1"}}>
              <Field label="Subject" required><Input value={form.subject} onChange={f("subject")} placeholder="Brief description of the issue"/></Field>
            </div>
            <Field label="Priority">
              <Select value={form.priority} onChange={f("priority")} options={priorities}/>
            </Field>
            <div style={{gridColumn:"1/-1"}}>
              <Field label="Notes"><Input value={form.notes} onChange={f("notes")} placeholder="Additional details..."/></Field>
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:20,paddingTop:16,borderTop:`1px solid ${C.bord}`}}>
            <Btn v="outline" onClick={()=>setShowModal(false)}>Cancel</Btn>
            <Btn onClick={handleSubmit} disabled={saving} icon={saving?Loader2:Plus}>{saving?"Creating...":"Create Ticket"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}