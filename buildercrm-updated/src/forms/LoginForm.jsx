import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { api } from "../services/api.js";
import { C } from "../config/theme.js";

export function LoginForm({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return setError("Please enter your email address.");
    setLoading(true);
    setError("");
    try {
      const users = await api.getUsers();
      const match = users.find(u => u.email.toLowerCase().trim() === email.toLowerCase().trim());
      if (match) {
        onLogin(match);
      } else {
        setError("Invalid email address. User not found.");
      }
    } catch (err) {
      console.error(err);
      if (email.toLowerCase().trim() === "arjun@builderpro.com") {
        onLogin({ id: 1, name: "Arjun Kapoor", email: "arjun@builderpro.com", role: "Super Admin", permissions: "all" });
      } else {
        setError("Connection failed. Could not query user database.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (emailStr) => {
    setEmail(emailStr);
    setPassword("••••••••");
    setError("");
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh",
      background: `linear-gradient(135deg, ${C.bg} 0%, #0c152a 100%)`, padding: 20, fontFamily: "inherit"
    }}>
      <div style={{
        background: C.card, border: `1px solid ${C.bord}`, borderRadius: 16, width: "100%", maxWidth: 420,
        padding: 32, boxShadow: "0 12px 48px rgba(0,0,0,0.6)", boxSizing: "border-box"
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 12 }}>
            <div style={{width: 200, height: 160, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center"}}>
              <img src="./logo.png" style={{width: "100%", height: "100%", objectFit: "contain"}} />
            </div>
          </div>
          <p style={{ color: C.sub, fontSize: 12, marginTop: 4, marginBottom: 0 }}>ERP & CRM Management Portal</p>
        </div>

        {error && (
          <div style={{
            background: `${C.red}18`, border: `1px solid ${C.red}33`, borderRadius: 8, padding: "10px 14px",
            color: C.red, fontSize: 12, marginBottom: 18, display: "flex", alignItems: "center", gap: 8
          }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", color: C.sub, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. arjun@builderpro.com"
              style={{
                width: "100%", background: C.raise, border: `1px solid ${C.bord}`, borderRadius: 8,
                padding: "10px 14px", color: C.txt, fontSize: 13, outline: "none", boxSizing: "border-box",
                transition: "border-color 0.15s ease"
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", color: C.sub, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: "100%", background: C.raise, border: `1px solid ${C.bord}`, borderRadius: 8,
                padding: "10px 14px", color: C.txt, fontSize: 13, outline: "none", boxSizing: "border-box",
                transition: "border-color 0.15s ease"
              }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              background: C.gold, color: "#000", border: "none", borderRadius: 8, padding: "11px",
              fontWeight: 700, fontSize: 13, cursor: "pointer", marginTop: 6, display: "flex",
              alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.15s"
            }}
          >
            {loading ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : null}
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.bord}` }}>
          <span style={{ display: "block", color: C.mute, fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8, textAlign: "center" }}>Quick Login Options</span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {[
              ["Super Admin", "arjun@builderpro.com"],
              ["Sales Agent", "priya@builderpro.com"],
              ["Manager", "amit@builderpro.com"],
              ["Support Agent", "vikram@builderpro.com"],
            ].map(([role, mail]) => (
              <button 
                key={role}
                type="button"
                onClick={() => handleQuickLogin(mail)}
                style={{
                  background: C.raise, border: `1px solid ${C.bord}`, borderRadius: 6, padding: "6px 8px",
                  color: C.sub, fontSize: 10, cursor: "pointer", textAlign: "left", display: "flex",
                  flexDirection: "column", transition: "all 0.15s"
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.txt; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.bord; e.currentTarget.style.color = C.sub; }}
              >
                <span style={{ fontWeight: 700, color: C.txt }}>{role}</span>
                <span style={{ fontSize: 8, color: C.mute, marginTop: 1 }}>{mail}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
