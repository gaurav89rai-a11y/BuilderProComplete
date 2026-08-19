import { useState } from "react";
import { Loader2, CheckCircle, Plus } from "lucide-react";
import { C } from "../../config/theme.js";

export function DocUploadField({ label, value, onChange, reqKey, errors, setErrors }) {
  const [uploading, setUploading] = useState(false);
  const hasError = errors?.[reqKey];

  const handleUpload = () => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      const ext = label.toLowerCase().includes("photo") ? "png" : "pdf";
      onChange(`${label.toLowerCase().replace(/[^a-z0-9]/g, "_")}_upload.${ext}`);
      if (setErrors) {
        setErrors(prev => ({ ...prev, [reqKey]: false }));
      }
    }, 1000);
  };

  return (
    <div 
      onClick={handleUpload}
      style={{
        border: hasError ? `1.5px dashed ${C.red}` : (value ? `1px solid ${C.teal}44` : `1px dashed ${C.bord}`),
        background: value ? `${C.teal}08` : C.raise,
        borderRadius: 10,
        padding: "16px 14px",
        textAlign: "center",
        cursor: "pointer",
        transition: "all 0.2s ease"
      }}
    >
      {uploading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: C.sub, fontSize: 12, height: 42 }}>
          <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Uploading...
        </div>
      ) : value ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: C.teal, fontSize: 12, height: 42 }}>
          <CheckCircle size={15} color={C.teal} /> 
          <div style={{ textAlign: "left" }}>
            <div style={{ fontWeight: 700, color: C.txt, fontSize: 11 }}>{label}</div>
            <div style={{ fontSize: 9, color: C.sub, marginTop: 1 }}>{value}</div>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, color: C.sub, padding: "2px 0" }}>
          <Plus size={16} color={C.mute} />
          <span style={{ fontSize: 12, fontWeight: 700 }}>{label}</span>
          <span style={{ fontSize: 9, color: C.mute }}>Click to upload</span>
        </div>
      )}
    </div>
  );
}
