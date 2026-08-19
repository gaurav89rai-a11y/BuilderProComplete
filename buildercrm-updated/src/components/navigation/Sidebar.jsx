import { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft, LogOut, ChevronDown } from "lucide-react";
import { C } from "../../config/theme.js";
import { NAV } from "../../config/navigation.js";
import { hasPermission } from "../../config/permissions.js";

export function Sidebar({active, setActive, col, setCol, user, usersList, onSelectUser, onLogout}) {
  const [expandedGroups, setExpandedGroups] = useState({
    crm: true,
    oms: true,
    construction_group: true,
    finance_group: true,
    hrms_group: true,
    administration_group: true
  });

  // Helper to find which group the active item belongs to
  const getParentGroup = (itemId) => {
    for (const g of NAV) {
      if (g.isGroup && g.items.some(item => item.id === itemId)) {
        return g.id;
      }
    }
    return null;
  };

  // Auto-expand the parent group of the active item on mount/active item change
  useEffect(() => {
    const parent = getParentGroup(active);
    if (parent) {
      setExpandedGroups(prev => ({ ...prev, [parent]: true }));
    }
  }, [active]);

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  return (
    <div style={{width:col?62:228,background:C.side,borderRight:`1px solid ${C.bord}`,
      display:"flex",flexDirection:"column",transition:"width 0.25s ease",overflow:"hidden",flexShrink:0}}>
      
      {/* Sidebar Header */}
      <div style={{padding:col?"15px 10px":"15px 18px",borderBottom:`1px solid ${C.bord}`,
        display:"flex",alignItems:"center",justifyContent:col?"center":"space-between",height:58}}>
        <div style={{display: "flex", alignItems: "center", gap: 8}}>
          <div style={{width: 28, height: 28, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center"}}>
            <img src="/logo.png" style={{width: "100%", height: "100%", objectFit: "contain"}} />
          </div>
          {!col && (
            <div style={{display: "flex", flexDirection: "column"}}>
              <span style={{color: C.txt, fontWeight: 800, fontSize: 13, letterSpacing: 0.5, lineHeight: 1.2}}>Abhay</span>
              <span style={{color: C.gold, fontWeight: 700, fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", lineHeight: 1}}>Buildcon</span>
            </div>
          )}
        </div>
        <button onClick={()=>setCol(!col)} style={{background:C.raise,border:`1px solid ${C.bord}`,
          borderRadius:7,padding:6,cursor:"pointer",color:C.sub,display:"flex",alignItems:"center",marginLeft:col?0:10}}>
          {col?<ChevronRight size={13}/>:<ChevronLeft size={13}/>}
        </button>
      </div>

      {/* Navigation Items */}
      <div style={{flex:1,overflowY:"auto",padding:"10px 6px"}}>
        {NAV.map(sec => {
          if (!sec.isGroup) {
            // Render single items (like Dashboard)
            const allowed = hasPermission(user, sec.id);
            if (!allowed) return null;
            const on = active === sec.id;
            return (
              <button key={sec.id} onClick={()=>setActive(sec.id)} title={col ? sec.sec : ""}
                style={{width:"100%",display:"flex",alignItems:"center",gap:9,
                  padding:col?"10px":"8px 10px",borderRadius:8,border:"none",cursor:"pointer",
                  marginBottom:4,justifyContent:col?"center":"flex-start",
                  background:on?`${C.gold}18`:"transparent",color:on?C.gold:C.sub,transition:"all 0.15s"}}>
                <sec.icon size={15} style={{flexShrink:0}}/>
                {!col&&<>
                  <span style={{fontSize:12,fontWeight:on?600:400,whiteSpace:"nowrap"}}>{sec.sec}</span>
                  {on&&<div style={{marginLeft:"auto",width:3,height:14,background:C.gold,borderRadius:2}}/>}
                </>}
              </button>
            );
          } else {
            // Render accordion groups (Masters, Sales CRM, etc.)
            const allowedSubItems = sec.items.filter(item => hasPermission(user, item.id));
            if (allowedSubItems.length === 0) return null;

            if (col) {
              // Narrow mode: show group icon, click activates the first allowed sub-item
              const hasActiveChild = allowedSubItems.some(item => item.id === active);
              const firstAllowedId = allowedSubItems[0]?.id;
              
              return (
                <button 
                  key={sec.id} 
                  onClick={() => firstAllowedId && setActive(firstAllowedId)} 
                  title={sec.sec}
                  style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",
                    padding:"10px",borderRadius:8,border:"none",cursor:"pointer",
                    marginBottom:4, background:hasActiveChild ? `${C.gold}18` : "transparent",
                    color:hasActiveChild ? C.gold : C.sub, transition:"all 0.15s"}}
                >
                  <sec.icon size={15} style={{flexShrink:0}}/>
                </button>
              );
            } else {
              // Wide mode: Collapsible accordion group
              const isExpanded = !!expandedGroups[sec.id];
              return (
                <div key={sec.id} style={{marginBottom:6}}>
                  <button 
                    onClick={() => toggleGroup(sec.id)}
                    style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",
                      padding:"8px 10px",borderRadius:8,border:"none",cursor:"pointer",
                      background:"transparent",color:C.txt,transition:"all 0.15s"}}
                  >
                    <div style={{display:"flex",alignItems:"center",gap:9}}>
                      <sec.icon size={15} style={{flexShrink:0, color: C.sub}}/>
                      <span style={{fontSize:12,fontWeight:600,whiteSpace:"nowrap"}}>{sec.sec}</span>
                    </div>
                    <ChevronDown size={11} style={{transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", color: C.mute}}/>
                  </button>

                  {isExpanded && (
                    <div style={{paddingLeft:16, marginTop:2, display:"flex", flexDirection:"column", gap:1}}>
                      {allowedSubItems.map(item => {
                        const on = active === item.id;
                        return (
                          <button key={item.id} onClick={()=>setActive(item.id)}
                            style={{width:"100%",display:"flex",alignItems:"center",gap:8,
                              padding:"6px 10px",borderRadius:6,border:"none",cursor:"pointer",
                              background:on?`${C.gold}18`:"transparent",color:on?C.gold:C.sub,transition:"all 0.15s",
                              textAlign:"left"}}>
                            <span style={{fontSize:10,opacity:0.6}}>•</span>
                            <span style={{fontSize:11.5,fontWeight:on?600:400,whiteSpace:"nowrap"}}>{item.label}</span>
                            {on&&<div style={{marginLeft:"auto",width:2.5,height:10,background:C.gold,borderRadius:2}}/>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
          }
        })}
      </div>

      {/* User Simulator and Profile controls */}
      <div style={{padding:col?"12px 6px":"12px",borderTop:`1px solid ${C.bord}`}}>
        {!col && usersList && usersList.length > 0 && (
          <div style={{marginBottom:8}}>
            <label style={{color:C.mute,fontSize:9,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",display:"block",marginBottom:4}}>Simulate User Role</label>
            <select 
              value={user?.id || ""} 
              onChange={(e) => {
                const selected = usersList.find(u => u.id === parseInt(e.target.value));
                if (selected) onSelectUser(selected);
              }}
              style={{
                background:C.raise, border:`1px solid ${C.bord}`, borderRadius:6, padding:"4px 8px",
                color:C.txt, fontSize:11, width:"100%", outline:"none", cursor:"pointer"
              }}
            >
              {usersList.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>
        )}
        <div style={{display:"flex",alignItems:"center",gap:9,padding:col?"8px 0":"8px 6px",justifyContent:"space-between",width:"100%"}}>
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <div style={{width:32,height:32,borderRadius:9,background:`${C.gold}22`,
              display:"flex",alignItems:"center",justifyContent:"center",color:C.gold,fontWeight:700,fontSize:12,flexShrink:0}}>
              {user ? user.name.split(" ").map(n=>n[0]).join("") : "AK"}
            </div>
            {!col&&<div>
              <div style={{color:C.txt,fontSize:12,fontWeight:600}}>{user?.name || "Arjun Kapoor"}</div>
              <div style={{color:C.mute,fontSize:10}}>{user?.role || "Super Admin"}</div>
            </div>}
          </div>
          {!col&&<button onClick={onLogout} title="Logout" style={{background:"none",border:"none",color:C.mute,cursor:"pointer",display:"flex",alignItems:"center",padding:6,borderRadius:6}}
            onMouseEnter={e=>e.currentTarget.style.color=C.red}
            onMouseLeave={e=>e.currentTarget.style.color=C.mute}>
            <LogOut size={15}/>
          </button>}
        </div>
      </div>
    </div>
  );
}
