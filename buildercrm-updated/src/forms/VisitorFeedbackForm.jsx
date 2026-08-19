import { Loader2, Check } from "lucide-react";
import { C } from "../config/theme.js";
import { Field, Btn } from "../components/ui";
import { inp } from "../components/ui/Input.jsx";

export function VisitorFeedbackForm({
  visForm,
  setVisForm,
  errors,
  usersList,
  saving,
  handleStartVerify,
  togglePreference,
  handleVisitorSubmit
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, borderBottom: `1px solid ${C.bord}`, paddingBottom: 10 }}>
        <h3 style={{ color: C.txt, fontSize: 16, fontWeight: 700 }}>Visitor Feedback Form</h3>
        <div style={{ background: `${C.blue}15`, color: C.blue, border: `1px solid ${C.blue}33`, padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700 }}>
          Walk-in Log
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Visitor Name" required>
          <input 
            value={visForm.visitorName} 
            onChange={e => setVisForm(prev => ({ ...prev, visitorName: e.target.value }))}
            placeholder="Enter visitor's full name"
            style={{ ...inp, border: errors.visitorName ? `1.5px solid ${C.red}` : inp.border }}
          />
        </Field>

        {/* Contact no. with OTP */}
        <Field label="Contact No." required>
          <div style={{ display: "flex", gap: 8 }}>
            <input 
              value={visForm.contactNo} 
              maxLength={10}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, "");
                setVisForm(prev => ({ ...prev, contactNo: val, otpVerified: false }));
              }}
              placeholder="98XXXXXXXX"
              style={{ ...inp, flex: 1, border: errors.contactNo ? `1.5px solid ${C.red}` : inp.border }}
            />
            {visForm.otpVerified ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: `${C.teal}15`, color: C.teal, border: `1px solid ${C.teal}33`, borderRadius: 8, padding: "0 10px", fontSize: 11, fontWeight: 700 }}>
                ✓ Verified
              </span>
            ) : (
              <button 
                type="button"
                disabled={!visForm.contactNo || visForm.contactNo.length < 10} 
                onClick={() => handleStartVerify(1, visForm.contactNo)}
                style={{
                  background: "transparent", color: C.gold, border: `1px solid ${C.bord}`,
                  borderRadius: 8, padding: "0 12px", fontSize: 11, fontWeight: 700,
                  cursor: (!visForm.contactNo || visForm.contactNo.length < 10) ? "not-allowed" : "pointer"
                }}
              >
                Verify OTP
              </button>
            )}
          </div>
        </Field>

        <Field label="Email ID">
          <input 
            type="email"
            value={visForm.emailId} 
            onChange={e => setVisForm(prev => ({ ...prev, emailId: e.target.value }))}
            placeholder="visitor@email.com"
            style={inp}
          />
        </Field>

        <Field label="How did you know about us?" required>
          <select 
            value={visForm.source} 
            onChange={e => setVisForm(prev => ({ ...prev, source: e.target.value }))}
            style={{ ...inp, border: errors.source ? `1.5px solid ${C.red}` : inp.border, cursor: "pointer" }}
          >
            <option value="Self">Self</option>
            <option value="Channel Partner">Channel Partner</option>
            <option value="Facebook/Instagram">Facebook/Instagram</option>
            <option value="Hoarding">Hoarding</option>
            <option value="Property Portal">Property Portal (99acres, MagicBricks)</option>
            <option value="Friends & Family">Friends & Family Reference</option>
            <option value="Others">Others</option>
          </select>
        </Field>

        <div style={{ gridColumn: "1/-1" }}>
          <Field label="Address">
            <input 
              value={visForm.address} 
              onChange={e => setVisForm(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Current residential address"
              style={inp}
            />
          </Field>
        </div>

        {/* Preference Badges */}
        <div>
          <label style={{ display: "block", color: C.sub, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
            Preference
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            {["1-BHK", "2-BHK", "3-BHK", "Shop"].map(pref => {
              const selected = visForm.preferences.includes(pref);
              return (
                <button
                  key={pref}
                  type="button"
                  onClick={() => togglePreference(pref)}
                  style={{
                    padding: "8px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                    background: selected ? "#8A3DF0" : C.raise,
                    color: "#fff",
                    border: selected ? "1px solid #8A3DF0" : `1px solid ${C.bord}`, cursor: "pointer"
                  }}
                >
                  {pref}
                </button>
              );
            })}
          </div>
        </div>

        {/* Revisit Toggles */}
        <div>
          <label style={{ display: "block", color: C.sub, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
            Revisit Stage
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            {["1st", "2nd", "3rd"].map(stage => {
              const selected = visForm.revisit === stage;
              return (
                <button
                  key={stage}
                  type="button"
                  onClick={() => setVisForm(prev => ({ ...prev, revisit: stage }))}
                  style={{
                    padding: "8px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                    background: selected ? "#8A3DF0" : C.raise,
                    color: "#fff",
                    border: selected ? "1px solid #8A3DF0" : `1px solid ${C.bord}`, cursor: "pointer"
                  }}
                >
                  {stage}
                </button>
              );
            })}
          </div>
        </div>

        <Field label="Date of Birth">
          <input 
            type="date"
            value={visForm.dob} 
            onChange={e => setVisForm(prev => ({ ...prev, dob: e.target.value }))}
            style={inp}
          />
        </Field>

        <Field label="Date of Anniversary">
          <input 
            type="date"
            value={visForm.anniversary} 
            onChange={e => setVisForm(prev => ({ ...prev, anniversary: e.target.value }))}
            style={inp}
          />
        </Field>

        <Field label="Attended By" required>
          <select 
            value={visForm.attendedBy} 
            onChange={e => setVisForm(prev => ({ ...prev, attendedBy: e.target.value }))}
            style={{ ...inp, border: errors.attendedBy ? `1.5px solid ${C.red}` : inp.border, cursor: "pointer" }}
          >
            {usersList.filter(u => u.role === "Sales Agent" || u.role === "Super Admin").map(u => (
              <option key={u.id} value={u.name}>{u.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Sourcing Manager">
          <select 
            value={visForm.sourcingManagerId} 
            onChange={e => setVisForm(prev => ({ ...prev, sourcingManagerId: e.target.value }))}
            style={{ ...inp, cursor: "pointer" }}
          >
            {usersList.filter(u => u.role === "Manager" || u.role === "Super Admin").map(u => (
              <option key={u.id} value={u.name}>{u.name}</option>
            ))}
          </select>
        </Field>

        <div style={{ gridColumn: "1/-1" }}>
          <Field label="Remarks / Special Requirements">
            <textarea 
              value={visForm.remark} 
              onChange={e => setVisForm(prev => ({ ...prev, remark: e.target.value }))}
              placeholder="Provide details about customer requirements..."
              style={{ ...inp, minHeight: 70, resize: "vertical", fontFamily: "inherit" }}
            />
          </Field>
        </div>

        {/* Opt-in disclaimer */}
        <div style={{ gridColumn: "1/-1", display: "flex", gap: 10, alignItems: "flex-start", marginTop: 6 }}>
          <input 
            type="checkbox" 
            id="optInCheck"
            checked={visForm.marketingOptIn}
            onChange={e => setVisForm(prev => ({ ...prev, marketingOptIn: e.target.checked }))}
            style={{ marginTop: 3, cursor: "pointer" }}
          />
          <label htmlFor="optInCheck" style={{ fontSize: 11, color: C.sub, cursor: "pointer", lineHeight: 1.4 }}>
            I would like to receive E-mail, SMS, and calls regarding project updates, offers & upcoming activities.
          </label>
        </div>
      </div>

      <div style={{ display: "flex", justify: "flex-end", gap: 10, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.bord}` }}>
        <Btn onClick={handleVisitorSubmit} disabled={saving} icon={saving ? Loader2 : Check}>
          {saving ? "Saving..." : "Submit Feedback"}
        </Btn>
      </div>
    </div>
  );
}
