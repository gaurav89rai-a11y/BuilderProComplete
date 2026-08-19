import { useState, useEffect, useCallback } from "react";
import { CreditCard, Plus, Loader2, X, RefreshCw, DollarSign, AlertCircle, Paperclip } from "lucide-react";
import { api } from "../../services/api.js";
import { C } from "../../config/theme.js";
import { fmtCr } from "../../utils/helpers.js";
import { Badge, Btn, Modal, Field, Input, Select, LoadingState, ErrorState, Toast, STitle, Stat } from "../../components/ui";
import { useConfig } from "../../config/ConfigContext.jsx";

export function Payments() {
  const { paymentMode: paymentModes, paymentStatus: paymentStatuses, getDefault } = useConfig();
  const [payments,setPayments]=useState([]);
  const [customers,setCustomers]=useState([]);
  const [bookings,setBookings]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [showModal,setShowModal]=useState(false);
  const [saving,setSaving]=useState(false);
  const [toast,setToast]=useState(null);

  const defaultMode = getDefault("paymentMode", "NEFT");
  const defaultStatus = getDefault("paymentStatus", "Received");

  const [form,setForm]=useState({customerId:"",bookingId:"",amount:0,paymentDate:"",paymentMode:defaultMode,status:defaultStatus,remarks:"",attachmentUrl:""});

  const load=useCallback(async()=>{
    setLoading(true);setError(null);
    try {
      const [p,c,b]=await Promise.all([api.getPayments(),api.getCustomers(),api.getBookings()]);
      setPayments(p); setCustomers(c); setBookings(b);
    } catch(e){ setError(e.message); }
    finally { setLoading(false); }
  },[]);
  useEffect(()=>{ load(); },[load]);

  const f=(k)=>(v)=>setForm(p=>({...p,[k]:v}));

  const handleSubmit=async()=>{
    if(!form.customerId||!form.amount) return setToast({msg:"Customer and Amount are required",type:"error"});
    setSaving(true);
    try {
      await api.createPayment({
        ...form,
        customerId: +form.customerId,
        bookingId: form.bookingId ? +form.bookingId : null,
        amount: +form.amount,
        paymentDate: form.paymentDate || new Date().toISOString()
      });
      setShowModal(false);
      setForm({customerId:"",bookingId:"",amount:0,paymentDate:"",paymentMode:defaultMode,status:defaultStatus,remarks:"",attachmentUrl:""});
      setToast({msg:"Payment recorded successfully!",type:"success"});
      load();
    } catch(e){ setToast({msg:e.message,type:"error"}); }
    finally { setSaving(false); }
  };

  const totalCollected=payments.filter(p=>p.status==="Received").reduce((s,p)=>s+(p.amount||0),0);

  if(loading) return <LoadingState/>;
  if(error) return <ErrorState msg={error} onRetry={load}/>;

  return (
    <div className="fi">
      {toast&&<Toast {...toast} onClose={()=>setToast(null)}/>}
      <STitle title="Payments & Finance" sub="Collection tracking"
        action={<Btn icon={Plus} onClick={()=>setShowModal(true)}>Record Payment</Btn>}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:18}}>
        <Stat icon={DollarSign} label="Total Collected" value={fmtCr(totalCollected)} change={12} color={C.teal}/>
        <Stat icon={CreditCard} label="Total Payments" value={payments.length} change={5} color={C.blue}/>
        <Stat icon={AlertCircle} label="Overdue Customers" value={customers.filter(c=>c.status==="Overdue").length} change={-2} color={C.red}/>
      </div>
      <div style={{background:C.card,border:`1px solid ${C.bord}`,borderRadius:14,overflow:"hidden"}}>
        <div style={{padding:"12px 18px",borderBottom:`1px solid ${C.bord}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{color:C.txt,fontWeight:600,fontSize:13}}>Payment History</span>
        </div>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:C.raise}}>
              {["Customer","Booking","Amount","Mode","Date","Status","Document"].map(h=>(
                <th key={h} style={{padding:"10px 18px",textAlign:"left",color:C.mute,fontSize:10,fontWeight:600,letterSpacing:0.5,textTransform:"uppercase"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payments.map((p,i)=>(
              <tr key={p.id} style={{borderBottom:`1px solid ${C.bord}`,background:i%2===0?"transparent":`${C.raise}40`}}>
                <td style={{padding:"12px 18px",color:C.txt,fontWeight:600,fontSize:12}}>{p.customer?.name||"—"}</td>
                <td style={{padding:"12px 18px",color:C.txt,fontSize:12,fontWeight:500,fontFamily:"monospace"}}>{p.booking?.bookingNumber||"—"}</td>
                <td style={{padding:"12px 18px",color:C.gold,fontWeight:700,fontSize:12}}>{fmtCr(p.amount)}</td>
                <td style={{padding:"12px 18px",color:C.sub,fontSize:11}}>{p.paymentMode}</td>
                <td style={{padding:"12px 18px",color:C.sub,fontSize:11}}>{p.paymentDate?.split("T")[0]}</td>
                <td style={{padding:"12px 18px"}}><Badge s={p.status}/></td>
                <td style={{padding:"12px 18px"}}>
                  {p.attachmentUrl ? (
                    <a href={p.attachmentUrl} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:4,color:C.gold,textDecoration:"none",fontSize:12,fontWeight:500}}>
                      <Paperclip size={14}/>
                      <span>View Receipt</span>
                    </a>
                  ) : (
                    <span style={{color:C.mute,fontSize:12}}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal&&(
        <Modal title="Record Payment" onClose={()=>setShowModal(false)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <Field label="Customer" required>
              <Select value={form.customerId} onChange={f("customerId")} placeholder="Select Customer"
                options={[{value:"",label:"-- Select Customer --"}, ...customers.map(c=>({value:c.id,label:c.name}))]}/>
            </Field>
            <Field label="Booking">
              <Select value={form.bookingId} onChange={f("bookingId")} placeholder="Select Booking"
                options={[{value:"",label:"-- Select Booking (Optional) --"}, ...bookings.map(b=>({value:b.id,label:b.bookingNumber||`Booking #${b.id}`}))]}/>
            </Field>
            <Field label="Amount (₹)" required><Input type="number" value={form.amount} onChange={f("amount")} placeholder="2000000"/></Field>
            <Field label="Payment Date"><Input type="date" value={form.paymentDate} onChange={f("paymentDate")}/></Field>
            <Field label="Payment Mode">
              <Select value={form.paymentMode} onChange={f("paymentMode")} options={paymentModes}/>
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={f("status")} options={paymentStatuses}/>
            </Field>
            <div style={{gridColumn:"1/-1"}}>
              <Field label="Remarks"><Input value={form.remarks} onChange={f("remarks")} placeholder="Optional notes..."/></Field>
            </div>
            <div style={{gridColumn:"1/-1"}}>
              <Field label="Attachment Document (Receipt Copy / Cheque Copy)">
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <input type="file" id="payment-attachment" style={{display:"none"}}
                    onChange={(e)=>{
                      const file = e.target.files[0];
                      if(file) {
                        setForm(p=>({...p, attachmentUrl: `/uploads/receipts/${file.name}`}));
                      }
                    }}
                  />
                  <Btn v="outline" icon={Plus} onClick={()=>document.getElementById("payment-attachment").click()}>
                    {form.attachmentUrl ? "Change File" : "Attach File"}
                  </Btn>
                  {form.attachmentUrl && (
                    <div style={{display:"flex",alignItems:"center",gap:8,background:`${C.gold}15`,border:`1px solid ${C.bord}`,borderRadius:8,padding:"6px 12px",fontSize:12,color:C.gold}}>
                      <Paperclip size={14}/>
                      <span style={{fontWeight:500}}>{form.attachmentUrl.split("/").pop()}</span>
                      <button type="button" onClick={()=>setForm(p=>({...p, attachmentUrl:""}))} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:16,padding:"0 4px",marginLeft:4}}>×</button>
                    </div>
                  )}
                </div>
              </Field>
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:20,paddingTop:16,borderTop:`1px solid ${C.bord}`}}>
            <Btn v="outline" onClick={()=>setShowModal(false)}>Cancel</Btn>
            <Btn onClick={handleSubmit} disabled={saving} icon={saving?Loader2:Plus}>{saving?"Recording...":"Record Payment"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}