import { C } from "../../config/theme.js";

export function Field({label,children,required}) {
  return (
    <div style={{marginBottom:16}}>
      <label style={{display:"block",color:C.sub,fontSize:11,fontWeight:600,
        textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>
        {label}{required&&<span style={{color:C.red,marginLeft:2}}>*</span>}
      </label>
      {children}
    </div>
  );
}
