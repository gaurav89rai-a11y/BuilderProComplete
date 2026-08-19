import { X } from "lucide-react";
import { C } from "../../config/theme.js";

export function Modal({title,onClose,children,width=520}) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:1000,
      display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:C.card,border:`1px solid ${C.bord}`,borderRadius:16,
        width:"100%",maxWidth:width,maxHeight:"90vh",overflow:"auto",boxShadow:"0 24px 64px rgba(0,0,0,0.6)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
          padding:"18px 22px",borderBottom:`1px solid ${C.bord}`}}>
          <div style={{color:C.txt,fontWeight:700,fontSize:15}}>{title}</div>
          <button onClick={onClose} style={{background:C.raise,border:"none",borderRadius:7,
            padding:6,cursor:"pointer",color:C.sub,display:"flex"}}><X size={14}/></button>
        </div>
        <div style={{padding:22}}>{children}</div>
      </div>
    </div>
  );
}
