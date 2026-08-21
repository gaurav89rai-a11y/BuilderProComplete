import { C } from "../../config/theme.js";

export function STitle({title,sub,action}) {
  return (
    <div className="s-title-container" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <div>
        <div style={{color:C.txt,fontSize:17,fontWeight:700}}>{title}</div>
        {sub&&<div style={{color:C.sub,fontSize:12,marginTop:3}}>{sub}</div>}
      </div>
      {action && <div className="s-title-action">{action}</div>}
    </div>
  );
}
