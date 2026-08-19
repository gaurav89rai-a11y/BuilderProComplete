import { useState, useEffect, useCallback } from "react";
import { Award, Plus, CheckCircle, RefreshCw } from "lucide-react";
import { api } from "../../services/api.js";
import { C } from "../../config/theme.js";
import { fmtCr } from "../../utils/helpers.js";
import { Badge, Btn, Modal, Field, Input, Select, LoadingState, ErrorState, Toast, STitle } from "../../components/ui";

export function Commission() {
  const [commissions,setCommissions]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [toast,setToast]=useState(null);

  const load=useCallback(async()=>{
    setLoading(true);setError(null);
    try { setCommissions(await api.getCommissions()); }
    catch(e){ setError(e.message); }
    finally { setLoading(false); }
  },[]);
  useEffect(()=>{ load(); },[load]);

  const handleApprove=async(id)=>{
    try { await api.approveCommission(id); setToast({msg:"Commission approved!",type:"success"}); load(); }
    catch(e){ setToast({msg:e.message,type:"error"}); }
  };
  const handlePay=async(id)=>{
    try { await api.payCommission(id); setToast({msg:"Marked as paid!",type:"success"}); load(); }
    catch(e){ setToast({msg:e.message,type:"error"}); }
  };

  if(loading) return <LoadingState/>;
  if(error) return <ErrorState msg={error} onRetry={load}/>;

  return (
    <div className="fi">
      {toast&&<Toast {...toast} onClose={()=>setToast(null)}/>}
      <STitle title="Commission Management" sub="Partner commissions tracker"/>
      <div style={{background:C.card,border:`1px solid ${C.bord}`,borderRadius:14,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:C.raise}}>
              {["Partner","Booking","Amount","Rate","Status","Actions"].map(h=>(
                <th key={h} style={{padding:"10px 18px",textAlign:"left",color:C.mute,fontSize:10,fontWeight:600,letterSpacing:0.5,textTransform:"uppercase"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {commissions.map((c,i)=>(
              <tr key={c.id} style={{borderBottom:`1px solid ${C.bord}`,background:i%2===0?"transparent":`${C.raise}40`}}>
                <td style={{padding:"12px 18px",color:C.txt,fontWeight:600,fontSize:12}}>{c.partner?.name||"—"}</td>
                <td style={{padding:"12px 18px",color:C.sub,fontSize:11}}>{c.booking?.bookingNumber||"—"}</td>
                <td style={{padding:"12px 18px",color:C.gold,fontWeight:700}}>{fmtCr(c.amount)}</td>
                <td style={{padding:"12px 18px",color:C.sub,fontSize:11}}>{c.rate}%</td>
                <td style={{padding:"12px 18px"}}><Badge s={c.status}/></td>
                <td style={{padding:"12px 18px"}}>
                  <div style={{display:"flex",gap:6}}>
                    {c.status==="Pending Approval"&&<Btn sm v="outline" onClick={()=>handleApprove(c.id)}>Approve</Btn>}
                    {c.status==="Payable"&&<Btn sm onClick={()=>handlePay(c.id)}>Mark Paid</Btn>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}