import { useState, useEffect, useCallback } from "react";
import { Handshake, Plus, Edit, Trash2, Loader2, X, Star, RefreshCw, User, MapPin } from "lucide-react";
import { api } from "../../services/api.js";
import { C } from "../../config/theme.js";
import { fmtCr } from "../../utils/helpers.js";
import { Badge, Btn, Modal, Field, Input, Select, LoadingState, ErrorState, Toast, STitle } from "../../components/ui";
import { useConfig } from "../../config/ConfigContext.jsx";

export function Partners() {
  const { partnerStatus, getDefault } = useConfig();
  const [partners,setPartners]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [showModal,setShowModal]=useState(false);
  const [saving,setSaving]=useState(false);
  const [toast,setToast]=useState(null);

  const defaultStatus = getDefault("partnerStatus", "Silver");

  const [form,setForm]=useState({name:"",contactPerson:"",email:"",phone:"",city:"",status:defaultStatus,rating:4.0,commissionRate:2.0});

  const load=useCallback(async()=>{
    setLoading(true);setError(null);
    try { setPartners(await api.getPartners()); }
    catch(e){ setError(e.message); }
    finally { setLoading(false); }
  },[]);
  useEffect(()=>{ load(); },[load]);

  const f=(k)=>(v)=>setForm(p=>({...p,[k]:v}));

  const handleSubmit=async()=>{
    if(!form.name||!form.contactPerson||!form.phone) return setToast({msg:"Name, Contact Person and Phone are required",type:"error"});
    setSaving(true);
    try {
      await api.createPartner({...form,rating:+form.rating,commissionRate:+form.commissionRate});
      setShowModal(false);
      setForm({name:"",contactPerson:"",email:"",phone:"",city:"",status:defaultStatus,rating:4.0,commissionRate:2.0});
      setToast({msg:"Partner added successfully!",type:"success"});
      load();
    } catch(e){ setToast({msg:e.message,type:"error"}); }
    finally { setSaving(false); }
  };

  if(loading) return <LoadingState/>;
  if(error) return <ErrorState msg={error} onRetry={load}/>;

  return (
    <div className="fi">
      {toast&&<Toast {...toast} onClose={()=>setToast(null)}/>}
      <STitle title="Channel Partners" sub={`${partners.length} registered partners`}
        action={<Btn icon={Plus} onClick={()=>setShowModal(true)}>Add Partner</Btn>}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
        {partners.map(p=>(
          <div key={p.id} style={{background:C.card,border:`1px solid ${C.bord}`,borderRadius:14,padding:20}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
              <div style={{width:42,height:42,borderRadius:10,background:C.raise,display:"flex",alignItems:"center",justifyContent:"center",color:C.gold,fontWeight:700,fontSize:13}}>
                {p.name[0]}{p.name.split(" ")[1]?.[0]}
              </div>
              <Badge s={p.status}/>
            </div>
            <div style={{color:C.txt,fontSize:13,fontWeight:700,marginBottom:10}}>{p.name}</div>
            <div style={{marginBottom:12}}>
              {[[User,p.contactPerson],[MapPin,p.city]].map(([I,v],i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:6,color:C.sub,fontSize:11,marginBottom:4}}>
                  <I size={11} color={C.mute}/>{v}
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
              {[{l:"Leads",v:p.leads||0,c:C.blue},{l:"Bookings",v:p.bookings||0,c:C.teal},{l:"Commission",v:fmtCr(p.totalCommission||0),c:C.gold}].map(s=>(
                <div key={s.l} style={{background:C.raise,borderRadius:8,padding:"10px 6px",textAlign:"center"}}>
                  <div style={{color:s.c,fontWeight:700,fontSize:12}}>{s.v}</div>
                  <div style={{color:C.mute,fontSize:9,marginTop:2}}>{s.l}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:3,alignItems:"center"}}>
              {[...Array(5)].map((_,i)=><Star key={i} size={11} fill={i<Math.floor(p.rating)?C.gold:"none"} color={C.gold}/>)}
              <span style={{color:C.sub,fontSize:11,marginLeft:4}}>{p.rating}</span>
            </div>
          </div>
        ))}
      </div>

      {showModal&&(
        <Modal title="Add Channel Partner" onClose={()=>setShowModal(false)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div style={{gridColumn:"1/-1"}}>
              <Field label="Company Name" required><Input value={form.name} onChange={f("name")} placeholder="e.g. PropNest Realty"/></Field>
            </div>
            <Field label="Contact Person" required><Input value={form.contactPerson} onChange={f("contactPerson")} placeholder="Contact name"/></Field>
            <Field label="Phone" required><Input value={form.phone} onChange={f("phone")} placeholder="98XXXXXXXX"/></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={f("email")} placeholder="email@company.com"/></Field>
            <Field label="City"><Input value={form.city} onChange={f("city")} placeholder="Mumbai"/></Field>
            <Field label="Status">
              <Select value={form.status} onChange={f("status")} options={partnerStatus}/>
            </Field>
            <Field label="Commission Rate (%)">
              <Input type="number" value={form.commissionRate} onChange={f("commissionRate")} placeholder="3.0"/>
            </Field>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:20,paddingTop:16,borderTop:`1px solid ${C.bord}`}}>
            <Btn v="outline" onClick={()=>setShowModal(false)}>Cancel</Btn>
            <Btn onClick={handleSubmit} disabled={saving} icon={saving?Loader2:Plus}>{saving?"Adding...":"Add Partner"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}