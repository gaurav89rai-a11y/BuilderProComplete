import { useState, useEffect, useCallback } from "react";
import { Shield } from "lucide-react";
import { C } from "../../config/theme.js";
import { Badge, STitle } from "../../components/ui";

export function RERACompliance() {
  const RERA_DATA=[
    {project:"Skyline Heights",rera:"P51900034682",expires:"2025-12-31",quarterly:"Filed",annual:"Filed",status:"Compliant"},
    {project:"Green Valley Township",rera:"P51900029841",expires:"2026-06-30",quarterly:"Pending",annual:"Filed",status:"Action Required"},
    {project:"Meridian Business Park",rera:"P51900041236",expires:"2024-03-31",quarterly:"Filed",annual:"Filed",status:"Expiring Soon"},
    {project:"Pearl Residences",rera:"P51900051890",expires:"2026-12-31",quarterly:"N/A",annual:"N/A",status:"Recently Registered"},
  ];
  return (
    <div className="fi">
      <STitle title="RERA Compliance" sub="Regulatory compliance tracker"/>
      <div style={{background:C.card,border:`1px solid ${C.bord}`,borderRadius:14,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:C.raise}}>
              {["Project","RERA Number","Expiry","Quarterly","Annual","Status"].map(h=>(
                <th key={h} style={{padding:"10px 18px",textAlign:"left",color:C.mute,fontSize:10,fontWeight:600,letterSpacing:0.5,textTransform:"uppercase"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RERA_DATA.map((r,i)=>(
              <tr key={i} style={{borderBottom:`1px solid ${C.bord}`}}>
                <td style={{padding:"12px 18px",color:C.txt,fontWeight:600,fontSize:12}}>{r.project}</td>
                <td style={{padding:"12px 18px",color:C.gold,fontFamily:"monospace",fontSize:11}}>{r.rera}</td>
                <td style={{padding:"12px 18px",color:C.sub,fontSize:11}}>{r.expires}</td>
                <td style={{padding:"12px 18px"}}><Badge s={r.quarterly}/></td>
                <td style={{padding:"12px 18px"}}><Badge s={r.annual}/></td>
                <td style={{padding:"12px 18px"}}><Badge s={r.status}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
