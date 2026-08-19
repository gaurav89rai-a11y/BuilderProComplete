import { C } from "../../config/theme.js";

export function Btn({children,onClick,v="primary",icon:Icon,sm,disabled,type="submit"}) {
  const vs={
    primary:{background:disabled?"#555":C.gold,color:"#000",border:"none"},
    outline:{background:"transparent",color:C.txt,border:`1px solid ${C.bord}`},
    ghost:{background:"transparent",color:C.sub,border:"none"},
    danger:{background:"#2E0A0A",color:C.red,border:`1px solid ${C.red}44`},
  };
  const p=sm?{padding:"5px 11px",fontSize:11}:{padding:"9px 16px",fontSize:13};
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{...vs[v],...p,borderRadius:8,fontWeight:600,cursor:disabled?"not-allowed":"pointer",
        display:"inline-flex",alignItems:"center",gap:6,whiteSpace:"nowrap",opacity:disabled?0.6:1}}>
      {Icon&&<Icon size={sm?12:14}/>}{children}
    </button>
  );
}
