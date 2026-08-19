import { BM } from "../../utils/helpers";
import { useConfig } from "../../config/ConfigContext.jsx";

export function Badge({s}) {
  const config = useConfig();
  const st = config?.badgeColors?.[s] || BM[s] || {b:"#151A2E",c:"#8897B8"};
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:5,background:st.b,color:st.c,
      padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,letterSpacing:0.3,whiteSpace:"nowrap"}}>
      <span style={{width:5,height:5,borderRadius:"50%",background:st.c,display:"inline-block"}}/>
      {s}
    </span>
  );
}
