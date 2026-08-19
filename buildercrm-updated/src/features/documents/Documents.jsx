import { useState, useEffect, useCallback } from "react";
import { FolderOpen, Plus, Download, Loader2, X, RefreshCw, FileText } from "lucide-react";
import { api } from "../../services/api.js";
import { C } from "../../config/theme.js";
import { Badge, Btn, Modal, Field, Input, Select, LoadingState, ErrorState, Toast, STitle } from "../../components/ui";
import { useConfig } from "../../config/ConfigContext.jsx";

export function Documents() {
  const { documentType: documentTypes, documentStatus: documentStatuses, getDefault } = useConfig();
  const [docs,setDocs]=useState([]);
  const [projects,setProjects]=useState([]);
  const [customers,setCustomers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [showModal,setShowModal]=useState(false);
  const [saving,setSaving]=useState(false);
  const [toast,setToast]=useState(null);

  const defaultType = getDefault("documentType", "Agreement");
  const defaultStatus = getDefault("documentStatus", "Pending");

  const [form,setForm]=useState({name:"",documentType:defaultType,projectId:"",customerId:"",filePath:"",fileSize:"",status:defaultStatus});

  const load=useCallback(async()=>{
    setLoading(true);setError(null);
    try {
      const [d,p,c]=await Promise.all([api.getDocuments(),api.getProjects(),api.getCustomers()]);
      setDocs(d); setProjects(p); setCustomers(c);
    } catch(e){ setError(e.message); }
    finally { setLoading(false); }
  },[]);
  useEffect(()=>{ load(); },[load]);

  const f=(k)=>(v)=>setForm(p=>({...p,[k]:v}));

  const handleSubmit=async()=>{
    if(!form.name||!form.documentType) return setToast({msg:"Name and Document Type are required",type:"error"});
    setSaving(true);
    try {
      await api.createDocument({...form,projectId:form.projectId?+form.projectId:null,customerId:form.customerId?+form.customerId:null});
      setShowModal(false);
      setForm({name:"",documentType:defaultType,projectId:"",customerId:"",filePath:"",fileSize:"",status:defaultStatus});
      setToast({msg:"Document added successfully!",type:"success"});
      load();
    } catch(e){ setToast({msg:e.message,type:"error"}); }
    finally { setSaving(false); }
  };

  if(loading) return <LoadingState/>;
  if(error) return <ErrorState msg={error} onRetry={load}/>;

  return (
    <div className="fi">
      {toast&&<Toast {...toast} onClose={()=>setToast(null)}/>}
      <STitle title="Document Management" sub="All project & customer documents"
        action={<Btn icon={Plus} onClick={()=>setShowModal(true)}>Add Document</Btn>}/>
      <div style={{display:"grid",gap:10}}>
        {docs.map(d=>(
          <div key={d.id} style={{background:C.card,border:`1px solid ${C.bord}`,borderRadius:12,padding:16,
            display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{background:`${C.blue}20`,borderRadius:10,padding:10,color:C.blue,display:"flex"}}>
                <FileText size={16}/>
              </div>
              <div>
                <div style={{color:C.txt,fontWeight:600,fontSize:13}}>{d.name}</div>
                <div style={{color:C.sub,fontSize:11,marginTop:2}}>{d.documentType} · {d.project?.name||"—"} · {d.fileSize||"—"} · {d.createdAt?.split("T")[0]}</div>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <Badge s={d.status}/>
              <Btn icon={Download} v="ghost" sm>Download</Btn>
            </div>
          </div>
        ))}
      </div>

      {showModal&&(
        <Modal title="Add Document" onClose={()=>setShowModal(false)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div style={{gridColumn:"1/-1"}}>
              <Field label="Document Name" required><Input value={form.name} onChange={f("name")} placeholder="e.g. Sale Agreement - Rajesh Verma"/></Field>
            </div>
            <Field label="Document Type" required>
              <Select value={form.documentType} onChange={f("documentType")} options={documentTypes}/>
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={f("status")} options={documentStatuses}/>
            </Field>
            <Field label="Project">
              <Select value={form.projectId} onChange={f("projectId")} placeholder="Select Project"
                options={projects.map(p=>({value:p.id,label:p.name}))}/>
            </Field>
            <Field label="Customer">
              <Select value={form.customerId} onChange={f("customerId")} placeholder="Select Customer"
                options={customers.map(c=>({value:c.id,label:c.name}))}/>
            </Field>
            <Field label="File Size"><Input value={form.fileSize} onChange={f("fileSize")} placeholder="e.g. 2.4 MB"/></Field>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:20,paddingTop:16,borderTop:`1px solid ${C.bord}`}}>
            <Btn v="outline" onClick={()=>setShowModal(false)}>Cancel</Btn>
            <Btn onClick={handleSubmit} disabled={saving} icon={saving?Loader2:Plus}>{saving?"Adding...":"Add Document"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}