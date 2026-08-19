import { useState, useEffect, useCallback, useRef } from "react";
import { Bot, Send, User, Loader2, Sparkles } from "lucide-react";
import { C } from "../../config/theme.js";
import { api } from "../../services/api.js";
import { Btn, STitle } from "../../components/ui";
import { inp } from "../../components/ui/Input.jsx";
import { useConfig } from "../../config/ConfigContext.jsx";

export function AIAssistant() {
  const { aiReplies } = useConfig();
  const [msgs,setMsgs]=useState([{role:"ai",text:"Hello! I'm ARIA, your AI assistant. I can help you analyze your portfolio, generate reports, or answer questions about your projects."}]);
  const [input,setInput]=useState("");
  const send=()=>{
    if(!input.trim()) return;
    const q=input; setInput("");
    setMsgs(m=>[...m,{role:"user",text:q}]);
    setTimeout(()=>setMsgs(m=>[...m,{role:"ai",text:aiReplies[Math.floor(Math.random()*aiReplies.length)]}]),900);
  };
  return (
    <div className="fi" style={{height:"calc(100vh - 130px)",display:"flex",flexDirection:"column"}}>
      <STitle title="AI Assistant · ARIA" sub="Powered by BuilderPro Intelligence"/>
      <div style={{flex:1,background:C.card,border:`1px solid ${C.bord}`,borderRadius:14,overflow:"hidden",display:"flex",flexDirection:"column"}}>
        <div style={{flex:1,overflowY:"auto",padding:20,display:"flex",flexDirection:"column",gap:12}}>
          {msgs.map((m,i)=>(
            <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",gap:10}}>
              {m.role==="ai"&&<div style={{width:30,height:30,borderRadius:8,background:`${C.blue}22`,display:"flex",alignItems:"center",justifyContent:"center",color:C.blue,fontSize:11,fontWeight:700,flexShrink:0}}>AI</div>}
              <div style={{background:m.role==="user"?C.gold:C.raise,color:m.role==="user"?"#000":C.txt,borderRadius:12,padding:"10px 14px",maxWidth:"75%",fontSize:13,lineHeight:1.5}}>{m.text}</div>
            </div>
          ))}
        </div>
        <div style={{padding:14,borderTop:`1px solid ${C.bord}`,display:"flex",gap:10}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}
            placeholder="Ask ARIA anything about your portfolio..." style={{...inp,flex:1}}/>
          <Btn onClick={send} icon={Send}>Send</Btn>
        </div>
      </div>
    </div>
  );
}
