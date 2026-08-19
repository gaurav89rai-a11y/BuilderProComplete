import { Loader2, CheckCircle, Check, User, Users } from "lucide-react";
import { C } from "../config/theme.js";
import { Field, Btn, DocUploadField } from "../components/ui";
import { inp } from "../components/ui/Input.jsx";
import { numberToWords } from "../utils/helpers.js";

export function BookingForm({
  bkForm,
  setBkForm,
  errors,
  setErrors,
  projectsList,
  unitsList,
  usersList,
  saving,
  handleUnitSelect,
  handleBookingSubmit
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, borderBottom: `1px solid ${C.bord}`, paddingBottom: 10 }}>
        <h3 style={{ color: C.txt, fontSize: 16, fontWeight: 700 }}>Unit Booking Agreement Form</h3>
        <div style={{ background: `${C.teal}15`, color: C.teal, border: `1px solid ${C.teal}33`, padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700 }}>
          Sales Desk
        </div>
      </div>

      {/* Form header details */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 18, background: C.raise, padding: 14, borderRadius: 10 }}>
        <Field label="Date of Booking">
          <input type="date" value={bkForm.date} onChange={e => setBkForm(prev => ({ ...prev, date: e.target.value }))} style={inp} />
        </Field>
        <Field label="Enquiry Form No.">
          <input value={bkForm.enquiryNo} onChange={e => setBkForm(prev => ({ ...prev, enquiryNo: e.target.value }))} placeholder="e.g. ENQ-9908" style={inp} />
        </Field>
        <Field label="Company Name">
          <input value={bkForm.companyName} onChange={e => setBkForm(prev => ({ ...prev, companyName: e.target.value }))} placeholder="e.g. Balaji Developers" style={inp} />
        </Field>
      </div>

      {/* Two Column Applicant Section */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 20 }}>
        
        {/* Left Column: First Applicant */}
        <div style={{ borderRight: `1px solid ${C.bord}`, paddingRight: 20 }}>
          <h4 style={{ color: C.gold, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <User size={14} /> Sole / First Applicant
          </h4>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Field label="Name of Applicant" required>
              <input 
                value={bkForm.app1Name} 
                onChange={e => setBkForm(prev => ({ ...prev, app1Name: e.target.value }))}
                placeholder="Full Name" 
                style={{ ...inp, border: errors.app1Name ? `1.5px solid ${C.red}` : inp.border }} 
              />
            </Field>
            <Field label="Date of Birth / Age" required>
              <input 
                type="date"
                value={bkForm.app1Dob} 
                onChange={e => setBkForm(prev => ({ ...prev, app1Dob: e.target.value }))}
                style={{ ...inp, border: errors.app1Dob ? `1.5px solid ${C.red}` : inp.border }} 
              />
            </Field>
            <Field label="Son/Daughter/Wife of">
              <input value={bkForm.app1Relation} onChange={e => setBkForm(prev => ({ ...prev, app1Relation: e.target.value }))} placeholder="Father's / Husband's name" style={inp} />
            </Field>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="PAN No." required>
                <input 
                  value={bkForm.app1Pan} 
                  maxLength={10}
                  onChange={e => setBkForm(prev => ({ ...prev, app1Pan: e.target.value.toUpperCase() }))}
                  placeholder="ABCDE1234F" 
                  style={{ ...inp, border: errors.app1Pan ? `1.5px solid ${C.red}` : inp.border }} 
                />
              </Field>
              <Field label="Aadhar No." required>
                <input 
                  value={bkForm.app1Aadhar} 
                  maxLength={12}
                  onChange={e => setBkForm(prev => ({ ...prev, app1Aadhar: e.target.value.replace(/\D/g, "") }))}
                  placeholder="12-digit number" 
                  style={{ ...inp, border: errors.app1Aadhar ? `1.5px solid ${C.red}` : inp.border }} 
                />
              </Field>
            </div>

            <Field label="Email Address" required>
              <input 
                type="email"
                value={bkForm.app1Email} 
                onChange={e => setBkForm(prev => ({ ...prev, app1Email: e.target.value }))}
                placeholder="name@email.com" 
                style={{ ...inp, border: errors.app1Email ? `1.5px solid ${C.red}` : inp.border }} 
              />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Mobile No." required>
                <input 
                  value={bkForm.app1Mobile} 
                  maxLength={10}
                  onChange={e => setBkForm(prev => ({ ...prev, app1Mobile: e.target.value.replace(/\D/g, "") }))}
                  placeholder="98XXXXXXXX" 
                  style={{ ...inp, border: errors.app1Mobile ? `1.5px solid ${C.red}` : inp.border }} 
                />
              </Field>
              <Field label="Alternate No.">
                <input value={bkForm.app1AltMobile} maxLength={10} onChange={e => setBkForm(prev => ({ ...prev, app1AltMobile: e.target.value.replace(/\D/g, "") }))} placeholder="Alternative number" style={inp} />
              </Field>
            </div>

            <Field label="Correspondence Address">
              <input value={bkForm.app1Address} onChange={e => setBkForm(prev => ({ ...prev, app1Address: e.target.value }))} placeholder="Residential address" style={inp} />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Occupation">
                <input value={bkForm.app1Occupation} onChange={e => setBkForm(prev => ({ ...prev, app1Occupation: e.target.value }))} placeholder="Job / Business" style={inp} />
              </Field>
              <Field label="Annual Income (Rs)">
                <input type="number" value={bkForm.app1Income} onChange={e => setBkForm(prev => ({ ...prev, app1Income: e.target.value }))} placeholder="e.g. 800000" style={inp} />
              </Field>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Company Name">
                <input value={bkForm.app1Company} onChange={e => setBkForm(prev => ({ ...prev, app1Company: e.target.value }))} placeholder="Employer name" style={inp} />
              </Field>
              <Field label="Designation">
                <input value={bkForm.app1Designation} onChange={e => setBkForm(prev => ({ ...prev, app1Designation: e.target.value }))} placeholder="Role" style={inp} />
              </Field>
            </div>

            <Field label="Office Address">
              <input value={bkForm.app1OfficeAddress} onChange={e => setBkForm(prev => ({ ...prev, app1OfficeAddress: e.target.value }))} placeholder="Workplace address" style={inp} />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Office No.">
                <input value={bkForm.app1OfficeNo} onChange={e => setBkForm(prev => ({ ...prev, app1OfficeNo: e.target.value }))} placeholder="Work contact" style={inp} />
              </Field>
              <Field label="Marriage Anniversary">
                <input type="date" value={bkForm.app1Anniversary} onChange={e => setBkForm(prev => ({ ...prev, app1Anniversary: e.target.value }))} style={inp} />
              </Field>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
              <input 
                type="checkbox" 
                id="app1ExistCheck"
                checked={bkForm.app1Existing}
                onChange={e => setBkForm(prev => ({ ...prev, app1Existing: e.target.checked }))}
                style={{ cursor: "pointer" }}
              />
              <label htmlFor="app1ExistCheck" style={{ fontSize: 11, color: C.sub, cursor: "pointer" }}>
                Existing Customer of Developer
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Co-Applicant */}
        <div>
          <h4 style={{ color: C.sub, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <Users size={14} /> Co / Second Applicant (Optional)
          </h4>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Field label="Name of Co-Applicant">
              <input value={bkForm.app2Name} onChange={e => setBkForm(prev => ({ ...prev, app2Name: e.target.value }))} placeholder="Full Name" style={inp} />
            </Field>
            <Field label="Date of Birth / Age">
              <input type="date" value={bkForm.app2Dob} onChange={e => setBkForm(prev => ({ ...prev, app2Dob: e.target.value }))} style={inp} />
            </Field>
            <Field label="Son/Daughter/Wife of">
              <input value={bkForm.app2Relation} onChange={e => setBkForm(prev => ({ ...prev, app2Relation: e.target.value }))} placeholder="Father's / Husband's name" style={inp} />
            </Field>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="PAN No.">
                <input value={bkForm.app2Pan} maxLength={10} onChange={e => setBkForm(prev => ({ ...prev, app2Pan: e.target.value.toUpperCase() }))} placeholder="ABCDE1234F" style={inp} />
              </Field>
              <Field label="Aadhar No.">
                <input value={bkForm.app2Aadhar} maxLength={12} onChange={e => setBkForm(prev => ({ ...prev, app2Aadhar: e.target.value.replace(/\D/g, "") }))} placeholder="12-digit number" style={inp} />
              </Field>
            </div>

            <Field label="Email Address">
              <input type="email" value={bkForm.app2Email} onChange={e => setBkForm(prev => ({ ...prev, app2Email: e.target.value }))} placeholder="name@email.com" style={inp} />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Mobile No.">
                <input value={bkForm.app2Mobile} maxLength={10} onChange={e => setBkForm(prev => ({ ...prev, app2Mobile: e.target.value.replace(/\D/g, "") }))} placeholder="98XXXXXXXX" style={inp} />
              </Field>
              <Field label="Alternate No.">
                <input value={bkForm.app2AltMobile} maxLength={10} onChange={e => setBkForm(prev => ({ ...prev, app2AltMobile: e.target.value.replace(/\D/g, "") }))} placeholder="Alternative number" style={inp} />
              </Field>
            </div>

            <Field label="Correspondence Address">
              <input value={bkForm.app2Address} onChange={e => setBkForm(prev => ({ ...prev, app2Address: e.target.value }))} placeholder="Residential address" style={inp} />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Occupation">
                <input value={bkForm.app2Occupation} onChange={e => setBkForm(prev => ({ ...prev, app2Occupation: e.target.value }))} placeholder="Job / Business" style={inp} />
              </Field>
              <Field label="Annual Income (Rs)">
                <input type="number" value={bkForm.app2Income} onChange={e => setBkForm(prev => ({ ...prev, app2Income: e.target.value }))} placeholder="e.g. 500000" style={inp} />
              </Field>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Company Name">
                <input value={bkForm.app2Company} onChange={e => setBkForm(prev => ({ ...prev, app2Company: e.target.value }))} placeholder="Employer name" style={inp} />
              </Field>
              <Field label="Designation">
                <input value={bkForm.app2Designation} onChange={e => setBkForm(prev => ({ ...prev, app2Designation: e.target.value }))} placeholder="Role" style={inp} />
              </Field>
            </div>

            <Field label="Office Address">
              <input value={bkForm.app2OfficeAddress} onChange={e => setBkForm(prev => ({ ...prev, app2OfficeAddress: e.target.value }))} placeholder="Workplace address" style={inp} />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Office No.">
                <input value={bkForm.app2OfficeNo} onChange={e => setBkForm(prev => ({ ...prev, app2OfficeNo: e.target.value }))} placeholder="Work contact" style={inp} />
              </Field>
              <Field label="Marriage Anniversary">
                <input type="date" value={bkForm.app2Anniversary} onChange={e => setBkForm(prev => ({ ...prev, app2Anniversary: e.target.value }))} style={inp} />
              </Field>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
              <input 
                type="checkbox" 
                id="app2ExistCheck"
                checked={bkForm.app2Existing}
                onChange={e => setBkForm(prev => ({ ...prev, app2Existing: e.target.checked }))}
                style={{ cursor: "pointer" }}
              />
              <label htmlFor="app2ExistCheck" style={{ fontSize: 11, color: C.sub, cursor: "pointer" }}>
                Existing Customer of Developer
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Flat & Project Specifications Section */}
      <h4 style={{ color: C.gold, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 14, borderBottom: `1px solid ${C.bord}`, paddingBottom: 6 }}>
        Project & Unit Specifications
      </h4>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 18 }}>
        <Field label="Name of Project" required>
          <select 
            value={bkForm.projectId} 
            onChange={e => {
              setBkForm(prev => ({ ...prev, projectId: e.target.value, unitId: "" }));
              setErrors(prev => ({ ...prev, projectId: false }));
            }}
            style={{ ...inp, border: errors.projectId ? `1.5px solid ${C.red}` : inp.border, cursor: "pointer" }}
          >
            <option value="">Select Project</option>
            {projectsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>

        <Field label="Wing">
          <input value={bkForm.wing} onChange={e => setBkForm(prev => ({ ...prev, wing: e.target.value }))} placeholder="e.g. A Wing" style={inp} />
        </Field>

        <Field label="Flat / Unit No." required>
          <select 
            disabled={!bkForm.projectId}
            value={bkForm.unitId} 
            onChange={e => handleUnitSelect(e.target.value)}
            style={{ ...inp, border: errors.unitId ? `1.5px solid ${C.red}` : inp.border, cursor: bkForm.projectId ? "pointer" : "not-allowed" }}
          >
            <option value="">Select Unit</option>
            {unitsList.filter(u => u.projectId === parseInt(bkForm.projectId) && u.status === "Available").map(u => (
              <option key={u.id} value={u.id}>{u.unitNumber} ({u.unitType})</option>
            ))}
          </select>
        </Field>

        <Field label="Floor No (Auto Filled)">
          <input value={bkForm.floor} readOnly placeholder="Auto-filled floor" style={{ ...inp, opacity: 0.7 }} />
        </Field>

        <Field label="Usable Carpet Area (Sq.ft)">
          <input 
            type="number"
            value={bkForm.usableCarpetArea} 
            onChange={e => setBkForm(prev => ({ ...prev, usableCarpetArea: e.target.value }))}
            placeholder="e.g. 680" 
            style={inp} 
          />
        </Field>

        <Field label="RERA Carpet Area (Sq.ft)">
          <input 
            type="number"
            value={bkForm.reraCarpetArea} 
            onChange={e => setBkForm(prev => ({ ...prev, reraCarpetArea: e.target.value }))}
            placeholder="e.g. 710" 
            style={inp} 
          />
        </Field>

        <Field label="Flat Cost (Rs)" required>
          <input 
            type="number"
            value={bkForm.flatCost} 
            onChange={e => {
              const val = e.target.value;
              setBkForm(prev => ({ ...prev, flatCost: val, flatCostWords: numberToWords(val) }));
              setErrors(prev => ({ ...prev, flatCost: false }));
            }}
            placeholder="e.g. 6500000" 
            style={{ ...inp, border: errors.flatCost ? `1.5px solid ${C.red}` : inp.border }} 
          />
        </Field>

        <div style={{ gridColumn: "span 2" }}>
          <Field label="Cost in Words (Auto Generated)">
            <input 
              value={bkForm.flatCostWords} 
              readOnly 
              placeholder="Rupees Only" 
              style={{ ...inp, opacity: 0.7, color: C.gold, fontWeight: 600 }} 
            />
          </Field>
        </div>

        <Field label="Referral Name / CP">
          <input value={bkForm.referral} onChange={e => setBkForm(prev => ({ ...prev, referral: e.target.value }))} placeholder="Name of referrer" style={inp} />
        </Field>

        <Field label="Car Parking Option">
          <input value={bkForm.carParking} onChange={e => setBkForm(prev => ({ ...prev, carParking: e.target.value }))} placeholder="e.g. Reserved Covered" style={inp} />
        </Field>

        <Field label="Assigned Sales Manager">
          <select 
            value={bkForm.salesManagerId} 
            onChange={e => setBkForm(prev => ({ ...prev, salesManagerId: e.target.value }))}
            style={{ ...inp, cursor: "pointer" }}
          >
            {usersList.filter(u => u.role === "Sales Agent" || u.role === "Super Admin").map(u => (
              <option key={u.id} value={u.name}>{u.name}</option>
            ))}
          </select>
        </Field>

        <div style={{ gridColumn: "1/-1" }}>
          <Field label="Special Payment Terms / Remarks">
            <textarea 
              value={bkForm.paymentTerms} 
              onChange={e => setBkForm(prev => ({ ...prev, paymentTerms: e.target.value }))}
              placeholder="Log dynamic payment milestones, dates, or booking conditions..."
              style={{ ...inp, minHeight: 60, resize: "vertical", fontFamily: "inherit" }}
            />
          </Field>
        </div>
      </div>

      {/* Photo uploads section */}
      <h4 style={{ color: C.gold, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 14 }}>
        Required Document Uploads <span style={{ color: C.red }}>*</span>
      </h4>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        <DocUploadField 
          label="Customer's Photo" 
          value={bkForm.customerPhoto} 
          onChange={val => setBkForm(prev => ({ ...prev, customerPhoto: val }))}
          reqKey="customerPhoto"
          errors={errors}
          setErrors={setErrors}
        />
        <DocUploadField 
          label="Applicant PAN Card" 
          value={bkForm.panPhoto} 
          onChange={val => setBkForm(prev => ({ ...prev, panPhoto: val }))}
          reqKey="panPhoto"
          errors={errors}
          setErrors={setErrors}
        />
        <DocUploadField 
          label="Applicant Aadhar Card" 
          value={bkForm.aadharPhoto} 
          onChange={val => setBkForm(prev => ({ ...prev, aadharPhoto: val }))}
          reqKey="aadharPhoto"
          errors={errors}
          setErrors={setErrors}
        />
      </div>

      <div style={{ display: "flex", justify: "flex-end", gap: 10, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.bord}` }}>
        <Btn onClick={handleBookingSubmit} disabled={saving} icon={saving ? Loader2 : Check}>
          {saving ? "Processing Booking..." : "Submit Booking Agreement"}
        </Btn>
      </div>
    </div>
  );
}
