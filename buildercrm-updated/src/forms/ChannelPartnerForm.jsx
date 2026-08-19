import { MapPin, Loader2, Check } from "lucide-react";
import { C } from "../config/theme.js";
import { Field, Btn, DocUploadField } from "../components/ui";
import { inp } from "../components/ui/Input.jsx";

export function ChannelPartnerForm({
  cpForm,
  setCpForm,
  projectsList,
  usersList,
  errors,
  setErrors,
  saving,
  handleStartVerify,
  toggleMarketingMaterial,
  setShowMapPicker,
  handleCpSubmit
}) {
  return (
    <div>
      <h3 style={{ color: C.txt, fontSize: 16, fontWeight: 700, marginBottom: 18, borderBottom: `1px solid ${C.bord}`, paddingBottom: 10 }}>
        Channel Partner Enrollment
      </h3>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Name of Firm" required>
          <input 
            value={cpForm.nameOfFirm} 
            onChange={e => setCpForm(prev => ({ ...prev, nameOfFirm: e.target.value }))}
            placeholder="e.g. Balaji Realty Associates"
            style={{ ...inp, border: errors.nameOfFirm ? `1.5px solid ${C.red}` : inp.border }}
          />
        </Field>
        <Field label="Name of Owner" required>
          <input 
            value={cpForm.nameOfOwner} 
            onChange={e => setCpForm(prev => ({ ...prev, nameOfOwner: e.target.value }))}
            placeholder="Owner / Contact Person name"
            style={{ ...inp, border: errors.nameOfOwner ? `1.5px solid ${C.red}` : inp.border }}
          />
        </Field>

        {/* Contact with OTP */}
        <Field label="Contact No." required>
          <div style={{ display: "flex", gap: 8 }}>
            <input 
              value={cpForm.contactNo} 
              maxLength={10}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, "");
                setCpForm(prev => ({ ...prev, contactNo: val, otpVerified: false }));
              }}
              placeholder="98XXXXXXXX"
              style={{ ...inp, flex: 1, border: errors.contactNo ? `1.5px solid ${C.red}` : inp.border }}
            />
            {cpForm.otpVerified ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: `${C.teal}15`, color: C.teal, border: `1px solid ${C.teal}33`, borderRadius: 8, padding: "0 10px", fontSize: 11, fontWeight: 700 }}>
                ✓ Verified
              </span>
            ) : (
              <button 
                type="button"
                disabled={!cpForm.contactNo || cpForm.contactNo.length < 10} 
                onClick={() => handleStartVerify(0, cpForm.contactNo)}
                style={{
                  background: "transparent", color: C.gold, border: `1px solid ${C.bord}`,
                  borderRadius: 8, padding: "0 12px", fontSize: 11, fontWeight: 700,
                  cursor: (!cpForm.contactNo || cpForm.contactNo.length < 10) ? "not-allowed" : "pointer"
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
            value={cpForm.emailId} 
            onChange={e => setCpForm(prev => ({ ...prev, emailId: e.target.value }))}
            placeholder="office@firm.com"
            style={inp}
          />
        </Field>

        <div style={{ gridColumn: "1/-1" }}>
          <Field label="Address" required>
            <input 
              value={cpForm.address} 
              onChange={e => setCpForm(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Complete office address"
              style={{ ...inp, border: errors.address ? `1.5px solid ${C.red}` : inp.border }}
            />
          </Field>
        </div>

        <Field label="Office Location (City/Area)">
          <input 
            value={cpForm.officeLocation} 
            onChange={e => setCpForm(prev => ({ ...prev, officeLocation: e.target.value }))}
            placeholder="e.g. Thakurli, Kalyan"
            style={inp}
          />
        </Field>

        <Field label="Team Strength">
          <input 
            type="number"
            value={cpForm.teamStrength} 
            onChange={e => setCpForm(prev => ({ ...prev, teamStrength: e.target.value }))}
            placeholder="Number of agents"
            style={inp}
          />
        </Field>

        <Field label="Preferred Work Location" required>
          <input 
            value={cpForm.preferredWorkLocation} 
            onChange={e => setCpForm(prev => ({ ...prev, preferredWorkLocation: e.target.value }))}
            placeholder="e.g. Dombivli, Kalyan"
            style={{ ...inp, border: errors.preferredWorkLocation ? `1.5px solid ${C.red}` : inp.border }}
          />
        </Field>

        <Field label="Meta Page URL">
          <input 
            value={cpForm.metaPage} 
            onChange={e => setCpForm(prev => ({ ...prev, metaPage: e.target.value }))}
            placeholder="https://facebook.com/firm"
            style={inp}
          />
        </Field>

        <Field label="Date of Birth" required>
          <input 
            type="date"
            value={cpForm.dob} 
            onChange={e => setCpForm(prev => ({ ...prev, dob: e.target.value }))}
            style={{ ...inp, border: errors.dob ? `1.5px solid ${C.red}` : inp.border }}
          />
        </Field>

        <Field label="Date of Anniversary">
          <input 
            type="date"
            value={cpForm.anniversary} 
            onChange={e => setCpForm(prev => ({ ...prev, anniversary: e.target.value }))}
            style={inp}
          />
        </Field>

        <Field label="Interested Project" required>
          <select 
            value={cpForm.interestedProjects[0] || ""}
            onChange={e => {
              const val = e.target.value;
              setCpForm(prev => ({ ...prev, interestedProjects: val ? [val] : [] }));
              setErrors(prev => ({ ...prev, interestedProjects: false }));
            }}
            style={{ ...inp, border: errors.interestedProjects ? `1.5px solid ${C.red}` : inp.border, cursor: "pointer" }}
          >
            <option value="">Select Project</option>
            <option value="All">All Projects</option>
            {projectsList.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
        </Field>

        <Field label="Sourcing Manager">
          <select 
            value={cpForm.sourcingManagerId} 
            onChange={e => setCpForm(prev => ({ ...prev, sourcingManagerId: e.target.value }))}
            style={{ ...inp, cursor: "pointer" }}
          >
            {usersList.filter(u => u.role === "Manager" || u.role === "Super Admin").map(u => (
              <option key={u.id} value={u.name}>{u.name}</option>
            ))}
          </select>
        </Field>

        {/* Marketing Materials Selection */}
        <div style={{ gridColumn: "1/-1", marginBottom: 12 }}>
          <label style={{ display: "block", color: C.sub, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
            Marketing Material Required
          </label>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {["All", "Standee", "Photo", "Door Sticker", "Others"].map(mat => {
              const selected = cpForm.marketingMaterials.includes(mat);
              return (
                <button
                  key={mat}
                  type="button"
                  onClick={() => toggleMarketingMaterial(mat)}
                  style={{
                    padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                    background: selected ? C.gold : C.raise,
                    color: selected ? "#000" : C.txt,
                    border: `1px solid ${C.bord}`, cursor: "pointer"
                  }}
                >
                  {mat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Upload visiting card & Map coordinates */}
        <DocUploadField 
          label="Visiting Card Photo" 
          value={cpForm.visitingCardPhoto} 
          onChange={val => setCpForm(prev => ({ ...prev, visitingCardPhoto: val }))}
          reqKey="visitingCardPhoto"
          errors={errors}
          setErrors={setErrors}
        />

        {/* Map location field */}
        <div 
          onClick={() => setShowMapPicker(true)}
          style={{
            border: errors.mapLocation ? `1.5px dashed ${C.red}` : (cpForm.mapLocation ? `1px solid ${C.teal}44` : `1px dashed ${C.bord}`),
            background: cpForm.mapLocation ? `${C.teal}08` : C.raise,
            borderRadius: 10, padding: "16px 14px", textAlign: "center", cursor: "pointer"
          }}
        >
          {cpForm.mapLocation ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: C.teal, fontSize: 12, height: 42 }}>
              <MapPin size={15} color={C.teal} /> 
              <div style={{ textAlign: "left" }}>
                <div style={{ fontWeight: 700, color: C.txt, fontSize: 11 }}>Office Location</div>
                <div style={{ fontSize: 9, color: C.sub, marginTop: 1 }}>{cpForm.mapLocation}</div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, color: C.sub, padding: "2px 0" }}>
              <MapPin size={16} color={C.mute} />
              <span style={{ fontSize: 12, fontWeight: 700 }}>Map Location</span>
              <span style={{ fontSize: 9, color: C.mute }}>Click to pin on map</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.bord}` }}>
        <Btn onClick={handleCpSubmit} disabled={saving} icon={saving ? Loader2 : Check}>
          {saving ? "Registering..." : "Submit Registration"}
        </Btn>
      </div>
    </div>
  );
}
