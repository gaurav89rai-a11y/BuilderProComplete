import { useState, useEffect } from "react";
import { Clock, Plus, Search, Calendar, Phone, Mail, Award, MessageSquare, AlertCircle } from "lucide-react";
import { C } from "../../config/theme.js";
import { Badge, Btn, Modal, Field, Input, Select, Stat, STitle, Toast } from "../../components/ui";
import { api } from "../../services/api.js";

const INITIAL_FOLLOWUPS = [
  { id: 1, leadName: "Rahul Sharma", phone: "9800000001", email: "rahul.s@email.com", type: "Call", date: "2026-07-07", time: "11:30 AM", remarks: "Wants to verify home loan approval rates for 3BHK", status: "Scheduled", agent: "Priya M.", project: "Skyline Heights" },
  { id: 2, leadName: "Anjali Patel", phone: "9800000002", email: "anjali.p@email.com", type: "Site Visit Meet", date: "2026-07-06", time: "03:00 PM", remarks: "Showing sample flat A-101. Final negotiation of parking charges", status: "Completed", agent: "Amit K.", project: "Green Valley Township" },
  { id: 3, leadName: "Suresh Kumar", phone: "9800000003", email: "suresh.k@email.com", type: "Email", date: "2026-07-03", time: "10:00 AM", remarks: "Send pricing brochure and RERA certificate copy", status: "Completed", agent: "Priya M.", project: "Skyline Heights" },
  { id: 4, leadName: "Meera Iyer", phone: "9800000004", email: "meera.i@email.com", type: "Meeting", date: "2026-07-05", time: "05:00 PM", remarks: "Negotiation meeting. Client requested 5% discount on floor rise charges", status: "Overdue", agent: "Vikram S.", project: "Meridian Business Park" },
  { id: 5, leadName: "Arun Mehta", phone: "9800000005", email: "arun.m@email.com", type: "Call", date: "2026-07-08", time: "02:30 PM", remarks: "Follow-up for token payment receipt copy", status: "Scheduled", agent: "Amit K.", project: "Pearl Residences" },
];

const AUDIT_ICONS = {
  "Site Visit Scheduled": "📅",
  "Site Visit Updated": "✏️",
  "Site Visit Rescheduled": "🔄",
  "Site Visit Started": "🚗",
  "Site Visit Completed": "✅",
  "Customer Feedback Added": "💬",
  "Attachment Uploaded": "📎",
  "Site Visit Cancelled": "❌",
  "Assigned Sales Executive Changed": "👤"
};

