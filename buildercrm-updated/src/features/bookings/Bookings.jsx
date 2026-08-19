import { useState, useEffect, useCallback } from "react";
import { FileText, Plus, Edit, Trash2, Loader2, X, RefreshCw, DollarSign, CheckCircle, Eye, Download } from "lucide-react";
import { api } from "../../services/api.js";
import { C } from "../../config/theme.js";
import { fmtCr } from "../../utils/helpers.js";
import { Badge, Btn, Modal, Field, Input, Select, LoadingState, ErrorState, Toast, STitle, Stat } from "../../components/ui";
import { useConfig } from "../../config/ConfigContext.jsx";

export function Bookings() {
  const { bookingStatus, getDefault } = useConfig();
  const [bookings,setBookings]=useState([]);
  const [customers,setCustomers]=useState([]);
  const [units,setUnits]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [showModal,setShowModal]=useState(false);
  const [saving,setSaving]=useState(false);
  const [toast,setToast]=useState(null);

  const defaultStatus = getDefault("bookingStatus", "Confirmed");

  const [form,setForm]=useState({customerId:"",unitId:"",bookingDate:"",totalAmount:0,tokenAmount:0,status:defaultStatus,assignedAgent:""});

  const load=useCallback(async()=>{
    setLoading(true);setError(null);
    try {
      const [b,c,u]=await Promise.all([api.getBookings(),api.getCustomers(),api.getUnits({status:"Available"})]);
      setBookings(b); setCustomers(c); setUnits(u);
    } catch(e){ setError(e.message); }
    finally { setLoading(false); }
  },[]);
  useEffect(()=>{ load(); },[load]);

  const f=(k)=>(v)=>setForm(p=>({...p,[k]:v}));

  const handleSubmit=async()=>{
    if(!form.customerId||!form.unitId) return setToast({msg:"Customer and Unit are required",type:"error"});
    setSaving(true);
    try {
      await api.createBooking({...form,customerId:+form.customerId,unitId:+form.unitId,totalAmount:+form.totalAmount,tokenAmount:+form.tokenAmount,bookingDate:form.bookingDate||new Date().toISOString()});
      setShowModal(false);
      setForm({customerId:"",unitId:"",bookingDate:"",totalAmount:0,tokenAmount:0,status:defaultStatus,assignedAgent:""});
      setToast({msg:"Booking created successfully!",type:"success"});
      load();
    } catch(e){ setToast({msg:e.message,type:"error"}); }
    finally { setSaving(false); }
  };

  const handleUnitChange = (unitIdVal) => {
    setForm(p => {
      const updated = { ...p, unitId: unitIdVal };
      const selectedUnit = units.find(u => u.id === parseInt(unitIdVal));
      if (selectedUnit) {
        const basePrice = selectedUnit.price || 0;
        const gstAmount = Math.round(basePrice * 0.05);
        const estimatedTotal = basePrice + gstAmount;
        updated.totalAmount = estimatedTotal;
        updated.tokenAmount = Math.round(basePrice * 0.02);
      }
      return updated;
    });
  };

  const totalValue=bookings.reduce((s,b)=>s+(b.totalAmount||0),0);

  if(loading) return <LoadingState/>;
  if(error) return <ErrorState msg={error} onRetry={load}/>;

  return (
    <div className="fi">
      {toast&&<Toast {...toast} onClose={()=>setToast(null)}/>}
      <STitle title="Booking Management" sub="Active bookings and agreements"
        action={<Btn icon={Plus} onClick={()=>setShowModal(true)}>New Booking</Btn>}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:18}}>
        <Stat icon={FileText} label="Total Bookings" value={bookings.length} change={25} color={C.blue}/>
        <Stat icon={DollarSign} label="Total Value" value={fmtCr(totalValue)} change={18} color={C.gold}/>
        <Stat icon={CheckCircle} label="Agreements Done" value={bookings.filter(b=>b.status==="Agreement Signed").length} change={0} color={C.teal}/>
      </div>
      {bookings.map(b=>(
        <div key={b.id} style={{background:C.card,border:`1px solid ${C.bord}`,borderRadius:14,padding:20,marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                <span style={{color:C.gold,fontFamily:"monospace",fontWeight:700,fontSize:12}}>{b.bookingNumber}</span>
                <Badge s={b.status}/>
              </div>
              <div style={{color:C.txt,fontSize:14,fontWeight:700}}>{b.customer?.name}</div>
              <div style={{color:C.sub,fontSize:11,marginTop:3}}>{b.unit?.unitNumber} · {b.customer?.project?.name} · {b.assignedAgent} · {b.bookingDate?.split("T")[0]}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{color:C.gold,fontWeight:700,fontSize:16}}>{fmtCr(b.totalAmount)}</div>
              <div style={{color:C.sub,fontSize:11,marginTop:2}}>Token: {fmtCr(b.tokenAmount)}</div>
            </div>
          </div>
          <div style={{marginTop:14,display:"flex",gap:8}}>
            <Btn icon={Eye} v="outline" sm>View Details</Btn>
            <Btn icon={Download} v="ghost" sm>Agreement</Btn>
          </div>
        </div>
      ))}

      {showModal&&(
        <Modal title="New Booking" onClose={()=>setShowModal(false)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <Field label="Customer" required>
              <Select value={form.customerId} onChange={f("customerId")} placeholder="Select Customer"
                options={customers.map(c=>({value:c.id,label:c.name}))}/>
            </Field>
            <Field label="Available Unit" required>
              <Select value={form.unitId} onChange={handleUnitChange} placeholder="Select Unit"
                options={units.map(u=>({value:u.id,label:`${u.unitNumber} - ${u.unitType} (${u.area} Sq Ft)`}))}/>
            </Field>

            {form.unitId && (() => {
              const u = units.find(unit => unit.id === parseInt(form.unitId));
              if (!u) return null;
              const basePrice = u.price || 0;
              const gstAmount = Math.round(basePrice * 0.05);
              const estimatedTotal = basePrice + gstAmount;
              return (
                <div style={{ gridColumn: "span 2", background: C.raise, border: `1px solid ${C.bord}`, borderRadius: 10, padding: 14, fontSize: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ fontWeight: 700, color: C.gold, fontSize: 13, borderBottom: `1px solid ${C.bord}`, paddingBottom: 6, marginBottom: 4 }}>Unit Cost Sheet Breakup</div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>Super Built-up Area:</span><span style={{ fontWeight: 600, color: C.txt }}>{u.area} Sq. Ft.</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>Base Unit Price:</span><span style={{ fontWeight: 600, color: C.txt }}>₹{basePrice.toLocaleString("en-IN")}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>Estimated GST (5%):</span><span style={{ fontWeight: 600, color: C.txt }}>₹{gstAmount.toLocaleString("en-IN")}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px dashed ${C.bord}`, paddingTop: 6, marginTop: 4, fontWeight: 700, color: C.gold, fontSize: 13.5 }}>
                    <span>Estimated Total Amount:</span>
                    <span>₹{estimatedTotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div style={{ fontSize: 10, color: C.mute, marginTop: 2 }}>* Values pre-filled in fields below automatically. User can override if custom discounts apply.</div>
                </div>
              );
            })()}

            <Field label="Booking Date"><Input type="date" value={form.bookingDate} onChange={f("bookingDate")}/></Field>
            <Field label="Assigned Agent"><Input value={form.assignedAgent} onChange={f("assignedAgent")} placeholder="Agent name"/></Field>
            <Field label="Total Amount (₹)"><Input type="number" value={form.totalAmount} onChange={f("totalAmount")} placeholder="13100000"/></Field>
            <Field label="Token Amount (₹)"><Input type="number" value={form.tokenAmount} onChange={f("tokenAmount")} placeholder="200000"/></Field>
             <Field label="Status">
              <Select value={form.status} onChange={f("status")} options={bookingStatus}/>
            </Field>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:20,paddingTop:16,borderTop:`1px solid ${C.bord}`}}>
            <Btn v="outline" onClick={()=>setShowModal(false)}>Cancel</Btn>
            <Btn onClick={handleSubmit} disabled={saving} icon={saving?Loader2:Plus}>{saving?"Creating...":"Create Booking"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}