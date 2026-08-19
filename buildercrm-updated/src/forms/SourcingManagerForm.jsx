import { Camera, CheckCircle, Check } from "lucide-react";
import { C } from "../config/theme.js";
import { Field, Btn } from "../components/ui";
import { inp } from "../components/ui/Input.jsx";

export function SourcingManagerForm({
  smForm,
  setSmForm,
  errors,
  setErrors,
  partnersList,
  handleCpSelect,
  startCamera,
  handleSmSubmit
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, borderBottom: `1px solid ${C.bord}`, paddingBottom: 10 }}>
        <h3 style={{ color: C.txt, fontSize: 16, fontWeight: 700 }}>Sourcing Manager Check-In</h3>
        <div style={{ background: `${C.gold}15`, color: C.gold, border: `1px solid ${C.gold}33`, padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700 }}>
          {smForm.smName || "Sourcing Manager"}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Check-In Date">
          <input type="date" value={smForm.date} readOnly style={{ ...inp, opacity: 0.7 }} />
        </Field>

        <Field label="Channel Partner Name" required>
          <select 
            value={smForm.cpId} 
            onChange={e => handleCpSelect(e.target.value)}
            style={{ ...inp, border: errors.cpId ? `1.5px solid ${C.red}` : inp.border, cursor: "pointer" }}
          >
            <option value="">Select Channel Partner</option>
            {partnersList.map(p => <option key={p.id} value={p.id}>{p.name} ({p.contactPerson})</option>)}
          </select>
        </Field>

        {/* Auto-filled details from CP selection */}
        <Field label="Address (Auto Filled)">
          <input value={smForm.address} readOnly placeholder="Select a Partner to auto-fill" style={{ ...inp, opacity: 0.7 }} />
        </Field>
        <Field label="Contact No. (Auto Filled)">
          <input value={smForm.contactNo} readOnly placeholder="Select a Partner to auto-fill" style={{ ...inp, opacity: 0.7 }} />
        </Field>
        <Field label="Email ID (Auto Filled)">
          <input value={smForm.emailId} readOnly placeholder="Select a Partner to auto-fill" style={{ ...inp, opacity: 0.7 }} />
        </Field>

        {/* Auto-filled Visit Counter */}
        <Field label="Total Visits to Date (Auto Filled)">
          <div style={{ ...inp, background: C.raise, color: C.gold, fontWeight: 700, opacity: 0.8, display: "flex", alignItems: "center" }}>
            {smForm.noOfVisits || "0"} Visits
          </div>
        </Field>

        <Field label="Time In">
          <input 
            type="time" 
            value={smForm.timeIn} 
            onChange={e => setSmForm(prev => ({ ...prev, timeIn: e.target.value }))}
            style={inp} 
          />
        </Field>
        <Field label="Time Out" required>
          <input 
            type="time" 
            value={smForm.timeOut} 
            onChange={e => {
              setSmForm(prev => ({ ...prev, timeOut: e.target.value }));
              setErrors(prev => ({ ...prev, timeOut: false }));
            }}
            style={{ ...inp, border: errors.timeOut ? `1.5px solid ${C.red}` : inp.border }} 
          />
        </Field>

        <div style={{ gridColumn: "1/-1" }}>
          <Field label="Meeting Remarks">
            <textarea 
              value={smForm.remark} 
              onChange={e => setSmForm(prev => ({ ...prev, remark: e.target.value }))}
              placeholder="Log partner feedback, requirements, or deal details discussed..."
              style={{ ...inp, minHeight: 70, resize: "vertical", fontFamily: "inherit" }}
            />
          </Field>
        </div>

        {/* Live Photo Capture with location */}
        <div style={{ gridColumn: "1/-1" }}>
          <label style={{ display: "block", color: C.sub, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
            Sourcing Manager Photo with Live GPS coordinates <span style={{ color: C.red }}>*</span>
          </label>
          
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <button 
              type="button"
              onClick={startCamera}
              style={{
                background: `${C.blue}15`, color: C.blue, border: `1px solid ${C.blue}33`,
                borderRadius: 8, padding: "10px 18px", fontSize: 12, fontWeight: 700,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 8
              }}
            >
              <Camera size={16} />
              Capture Live Photo
            </button>
            
            {smForm.livePhoto ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.teal, fontSize: 11, fontWeight: 600 }}>
                <CheckCircle size={15} /> Live Photo Logged ({smForm.liveCoords})
              </div>
            ) : (
              <span style={{ fontSize: 11, color: errors.livePhoto ? C.red : C.mute }}>
                {errors.livePhoto ? "⚠️ Capturing photo at the visit site is required." : "No photo captured yet."}
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justify: "flex-end", gap: 10, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.bord}` }}>
        <Btn onClick={handleSmSubmit} icon={Check}>Log Visit Details</Btn>
      </div>
    </div>
  );
}