export function FollowUp() {
  const [followups, setFollowups] = useState(INITIAL_FOLLOWUPS);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState(null);

  const [leads, setLeads] = useState([]);
  const [projects, setProjects] = useState([]);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState({
    2: [
      { icon: "📅", activity: "Site Visit Scheduled", user: "John Smith", datetime: "06-Jul-2026 10:30 AM", comments: "Site visit scheduled for 08-Jul-2026 at 11:00 AM." },
      { icon: "✏️", activity: "Site Visit Updated", user: "John Smith", datetime: "07-Jul-2026 09:15 AM", comments: "Visit time changed from 11:00 AM to 2:00 PM." },
      { icon: "🔄", activity: "Site Visit Rescheduled", user: "Sarah Patel", datetime: "08-Jul-2026 08:45 AM", comments: "Customer requested a new visit date." },
      { icon: "🚗", activity: "Site Visit Started", user: "Sales Executive", datetime: "08-Jul-2026 01:55 PM", comments: "Executive checked in at the project site." },
      { icon: "✅", activity: "Site Visit Completed", user: "Sales Executive", datetime: "08-Jul-2026 03:20 PM", comments: "Customer visited Tower A and Unit A-502." },
      { icon: "💬", activity: "Customer Feedback Added", user: "Sales Executive", datetime: "08-Jul-2026 03:30 PM", comments: "Customer liked the layout and requested a quotation." },
      { icon: "📎", activity: "Attachment Uploaded", user: "Sales Executive", datetime: "08-Jul-2026 03:35 PM", comments: "Site photos and brochure uploaded." },
      { icon: "❌", activity: "Site Visit Cancelled", user: "Admin", datetime: "09-Jul-2026 10:00 AM", comments: "Customer unavailable." },
      { icon: "👤", activity: "Assigned Sales Executive Changed", user: "Admin", datetime: "09-Jul-2026 11:15 AM", comments: "Reassigned to Rahul Sharma." }
    ]
  });
  const [activeAuditId, setActiveAuditId] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [l, p] = await Promise.all([api.getLeads(), api.getProjects()]);
        setLeads(l);
        setProjects(p);
      } catch (err) {
        console.error("Failed to load leads/projects", err);
      }
    };
    loadData();
  }, []);

  const [form, setForm] = useState({
    leadId: "",
    leadName: "",
    phone: "",
    email: "",
    type: "Call",
    date: "",
    time: "",
    remarks: "",
    status: "Scheduled",
    agent: "Priya M.",
    project: "Skyline Heights"
  });

  const handleLeadChange = (leadId) => {
    const selectedLead = leads.find(l => String(l.id) === String(leadId));
    if (selectedLead) {
      setForm(prev => ({
        ...prev,
        leadId: selectedLead.id,
        leadName: selectedLead.name,
        phone: selectedLead.phone || "",
        email: selectedLead.email || "",
        project: selectedLead.project?.name || selectedLead.project || prev.project
      }));
    } else {
      setForm(prev => ({
        ...prev,
        leadId: "",
        leadName: "",
        phone: "",
        email: ""
      }));
    }
  };

  const getFormattedDateTime = () => {
    const now = new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = String(now.getDate()).padStart(2, '0');
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strTime = String(hours).padStart(2, '0') + ':' + minutes + ' ' + ampm;
    return `${day}-${month}-${year} ${strTime}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.leadName || !form.date) {
      setToast({ type: "error", msg: "Please fill out all required fields." });
      return;
    }
    const newFollowup = {
      id: Date.now(),
      ...form
    };

    // If it's a Site Visit Meet, automatically seed an audit entry
    if (form.type === "Site Visit Meet") {
      const entry = {
        icon: "📅",
        activity: "Site Visit Scheduled",
        user: "Sales Executive",
        datetime: getFormattedDateTime(),
        comments: `Site visit scheduled for ${form.date} at ${form.time || "12:00 PM"}.`
      };
      setAuditLogs(prev => ({
        ...prev,
        [newFollowup.id]: [entry]
      }));
    }

    setFollowups([newFollowup, ...followups]);
    setShowAddModal(false);
    setToast({ type: "success", msg: `Follow-up for ${form.leadName} recorded!` });
    setForm({
      leadId: "",
      leadName: "",
      phone: "",
      email: "",
      type: "Call",
      date: "",
      time: "",
      remarks: "",
      status: "Scheduled",
      agent: "Priya M.",
      project: "Skyline Heights"
    });
  };

  const updateStatus = (id, newStatus) => {
    setFollowups(followups.map(f => f.id === id ? { ...f, status: newStatus } : f));
    
    // Automatically record an audit log entry on status update
    const selected = followups.find(f => f.id === id);
    if (selected && selected.type === "Site Visit Meet") {
      let activity = "Site Visit Updated";
      let icon = "✏️";
      let comments = `Status updated to ${newStatus}.`;
      
      if (newStatus === "Completed") {
        activity = "Site Visit Completed";
        icon = "✅";
        comments = "Site visit successfully checked off as completed.";
      } else if (newStatus === "Scheduled") {
        activity = "Site Visit Rescheduled";
        icon = "🔄";
        comments = "Site visit set back to scheduled.";
      } else if (newStatus === "Overdue") {
        activity = "Site Visit Cancelled";
        icon = "❌";
        comments = "Marked as overdue/late.";
      }
      
      const entry = {
        icon,
        activity,
        user: "Sales Executive",
        datetime: getFormattedDateTime(),
        comments
      };
      setAuditLogs(prev => ({
        ...prev,
        [id]: [...(prev[id] || []), entry]
      }));
    }

    setToast({ type: "success", msg: `Follow-up status updated to ${newStatus}.` });
  };



  // Metrics
  const total = followups.length;
  const scheduled = followups.filter(f => f.status === "Scheduled").length;
  const completed = followups.filter(f => f.status === "Completed").length;
  const overdue = followups.filter(f => f.status === "Overdue").length;

  const filtered = followups.filter(f => {
    const matchesSearch = f.leadName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          f.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          f.remarks.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "All" || f.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <STitle title="Follow-up & Site Visit Tracker" sub="Track client follow-up calls, schedules, and site visits" />
        <Btn onClick={() => setShowAddModal(true)} icon={Plus}>Record Activity</Btn>
      </div>

      {/* Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <Stat label="Total Follow-ups" val={total} icon={Clock} color={C.sub} />
        <Stat label="Scheduled" val={scheduled} icon={Calendar} color={C.blue} />
        <Stat label="Completed" val={completed} icon={Award} color={C.teal} />
        <Stat label="Overdue Activities" val={overdue} icon={AlertCircle} color={C.red} />
      </div>

      {/* Search & Filter Header */}
      <div style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 12, padding: "14px 18px", display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.mute }} />
          <input
            type="text"
            placeholder="Search by Lead name, Project, or Remarks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%", background: C.bg, border: `1px solid ${C.bord}`, borderRadius: 8,
              padding: "8px 12px 8px 36px", color: C.txt, outline: "none", fontSize: 13
            }}
          />
        </div>
        <div style={{ width: 180 }}>
          <Select
            value={typeFilter}
            onChange={(val) => setTypeFilter(val)}
            options={[
              { value: "All", label: "All Types" },
              { value: "Call", label: "Phone Calls" },
              { value: "Email", label: "Emails" },
              { value: "Site Visit Meet", label: "Site Visit Meets" },
              { value: "Meeting", label: "Meetings" }
            ]}
          />
        </div>
      </div>

      {/* Pipeline Board Column View */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {["Scheduled", "Overdue", "Completed"].map(col => {
          const colItems = filtered.filter(f => f.status === col);
          const colColor = col === "Scheduled" ? C.blue : col === "Overdue" ? C.red : C.teal;
          return (
            <div key={col} style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 12, minHeight: "50vh" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.bord}`, paddingBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: colColor }} />
                  <span style={{ fontWeight: 700, fontSize: 13, color: C.txt }}>{col}</span>
                </div>
                <Badge label={`${colItems.length} tasks`} type={col === "Scheduled" ? "blue" : col === "Overdue" ? "red" : "teal"} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>
                {colItems.length === 0 ? (
                  <div style={{ color: C.mute, fontSize: 12, textAlign: "center", padding: "40px 10px", border: `1px dashed ${C.bord}`, borderRadius: 8 }}>
                    No follow-ups here
                  </div>
                ) : (
                  colItems.map(item => (
                    <div key={item.id} style={{ background: C.bg, border: `1px solid ${C.bord}`, borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ color: C.txt, fontWeight: 700, fontSize: 12.5 }}>{item.leadName}</div>
                          <div style={{ color: C.mute, fontSize: 10.5, marginTop: 1 }}>{item.project}</div>
                        </div>
                        <Badge label={item.type} type="orange" />
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "6px 8px", background: C.raise, borderRadius: 6, fontSize: 11, color: C.sub }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Calendar size={11} color={C.gold} />
                          <span>{item.date} at {item.time}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Phone size={11} color={C.gold} />
                          <span>{item.phone}</span>
                        </div>
                      </div>

                      <div style={{ fontSize: 11, color: C.mute, display: "flex", alignItems: "flex-start", gap: 5, lineHeight: 1.4 }}>
                        <MessageSquare size={12} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>{item.remarks}</span>
                      </div>

                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, borderTop: `1px solid ${C.bord}`, paddingTop: 8, marginTop: 4 }}>
                        {col !== "Completed" && (
                          <Btn size="xs" color="teal" onClick={() => updateStatus(item.id, "Completed")}>Done</Btn>
                        )}
                        {col !== "Scheduled" && (
                          <Btn size="xs" color="blue" onClick={() => updateStatus(item.id, "Scheduled")}>Schedule</Btn>
                        )}
                        {col !== "Overdue" && col !== "Completed" && (
                          <Btn size="xs" color="red" onClick={() => updateStatus(item.id, "Overdue")}>Mark Late</Btn>
                        )}
                        {item.type === "Site Visit Meet" && (
                          <Btn size="xs" v="outline" onClick={() => setActiveAuditId(item.id)}>Audit Log</Btn>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal - Add Follow-up */}
      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)} title="Record New Lead Follow-up">
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Lead Name *" required>
                <Select
                  value={form.leadId || ""}
                  onChange={handleLeadChange}
                  placeholder="Select Lead"
                  options={leads.map(l => ({ value: l.id, label: l.name }))}
                />
              </Field>
              <Field label="Linked Project">
                <Select
                  value={form.project}
                  onChange={(val) => setForm({ ...form, project: val })}
                  options={projects.map(p => ({ value: p.name, label: p.name }))}
                />
              </Field>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Contact Phone">
                <Input
                  value={form.phone}
                  onChange={(val) => setForm({ ...form, phone: val })}
                  placeholder="Phone Number"
                />
              </Field>
              <Field label="Contact Email">
                <Input
                  value={form.email}
                  onChange={(val) => setForm({ ...form, email: val })}
                  placeholder="Email Address"
                />
              </Field>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Field label="Activity Type">
                <Select
                  value={form.type}
                  onChange={(val) => setForm({ ...form, type: val })}
                  options={[
                    { value: "Call", label: "Phone Call" },
                    { value: "Email", label: "Email" },
                    { value: "Site Visit Meet", label: "Site Visit Meet" },
                    { value: "Meeting", label: "Meeting" }
                  ]}
                />
              </Field>
              <Field label="Follow-up Date *">
                <Input
                  type="date"
                  required
                  value={form.date}
                  onChange={(val) => setForm({ ...form, date: val })}
                />
              </Field>
              <Field label="Follow-up Time">
                <Input
                  type="text"
                  placeholder="e.g. 11:30 AM"
                  value={form.time}
                  onChange={(val) => setForm({ ...form, time: val })}
                />
              </Field>
            </div>

            <Field label="Next Step Remarks / Conversation Notes">
              <textarea
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                placeholder="e.g., Client wants to see payment logs, schedule visit to site"
                style={{
                  width: "100%", background: C.bg, border: `1px solid ${C.bord}`, borderRadius: 8,
                  padding: "8px 12px", color: C.txt, outline: "none", fontSize: 13, minHeight: 70, resize: "vertical"
                }}
              />
            </Field>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
              <Btn type="button" v="outline" onClick={() => setShowAddModal(false)}>Cancel</Btn>
              <Btn type="submit">Record Activity</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal - Audit Log */}
      {activeAuditId && (() => {
        const item = followups.find(f => f.id === activeAuditId);
        if (!item) return null;
        const logs = auditLogs[activeAuditId] || [];
        return (
          <Modal onClose={() => setActiveAuditId(null)} title={`Site Visit Audit Log: ${item.leadName}`} width={800}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Audit Table */}
              <div style={{ border: `1px solid ${C.bord}`, borderRadius: 10, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: C.raise, borderBottom: `1px solid ${C.bord}`, color: C.sub, fontWeight: 700 }}>
                      <th style={{ padding: "10px 12px", width: 50, textAlign: "center" }}>Icon</th>
                      <th style={{ padding: "10px 12px", width: 180 }}>Activity</th>
                      <th style={{ padding: "10px 12px", width: 120 }}>User</th>
                      <th style={{ padding: "10px 12px", width: 150 }}>Date & Time</th>
                      <th style={{ padding: "10px 12px" }}>Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, idx) => (
                      <tr key={idx} style={{ borderBottom: idx < logs.length - 1 ? `1px solid ${C.bord}` : "none", color: C.txt }}>
                        <td style={{ padding: "10px 12px", textAlign: "center", fontSize: 16 }}>{log.icon}</td>
                        <td style={{ padding: "10px 12px", fontWeight: 600 }}>{log.activity}</td>
                        <td style={{ padding: "10px 12px", color: C.sub }}>{log.user}</td>
                        <td style={{ padding: "10px 12px", color: C.sub }}>{log.datetime}</td>
                        <td style={{ padding: "10px 12px", color: C.txt }}>{log.comments}</td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ padding: 20, textAlign: "center", color: C.mute }}>No audit trail entries recorded yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.bord}` }}>
              <Btn onClick={() => setActiveAuditId(null)}>Close</Btn>
            </div>
          </Modal>
        );
      })()}

      {toast && <Toast type={toast.type} msg={toast.msg} onClose={() => setToast(null)} />}
    </div>
  );
}
