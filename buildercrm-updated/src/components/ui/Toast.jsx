import { useEffect } from "react";
import { CheckCircle, AlertCircle, X } from "lucide-react";
import { C } from "../../config/theme.js";

export function Toast({msg,type,onClose}) {
  useEffect(()=>{ const t=setTimeout(onClose,3500); return()=>clearTimeout(t); },[]);
  const colors={success:C.teal,error:C.red,info:C.blue};
  return (
    <div style={{position:"fixed",bottom:24,right:24,zIndex:2000,background:C.card,
      border:`1px solid ${colors[type]||C.bord}`,borderRadius:12,padding:"12px 18px",
      color:C.txt,fontSize:13,display:"flex",alignItems:"center",gap:10,
      boxShadow:"0 8px 32px rgba(0,0,0,0.5)",maxWidth:380}}>
      {type==="success"&&<CheckCircle size={16} color={C.teal}/>}
      {type==="error"&&<AlertCircle size={16} color={C.red}/>}
      {msg}
      <button onClick={onClose} style={{background:"none",border:"none",color:C.mute,cursor:"pointer",marginLeft:"auto"}}><X size={12}/></button>
    </div>
  );
}
