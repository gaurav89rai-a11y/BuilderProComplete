import { useState, useEffect, useCallback } from "react";
import { Loader2, Plus, Check, RefreshCw, Handshake, Target, Award, FileText, Activity, CheckCircle, User } from "lucide-react";
import { C } from "../../config/theme.js";
import { api } from "../../services/api.js";
import { Badge, Btn, Modal, Field, Input, Select, LoadingState, ErrorState, Toast, STitle, inp } from "../../components/ui";
import { ChannelPartnerForm, VisitorFeedbackForm, SourcingManagerForm, BookingForm, SalesManagerForm } from "../../forms";

export function Workflow() {
  const [activeTab, setActiveTab] = useState("forms"); // "forms" or "trackers"
  const [activeForm, setActiveForm] = useState(0); // 0: Channel Partner, 1: Visitor Feedback, 2: Sourcing Manager, 3: Booking Form, 4: Sales Manager
  
  // Dynamic Lists from Backend
  const [projectsList, setProjectsList] = useState([]);
  const [unitsList, setUnitsList] = useState([]);
  const [partnersList, setPartnersList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Interactive Verification states
  const [otpVerifyTarget, setOtpVerifyTarget] = useState(null); // { formId: 0|1, phone: "..." }
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");
  
  // Map Location picker states
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapPin, setMapPin] = useState(null); // { x: px, y: px }
  const [selectedCoords, setSelectedCoords] = useState("");
  
  // GPS Camera simulation states
  const [capturingPhoto, setCapturingPhoto] = useState(false);
  const [photoStep, setPhotoStep] = useState("scanning"); // "scanning" | "captured"
  
  // Validation error states
  const [errors, setErrors] = useState({});

  // ─────────────────────────────────────────────────────────────
  // FORM 0: Channel Partner State
  const [cpForm, setCpForm] = useState({
    nameOfFirm: "",
    nameOfOwner: "",
    contactNo: "",
    otpVerified: false,
    emailId: "",
    address: "",
    officeLocation: "",
    teamStrength: "",
    preferredWorkLocation: "",
    metaPage: "",
    dob: "",
    anniversary: "",
    interestedProjects: [],
    visitingCardPhoto: "",
    mapLocation: "",
    marketingMaterials: [],
    sourcingManagerId: ""
  });

  // FORM 1: Visitor Feedback State
  const [visForm, setVisForm] = useState({
    companyName: "",
    visitorName: "",
    address: "",
    preferences: [], // e.g. ["1-BHK", "2-BHK"]
    contactNo: "",
    otpVerified: false,
    emailId: "",
    source: "Self",
    dob: "",
    anniversary: "",
    marketingOptIn: true,
    remark: "",
    revisit: "1st",
    attendedBy: "",
    sourcingManagerId: ""
  });

  // FORM 2: Sourcing Manager State
  const [smForm, setSmForm] = useState({
    date: new Date().toISOString().split("T")[0],
    smName: "",
    cpId: "",
    address: "",
    contactNo: "",
    emailId: "",
    remark: "",
    timeIn: "10:00",
    timeOut: "17:30",
    livePhoto: "",
    liveCoords: "",
    noOfVisits: 3
  });

  // FORM 3: Booking Form State
  const [bkForm, setBkForm] = useState({
    date: new Date().toISOString().split("T")[0],
    enquiryNo: "",
    companyName: "",
    // Applicant 1
    app1Name: "", app1Dob: "", app1Relation: "", app1Pan: "", app1Aadhar: "", app1Email: "",
    app1Mobile: "", app1AltMobile: "", app1Existing: false, app1Address: "", app1Occupation: "",
    app1Company: "", app1OfficeAddress: "", app1OfficeNo: "", app1Designation: "", app1Anniversary: "", app1Income: "",
    // Applicant 2
    app2Name: "", app2Dob: "", app2Relation: "", app2Pan: "", app2Aadhar: "", app2Email: "",
    app2Mobile: "", app2AltMobile: "", app2Existing: false, app2Address: "", app2Occupation: "",
    app2Company: "", app2OfficeAddress: "", app2OfficeNo: "", app2Designation: "", app2Anniversary: "", app2Income: "",
    // Details
    projectId: "", wing: "", unitId: "", floor: "", usableCarpetArea: "", reraCarpetArea: "",
    flatCost: "", flatCostWords: "", referral: "", carParking: "", paymentTerms: "",
    salesManagerId: "", customerPhoto: "", panPhoto: "", aadharPhoto: ""
  });

  // FORM 4: Sales Manager State
  const [salesMForm, setSalesMForm] = useState({
    date: new Date().toISOString().split("T")[0],
    smName: "",
    visitsAttended: "",
    revisitsAttended: "",
    followUpCalls: "",
    bookingsCount: "",
    otherWorks: "",
    timeIn: "09:30",
    timeOut: "18:30"
  });

  // ─────────────────────────────────────────────────────────────
  // Fetch lists on mount
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [p, u, partners, users] = await Promise.all([
        api.getProjects(),
        api.getUnits(),
        api.getPartners(),
        api.getUsers()
      ]);
      setProjectsList(p);
      setUnitsList(u);
      setPartnersList(partners);
      setUsersList(users);
      
      // Auto-set default agents for dropdowns
      const salesAgent = users.find(x => x.role === "Sales Agent" || x.role === "Super Admin")?.name || "";
      const mgr = users.find(x => x.role === "Manager" || x.role === "Super Admin")?.name || "";
      
      setVisForm(prev => ({ ...prev, attendedBy: salesAgent, sourcingManagerId: mgr }));
      setCpForm(prev => ({ ...prev, sourcingManagerId: mgr }));
      setSmForm(prev => ({ ...prev, smName: mgr }));
      setBkForm(prev => ({ ...prev, salesManagerId: salesAgent }));
      setSalesMForm(prev => ({ ...prev, smName: salesAgent }));
    } catch (e) {
      console.error(e);
      setToast({ msg: "Error loading reference lists", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);



  // ─────────────────────────────────────────────────────────────
  // OTP Verification logic
  const handleStartVerify = (formId, phone) => {
    if (!phone || phone.length < 10) {
      setToast({ msg: "Please enter a valid 10-digit mobile number first.", type: "error" });
      return;
    }
    setOtpVerifyTarget({ formId, phone });
    setOtpInput("");
    setOtpError("");
  };

  const confirmOtp = () => {
    if (otpInput === "1234") {
      if (otpVerifyTarget.formId === 0) {
        setCpForm(prev => ({ ...prev, otpVerified: true }));
      } else {
        setVisForm(prev => ({ ...prev, otpVerified: true }));
      }
      setToast({ msg: "Mobile number verified successfully!", type: "success" });
      setOtpVerifyTarget(null);
    } else {
      setOtpError("Incorrect verification code. Please try again.");
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Map Picker logic
  const handleMapClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMapPin({ x, y });
    
    // Simulate latitude and longitude based on click coordinates
    const baseLat = 19.1824;
    const baseLng = 73.1254;
    const lat = (baseLat + (150 - y) * 0.0003).toFixed(5);
    const lng = (baseLng + (x - 250) * 0.0003).toFixed(5);
    setSelectedCoords(`${lat}° N, ${lng}° E`);
  };

  const saveMapLocation = () => {
    setCpForm(prev => ({ ...prev, mapLocation: selectedCoords }));
    setShowMapPicker(false);
  };

  // ─────────────────────────────────────────────────────────────
  // Camera simulation logic
  const startCamera = () => {
    setCapturingPhoto(true);
    setPhotoStep("scanning");
    setTimeout(() => {
      setPhotoStep("captured");
    }, 1500);
  };

  const saveLivePhoto = () => {
    setSmForm(prev => ({
      ...prev,
      livePhoto: "sm_live_capture_4412.jpg",
      liveCoords: "Lat: 19.2145° N, Lng: 73.1092° E"
    }));
    setCapturingPhoto(false);
    setToast({ msg: "Live GPS Photo captured!", type: "success" });
  };



  // ─────────────────────────────────────────────────────────────
  // Form submission and validation handlers
  const handleCpSubmit = async () => {
    let errs = {};
    if (!cpForm.nameOfFirm) errs.nameOfFirm = true;
    if (!cpForm.nameOfOwner) errs.nameOfOwner = true;
    if (!cpForm.contactNo || cpForm.contactNo.length < 10) errs.contactNo = true;
    if (!cpForm.otpVerified) errs.otpVerified = true;
    if (!cpForm.address) errs.address = true;
    if (!cpForm.preferredWorkLocation) errs.preferredWorkLocation = true;
    if (!cpForm.dob) errs.dob = true;
    if (cpForm.interestedProjects.length === 0) errs.interestedProjects = true;
    if (!cpForm.visitingCardPhoto) errs.visitingCardPhoto = true;
    if (!cpForm.mapLocation) errs.mapLocation = true;

    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      setToast({ msg: "Please correct highlighted fields and verify OTP.", type: "error" });
      return;
    }

    setSaving(true);
    try {
      // Map to C# Partner class properties
      await api.createPartner({
        name: cpForm.nameOfFirm,
        contactPerson: cpForm.nameOfOwner,
        phone: cpForm.contactNo,
        email: cpForm.emailId || "partner@builderpro.com",
        city: cpForm.preferredWorkLocation,
        status: "Silver",
        rating: 4.0,
        commissionRate: 2.5
      });

      setToast({ msg: "Channel Partner registered successfully!", type: "success" });
      // Reset form
      setCpForm({
        nameOfFirm: "", nameOfOwner: "", contactNo: "", otpVerified: false, emailId: "", address: "",
        officeLocation: "", teamStrength: "", preferredWorkLocation: "", metaPage: "", dob: "",
        anniversary: "", interestedProjects: [], visitingCardPhoto: "", mapLocation: "",
        marketingMaterials: [], sourcingManagerId: ""
      });
      loadData();
    } catch (e) {
      setToast({ msg: e.message || "Failed to save partner", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleVisitorSubmit = async () => {
    let errs = {};
    if (!visForm.visitorName) errs.visitorName = true;
    if (!visForm.contactNo || visForm.contactNo.length < 10) errs.contactNo = true;
    if (!visForm.otpVerified) errs.otpVerified = true;
    if (!visForm.source) errs.source = true;
    if (!visForm.attendedBy) errs.attendedBy = true;

    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      setToast({ msg: "Please correct highlighted fields and verify OTP.", type: "error" });
      return;
    }

    setSaving(true);
    try {
      // Save visitor as a Lead
      const projId = projectsList[0]?.id || null;
      await api.createLead({
        name: visForm.visitorName,
        phone: visForm.contactNo,
        email: visForm.emailId || "visitor@visitor.com",
        source: visForm.source || "Walk-in",
        stage: "Site Visit",
        interest: visForm.preferences.join(", ") || "1-BHK",
        assignedTo: visForm.attendedBy,
        budget: 5000000,
        projectId: projId
      });

      setToast({ msg: "Visitor Feedback logged successfully as a new Lead!", type: "success" });
      setVisForm({
        companyName: "", visitorName: "", address: "", preferences: [], contactNo: "",
        otpVerified: false, emailId: "", source: "Self", dob: "", anniversary: "",
        marketingOptIn: true, remark: "", revisit: "1st", attendedBy: "", sourcingManagerId: ""
      });
      loadData();
    } catch (e) {
      setToast({ msg: e.message || "Failed to save visitor feedback", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleSmSubmit = () => {
    let errs = {};
    if (!smForm.cpId) errs.cpId = true;
    if (!smForm.livePhoto) errs.livePhoto = true;
    
    // Time check
    const timeInVal = parseInt(smForm.timeIn.replace(":", ""));
    const timeOutVal = parseInt(smForm.timeOut.replace(":", ""));
    if (timeOutVal <= timeInVal) errs.timeOut = true;

    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      if (errs.timeOut) {
        setToast({ msg: "Time Out must be later than Time In.", type: "error" });
      } else {
        setToast({ msg: "Please select a Channel Partner and capture your Live Photo.", type: "error" });
      }
      return;
    }

    setToast({ msg: "Sourcing Manager log saved successfully!", type: "success" });
    setSmForm(prev => ({
      ...prev,
      remark: "",
      livePhoto: "",
      liveCoords: "",
      timeIn: "10:00",
      timeOut: "17:30"
    }));
  };

  const handleBookingSubmit = async () => {
    let errs = {};
    if (!bkForm.app1Name) errs.app1Name = true;
    if (!bkForm.app1Dob) errs.app1Dob = true;
    if (!bkForm.app1Pan || bkForm.app1Pan.length !== 10) errs.app1Pan = true;
    if (!bkForm.app1Aadhar || bkForm.app1Aadhar.length !== 12) errs.app1Aadhar = true;
    if (!bkForm.app1Mobile || bkForm.app1Mobile.length < 10) errs.app1Mobile = true;
    if (!bkForm.app1Email) errs.app1Email = true;

    if (!bkForm.projectId) errs.projectId = true;
    if (!bkForm.unitId) errs.unitId = true;
    if (!bkForm.flatCost || bkForm.flatCost <= 0) errs.flatCost = true;

    if (!bkForm.customerPhoto) errs.customerPhoto = true;
    if (!bkForm.panPhoto) errs.panPhoto = true;
    if (!bkForm.aadharPhoto) errs.aadharPhoto = true;

    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      setToast({ msg: "Please correct highlighted fields and upload all required photos/documents.", type: "error" });
      return;
    }

    setSaving(true);
    try {
      // 1. Create a Customer record first
      const custObj = await api.createCustomer({
        name: bkForm.app1Name,
        email: bkForm.app1Email,
        phone: bkForm.app1Mobile,
        unitNumber: unitsList.find(x => x.id === parseInt(bkForm.unitId))?.unitNumber || "A-101",
        projectId: parseInt(bkForm.projectId),
        bookingDate: new Date(bkForm.date).toISOString(),
        status: "Active",
        totalAmount: parseFloat(bkForm.flatCost),
        paidAmount: parseFloat(bkForm.flatCost) * 0.1 // 10% token amount
      });

      // 2. Create the Booking referencing the Customer ID
      await api.createBooking({
        customerId: custObj.id,
        unitId: parseInt(bkForm.unitId),
        bookingDate: new Date(bkForm.date).toISOString(),
        totalAmount: parseFloat(bkForm.flatCost),
        tokenAmount: parseFloat(bkForm.flatCost) * 0.1,
        status: "Confirmed",
        assignedAgent: bkForm.salesManagerId
      });

      setToast({ msg: `Booking successful! Unit registered and Customer created successfully.`, type: "success" });
      // Reset Booking form
      setBkForm({
        date: new Date().toISOString().split("T")[0], enquiryNo: "", companyName: "",
        app1Name: "", app1Dob: "", app1Relation: "", app1Pan: "", app1Aadhar: "", app1Email: "",
        app1Mobile: "", app1AltMobile: "", app1Existing: false, app1Address: "", app1Occupation: "",
        app1Company: "", app1OfficeAddress: "", app1OfficeNo: "", app1Designation: "", app1Anniversary: "", app1Income: "",
        app2Name: "", app2Dob: "", app2Relation: "", app2Pan: "", app2Aadhar: "", app2Email: "",
        app2Mobile: "", app2AltMobile: "", app2Existing: false, app2Address: "", app2Occupation: "",
        app2Company: "", app2OfficeAddress: "", app2OfficeNo: "", app2Designation: "", app2Anniversary: "", app2Income: "",
        projectId: "", wing: "", unitId: "", floor: "", usableCarpetArea: "", reraCarpetArea: "",
        flatCost: "", flatCostWords: "", referral: "", carParking: "", paymentTerms: "",
        salesManagerId: "", customerPhoto: "", panPhoto: "", aadharPhoto: ""
      });
      loadData();
    } catch (e) {
      setToast({ msg: e.message || "Failed to create booking", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleSalesMSubmit = () => {
    let errs = {};
    if (!salesMForm.smName) errs.smName = true;
    if (salesMForm.visitsAttended === "" || isNaN(salesMForm.visitsAttended)) errs.visitsAttended = true;
    if (salesMForm.revisitsAttended === "" || isNaN(salesMForm.revisitsAttended)) errs.revisitsAttended = true;
    if (salesMForm.followUpCalls === "" || isNaN(salesMForm.followUpCalls)) errs.followUpCalls = true;
    if (salesMForm.bookingsCount === "" || isNaN(salesMForm.bookingsCount)) errs.bookingsCount = true;

    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      setToast({ msg: "Please fill in all counts.", type: "error" });
      return;
    }

    setToast({ msg: "Sales Manager daily log logged successfully!", type: "success" });
    setSalesMForm(prev => ({
      ...prev,
      visitsAttended: "",
      revisitsAttended: "",
      followUpCalls: "",
      bookingsCount: "",
      otherWorks: ""
    }));
  };

  // Sourcing Manager auto-fill trigger when CP is selected
  const handleCpSelect = (cpIdVal) => {
    setSmForm(prev => {
      const selectedCP = partnersList.find(x => x.id === parseInt(cpIdVal));
      if (selectedCP) {
        return {
          ...prev,
          cpId: cpIdVal,
          address: selectedCP.city || "Mumbai",
          contactNo: selectedCP.phone || "9876543210",
          emailId: selectedCP.email || "cp@partner.com",
          noOfVisits: (selectedCP.leads || 0) + 1
        };
      }
      return { ...prev, cpId: cpIdVal, address: "", contactNo: "", emailId: "", noOfVisits: 0 };
    });
    setErrors(prev => ({ ...prev, cpId: false }));
  };

  // Dynamic Unit auto-fill trigger when project & unit is selected
  const handleUnitSelect = (unitIdVal) => {
    const selectedUnit = unitsList.find(x => x.id === parseInt(unitIdVal));
    setBkForm(prev => ({
      ...prev,
      unitId: unitIdVal,
      floor: selectedUnit ? selectedUnit.floor.toString() : "",
      usableCarpetArea: selectedUnit ? (selectedUnit.area * 0.9).toFixed(0) : "",
      reraCarpetArea: selectedUnit ? selectedUnit.area.toFixed(0) : "",
      flatCost: selectedUnit ? selectedUnit.price.toString() : "",
      flatCostWords: selectedUnit ? numberToWords(selectedUnit.price) : ""
    }));
    setErrors(prev => ({ ...prev, unitId: false, flatCost: false }));
  };

  // Checkbox/Badges multiple preference helper
  const togglePreference = (pref) => {
    setVisForm(prev => {
      const exists = prev.preferences.includes(pref);
      const next = exists 
        ? prev.preferences.filter(p => p !== pref) 
        : [...prev.preferences, pref];
      return { ...prev, preferences: next };
    });
  };

  const toggleMarketingMaterial = (mat) => {
    setCpForm(prev => {
      const exists = prev.marketingMaterials.includes(mat);
      const next = exists 
        ? prev.marketingMaterials.filter(m => m !== mat) 
        : [...prev.marketingMaterials, mat];
      return { ...prev, marketingMaterials: next };
    });
  };

  if (loading) return <LoadingState />;

  const formButtons = [
    { label: "Channel Partner", id: 0, icon: Handshake },
    { label: "Visitor Feedback", id: 1, icon: Target },
    { label: "Sourcing Manager", id: 2, icon: Award },
    { label: "Booking Form", id: 3, icon: FileText },
    { label: "Sales Manager", id: 4, icon: Activity }
  ];

  return (
    <div className="fi">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      {/* Upper Tab Switcher */}
      <div style={{ display: "flex", gap: 10, borderBottom: `1px solid ${C.bord}`, paddingBottom: 14, marginBottom: 20 }}>
        <button 
          onClick={() => setActiveTab("forms")} 
          style={{
            background: activeTab === "forms" ? C.gold : "transparent",
            color: activeTab === "forms" ? "#000" : C.sub,
            border: activeTab === "forms" ? "none" : `1px solid ${C.bord}`,
            padding: "8px 16px",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 12,
            cursor: "pointer"
          }}
        >
          Interactive Workflow Forms
        </button>
        <button 
          onClick={() => setActiveTab("trackers")} 
          style={{
            background: activeTab === "trackers" ? C.gold : "transparent",
            color: activeTab === "trackers" ? "#000" : C.sub,
            border: activeTab === "trackers" ? "none" : `1px solid ${C.bord}`,
            padding: "8px 16px",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 12,
            cursor: "pointer"
          }}
        >
          Process Dashboards
        </button>
      </div>

      {activeTab === "trackers" ? (
        /* Original Process Trackers View */
        <div style={{ display: "grid", gap: 14 }}>
          {[
            { name: "Lead to Site Visit", trigger: "Lead Stage Change", steps: ["New Lead", "Auto Assign", "Send SMS", "Schedule Visit", "Follow-up"], cur: 3, status: "Active", count: 12 },
            { name: "Booking to Agreement", trigger: "Booking Created", steps: ["Booking Confirm", "Doc Collection", "Legal Review", "Agreement Draft", "Sign & Register"], cur: 2, status: "Active", count: 5 },
            { name: "Payment Reminder", trigger: "Due Date -7 days", steps: ["Check Due", "Generate Notice", "Send Email", "Send WhatsApp", "Escalate"], cur: 4, status: "Active", count: 3 }
          ].map((w, wi) => (
            <div key={wi} style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 14, padding: 22 }}>
              <div style={{ display: "flex", justify: "space-between", alignItems: "center", marginBottom: 18 }}>
                <div>
                  <div style={{ color: C.txt, fontWeight: 700, fontSize: 14 }}>{w.name}</div>
                  <div style={{ color: C.sub, fontSize: 11, marginTop: 3 }}>Trigger: {w.trigger} · {w.count} instances</div>
                </div>
                <Badge s={w.status} />
              </div>
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                {w.steps.map((step, si) => {
                  const done = si < w.cur, active = si === w.cur && w.status === "Active";
                  const col = done ? C.teal : active ? C.gold : C.mute;
                  return (
                    <div key={si} style={{ display: "flex", alignItems: "flex-start", flex: si < w.steps.length - 1 ? 1 : "none" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: done ? C.teal : active ? C.gold : C.raise, border: `2px solid ${col}`, display: "flex", alignItems: "center", justify: "center" }}>
                          {done ? <CheckCircle size={13} color="#fff" /> : <span style={{ color: active ? "#000" : C.mute, fontSize: 10, fontWeight: 700 }}>{si + 1}</span>}
                        </div>
                        <span style={{ color: col, fontSize: 10, textAlign: "center", width: 64, lineHeight: 1.3 }}>{step}</span>
                      </div>
                      {si < w.steps.length - 1 && <div style={{ flex: 1, height: 2, background: done ? C.teal : C.raise, margin: "13px 4px 0", minWidth: 16 }} />}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Workflow Forms view */
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 20 }}>
          
          {/* Left panel buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {formButtons.map(f => {
              const isActive = activeForm === f.id;
              const Icon = f.icon;
              return (
                <button 
                  key={f.id}
                  onClick={() => { setActiveForm(f.id); setErrors({}); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: isActive ? `1px solid ${C.gold}44` : `1px solid ${C.bord}`,
                    background: isActive ? `${C.gold}15` : C.card,
                    color: isActive ? C.gold : C.txt,
                    fontSize: 12,
                    fontWeight: 700,
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  <Icon size={16} color={isActive ? C.gold : C.sub} />
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Right panel: Active Form render */}
          <div style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 16, padding: 24 }}>
            
            {/* ───────── CHANNEL PARTNER REGISTRATION FORM ───────── */}
                        {activeForm === 0 && (
              <ChannelPartnerForm
                cpForm={cpForm}
                setCpForm={setCpForm}
                projectsList={projectsList}
                usersList={usersList}
                errors={errors}
                setErrors={setErrors}
                saving={saving}
                handleStartVerify={handleStartVerify}
                toggleMarketingMaterial={toggleMarketingMaterial}
                setShowMapPicker={setShowMapPicker}
                handleCpSubmit={handleCpSubmit}
              />
            )}

            {activeForm === 1 && (
              <VisitorFeedbackForm
                visForm={visForm}
                setVisForm={setVisForm}
                errors={errors}
                usersList={usersList}
                saving={saving}
                handleStartVerify={handleStartVerify}
                togglePreference={togglePreference}
                handleVisitorSubmit={handleVisitorSubmit}
              />
            )}

            {activeForm === 2 && (
              <SourcingManagerForm
                smForm={smForm}
                setSmForm={setSmForm}
                errors={errors}
                setErrors={setErrors}
                partnersList={partnersList}
                handleCpSelect={handleCpSelect}
                startCamera={startCamera}
                handleSmSubmit={handleSmSubmit}
              />
            )}

            {activeForm === 3 && (
              <BookingForm
                bkForm={bkForm}
                setBkForm={setBkForm}
                errors={errors}
                setErrors={setErrors}
                projectsList={projectsList}
                unitsList={unitsList}
                usersList={usersList}
                saving={saving}
                handleUnitSelect={handleUnitSelect}
                handleBookingSubmit={handleBookingSubmit}
              />
            )}

            {activeForm === 4 && (
              <SalesManagerForm
                salesMForm={salesMForm}
                setSalesMForm={setSalesMForm}
                errors={errors}
                setErrors={setErrors}
                usersList={usersList}
                handleSalesMSubmit={handleSalesMSubmit}
              />
            )}

          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Verification OTP Modal */}
      {otpVerifyTarget && (
        <Modal title="Verify Mobile Number" onClose={() => setOtpVerifyTarget(null)} width={380}>
          <div style={{ textAlign: "center" }}>
            <p style={{ color: C.sub, fontSize: 13, marginBottom: 14 }}>
              We sent a 4-digit code to <strong style={{ color: C.txt }}>{otpVerifyTarget.phone}</strong>.
            </p>
            <div style={{ background: `${C.blue}15`, color: C.blue, padding: "8px 12px", borderRadius: 8, fontSize: 12, marginBottom: 20, display: "inline-block" }}>
              Test code: <strong style={{ color: C.gold }}>1234</strong>
            </div>
            
            <Field label="Enter 4-Digit OTP">
              <input 
                maxLength={4}
                value={otpInput} 
                onChange={e => setOtpInput(e.target.value.replace(/\D/g, ""))}
                placeholder="XXXX" 
                style={{ ...inp, textAlign: "center", fontSize: 18, letterSpacing: 6, fontWeight: 700 }}
              />
            </Field>
            {otpError && <p style={{ color: C.red, fontSize: 11, marginBottom: 12 }}>{otpError}</p>}
            
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20 }}>
              <Btn v="outline" onClick={() => setOtpVerifyTarget(null)}>Cancel</Btn>
              <Btn onClick={confirmOtp}>Confirm OTP</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Map Pin Location Modal */}
      {showMapPicker && (
        <Modal title="Office Location Map Picker" onClose={() => setShowMapPicker(false)} width={480}>
          <div>
            <p style={{ color: C.sub, fontSize: 12, marginBottom: 14 }}>
              Click anywhere on the area map below to set your office location.
            </p>
            
            <div 
              onClick={handleMapClick}
              style={{
                height: 260, background: C.raise, border: `1px solid ${C.bord}`, borderRadius: 12,
                position: "relative", cursor: "crosshair", overflow: "hidden"
              }}
            >
              <svg style={{ width: "100%", height: "100%", opacity: 0.12 }} xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke={C.txt} strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                <path d="M 0 100 Q 240 70 480 120" fill="none" stroke={C.txt} strokeWidth="6"/>
                <path d="M 180 0 Q 200 160 260 260" fill="none" stroke={C.txt} strokeWidth="8"/>
                <path d="M 330 0 C 380 90 280 170 450 260" fill="none" stroke={C.blue} strokeWidth="20" opacity="0.4"/>
              </svg>
              
              <div style={{ position: "absolute", top: 30, left: 40, fontSize: 9, background: C.card, padding: "2px 5px", borderRadius: 4, opacity: 0.8, color: C.txt }}>Balaji Emerald (Thakurli)</div>
              <div style={{ position: "absolute", top: 110, left: 280, fontSize: 9, background: C.card, padding: "2px 5px", borderRadius: 4, opacity: 0.8, color: C.txt }}>Balaji Solitaire (Dombivli)</div>
              <div style={{ position: "absolute", top: 190, left: 140, fontSize: 9, background: C.card, padding: "2px 5px", borderRadius: 4, opacity: 0.8, color: C.txt }}>Mahaveer Enclave</div>
              
              {mapPin && (
                <div style={{ position: "absolute", left: mapPin.x - 11, top: mapPin.y - 22, color: C.red }}>
                  <MapPin size={22} fill={C.red} color="#fff" />
                </div>
              )}
            </div>
            
            <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: C.sub }}>
                Selected Pin: <strong style={{ color: C.txt }}>{selectedCoords || "None"}</strong>
              </span>
              <div style={{ display: "flex", gap: 10 }}>
                <Btn v="outline" onClick={() => setShowMapPicker(false)}>Cancel</Btn>
                <Btn disabled={!selectedCoords} onClick={saveMapLocation}>Confirm Location</Btn>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* GPS Camera Capturing Modal */}
      {capturingPhoto && (
        <Modal title="Secure Live GPS Capture" onClose={() => setCapturingPhoto(false)} width={380}>
          <div style={{ textAlign: "center" }}>
            <div 
              style={{
                width: 320, height: 240, background: "#000", borderRadius: 12, margin: "0 auto 16px",
                position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden", border: `2px solid ${C.bord}`
              }}
            >
              {photoStep === "scanning" ? (
                <div style={{ color: C.blue, textAlign: "center" }}>
                  <Loader2 size={36} style={{ animation: "spin 1.5s linear infinite", marginBottom: 12, marginLeft: "auto", marginRight: "auto" }} />
                  <div style={{ fontSize: 12, fontWeight: 700 }}>Initializing Camera & GPS...</div>
                  <div style={{ fontSize: 9, color: C.mute, marginTop: 4 }}>Lat: 19.2145 | Lng: 73.1092</div>
                </div>
              ) : (
                <div style={{ width: "100%", height: "100%", position: "relative" }}>
                  <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${C.blue}33, ${C.gold}33)`, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                    <User size={54} color={C.txt} style={{ opacity: 0.5, marginBottom: 8 }} />
                    <div style={{ fontSize: 12, color: C.txt, fontWeight: 700 }}>Live Photo Ready</div>
                  </div>
                  <div style={{ position: "absolute", bottom: 10, left: 10, background: "rgba(0,0,0,0.75)", padding: "4px 8px", borderRadius: 4, textAlign: "left", fontSize: 9, fontFamily: "monospace", color: "#fff", lineHeight: 1.2 }}>
                    <div>LAT: 19.2145° N</div>
                    <div>LNG: 73.1092° E</div>
                    <div>ALT: 14m</div>
                    <div>DATE: {new Date().toLocaleString()}</div>
                  </div>
                  <div style={{ position: "absolute", top: 10, right: 10, background: C.teal, color: "#000", fontSize: 8, fontWeight: 700, padding: "2px 6px", borderRadius: 20 }}>
                    GPS SECURE
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <Btn v="outline" onClick={() => setCapturingPhoto(false)}>Cancel</Btn>
              {photoStep === "scanning" ? (
                <Btn disabled>Capturing...</Btn>
              ) : (
                <Btn onClick={saveLivePhoto}>Save Capture</Btn>
              )}
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
