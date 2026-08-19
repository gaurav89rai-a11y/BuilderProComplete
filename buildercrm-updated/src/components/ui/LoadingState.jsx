import { Loader2 } from "lucide-react";
import { C } from "../../config/theme.js";

export function LoadingState() {
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:60,
      color:C.sub,flexDirection:"column",gap:12}}>
      <Loader2 size={28} style={{animation:"spin 1s linear infinite"}}/>
      <span style={{fontSize:13}}>Loading data...</span>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
