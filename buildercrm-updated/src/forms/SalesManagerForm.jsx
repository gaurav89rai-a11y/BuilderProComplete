import { Check } from "lucide-react";
import { C } from "../config/theme.js";
import { Field, Btn } from "../components/ui";
import { inp } from "../components/ui/Input.jsx";

export function SalesManagerForm({
  salesMForm,
  setSalesMForm,
  errors,
  setErrors,
  usersList,
  handleSalesMSubmit
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, borderBottom: `1px solid ${C.bord}`, paddingBottom: 10 }}>
        <h3 style={{ color: C.txt, fontSize: 16, fontWeight: 700 }}>Sales Manager Daily Performance</h3>
        <div style={{ background: `${C.blue}15`, color: C.blue, border: `1px solid ${C.blue}33`, padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700 }}>
          Daily Log
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Activity Date">
          <input type="date" value={salesMForm.date} readOnly style={{ ...inp, opacity: 0.7 }} />
        </Field>

        <Field label="Sales Manager Name" required>
          <select 
            value={salesMForm.smName} 
            onChange={e => {
              setSalesMForm(prev => ({ ...prev, smName: e.target.value }));
              setErrors(prev => ({ ...prev, smName: false }));
            }}
            style={{ ...inp, border: errors.smName ? `1.5px solid ${C.red}` : inp.border, cursor: "pointer" }}
          >
            {usersList.filter(u => u.role === "Sales Agent" || u.role === "Super Admin").map(u => (
              <option key={u.id} value={u.name}>{u.name}</option>
            ))}
          </select>
        </Field>

        <Field label="No. of Visits Attended" required>
          <input 
            type="number"
            min="0"
            value={salesMForm.visitsAttended} 
            onChange={e => {
              setSalesMForm(prev => ({ ...prev, visitsAttended: e.target.value }));
              setErrors(prev => ({ ...prev, visitsAttended: false }));
            }}
            placeholder="e.g. 5" 
            style={{ ...inp, border: errors.visitsAttended ? `1.5px solid ${C.red}` : inp.border }} 
          />
        </Field>

        <Field label="No. of Revisits Attended" required>
          <input 
            type="number"
            min="0"
            value={salesMForm.revisitsAttended} 
            onChange={e => {
              setSalesMForm(prev => ({ ...prev, revisitsAttended: e.target.value }));
              setErrors(prev => ({ ...prev, revisitsAttended: false }));
            }}
            placeholder="e.g. 2" 
            style={{ ...inp, border: errors.revisitsAttended ? `1.5px solid ${C.red}` : inp.border }} 
          />
        </Field>

        <Field label="No. of Follow-up Calls Made" required>
          <input 
            type="number"
            min="0"
            value={salesMForm.followUpCalls} 
            onChange={e => {
              setSalesMForm(prev => ({ ...prev, followUpCalls: e.target.value }));
              setErrors(prev => ({ ...prev, followUpCalls: false }));
            }}
            placeholder="e.g. 18" 
            style={{ ...inp, border: errors.followUpCalls ? `1.5px solid ${C.red}` : inp.border }} 
          />
        </Field>

        <Field label="No. of Bookings Secured" required>
          <input 
            type="number"
            min="0"
            value={salesMForm.bookingsCount} 
            onChange={e => {
              setSalesMForm(prev => ({ ...prev, bookingsCount: e.target.value }));
              setErrors(prev => ({ ...prev, bookingsCount: false }));
            }}
            placeholder="e.g. 1" 
            style={{ ...inp, border: errors.bookingsCount ? `1.5px solid ${C.red}` : inp.border }} 
          />
        </Field>

        <Field label="Time In">
          <input 
            type="time" 
            value={salesMForm.timeIn} 
            onChange={e => setSalesMForm(prev => ({ ...prev, timeIn: e.target.value }))}
            style={inp} 
          />
        </Field>
        <Field label="Time Out">
          <input 
            type="time" 
            value={salesMForm.timeOut} 
            onChange={e => setSalesMForm(prev => ({ ...prev, timeOut: e.target.value }))}
            style={inp} 
          />
        </Field>

        <div style={{ gridColumn: "1/-1" }}>
          <Field label="Other Daily Work / Notes">
            <textarea 
              value={salesMForm.otherWorks} 
              onChange={e => setSalesMForm(prev => ({ ...prev, otherWorks: e.target.value }))}
              placeholder="Log other tasks completed (e.g., dealer visits, marketing support, legal reviews)..."
              style={{ ...inp, minHeight: 70, resize: "vertical", fontFamily: "inherit" }}
            />
          </Field>
        </div>
      </div>

      <div style={{ display: "flex", justify: "flex-end", gap: 10, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.bord}` }}>
        <Btn onClick={handleSalesMSubmit} icon={Check}>Submit Performance Log</Btn>
      </div>
    </div>
  );
}
