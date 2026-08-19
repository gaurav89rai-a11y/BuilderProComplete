import { AlertCircle, RefreshCw } from "lucide-react";
import { C } from "../../config/theme.js";
import { Btn } from "./Btn";

export function ErrorState({msg,onRetry}) {
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:60,
      color:C.red,flexDirection:"column",gap:12}}>
      <AlertCircle size={28}/>
      <span style={{fontSize:13}}>{msg||"Failed to load data"}</span>
      {onRetry&&<Btn onClick={onRetry} v="outline" icon={RefreshCw} sm>Retry</Btn>}
    </div>
  );
}
