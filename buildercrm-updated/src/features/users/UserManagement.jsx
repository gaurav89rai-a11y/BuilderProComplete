import { useState, useEffect, useCallback } from "react";
import { Users, Plus, Edit, Trash2, Loader2, X, RefreshCw } from "lucide-react";
import { api } from "../../services/api.js";
import { C } from "../../config/theme.js";
import { allPermissionsList } from "../../utils/helpers.js";
import { Badge, Btn, Modal, Field, Input, Select, LoadingState, ErrorState, Toast, STitle } from "../../components/ui";
import { useConfig } from "../../config/ConfigContext.jsx";

export function UserManagement() {
  const { userRole, getDefault } = useConfig();
  const [users,setUsers]=useState([]);
  const [partners,setPartners]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [showModal,setShowModal]=useState(false);
  const [saving,setSaving]=useState(false);
  const [toast,setToast]=useState(null);
  const [editingId,setEditingId]=useState(null);

  const defaultRole = getDefault("userRole", "Sales Agent");

  const [form,setForm]=useState({name:"",email:"",role:defaultRole,permissions:"",channelPartnerId:""});

  const load=useCallback(async()=>{
    setLoading(true);setError(null);
    try { 
      const [uList, pList] = await Promise.all([
        api.getUsers(),
        api.getPartners().catch(() => [])
      ]);
      setUsers(uList || []);
      setPartners(pList || []);
    }
    catch(e){ setError(e.message); }
    finally { setLoading(false); }
  },[]);
  
  useEffect(()=>{ load(); },[load]);

  const f=(k)=>(v)=>setForm(p=>({...p,[k]:v}));

  const handleRoleChange = (newRole) => {
    setForm(prev => {
      let permissions = prev.permissions;
      if (newRole === "Channel Partner" && !permissions) {
        permissions = "view_dashboard,manage_leads,manage_customers,manage_bookings,manage_visits";
      }
      return { ...prev, role: newRole, permissions };
    });
  };

  const handleEditClick=(u)=>{
    setEditingId(u.id);
    setForm({
      name: u.name || "",
      email: u.email || "",
      role: u.role || "Sales Agent",
      permissions: u.permissions || "",
      channelPartnerId: u.channelPartnerId || "",
    });
    setShowModal(true);
  };

  const handleDeleteClick=async(id)=>{
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.deleteUser(id);
      setToast({msg:"User deleted successfully!",type:"success"});
      load();
    } catch(e){ setToast({msg:e.message,type:"error"}); }
  };

  const handleSubmit=async()=>{
    if(!form.name||!form.email) return setToast({msg:"Name and Email are required",type:"error"});
    if(form.role === "Channel Partner" && !form.channelPartnerId) {
      return setToast({msg:"Please select an associated Channel Partner entity for this partner user",type:"error"});
    }
    setSaving(true);
    try {
      const payload={
        ...form,
        channelPartnerId: form.channelPartnerId ? parseInt(form.channelPartnerId) : null
      };
      if (editingId) {
        await api.updateUser(editingId, { ...payload, id: editingId });
        setToast({msg:"User updated successfully!",type:"success"});
      } else {
        await api.createUser(payload);
        setToast({msg:"User created successfully!",type:"success"});
      }
      setShowModal(false);
      setEditingId(null);
      setForm({name:"",email:"",role:defaultRole,permissions:"",channelPartnerId:""});
      load();
    } catch(e){ setToast({msg:e.message,type:"error"}); }
    finally { setSaving(false); }
  };

  if(loading) return <LoadingState/>;
  if(error) return <ErrorState msg={error} onRetry={load}/>;

  return (
    <div className="fi">
      {toast&&<Toast {...toast} onClose={()=>setToast(null)}/>}
      <STitle title="User Management" sub={`${users.length} registered user profiles`}
        action={<Btn icon={Plus} onClick={()=>setShowModal(true)}>New User</Btn>}/>
      
      <div style={{background:C.card,border:`1px solid ${C.bord}`,borderRadius:14,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:C.raise}}>
              {["User","Email","Role","Permissions","Actions"].map(h=>(
                <th key={h} style={{padding:"10px 18px",textAlign:"left",color:C.mute,fontSize:10,fontWeight:600,letterSpacing:0.5,textTransform:"uppercase"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u,i)=>{
              const partnerObj = u.channelPartner || partners.find(p => p.id === u.channelPartnerId);
              return (
                <tr key={u.id} style={{borderBottom:`1px solid ${C.bord}`,background:i%2===0?"transparent":`${C.raise}40`}}>
                  <td style={{padding:"12px 18px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:9}}>
                      <div style={{width:32,height:32,borderRadius:8,background:`${C.gold}22`,display:"flex",alignItems:"center",justifyContent:"center",color:C.gold,fontWeight:700,fontSize:12}}>
                        {u.name.split(" ").map(n=>n[0]).join("")}
                      </div>
                      <div>
                        <div style={{color:C.txt,fontWeight:600,fontSize:12}}>{u.name}</div>
                        {partnerObj && (
                          <div style={{fontSize:10,color:C.gold,display:"flex",alignItems:"center",gap:3,marginTop:2}}>
                            <span>🏢</span> {partnerObj.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{padding:"12px 18px",color:C.sub,fontSize:11}}>{u.email}</td>
                  <td style={{padding:"12px 18px"}}>
                    <Badge s={u.role}/>
                  </td>
                  <td style={{padding:"12px 18px",maxWidth:300,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {u.permissions === "all" ? (
                      <span style={{color:C.teal,fontSize:11,fontWeight:600}}>All Permissions</span>
                    ) : (
                      (u.permissions || "").split(",").map(p => (
                        <span key={p} style={{background:C.raise,color:C.sub,fontSize:10,padding:"2px 6px",borderRadius:4,marginRight:4,display:"inline-block",marginBottom:2}}>
                          {p.replace("manage_","").replace("view_","")}
                        </span>
                      ))
                    )}
                  </td>
                  <td style={{padding:"12px 18px"}}>
                    {u.id !== 1 ? (
                      <div style={{display:"flex",gap:5}}>
                        <button onClick={()=>handleEditClick(u)} style={{background:C.raise,border:"none",borderRadius:6,padding:6,cursor:"pointer",color:C.sub,display:"flex"}}><Edit size={12}/></button>
                        <button onClick={()=>handleDeleteClick(u.id)} style={{background:C.raise,border:"none",borderRadius:6,padding:6,cursor:"pointer",color:C.red,display:"flex"}}><Trash2 size={12}/></button>
                      </div>
                    ) : (
                      <span style={{color:C.mute,fontSize:10}}>System Admin</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal&&(
        <Modal title={editingId ? "Edit User" : "Add User"} onClose={()=>{ setShowModal(false); setEditingId(null); setForm({name:"",email:"",role:defaultRole,permissions:"",channelPartnerId:""}); }} width={580}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <Field label="Full Name" required><Input value={form.name} onChange={f("name")} placeholder="e.g. Sanjay Bhatt"/></Field>
            <Field label="Email" required><Input type="email" value={form.email} onChange={f("email")} placeholder="email@propnest.com"/></Field>
            <div style={{gridColumn:"1/-1"}}>
              <Field label="System Role">
                <Select value={form.role} onChange={handleRoleChange} options={userRole}/>
              </Field>
            </div>

            {form.role === "Channel Partner" && (
              <div style={{gridColumn:"1/-1"}}>
                <Field label="Associated Channel Partner Firm" required>
                  <select 
                    value={form.channelPartnerId || ""} 
                    onChange={(e) => setForm(p => ({ ...p, channelPartnerId: e.target.value }))}
                    style={{
                      width:"100%", background:C.raise, border:`1px solid ${C.bord}`, borderRadius:8,
                      padding:"10px 14px", color:C.txt, fontSize:13, outline:"none"
                    }}
                  >
                    <option value="">-- Select Channel Partner Company --</option>
                    {partners.map(cp => (
                      <option key={cp.id} value={cp.id}>{cp.name} ({cp.contactPerson || cp.city})</option>
                    ))}
                  </select>
                </Field>
                <div style={{fontSize:11,color:C.mute,marginTop:4}}>
                  Channel Partner users will only be granted access to their own submitted leads, associated customers, and permitted booking statuses.
                </div>
              </div>
            )}
            
            {form.role !== "Super Admin" && (
              <div style={{gridColumn:"1/-1"}}>
                <label style={{display:"block",color:C.sub,fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:8}}>Permissions</label>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,background:C.raise,borderRadius:8,padding:12}}>
                  {allPermissionsList.map(p => {
                    const current = form.permissions ? form.permissions.split(",") : [];
                    const hasP = current.includes(p.key);
                    return (
                      <label key={p.key} style={{display:"flex",alignItems:"flex-start",gap:8,color:C.txt,fontSize:12,cursor:"pointer",padding:4}}>
                        <input 
                          type="checkbox" 
                          checked={hasP}
                          style={{marginTop:3}}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            const next = checked ? [...current, p.key] : current.filter(k => k !== p.key);
                            setForm(prev => ({ ...prev, permissions: next.join(",") }));
                          }}
                        />
                        <div>
                          <div style={{fontWeight:600,fontSize:11}}>{p.label}</div>
                          <div style={{fontSize:9,color:C.mute,marginTop:1}}>{p.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:20,paddingTop:16,borderTop:`1px solid ${C.bord}`}}>
            <Btn v="outline" onClick={()=>{ setShowModal(false); setEditingId(null); setForm({name:"",email:"",role:defaultRole,permissions:"",channelPartnerId:""}); }}>Cancel</Btn>
            <Btn onClick={handleSubmit} disabled={saving} icon={saving?Loader2:(editingId?Edit:Plus)}>{saving?(editingId?"Saving...":"Creating..."):(editingId?"Update User":"Create User")}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}