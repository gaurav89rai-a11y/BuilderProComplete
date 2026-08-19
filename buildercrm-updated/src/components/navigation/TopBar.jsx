import { useState } from "react";
import { Search, Sun, Moon, Bell } from "lucide-react";
import { C } from "../../config/theme.js";
import { LABELS } from "../../config/navigation.js";
import { Modal, Btn } from "../ui";

export function TopBar({mod, theme, toggleTheme, user}) {
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  return (
    <div style={{background:C.side,borderBottom:`1px solid ${C.bord}`,padding:"0 22px",
      height:58,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
      <div>
        <div style={{color:C.txt,fontSize:15,fontWeight:700}}>{LABELS[mod]}</div>
        <div style={{color:C.mute,fontSize:10}}>Matrix Group ERP Platform · v2.4.1</div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:8,background:C.raise,
          border:`1px solid ${C.bord}`,borderRadius:10,padding:"7px 12px"}}>
          <Search size={13} color={C.mute}/>
          <input placeholder="Search anything..." style={{background:"transparent",border:"none",
            outline:"none",color:C.txt,fontSize:12,width:180}}/>
        </div>
        <button onClick={toggleTheme} title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          style={{background:C.raise,border:`1px solid ${C.bord}`,
          borderRadius:9,padding:8,cursor:"pointer",color:C.sub,display:"flex",alignItems:"center"}}>
          {theme === "dark" ? <Sun size={15}/> : <Moon size={15}/>}
        </button>
        <button style={{position:"relative",background:C.raise,border:`1px solid ${C.bord}`,
          borderRadius:9,padding:8,cursor:"pointer",color:C.sub,display:"flex"}}>
          <Bell size={15}/>
          <span style={{position:"absolute",top:5,right:5,width:7,height:7,
            borderRadius:"50%",background:C.red,border:`1.5px solid ${C.side}`}}/>
        </button>
        
        <button onClick={() => setShowProfileModal(true)} title="View Profile Details" 
          style={{background:"none",border:"none",padding:0,cursor:"pointer",display:"flex"}}>
          <div style={{width:34,height:34,borderRadius:9,background:`${C.gold}22`,
            display:"flex",alignItems:"center",justifyContent:"center",color:C.gold,fontWeight:700,fontSize:12,transition:"all 0.15s"}}
            onMouseEnter={e=>e.currentTarget.style.transform="scale(1.06)"}
            onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
            {user ? user.name.split(" ").map(n=>n[0]).join("") : "AK"}
          </div>
        </button>
      </div>

      {showProfileModal && user && (
        <Modal title="My Profile" onClose={() => setShowProfileModal(false)}>
          <div style={{display:"flex",flexDirection:"column",gap:16,alignItems:"center",padding:"10px 0"}}>
            <div style={{width:64,height:64,borderRadius:"50%",background:`${C.gold}22`,display:"flex",alignItems:"center",justifyContent:"center",color:C.gold,fontWeight:800,fontSize:20,border:`2px solid ${C.gold}`}}>
              {user.name.split(" ").map(n=>n[0]).join("")}
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{color:C.txt,fontSize:18,fontWeight:800}}>{user.name}</div>
              <div style={{color:C.sub,fontSize:13,marginTop:4}}>{user.email}</div>
            </div>
            
            <div style={{width:"100%",background:C.raise,borderRadius:12,padding:14,border:`1px solid ${C.bord}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,paddingBottom:8,borderBottom:`1px solid ${C.bord}`}}>
                <span style={{color:C.mute,fontSize:11,fontWeight:600,textTransform:"uppercase"}}>System Role</span>
                <span style={{background:C.card,color:C.gold,fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:6,border:`1px solid ${C.bord}`}}>{user.role}</span>
              </div>
              
              <div>
                <span style={{color:C.mute,fontSize:11,fontWeight:600,textTransform:"uppercase",display:"block",marginBottom:8}}>Active Permissions</span>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {user.permissions === "all" ? (
                    <span style={{background:`${C.teal}18`,color:C.teal,fontSize:10,fontWeight:700,padding:"4px 10px",borderRadius:6}}>Full Administrative Access</span>
                  ) : (
                    user.permissions.split(",").map(p => (
                      <span key={p} style={{background:C.card,color:C.sub,fontSize:10,fontWeight:600,padding:"4px 8px",borderRadius:6,border:`1px solid ${C.bord}`}}>
                        {p.replace("manage_","").replace("view_","").replace("_"," ")}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
            
            <div style={{width:"100%",display:"flex",justifyContent:"flex-end",marginTop:8,paddingTop:16,borderTop:`1px solid ${C.bord}`}}>
              <Btn onClick={() => setShowProfileModal(false)}>Close</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
