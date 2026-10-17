import { useState, useEffect, useCallback } from "react";
import { 
  FileText, Plus, Edit, Trash2, Loader2, X, RefreshCw, DollarSign, 
  CheckCircle, Eye, Download, Search, User, Home, Calendar, Phone, Mail, Award, Check
} from "lucide-react";
import { api } from "../../services/api.js";
import { C } from "../../config/theme.js";
import { fmtCr } from "../../utils/helpers.js";
import { Badge, Btn, Modal, Field, Input, Select, LoadingState, ErrorState, Toast, STitle, Stat } from "../../components/ui";
import { useConfig } from "../../config/ConfigContext.jsx";

export function Bookings() {
  const { bookingStatus, getDefault } = useConfig();
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [units, setUnits] = useState([]);
  const [leads, setLeads] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modals & UI States
  const [showModal, setShowModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  const defaultStatus = getDefault("bookingStatus", "Confirmed");

  const [form, setForm] = useState({
    customerId: "",
    unitId: "",
    bookingDate: "",
    totalAmount: 0,
    tokenAmount: 0,
    status: defaultStatus,
    assignedAgent: ""
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [b, c, u, l, p] = await Promise.all([
        api.getBookings(),
        api.getCustomers(),
        api.getUnits({ status: "Available" }),
        api.getLeads(),
        api.getProjects()
      ]);
      setBookings(b || []);
      setCustomers(c || []);
      setUnits(u || []);
      setLeads(l || []);
      setProjects(p || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const f = (k) => (v) => setForm(p => ({ ...p, [k]: v }));

  // Handle Agreement Download with reporting tool / backend PDF stream
  const handleDownloadAgreement = async (booking) => {
    if (!booking) return;
    try {
      setDownloadingId(booking.id);
      setToast({ msg: `Generating Agreement PDF for ${booking.bookingNumber}...`, type: "info" });
      await api.downloadBookingAgreement(booking.id, booking.bookingNumber);
      setToast({ msg: `Agreement for ${booking.bookingNumber} downloaded successfully!`, type: "success" });
    } catch (err) {
      console.error("Agreement download error:", err);
      setToast({ msg: `Failed to download agreement: ${err.message || "Unknown error"}`, type: "error" });
    } finally {
      setDownloadingId(null);
    }
  };

  // Handle Customer Selection: Auto-fetch all customer details for booking
  const handleCustomerChange = (customerIdVal) => {
    const custId = parseInt(customerIdVal);
    const selectedCustomer = customers.find(c => c.id === custId);
    
    // Find matching lead for additional rich CRM context (agent, budget, interest, etc.)
    const matchingLead = selectedCustomer ? leads.find(l => 
      (selectedCustomer.phone && l.phone === selectedCustomer.phone) || 
      (selectedCustomer.email && l.email === selectedCustomer.email) ||
      (selectedCustomer.name && l.name.toLowerCase() === selectedCustomer.name.toLowerCase())
    ) : null;

    setForm(prev => {
      const updated = { 
        ...prev, 
        customerId: customerIdVal 
      };

      // 1. Auto-fill Assigned Agent
      if (matchingLead?.assignedTo) {
        updated.assignedAgent = matchingLead.assignedTo;
      } else if (!updated.assignedAgent) {
        updated.assignedAgent = "Arjun Kapoor";
      }

      // 2. Auto-fill Booking Date to today if empty
      if (!updated.bookingDate) {
        updated.bookingDate = new Date().toISOString().split("T")[0];
      }

      // 3. Auto-select or suggest matching Unit from Customer's project / preference
      const targetProjId = selectedCustomer?.projectId || matchingLead?.projectId;
      let matchedUnit = null;

      if (targetProjId) {
        const projectUnits = units.filter(u => u.projectId === targetProjId);
        if (projectUnits.length > 0) {
          const targetUnitNum = selectedCustomer?.unitNumber || matchingLead?.flatNo || matchingLead?.interest;
          matchedUnit = (targetUnitNum && projectUnits.find(u => u.unitNumber.toLowerCase().includes(targetUnitNum.toLowerCase()))) || projectUnits[0];
        }
      }

      if (matchedUnit) {
        updated.unitId = matchedUnit.id.toString();
        const basePrice = matchedUnit.price || 0;
        const gstAmount = Math.round(basePrice * 0.05);
        updated.totalAmount = basePrice + gstAmount;
        updated.tokenAmount = Math.round(basePrice * 0.02);
      } else if (!updated.unitId && (matchingLead?.budget || selectedCustomer?.totalAmount)) {
        const budget = matchingLead?.budget || selectedCustomer?.totalAmount || 0;
        updated.totalAmount = budget;
        updated.tokenAmount = Math.round(budget * 0.02);
      }

      return updated;
    });
  };

  const handleUnitChange = (unitIdVal) => {
    setForm(p => {
      const updated = { ...p, unitId: unitIdVal };
      const selectedUnit = units.find(u => u.id === parseInt(unitIdVal));
      if (selectedUnit) {
        const basePrice = selectedUnit.price || 0;
        const gstAmount = Math.round(basePrice * 0.05);
        const estimatedTotal = basePrice + gstAmount;
        updated.totalAmount = estimatedTotal;
        updated.tokenAmount = Math.round(basePrice * 0.02);
      }
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!form.customerId || !form.unitId) {
      return setToast({ msg: "Please select both Customer and Unit", type: "error" });
    }
    setSaving(true);
    try {
      await api.createBooking({
        ...form,
        customerId: +form.customerId,
        unitId: +form.unitId,
        totalAmount: +form.totalAmount,
        tokenAmount: +form.tokenAmount,
        bookingDate: form.bookingDate ? new Date(form.bookingDate).toISOString() : new Date().toISOString()
      });
      setShowModal(false);
      setForm({
        customerId: "",
        unitId: "",
        bookingDate: "",
        totalAmount: 0,
        tokenAmount: 0,
        status: defaultStatus,
        assignedAgent: ""
      });
      setToast({ msg: "Booking created successfully!", type: "success" });
      load();
    } catch (e) {
      setToast({ msg: e.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const filteredBookings = bookings.filter(b => {
    const custName = b.customer?.name || "";
    const bNumber = b.bookingNumber || "";
    const uNum = b.unit?.unitNumber || "";
    const agent = b.assignedAgent || "";
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || custName.toLowerCase().includes(q) || bNumber.toLowerCase().includes(q) || uNum.toLowerCase().includes(q) || agent.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "All Statuses" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalValue = bookings.reduce((s, b) => s + (b.totalAmount || 0), 0);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState msg={error} onRetry={load} />;

  return (
    <div className="fi">
      {toast && <Toast key={toast.msg} {...toast} onClose={() => setToast(null)} />}
      
      <STitle 
        title="Booking Management" 
        sub={`Active bookings and agreements (${bookings.length} total)`}
        action={<Btn icon={Plus} onClick={() => {
          setForm({
            customerId: "",
            unitId: "",
            bookingDate: new Date().toISOString().split("T")[0],
            totalAmount: 0,
            tokenAmount: 0,
            status: defaultStatus,
            assignedAgent: "Arjun Kapoor"
          });
          setShowModal(true);
        }}>New Booking</Btn>}
      />

      {/* KPI Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 18 }}>
        <Stat icon={FileText} label="Total Bookings" value={bookings.length} change={25} color={C.blue} />
        <Stat icon={DollarSign} label="Total Value" value={fmtCr(totalValue)} change={18} color={C.gold} />
        <Stat icon={CheckCircle} label="Agreements Done" value={bookings.filter(b => b.status === "Agreement Signed").length} change={0} color={C.teal} />
      </div>

      {/* Search and Filters */}
      <div style={{
        display: "flex", gap: 10, alignItems: "center", marginBottom: 16,
        background: C.card, padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.bord}`
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, background: C.raise, padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.bord}` }}>
          <Search size={14} style={{ color: C.mute }} />
          <input 
            type="text" 
            placeholder="Search bookings by customer name, booking #, unit, agent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: "none", outline: "none", background: "transparent", color: C.txt, fontSize: 12, width: "100%" }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} style={{ background: "transparent", border: "none", color: C.mute, cursor: "pointer", display: "flex" }}>
              <X size={13} />
            </button>
          )}
        </div>

        <div style={{ width: 180 }}>
          <Select 
            value={statusFilter} 
            onChange={(val) => setStatusFilter(val)}
            options={["All Statuses", "Confirmed", "Agreement Pending", "Agreement Signed", "Cancelled"]}
          />
        </div>
      </div>

      {/* Bookings Grid */}
      {filteredBookings.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: C.mute, background: C.card, borderRadius: 12, border: `1px solid ${C.bord}` }}>
          <FileText size={32} style={{ margin: "0 auto 8px auto", opacity: 0.5 }} />
          <div style={{ fontWeight: 600, color: C.txt }}>No bookings found</div>
          <div style={{ fontSize: 11 }}>Try adjusting your search or status filter</div>
        </div>
      ) : (
        filteredBookings.map(b => (
          <div key={b.id} style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 14, padding: 20, marginBottom: 12, transition: "box-shadow 0.2s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ color: C.gold, fontFamily: "monospace", fontWeight: 700, fontSize: 12 }}>{b.bookingNumber}</span>
                  <Badge s={b.status} />
                </div>
                <div style={{ color: C.txt, fontSize: 15, fontWeight: 700 }}>{b.customer?.name}</div>
                <div style={{ color: C.sub, fontSize: 11.5, marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
                  <span><strong>Unit:</strong> {b.unit?.unitNumber || "N/A"}</span>
                  <span>•</span>
                  <span><strong>Project:</strong> {b.unit?.project?.name || b.customer?.project?.name || "General"}</span>
                  <span>•</span>
                  <span><strong>Agent:</strong> {b.assignedAgent || "Unassigned"}</span>
                  <span>•</span>
                  <span><strong>Date:</strong> {b.bookingDate ? new Date(b.bookingDate).toLocaleDateString("en-IN") : "N/A"}</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: C.gold, fontWeight: 700, fontSize: 17 }}>{fmtCr(b.totalAmount)}</div>
                <div style={{ color: C.sub, fontSize: 11, marginTop: 2 }}>Token Paid: {fmtCr(b.tokenAmount)}</div>
              </div>
            </div>
            <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
              <Btn icon={Eye} v="outline" sm onClick={() => setSelectedBooking(b)}>View Details</Btn>
              <Btn 
                icon={downloadingId === b.id ? Loader2 : Download} 
                v="ghost" 
                sm 
                onClick={() => handleDownloadAgreement(b)}
                disabled={downloadingId === b.id}
              >
                {downloadingId === b.id ? "Downloading..." : "Agreement"}
              </Btn>
            </div>
          </div>
        ))
      )}

      {/* ─── NEW BOOKING MODAL ────────────────────────────────────────── */}
      {showModal && (
        <Modal title="New Booking" onClose={() => setShowModal(false)} width={600}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            
            {/* Customer Dropdown - Showing ALL customers from database */}
            <div style={{ gridColumn: "span 2" }}>
              <Field label={`Customer (${customers.length} available)`} required>
                <Select 
                  value={form.customerId} 
                  onChange={handleCustomerChange} 
                  placeholder="Select Customer (Showing all registered clients)"
                  options={customers.map(c => {
                    const proj = projects.find(p => p.id === c.projectId)?.name || c.project?.name || "";
                    const extra = [proj, c.phone].filter(Boolean).join(" · ");
                    return {
                      value: c.id,
                      label: extra ? `${c.name} (${extra})` : c.name
                    };
                  })}
                />
              </Field>
            </div>

            {/* Auto-Fetched Customer Profile Preview */}
            {form.customerId && (() => {
              const cust = customers.find(c => c.id === parseInt(form.customerId));
              if (!cust) return null;
              const leadMatch = leads.find(l => 
                (cust.phone && l.phone === cust.phone) || 
                (cust.email && l.email === cust.email) ||
                (cust.name && l.name.toLowerCase() === cust.name.toLowerCase())
              );
              const projName = projects.find(p => p.id === (cust.projectId || leadMatch?.projectId))?.name || cust.project?.name || "General Project";

              return (
                <div style={{
                  gridColumn: "span 2",
                  background: `${C.blue}0d`,
                  border: `1px solid ${C.blue}30`,
                  borderRadius: 10,
                  padding: "12px 14px",
                  fontSize: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 700, color: C.txt, fontSize: 13.5 }}>{cust.name}</span>
                      <span style={{ 
                        fontSize: 10, 
                        padding: "2px 8px", 
                        borderRadius: 6, 
                        background: `${C.blue}20`, 
                        color: C.blue, 
                        fontWeight: 700 
                      }}>
                        {leadMatch ? `Lead (${leadMatch.stage})` : (cust.status || "Customer")}
                      </span>
                    </div>
                    <span style={{ fontSize: 10.5, color: C.teal, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                      <Check size={12} /> Details Auto-Fetched
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 4, color: C.sub }}>
                    <div><span style={{ color: C.mute, fontSize: 10, textTransform: "uppercase" }}>Phone:</span> <strong style={{ color: C.txt }}>{cust.phone || "N/A"}</strong></div>
                    <div><span style={{ color: C.mute, fontSize: 10, textTransform: "uppercase" }}>Email:</span> <strong style={{ color: C.txt }}>{cust.email || "N/A"}</strong></div>
                    <div><span style={{ color: C.mute, fontSize: 10, textTransform: "uppercase" }}>Project:</span> <strong style={{ color: C.gold }}>{projName}</strong></div>
                  </div>

                  {leadMatch && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, borderTop: `1px dashed ${C.bord}`, paddingTop: 6, marginTop: 2 }}>
                      <div><span style={{ color: C.mute, fontSize: 10, textTransform: "uppercase" }}>Assigned Exec:</span> <span style={{ color: C.txt, fontWeight: 600 }}>{leadMatch.assignedTo || "Unassigned"}</span></div>
                      <div><span style={{ color: C.mute, fontSize: 10, textTransform: "uppercase" }}>Preferred Unit:</span> <span style={{ color: C.txt, fontWeight: 600 }}>{leadMatch.interest || leadMatch.flatNo || "N/A"}</span></div>
                      <div><span style={{ color: C.mute, fontSize: 10, textTransform: "uppercase" }}>Target Budget:</span> <span style={{ color: C.gold, fontWeight: 700 }}>₹{leadMatch.budget ? Number(leadMatch.budget).toLocaleString("en-IN") : "0"}</span></div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Available Unit Dropdown */}
            <div style={{ gridColumn: "span 2" }}>
              <Field label="Available Unit" required>
                <Select 
                  value={form.unitId} 
                  onChange={handleUnitChange} 
                  placeholder="Select Unit"
                  options={units.map(u => {
                    const proj = projects.find(p => p.id === u.projectId)?.name;
                    const selectedCust = customers.find(c => c.id === parseInt(form.customerId));
                    const isPreferred = selectedCust && selectedCust.projectId === u.projectId;
                    return {
                      value: u.id,
                      label: `${isPreferred ? "★ [Preferred] " : ""}${u.unitNumber} - ${u.unitType} (${u.area} Sq Ft)${proj ? ` · ${proj}` : ""} - ₹${fmtCr(u.price)}`
                    };
                  })}
                />
              </Field>
            </div>

            {/* Unit Cost Sheet Breakup */}
            {form.unitId && (() => {
              const u = units.find(unit => unit.id === parseInt(form.unitId));
              if (!u) return null;
              const basePrice = u.price || 0;
              const gstAmount = Math.round(basePrice * 0.05);
              const estimatedTotal = basePrice + gstAmount;
              return (
                <div style={{ gridColumn: "span 2", background: C.raise, border: `1px solid ${C.bord}`, borderRadius: 10, padding: 14, fontSize: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ fontWeight: 700, color: C.gold, fontSize: 13, borderBottom: `1px solid ${C.bord}`, paddingBottom: 6, marginBottom: 4 }}>Unit Cost Sheet Breakup</div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>Super Built-up Area:</span><span style={{ fontWeight: 600, color: C.txt }}>{u.area} Sq. Ft.</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>Base Unit Price:</span><span style={{ fontWeight: 600, color: C.txt }}>₹{basePrice.toLocaleString("en-IN")}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>Estimated GST (5%):</span><span style={{ fontWeight: 600, color: C.txt }}>₹{gstAmount.toLocaleString("en-IN")}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px dashed ${C.bord}`, paddingTop: 6, marginTop: 4, fontWeight: 700, color: C.gold, fontSize: 13.5 }}>
                    <span>Estimated Total Amount:</span>
                    <span>₹{estimatedTotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div style={{ fontSize: 10, color: C.mute, marginTop: 2 }}>* Values pre-filled in fields below automatically. User can override if custom discounts apply.</div>
                </div>
              );
            })()}

            <Field label="Booking Date">
              <Input type="date" value={form.bookingDate} onChange={f("bookingDate")} />
            </Field>

            <Field label="Assigned Agent">
              <Input value={form.assignedAgent} onChange={f("assignedAgent")} placeholder="Agent name" />
            </Field>

            <Field label="Total Amount (₹)">
              <Input type="number" value={form.totalAmount} onChange={f("totalAmount")} placeholder="13100000" />
            </Field>

            <Field label="Token Amount (₹)">
              <Input type="number" value={form.tokenAmount} onChange={f("tokenAmount")} placeholder="200000" />
            </Field>

            <div style={{ gridColumn: "span 2" }}>
              <Field label="Status">
                <Select value={form.status} onChange={f("status")} options={bookingStatus} />
              </Field>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.bord}` }}>
            <Btn v="outline" onClick={() => setShowModal(false)}>Cancel</Btn>
            <Btn onClick={handleSubmit} disabled={saving} icon={saving ? Loader2 : Plus}>
              {saving ? "Creating..." : "Create Booking"}
            </Btn>
          </div>
        </Modal>
      )}

      {/* ─── VIEW BOOKING DETAILS MODAL ─────────────────────────────────── */}
      {selectedBooking && (
        <Modal title={`Booking Details - ${selectedBooking.bookingNumber}`} onClose={() => setSelectedBooking(null)} width={620}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Header Status Card */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.raise, padding: "14px 18px", borderRadius: 10, border: `1px solid ${C.bord}` }}>
              <div>
                <div style={{ fontSize: 11, color: C.mute, fontWeight: 700, textTransform: "uppercase" }}>Booking Reference</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.gold, fontFamily: "monospace" }}>{selectedBooking.bookingNumber}</div>
              </div>
              <Badge s={selectedBooking.status} />
            </div>

            {/* Customer Details Section */}
            <div style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 10, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, color: C.txt, fontSize: 13, marginBottom: 10 }}>
                <User size={15} style={{ color: C.blue }} /> Customer Details
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12 }}>
                <div><span style={{ color: C.mute }}>Full Name:</span> <strong style={{ color: C.txt }}>{selectedBooking.customer?.name}</strong></div>
                <div><span style={{ color: C.mute }}>Phone:</span> <strong style={{ color: C.txt }}>{selectedBooking.customer?.phone || "N/A"}</strong></div>
                <div><span style={{ color: C.mute }}>Email:</span> <strong style={{ color: C.txt }}>{selectedBooking.customer?.email || "N/A"}</strong></div>
                <div><span style={{ color: C.mute }}>Customer Status:</span> <span style={{ color: C.teal, fontWeight: 600 }}>{selectedBooking.customer?.status || "Active"}</span></div>
              </div>
            </div>

            {/* Unit Details Section */}
            <div style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 10, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, color: C.txt, fontSize: 13, marginBottom: 10 }}>
                <Home size={15} style={{ color: C.gold }} /> Unit & Project Details
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12 }}>
                <div><span style={{ color: C.mute }}>Unit Number:</span> <strong style={{ color: C.gold, fontSize: 13 }}>{selectedBooking.unit?.unitNumber || "N/A"}</strong></div>
                <div><span style={{ color: C.mute }}>Unit Type:</span> <strong style={{ color: C.txt }}>{selectedBooking.unit?.unitType || "N/A"}</strong></div>
                <div><span style={{ color: C.mute }}>Super Built-up Area:</span> <span style={{ color: C.txt }}>{selectedBooking.unit?.area ? `${selectedBooking.unit.area} Sq. Ft.` : "N/A"}</span></div>
                <div><span style={{ color: C.mute }}>Project:</span> <strong style={{ color: C.txt }}>{selectedBooking.customer?.project?.name || "General"}</strong></div>
                <div style={{ gridColumn: "span 2" }}><span style={{ color: C.mute }}>Project Location:</span> <span style={{ color: C.sub }}>{selectedBooking.customer?.project?.location || "N/A"}</span></div>
              </div>
            </div>

            {/* Financial Overview */}
            <div style={{ background: C.raise, border: `1px solid ${C.bord}`, borderRadius: 10, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, color: C.txt, fontSize: 13, marginBottom: 10 }}>
                <DollarSign size={15} style={{ color: C.teal }} /> Financial Summary
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, fontSize: 12 }}>
                <div>
                  <div style={{ color: C.mute, fontSize: 10.5 }}>Total Deal Value</div>
                  <div style={{ color: C.gold, fontWeight: 700, fontSize: 15 }}>₹{selectedBooking.totalAmount ? Number(selectedBooking.totalAmount).toLocaleString("en-IN") : "0"}</div>
                </div>
                <div>
                  <div style={{ color: C.mute, fontSize: 10.5 }}>Token Amount Paid</div>
                  <div style={{ color: C.teal, fontWeight: 700, fontSize: 15 }}>₹{selectedBooking.tokenAmount ? Number(selectedBooking.tokenAmount).toLocaleString("en-IN") : "0"}</div>
                </div>
                <div>
                  <div style={{ color: C.mute, fontSize: 10.5 }}>Balance Due</div>
                  <div style={{ color: C.red, fontWeight: 700, fontSize: 15 }}>
                    ₹{((selectedBooking.totalAmount || 0) - (selectedBooking.tokenAmount || 0)).toLocaleString("en-IN")}
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Meta Information */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 11.5, color: C.sub, padding: "0 4px" }}>
              <div><span>Assigned Sales Agent:</span> <strong style={{ color: C.txt }}>{selectedBooking.assignedAgent || "Unassigned"}</strong></div>
              <div><span>Booking Date:</span> <strong style={{ color: C.txt }}>{selectedBooking.bookingDate ? new Date(selectedBooking.bookingDate).toLocaleDateString("en-IN") : "N/A"}</strong></div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, borderTop: `1px solid ${C.bord}`, paddingTop: 14 }}>
              <Btn v="outline" onClick={() => setSelectedBooking(null)}>Close</Btn>
              <Btn 
                icon={downloadingId === selectedBooking.id ? Loader2 : Download} 
                onClick={() => handleDownloadAgreement(selectedBooking)}
                disabled={downloadingId === selectedBooking.id}
              >
                {downloadingId === selectedBooking.id ? "Generating PDF..." : "Download Agreement"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}