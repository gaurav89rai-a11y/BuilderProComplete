import { useState, useEffect, useCallback } from "react";
import { User, Plus, Edit, Trash2, Loader2, X, RefreshCw, Eye, Search } from "lucide-react";
import { api } from "../../services/api.js";
import { C } from "../../config/theme.js";
import { fmtCr } from "../../utils/helpers.js";
import { Badge, Btn, Modal, Field, Input, Select, LoadingState, ErrorState, Toast, STitle } from "../../components/ui";
import { useConfig } from "../../config/ConfigContext.jsx";

export function Customers() {
  const { customerStatus, getDefault } = useConfig();
  const [customers,setCustomers]=useState([]);
  const [projects,setProjects]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [q,setQ]=useState("");
  const [showModal,setShowModal]=useState(false);
  const [saving,setSaving]=useState(false);
  const [toast,setToast]=useState(null);
  const defaultStatus = getDefault("customerStatus", "Active");
  const [form,setForm]=useState({name:"",email:"",phone:"",unitNumber:"",projectId:"",bookingDate:"",status:defaultStatus,totalAmount:0,paidAmount:0});
  const [editingId,setEditingId]=useState(null);
  const [viewCustomer,setViewCustomer]=useState(null);

  const load=useCallback(async()=>{
    setLoading(true);setError(null);
    try {
      const [c,p,l]=await Promise.all([api.getCustomers(),api.getProjects(),api.getLeads()]);
      const mappedLeads = l.map(lead => ({
        id: `lead-${lead.id}`,
        isLead: true,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        unitNumber: "Lead",
        projectId: lead.projectId || "",
        project: lead.project,
        bookingDate: lead.createdAt || "",
        status: `Lead - ${lead.stage}`,
        totalAmount: lead.budget || 0,
        paidAmount: 0,
        originalLead: lead
      }));
      setCustomers([...c, ...mappedLeads]); setProjects(p);
    } catch(e){ setError(e.message); }
    finally { setLoading(false); }
  },[]);
  useEffect(()=>{ load(); },[load]);

  const list=customers.filter(c=>
    c.name.toLowerCase().includes(q.toLowerCase()) || 
    (c.unitNumber && c.unitNumber.toLowerCase().includes(q.toLowerCase()))
  );
  const f=(k)=>(v)=>setForm(p=>({...p,[k]:v}));

  const handleEditClick=(c)=>{
    setEditingId(c.id);
    setForm({
      name: c.name || "",
      email: c.email || "",
      phone: c.phone || "",
      unitNumber: c.unitNumber || "",
      projectId: c.projectId || "",
      bookingDate: c.bookingDate ? c.bookingDate.split("T")[0] : "",
      status: c.status || "Active",
      totalAmount: c.totalAmount || 0,
      paidAmount: c.paidAmount || 0,
      isLead: !!c.isLead
    });
    setShowModal(true);
  };

  const handleSubmit=async()=>{
    const isLeadEditing = editingId && editingId.toString().startsWith("lead-");
    if(!form.name || !form.projectId || (!isLeadEditing && !form.unitNumber)) {
      return setToast({msg: isLeadEditing ? "Name and Project are required" : "Name, Project and Unit are required", type: "error"});
    }
    setSaving(true);
    try {
      if (isLeadEditing) {
        const leadId = parseInt(editingId.toString().replace("lead-", ""));
        const originalLead = customers.find(c => c.id === editingId)?.originalLead || {};
        const payload = {
          ...originalLead,
          name: form.name,
          email: form.email,
          phone: form.phone,
          projectId: form.projectId ? +form.projectId : null,
          budget: +form.totalAmount,
        };
        await api.updateLead(leadId, payload);
        setToast({msg:"Lead updated successfully!",type:"success"});
      } else {
        const payload={...form,projectId:+form.projectId,totalAmount:+form.totalAmount,paidAmount:+form.paidAmount,bookingDate:form.bookingDate||new Date().toISOString()};
        if (editingId) {
          await api.updateCustomer(editingId, { ...payload, id: editingId });
          setToast({msg:"Customer updated successfully!",type:"success"});
        } else {
          await api.createCustomer(payload);
          setToast({msg:"Customer added successfully!",type:"success"});
        }
      }
      setShowModal(false);
      setEditingId(null);
      setForm({name:"",email:"",phone:"",unitNumber:"",projectId:"",bookingDate:"",status:"Active",totalAmount:0,paidAmount:0});
      load();
    } catch(e){ setToast({msg:e.message,type:"error"}); }
    finally { setSaving(false); }
  };

  if(loading) return <LoadingState/>;
  if(error) return <ErrorState msg={error} onRetry={load}/>;

  return (
    <div className="fi">
      {toast&&<Toast {...toast} onClose={()=>setToast(null)}/>}
      <STitle title="Customer Management" sub="All registered customers"
        action={<Btn icon={Plus} onClick={()=>setShowModal(true)}>Add Customer</Btn>}/>
      <div style={{background:C.card,border:`1px solid ${C.bord}`,borderRadius:14,overflow:"hidden"}}>
        <div style={{padding:"12px 18px",borderBottom:`1px solid ${C.bord}`,display:"flex",alignItems:"center",gap:8}}>
          <Search size={14} color={C.mute}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by name or unit..."
            style={{background:"transparent",border:"none",outline:"none",color:C.txt,fontSize:12,flex:1}}/>
        </div>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:C.raise}}>
              {["Customer","Unit","Project","Booking Date","Payment","Status","Actions"].map(h=>(
                <th key={h} style={{padding:"10px 18px",textAlign:"left",color:C.mute,fontSize:10,fontWeight:600,letterSpacing:0.5,textTransform:"uppercase"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((c,i)=>{
              const pct=c.totalAmount?Math.round(c.paidAmount/c.totalAmount*100):0;
              return (
                <tr key={c.id} style={{borderBottom:`1px solid ${C.bord}`,background:i%2===0?"transparent":`${C.raise}40`}}>
                  <td style={{padding:"12px 18px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:9}}>
                      <div style={{width:32,height:32,borderRadius:8,background:`${C.blue}22`,display:"flex",alignItems:"center",justifyContent:"center",color:C.blue,fontWeight:700,fontSize:12}}>{c.name[0]}</div>
                      <div>
                        <div style={{color:C.txt,fontWeight:600,fontSize:12}}>{c.name}</div>
                        <div style={{color:C.mute,fontSize:10}}>{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{padding:"12px 18px",color:C.gold,fontWeight:600,fontSize:12}}>{c.unitNumber}</td>
                  <td style={{padding:"12px 18px",color:C.sub,fontSize:11}}>{c.project?.name||"—"}</td>
                  <td style={{padding:"12px 18px",color:C.sub,fontSize:11}}>{c.bookingDate?.split("T")[0]}</td>
                  <td style={{padding:"12px 18px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{flex:1,background:C.raise,borderRadius:4,height:4,overflow:"hidden"}}>
                        <div style={{width:`${pct}%`,height:"100%",background:pct===100?C.teal:pct>50?C.gold:C.blue}}/>
                      </div>
                      <span style={{color:C.sub,fontSize:10}}>{pct}%</span>
                    </div>
                  </td>
                  <td style={{padding:"12px 18px"}}><Badge s={c.status}/></td>
                  <td style={{padding:"12px 18px"}}>
                    <div style={{display:"flex",gap:5}}>
                      <button onClick={()=>setViewCustomer(c)} style={{background:C.raise,border:"none",borderRadius:6,padding:6,cursor:"pointer",color:C.sub,display:"flex"}}><Eye size={12}/></button>
                      <button onClick={()=>handleEditClick(c)} style={{background:C.raise,border:"none",borderRadius:6,padding:6,cursor:"pointer",color:C.sub,display:"flex"}}><Edit size={12}/></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal&&(
        <Modal 
          title={editingId ? (form.isLead ? "Edit Lead Information" : "Edit Customer Details") : "Add Customer"} 
          onClose={()=>{ 
            setShowModal(false); 
            setEditingId(null); 
            setForm({name:"",email:"",phone:"",unitNumber:"",projectId:"",bookingDate:"",status:"Active",totalAmount:0,paidAmount:0}); 
          }} 
          width={560}
        >
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <Field label="Full Name" required><Input value={form.name} onChange={f("name")} placeholder="e.g. Rajesh Verma"/></Field>
            <Field label="Phone"><Input value={form.phone} onChange={f("phone")} placeholder="97XXXXXXXX"/></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={f("email")} placeholder="email@gmail.com"/></Field>
            
            {form.isLead ? (
              <>
                <Field label="Project Interest" required>
                  <Select value={form.projectId} onChange={f("projectId")} placeholder="Select Project"
                    options={projects.map(p=>({value:p.id,label:p.name}))}/>
                </Field>
                <div style={{gridColumn:"1/-1"}}>
                  <Field label="Budget / Potential (₹)"><Input type="number" value={form.totalAmount} onChange={f("totalAmount")} placeholder="e.g. 13100000"/></Field>
                </div>
              </>
            ) : (
              <>
                <Field label="Unit Number" required><Input value={form.unitNumber} onChange={f("unitNumber")} placeholder="e.g. B-201"/></Field>
                <Field label="Project" required>
                  <Select value={form.projectId} onChange={f("projectId")} placeholder="Select Project"
                    options={projects.map(p=>({value:p.id,label:p.name}))}/>
                </Field>
                <Field label="Booking Date"><Input type="date" value={form.bookingDate} onChange={f("bookingDate")}/></Field>
                <Field label="Status">
                  <Select value={form.status} onChange={f("status")} options={customerStatus}/>
                </Field>
                <Field label="Total Amount (₹)"><Input type="number" value={form.totalAmount} onChange={f("totalAmount")} placeholder="13100000"/></Field>
                <div style={{gridColumn:"1/-1"}}>
                  <Field label="Paid Amount (₹)"><Input type="number" value={form.paidAmount} onChange={f("paidAmount")} placeholder="8500000"/></Field>
                </div>
              </>
            )}
          </div>
          <div style={{display:"flex",justify:"flex-end",gap:10,marginTop:20,paddingTop:16,borderTop:`1px solid ${C.bord}`}}>
            <Btn v="outline" onClick={()=>{ 
              setShowModal(false); 
              setEditingId(null); 
              setForm({name:"",email:"",phone:"",unitNumber:"",projectId:"",bookingDate:"",status:defaultStatus,totalAmount:0,paidAmount:0}); 
            }}>Cancel</Btn>
            <Btn onClick={handleSubmit} disabled={saving} icon={saving?Loader2:(editingId?Edit:Plus)}>{saving?(editingId?"Saving...":"Adding..."):(editingId?(form.isLead ? "Update Lead" : "Update Customer"):"Add Customer")}</Btn>
          </div>
        </Modal>
      )}

      {viewCustomer&&(
        <Modal title={viewCustomer.isLead ? "Lead Details" : "Customer Details"} onClose={()=>setViewCustomer(null)}>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:48,height:48,borderRadius:10,background:`${C.blue}22`,display:"flex",alignItems:"center",justifyContent:"center",color:C.blue,fontWeight:700,fontSize:16}}>{viewCustomer.name[0]}</div>
              <div>
                <div style={{color:C.txt,fontSize:16,fontWeight:700}}>{viewCustomer.name}</div>
                <div style={{color:C.sub,fontSize:12}}>{viewCustomer.email}</div>
              </div>
            </div>
            
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,background:C.raise,borderRadius:10,padding:14}}>
              {viewCustomer.isLead ? [
                ["Phone", viewCustomer.phone || "—"],
                ["Type", "Lead (Potential Customer)"],
                ["Project Interest", viewCustomer.project?.name || "—"],
                ["Created Date", viewCustomer.bookingDate ? new Date(viewCustomer.bookingDate).toLocaleDateString("en-IN") : "—"],
                ["Lead Stage", viewCustomer.status],
              ].map(([l, v]) => (
                <div key={l} style={{ gridColumn: l === "Type" ? "1/-1" : "auto" }}>
                  <div style={{color:C.mute,fontSize:10,marginBottom:2}}>{l}</div>
                  <div style={{color:C.txt,fontSize:12,fontWeight:600}}>{v}</div>
                </div>
              )) : [
                ["Phone", viewCustomer.phone || "—"],
                ["Unit Number", viewCustomer.unitNumber],
                ["Project", viewCustomer.project?.name || "—"],
                ["Booking Date", viewCustomer.bookingDate?.split("T")[0] || "—"],
                ["Status", viewCustomer.status],
              ].map(([l, v]) => (
                <div key={l}>
                  <div style={{color:C.mute,fontSize:10,marginBottom:2}}>{l}</div>
                  <div style={{color:C.txt,fontSize:12,fontWeight:600}}>{v}</div>
                </div>
              ))}
            </div>
            
            <div style={{background:C.raise,borderRadius:10,padding:14}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{color:C.sub,fontSize:11}}>{viewCustomer.isLead ? "Budget Allocation" : "Payment Progress"}</span>
                <span style={{color:C.gold,fontWeight:700,fontSize:12}}>
                  {viewCustomer.isLead ? "0% Paid" : `${viewCustomer.totalAmount ? Math.round((viewCustomer.paidAmount / viewCustomer.totalAmount) * 100) : 0}%`}
                </span>
              </div>
              {!viewCustomer.isLead && (
                <div style={{background:C.bg,borderRadius:6,height:6,overflow:"hidden",marginBottom:12}}>
                  <div style={{width: `${viewCustomer.totalAmount ? Math.round((viewCustomer.paidAmount / viewCustomer.totalAmount) * 100) : 0}%`, height: "100%", background: C.teal, borderRadius: 6}}/>
                </div>
              )}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div>
                  <div style={{color:C.mute,fontSize:10,marginBottom:2}}>{viewCustomer.isLead ? "Estimated Budget" : "Total Amount"}</div>
                  <div style={{color:C.txt,fontSize:13,fontWeight:700}}>{fmtCr(viewCustomer.totalAmount)}</div>
                </div>
                <div>
                  <div style={{color:C.mute,fontSize:10,marginBottom:2}}>Paid Amount</div>
                  <div style={{color:C.teal,fontSize:13,fontWeight:700}}>{fmtCr(viewCustomer.paidAmount)}</div>
                </div>
              </div>
            </div>
            
            <div style={{display:"flex",justifyContent:"flex-end",marginTop:10,paddingTop:16,borderTop:`1px solid ${C.bord}`}}>
              <Btn onClick={()=>setViewCustomer(null)}>Close</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}