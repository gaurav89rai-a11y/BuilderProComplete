import { useState } from "react";
import { Building, Mail, Phone, MapPin, Globe, Shield, Save, CheckCircle, Bell, Database } from "lucide-react";
import { C } from "../../config/theme.js";
import { Btn, Field, Input, Toast, STitle } from "../../components/ui";

export function CompanySettings() {
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    companyName: "Abhay Buildcon Pvt. Ltd.",
    reraNumber: "MAHARERA / P51900034682",
    pan: "AAACA1234F",
    gstin: "27AAACA1234F1Z5",
    email: "contact@abhaybuildcon.com",
    phone: "+91 22 4987 6500",
    website: "https://www.abhaybuildcon.com",
    address: "Tower 2, Level 14, BKC Financial Center, Bandra East, Mumbai, Maharashtra 400051",
    currency: "INR (₹)",
    fiscalYearStart: "April 1st",
    sessionTimeoutMins: "60",
    twoFactorEnforced: false,
    emailAlertsEnabled: true,
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setToast({ type: "success", message: "Company and System Settings saved successfully." });
    }, 600);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <STitle
        title="Enterprise System Settings & Organization Profile"
        sub="Maintain corporate identity, statutory RERA registration numbers, security policies, and system defaults"
      />

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Company Profile Card */}
        <div style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 12, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, borderBottom: `1px solid ${C.bord}`, paddingBottom: 10 }}>
            <Building size={18} color={C.gold} />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.txt }}>Corporate Legal Identity</h3>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            <Field label="Organization Legal Name" required>
              <Input
                value={form.companyName}
                onChange={(e) => setForm(p => ({ ...p, companyName: e.target.value }))}
                required
              />
            </Field>

            <Field label="State RERA Registration No." required>
              <Input
                value={form.reraNumber}
                onChange={(e) => setForm(p => ({ ...p, reraNumber: e.target.value }))}
                required
              />
            </Field>

            <Field label="Company PAN">
              <Input
                value={form.pan}
                onChange={(e) => setForm(p => ({ ...p, pan: e.target.value }))}
              />
            </Field>

            <Field label="GSTIN Number">
              <Input
                value={form.gstin}
                onChange={(e) => setForm(p => ({ ...p, gstin: e.target.value }))}
              />
            </Field>
          </div>
        </div>

        {/* Contact & Address */}
        <div style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 12, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, borderBottom: `1px solid ${C.bord}`, paddingBottom: 10 }}>
            <MapPin size={18} color={C.gold} />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.txt }}>Headquarters & Communication</h3>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            <Field label="Official Support Email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
              />
            </Field>

            <Field label="Central Phone / PBX">
              <Input
                value={form.phone}
                onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}
              />
            </Field>

            <Field label="Official Website">
              <Input
                value={form.website}
                onChange={(e) => setForm(p => ({ ...p, website: e.target.value }))}
              />
            </Field>

            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Registered Office Address">
                <Input
                  value={form.address}
                  onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Security & System Defaults */}
        <div style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 12, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, borderBottom: `1px solid ${C.bord}`, paddingBottom: 10 }}>
            <Shield size={18} color={C.gold} />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.txt }}>Security & System Parameters</h3>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            <Field label="Base Currency">
              <Input
                value={form.currency}
                disabled
              />
            </Field>

            <Field label="Session Inactivity Timeout (Minutes)">
              <Input
                type="number"
                value={form.sessionTimeoutMins}
                onChange={(e) => setForm(p => ({ ...p, sessionTimeoutMins: e.target.value }))}
              />
            </Field>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
              <input
                type="checkbox"
                id="twoFactor"
                checked={form.twoFactorEnforced}
                onChange={(e) => setForm(p => ({ ...p, twoFactorEnforced: e.target.checked }))}
                style={{ width: 16, height: 16 }}
              />
              <label htmlFor="twoFactor" style={{ fontSize: 13, color: C.txt, cursor: "pointer" }}>
                Enforce Two-Factor Authentication (2FA) for Admin & Accounts roles
              </label>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
              <input
                type="checkbox"
                id="emailAlerts"
                checked={form.emailAlertsEnabled}
                onChange={(e) => setForm(p => ({ ...p, emailAlertsEnabled: e.target.checked }))}
                style={{ width: 16, height: 16 }}
              />
              <label htmlFor="emailAlerts" style={{ fontSize: 13, color: C.txt, cursor: "pointer" }}>
                Send automated email alerts for high-value bookings and stage approvals
              </label>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Btn type="submit" disabled={saving} style={{ background: C.gold, color: "#000", fontWeight: 700, display: "flex", alignItems: "center", gap: 8, padding: "10px 24px" }}>
            <Save size={16} /> {saving ? "Saving Changes..." : "Save System Settings"}
          </Btn>
        </div>
      </form>
    </div>
  );
}

export default CompanySettings;
