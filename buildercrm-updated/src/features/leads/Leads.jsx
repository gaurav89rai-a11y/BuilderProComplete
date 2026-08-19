import { useState, useEffect, useCallback } from "react";
import { 
  Target, Phone, Clock, Calendar, MapPin, FileText, Handshake, Home, 
  Award, DollarSign, CheckSquare, Key, Trophy, AlertCircle, Mail, 
  User, Flag, MessageSquare, MessageCircle, MoreHorizontal, Plus, 
  Loader2, X, Search, Filter, Users, Edit, Download, Trash, Check, 
  Paperclip, Send, PlusCircle, CreditCard, ChevronRight, ChevronLeft, Eye
} from "lucide-react";
import { api } from "../../services/api.js";
import { C } from "../../config/theme.js";
import { fmtCr } from "../../utils/helpers.js";
import { Badge, Btn, Modal, Field, Input, Select, LoadingState, ErrorState, Toast, STitle } from "../../components/ui";
import { useConfig } from "../../config/ConfigContext.jsx";

export function Leads() {
  const { leadStage: stages, leadSource: sources, getDefault, configs } = useConfig();
  const [kanban, setKanban] = useState({});
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modals & Action States
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [projectFilter, setProjectFilter] = useState("All Projects");
  const [executiveFilter, setExecutiveFilter] = useState("All Executives");
  const [sourceFilter, setSourceFilter] = useState("All Sources");
  const [priorityFilter, setPriorityFilter] = useState("All Priorities");
  const [budgetFilter, setBudgetFilter] = useState("All Budgets");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Unified Workspace collapsible right sidebar states
  const [filterTodayFollowUp, setFilterTodayFollowUp] = useState(false);
  const [filterOverdue, setFilterOverdue] = useState(false);
  const [filterSiteVisitToday, setFilterSiteVisitToday] = useState(false);
  const [filterHighProb, setFilterHighProb] = useState(false);

  // Stage change confirmation state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingMove, setPendingMove] = useState(null); // { leadId, leadName, prevStage, targetStage }
  const [comment, setComment] = useState("");
  const [simulatedUser, setSimulatedUser] = useState("Arjun Kapoor|Super Admin");

  // Redesign additional states
  const [collapsedStages, setCollapsedStages] = useState({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [movingLeadId, setMovingLeadId] = useState(null);
  const [activeMenuLeadId, setActiveMenuLeadId] = useState(null);

  // Auto collapse empty stages on load
  useEffect(() => {
    if (kanban && Object.keys(kanban).length > 0) {
      const initialCollapsed = {};
      stages.forEach(stage => {
        const rawLeads = kanban[stage] || [];
        if (rawLeads.length === 0) {
          initialCollapsed[stage] = true;
        }
      });
      setCollapsedStages(initialCollapsed);
    }
  }, [kanban, stages]);

  const toggleStageCollapse = (stage) => {
    setCollapsedStages(prev => ({ ...prev, [stage]: !prev[stage] }));
  };



  const handleEditCardClick = (lead) => {
    setSelectedLead(lead);
    setDrawerTab("info");
    setIsEditingInfo(true);
    setInfoForm({ ...lead });
    refreshDrawerData(lead);
  };

  const formatFollowUpDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const day = d.getDate();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const getNextActivityType = (lead) => {
    if (lead.siteVisits && lead.siteVisits.some(v => v.status === "Scheduled" || new Date(v.visitDate) >= new Date())) {
      return "Site Visit";
    }
    return "Next Activity";
  };

  const renderProgress = (stage) => {
    const idx = stages.indexOf(stage);
    const total = stages.length;
    const filledCount = Math.round(((idx + 1) / total) * 8);
    const stageColor = SC[stage] || C.blue;
    return (
      <div style={{ display: "flex", gap: 3, marginTop: 4, marginBottom: 2 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div 
            key={i} 
            style={{ 
              width: 12, 
              height: 4, 
              borderRadius: 1, 
              background: i < filledCount ? stageColor : `${C.bord}50`,
              transition: "background 0.3s" 
            }} 
          />
        ))}
      </div>
    );
  };

  // Sliding Drawer State
  const [selectedLead, setSelectedLead] = useState(null);
  const [drawerTab, setDrawerTab] = useState("info"); // info, timeline, followups, calls, visits, docs, quote, payments, notes
  const [timelineData, setTimelineData] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  
  // Synced customer details inside drawer
  const [matchedCustomer, setMatchedCustomer] = useState(null);
  const [customerPayments, setCustomerPayments] = useState([]);
  const [customerDocuments, setCustomerDocuments] = useState([]);

  // Drawer Form States
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({});
  
  // Follow-up form
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("12:00");
  const [followUpRemarks, setFollowUpRemarks] = useState("");
  
  // Call form
  const [callType, setCallType] = useState("Outgoing");
  const [callDuration, setCallDuration] = useState("01:30");
  const [callRemarks, setCallRemarks] = useState("");
  const [simulatedCallHistory, setSimulatedCallHistory] = useState({});

  // Site Visit form
  const [visitDate, setVisitDate] = useState("");
  const [visitTime, setVisitTime] = useState("11:00 AM");
  const [visitGuests, setVisitGuests] = useState(2);
  const [visitFeedback, setVisitFeedback] = useState("");
  const [visitRating, setVisitRating] = useState("5");

  // Document Upload Form
  const [docType, setDocType] = useState("Aadhaar");
  const [docName, setDocName] = useState("");

  // Quotation Form
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteDiscount, setQuoteDiscount] = useState("0");
  const [quoteHistory, setQuoteHistory] = useState({}); // leadId -> quote object

  // Payment Form
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState("NEFT");
  const [payTxnId, setPayTxnId] = useState("");
  const [payRemarks, setPayRemarks] = useState("");

  // Notes Form
  const [newNote, setNewNote] = useState("");

  const defaultSource = getDefault("leadSource", "Website");
  const defaultStage = getDefault("leadStage", "New Lead");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    source: defaultSource,
    stage: defaultStage,
    score: 50,
    interest: "",
    assignedTo: "",
    budget: 0,
    projectId: ""
  });

  const SC = {};
  stages.forEach(stage => {
    const cfg = configs.leadStage?.find(c => c.value === stage);
    SC[stage] = C[cfg?.color] || C.sub;
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [k, p] = await Promise.all([api.getLeadsKanban(), api.getProjects()]);
      setKanban(k);
      setProjects(p);
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

  const handleSubmit = async () => {
    if (!form.name || !form.phone) return setToast({ msg: "Name and Phone are required", type: "error" });
    setSaving(true);
    try {
      await api.createLead({
        ...form,
        score: +form.score,
        budget: +form.budget,
        projectId: form.projectId ? +form.projectId : null
      });
      setShowModal(false);
      setForm({
        name: "",
        email: "",
        phone: "",
        source: defaultSource,
        stage: defaultStage,
        score: 50,
        interest: "",
        assignedTo: "",
        budget: 0,
        projectId: ""
      });
      setToast({ msg: "Lead added successfully!", type: "success" });
      load();
    } catch (e) {
      setToast({ msg: e.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Drag and Drop implementation
  const handleDragStart = (e, lead) => {
    e.dataTransfer.setData("text/plain", lead.id.toString());
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const getStageIndex = (stageName) => stages.indexOf(stageName);

  const isCommentRequired = (prevStage, targetStage) => {
    const prevIdx = getStageIndex(prevStage);
    const targetIdx = getStageIndex(targetStage);
    return (prevIdx !== -1 && targetIdx !== -1 && targetIdx < prevIdx) || 
           targetStage === "Closed Lost" || 
           targetStage === "Cancelled";
  };

  const handleDrop = (e, targetStage) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("text/plain");
    if (!leadId) return;

    let foundLead = null;
    for (const stage in kanban) {
      const idx = kanban[stage].findIndex(l => l.id.toString() === leadId);
      if (idx !== -1) {
        foundLead = kanban[stage][idx];
        break;
      }
    }

    if (!foundLead) return;
    if (foundLead.stage === targetStage) return;

    setPendingMove({
      leadId: parseInt(leadId),
      leadName: foundLead.name,
      prevStage: foundLead.stage,
      targetStage: targetStage
    });
    setComment("");
    setShowConfirmModal(true);
  };

  const executePendingMove = async () => {
    if (!pendingMove) return;
    const { leadId, targetStage, prevStage } = pendingMove;
    const savedComment = comment;

    setShowConfirmModal(false);
    setPendingMove(null);
    setComment("");

    // Optimistic Update
    const prevKanban = { ...kanban };
    setKanban(prev => {
      const updated = { ...prev };
      let foundLead = null;
      for (const stage in updated) {
        const index = updated[stage].findIndex(l => l.id.toString() === leadId.toString());
        if (index !== -1) {
          foundLead = { ...updated[stage][index], stage: targetStage };
          updated[stage] = updated[stage].filter(l => l.id.toString() !== leadId.toString());
          break;
        }
      }
      if (foundLead) {
        updated[targetStage] = [...(updated[targetStage] || []), foundLead];
      }
      return updated;
    });

    try {
      const [uName, uRole] = simulatedUser.split("|");
      await api.updateLeadStage(leadId, targetStage, savedComment, uRole, uName);
      setToast({ msg: `Lead moved to ${targetStage} successfully!`, type: "success" });
      
      // Update state in drawer if open
      if (selectedLead && selectedLead.id === leadId) {
        const updatedLead = { ...selectedLead, stage: targetStage };
        setSelectedLead(updatedLead);
        refreshDrawerData(updatedLead);
      }
      load();
    } catch (err) {
      setToast({ msg: `Transition Failed: ${err.message || err.error || err}`, type: "error" });
      setKanban(prevKanban);
    }
  };

  const refreshDrawerData = async (lead) => {
    setTimelineLoading(true);
    try {
      const data = await api.getLeadTimeline(lead.id);
      setTimelineData(data);
      
      const allCust = await api.getCustomers();
      const match = allCust.find(c => c.phone === lead.phone || (lead.email && c.email === lead.email));
      setMatchedCustomer(match || null);

      if (match) {
        const pmts = await api.getPayments({ customerId: match.id });
        setCustomerPayments(pmts);
        
        const docs = await api.getDocuments({ customerId: match.id });
        setCustomerDocuments(docs);
      } else {
        setCustomerPayments([]);
        setCustomerDocuments([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTimelineLoading(false);
    }
  };

  const handleCardClick = (lead, tab = "info") => {
    setSelectedLead(lead);
    setDrawerTab(tab);
    setIsEditingInfo(false);
    setInfoForm({ ...lead });
    refreshDrawerData(lead);
  };

  const getPriority = (score) => {
    if (score >= 80) return { label: "High", color: C.red };
    if (score >= 50) return { label: "Medium", color: C.blue };
    return { label: "Low", color: C.sub };
  };

  const getNextFollowUp = (lead) => {
    if (lead.siteVisits && lead.siteVisits.length > 0) {
      const v = lead.siteVisits[0];
      return v.visitDate ? v.visitDate.split("T")[0] : "Scheduled";
    }
    if (lead.createdAt) {
      return new Date(new Date(lead.createdAt).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    }
    return "2026-07-09";
  };

  const getStageHeaderIcon = (stage) => {
    switch (stage) {
      case "New Lead": return Target;
      case "Contacted": return Phone;
      case "Follow-up": return Clock;
      case "Site Visit Scheduled": return Calendar;
      case "Site Visit Completed": return Key;
      case "Quotation Sent": return FileText;
      case "Negotiation": return Handshake;
      case "Booking Token Received": return DollarSign;
      case "Booking Confirmed": return Home;
      case "Documentation": return FileText;
      case "Agreement Signed": return Award;
      case "Home Loan Processing": return Clock;
      case "Registration": return CheckSquare;
      case "Closed Won": return Trophy;
      case "Closed Lost": return AlertCircle;
      default: return Target;
    }
  };

  // Flattened leads for global computations
  const allLeads = Object.values(kanban).flat();
  const totalLeadsCount = allLeads.length;
  const newLeadsCount = allLeads.filter(l => l.stage === "New Lead").length;
  
  const todayStr = new Date().toISOString().split("T")[0];
  const todayFollowUpsCount = allLeads.filter(l => getNextFollowUp(l) === todayStr).length;

  const siteVisitsCount = allLeads.reduce((acc, l) => acc + (l.siteVisits?.length || 0), 0);
  const quotationsCount = allLeads.filter(l => l.stage === "Quotation Sent").length;
  const bookingsCount = allLeads.filter(l => l.stage === "Booking Token Received" || l.stage === "Booking Confirmed").length;
  const closedWonCount = allLeads.filter(l => l.stage === "Closed Won").length;
  const closedLostCount = allLeads.filter(l => l.stage === "Closed Lost").length;
  
  const conversionRate = totalLeadsCount 
    ? ((closedWonCount / totalLeadsCount) * 100).toFixed(1) + "%" 
    : "0%";
    
  const revenueGenerated = allLeads
    .filter(l => l.stage === "Closed Won" || l.stage === "Booking Confirmed")
    .reduce((acc, l) => acc + (l.budget || 0), 0);

  const uniqueExecutives = Array.from(new Set(allLeads.map(lead => lead.assignedTo).filter(Boolean)));

  // Info editing save
  const handleSaveInfo = async () => {
    try {
      const updated = await api.updateLead(selectedLead.id, {
        ...selectedLead,
        ...infoForm,
        score: parseInt(infoForm.score || 50),
        budget: parseFloat(infoForm.budget || 0),
        projectId: infoForm.projectId ? parseInt(infoForm.projectId) : null
      });
      setSelectedLead(updated);
      setIsEditingInfo(false);
      setToast({ msg: "Lead info updated successfully!", type: "success" });
      load();
    } catch (e) {
      setToast({ msg: e.message, type: "error" });
    }
  };

  // Follow-up logging
  const handleAddFollowUp = async (e) => {
    e.preventDefault();
    if (!followUpDate || !followUpRemarks) return setToast({ msg: "Fill required fields", type: "error" });
    
    try {
      const [uName, uRole] = simulatedUser.split("|");
      const commentString = `[Follow-up] Scheduled Next Follow-up on ${followUpDate} at ${followUpTime}. Remarks: ${followUpRemarks}`;
      
      const timeStr = followUpTime || "12:00";
      const followUpDateTime = new Date(`${followUpDate}T${timeStr}:00`).toISOString();
      
      await api.updateLeadStage(selectedLead.id, selectedLead.stage, commentString, uRole, uName, followUpDateTime);
      
      setToast({ msg: "Follow-up added to timeline!", type: "success" });
      setFollowUpDate("");
      setFollowUpRemarks("");
      
      // Update selected lead follow-up date locally
      const updatedLead = { ...selectedLead, nextFollowUpDate: followUpDateTime };
      setSelectedLead(updatedLead);
      
      refreshDrawerData(updatedLead);
      load();
    } catch (err) {
      setToast({ msg: err.message, type: "error" });
    }
  };

  // Call logging
  const handleLogCall = async (e) => {
    e.preventDefault();
    if (!callRemarks) return setToast({ msg: "Call notes are required", type: "error" });
    
    try {
      const [uName, uRole] = simulatedUser.split("|");
      const commentString = `[Call Log] ${callType} Call. Duration: ${callDuration}. Remarks: ${callRemarks}`;
      await api.updateLeadStage(selectedLead.id, selectedLead.stage, commentString, uRole, uName);
      
      // Store in local simulated call state
      const leadId = selectedLead.id;
      const newCall = {
        type: callType,
        duration: callDuration,
        dateTime: new Date().toISOString(),
        remarks: callRemarks,
        recording: "recording_" + Math.floor(Math.random() * 10000) + ".mp3"
      };
      setSimulatedCallHistory(prev => ({
        ...prev,
        [leadId]: [...(prev[leadId] || []), newCall]
      }));

      setToast({ msg: "Call logged successfully!", type: "success" });
      setCallRemarks("");
      refreshDrawerData(selectedLead);
      load();
    } catch (err) {
      setToast({ msg: err.message, type: "error" });
    }
  };

  // Site Visit Schedule
  const handleScheduleVisit = async (e) => {
    e.preventDefault();
    if (!visitDate || !visitFeedback) return setToast({ msg: "Please fill date and feedback", type: "error" });

    try {
      await api.createVisit({
        leadId: selectedLead.id,
        projectId: selectedLead.projectId || projects[0]?.id || 1,
        visitDate: new Date(visitDate).toISOString(),
        visitTime: visitTime,
        assignedAgent: selectedLead.assignedTo || "Unassigned",
        interest: selectedLead.interest || "Skyline Heights",
        notes: `Guests: ${visitGuests} | Rating: ${visitRating}/5 stars. Feedback: ${visitFeedback}`,
        status: "Completed"
      });

      setToast({ msg: "Site visit logged successfully!", type: "success" });
      setVisitDate("");
      setVisitFeedback("");
      refreshDrawerData(selectedLead);
      load();
    } catch (err) {
      setToast({ msg: err.message, type: "error" });
    }
  };

  // Document upload
  const handleUploadDoc = async (e) => {
    e.preventDefault();
    if (!matchedCustomer) {
      return setToast({ msg: "No Customer linked. Change stage to Booking Confirmed first.", type: "error" });
    }
    const filename = docName.trim() || `${docType}_Document.pdf`;
    
    try {
      await api.createDocument({
        name: filename,
        documentType: docType,
        customerId: matchedCustomer.id,
        projectId: selectedLead.projectId || 1,
        filePath: `/uploads/docs/${filename.toLowerCase().replace(/\s+/g, "_")}`,
        fileSize: "1.8 MB",
        status: "Signed"
      });

      setToast({ msg: "Document uploaded successfully!", type: "success" });
      setDocName("");
      refreshDrawerData(selectedLead);
    } catch (err) {
      setToast({ msg: err.message, type: "error" });
    }
  };

  // Quotation Sent
  const handleGenerateQuote = async (e) => {
    e.preventDefault();
    if (!quoteAmount) return setToast({ msg: "Amount is required", type: "error" });

    try {
      const qNo = `QT-${new Date().getFullYear()}-${Math.floor(Math.random() * 89999 + 10000)}`;
      const amt = parseFloat(quoteAmount);
      const disc = parseFloat(quoteDiscount || 0);
      const finalAmt = amt - (amt * disc / 100);

      const [uName, uRole] = simulatedUser.split("|");
      const commentString = `[Quotation Sent] Generated Quote ${qNo} for ₹${finalAmt.toLocaleString("en-IN")} (Discount: ${disc}%).`;
      await api.updateLeadStage(selectedLead.id, "Quotation Sent", commentString, uRole, uName);
      
      setQuoteHistory(prev => ({
        ...prev,
        [selectedLead.id]: {
          quoteNo: qNo,
          amount: amt,
          discount: disc,
          finalAmount: finalAmt,
          date: new Date().toISOString()
        }
      }));

      // Set lead status to Quotation Sent
      const updatedLead = { ...selectedLead, stage: "Quotation Sent" };
      setSelectedLead(updatedLead);

      setToast({ msg: "Quotation sent and logged successfully!", type: "success" });
      setQuoteAmount("");
      refreshDrawerData(updatedLead);
      load();
    } catch (err) {
      setToast({ msg: err.message, type: "error" });
    }
  };

  const handleDownloadQuotationPDF = (quote) => {
    // Simulated PDF Download
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(quote, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href",     dataStr     );
    dlAnchorElem.setAttribute("download", `${quote.quoteNo}.json`);
    dlAnchorElem.click();
    setToast({ msg: "Simulated Quotation PDF downloaded!", type: "success" });
  };

  // Add Payment
  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!matchedCustomer) {
      return setToast({ msg: "No Customer linked. Change stage to Booking Confirmed first.", type: "error" });
    }
    if (!payAmount) return setToast({ msg: "Payment Amount is required", type: "error" });

    try {
      await api.createPayment({
        customerId: matchedCustomer.id,
        amount: parseFloat(payAmount),
        paymentMode: payMode,
        status: "Received",
        remarks: payRemarks || "Payment logged from lead pipeline",
        attachmentUrl: payTxnId ? `TXN-${payTxnId}` : `TXN-${Date.now()}`
      });

      setToast({ msg: "Payment processed successfully!", type: "success" });
      setPayAmount("");
      setPayTxnId("");
      setPayRemarks("");
      refreshDrawerData(selectedLead);
      load();
    } catch (err) {
      setToast({ msg: err.message, type: "error" });
    }
  };

  // Add Note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      const [uName, uRole] = simulatedUser.split("|");
      const commentString = `[Note Logged] ${newNote}`;
      await api.updateLeadStage(selectedLead.id, selectedLead.stage, commentString, uRole, uName);
      
      setToast({ msg: "Note logged!", type: "success" });
      setNewNote("");
      refreshDrawerData(selectedLead);
    } catch (err) {
      setToast({ msg: err.message, type: "error" });
    }
  };

  // Get filtered leads
  const isToday = (dateStr, stage) => {
    if (!dateStr || stage === "Closed Won" || stage === "Closed Lost" || stage === "Cancelled") return false;
    const d = new Date(dateStr);
    const today = new Date();
    return d.getFullYear() === today.getFullYear() &&
           d.getMonth() === today.getMonth() &&
           d.getDate() === today.getDate();
  };

  const isOverdue = (dateStr, stage) => {
    if (!dateStr || stage === "Closed Won" || stage === "Closed Lost" || stage === "Cancelled") return false;
    const d = new Date(dateStr);
    const today = new Date();
    const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return dDate < todayDate;
  };

  const getFilteredLeadsForStage = (stage) => {
    const rawLeads = kanban[stage] || [];
    return rawLeads.filter(lead => {
      // 1. Search text filter
      const matchesSearch = 
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm) ||
        (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.interest && lead.interest.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.assignedTo && lead.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // 2. Project filter
      const matchesProject = projectFilter === "All Projects" || (lead.project?.name === projectFilter);
      
      // 3. Executive filter
      const matchesExecutive = executiveFilter === "All Executives" || (lead.assignedTo === executiveFilter);
      
      // 4. Source filter
      const matchesSource = sourceFilter === "All Sources" || (lead.source === sourceFilter);
      
      // 5. Priority filter
      const prio = getPriority(lead.score);
      const matchesPriority = priorityFilter === "All Priorities" || (prio.label === priorityFilter);
      
      // 6. Budget filter
      let matchesBudget = true;
      if (budgetFilter !== "All Budgets") {
        const amt = lead.budget || 0;
        if (budgetFilter === "Under 50L") matchesBudget = amt < 5000000;
        else if (budgetFilter === "50L - 1Cr") matchesBudget = amt >= 5000000 && amt <= 10000000;
        else if (budgetFilter === "1Cr - 2Cr") matchesBudget = amt >= 10000000 && amt <= 20000000;
        else if (budgetFilter === "2Cr+") matchesBudget = amt > 20000000;
      }

      // 7. Date Range Filter
      let matchesDate = true;
      if (startDate) {
        const start = new Date(startDate);
        const created = new Date(lead.createdAt);
        matchesDate = matchesDate && created >= start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        const created = new Date(lead.createdAt);
        matchesDate = matchesDate && created <= end;
      }

      // 8. Quick activity filters
      let matchesTodayFollowUp = true;
      if (filterTodayFollowUp) {
        matchesTodayFollowUp = lead.nextFollowUpDate && isToday(lead.nextFollowUpDate, lead.stage);
      }
      
      let matchesOverdue = true;
      if (filterOverdue) {
        matchesOverdue = lead.nextFollowUpDate && isOverdue(lead.nextFollowUpDate, lead.stage);
      }
      
      let matchesSiteVisitToday = true;
      if (filterSiteVisitToday) {
        matchesSiteVisitToday = lead.siteVisits && lead.siteVisits.some(v => v.visitDate && isToday(v.visitDate, lead.stage));
      }
      
      let matchesHighProb = true;
      if (filterHighProb) {
        matchesHighProb = lead.score >= 80;
      }

      return matchesSearch && matchesProject && matchesExecutive && matchesSource && matchesPriority && matchesBudget && matchesDate && matchesTodayFollowUp && matchesOverdue && matchesSiteVisitToday && matchesHighProb;
    });
  };



  const handleStatusChange = (lead, targetStage) => {
    if (lead.stage === targetStage) return;
    setPendingMove({
      leadId: lead.id,
      leadName: lead.name,
      prevStage: lead.stage,
      targetStage: targetStage
    });
    setComment("");
    setShowConfirmModal(true);
  };

  // Get last updated timestamp from logs or lead
  const getLastUpdatedTime = (lead) => {
    if (timelineData && timelineData.length > 0) {
      const dates = timelineData.map(t => new Date(t.dateTime));
      const maxDate = new Date(Math.max(...dates));
      return maxDate.toLocaleDateString("en-IN") + " " + maxDate.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' });
    }
    return new Date(lead.createdAt).toLocaleDateString("en-IN");
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState msg={error} onRetry={load} />;  return (
    <div className="fi" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", boxSizing: "border-box", overflow: "hidden" }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      {/* ─── FIXED HEADER & STICKY FILTER BAR ─────────────────────────── */}
      <div style={{ flexShrink: 0, paddingBottom: 8, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <STitle title="Lead Pipeline" sub={`CRM Kanban Board · ${totalLeadsCount} Leads`} />
          
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Simulated User Selector matching constraints */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.raise, padding: "4px 10px", borderRadius: 8, border: `1px solid ${C.bord}` }}>
              <span style={{ fontSize: 11, color: C.sub, fontWeight: 600 }}>Simulate Performer:</span>
              <select 
                value={simulatedUser} 
                onChange={(e) => setSimulatedUser(e.target.value)} 
                style={{ background: "transparent", border: "none", color: C.gold, fontSize: 11, fontWeight: 700, outline: "none", cursor: "pointer" }}
              >
                <option value="Arjun Kapoor|Super Admin" style={{background:C.bg}}>Arjun Kapoor (Admin)</option>
                <option value="Amit Kumar|Manager" style={{background:C.bg}}>Amit Kumar (Manager)</option>
                <option value="Priya Mehta|Sales Agent" style={{background:C.bg}}>Priya Mehta (Sales Agent)</option>
                <option value="Vikram Sen|Support Agent" style={{background:C.bg}}>Vikram Sen (Support)</option>
              </select>
            </div>
            <Btn icon={Plus} onClick={() => setShowModal(true)}>Add Lead</Btn>
          </div>
        </div>

        {/* KPI Cards Dashboard (Move to Top) */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", 
          gap: 10,
          margin: "4px 0"
        }}>
          <div style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8, flex: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${C.blue}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Users size={14} color={C.blue} /></div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 9.5, color: C.sub, fontWeight: 600, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>Total Leads</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.txt }}>{totalLeadsCount}</div>
            </div>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8, flex: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${C.sub}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Target size={14} color={C.sub} /></div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 9.5, color: C.sub, fontWeight: 600, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>New</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.txt }}>{newLeadsCount}</div>
            </div>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8, flex: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${C.amb}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Clock size={14} color={C.amb} /></div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 9.5, color: C.sub, fontWeight: 600, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>Today's Follow-ups</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.txt }}>{todayFollowUpsCount}</div>
            </div>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8, flex: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${C.teal}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><MapPin size={14} color={C.teal} /></div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 9.5, color: C.sub, fontWeight: 600, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>Site Visits</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.txt }}>{siteVisitsCount}</div>
            </div>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8, flex: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${C.blue}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Home size={14} color={C.blue} /></div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 9.5, color: C.sub, fontWeight: 600, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>Bookings</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.txt }}>{bookingsCount}</div>
            </div>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8, flex: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${C.gold}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><DollarSign size={14} color={C.gold} /></div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 9.5, color: C.sub, fontWeight: 600, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>Revenue</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.gold }}>{fmtCr(revenueGenerated)}</div>
            </div>
          </div>
        </div>

        {/* Sticky Filters row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap", background: C.raise, padding: "8px 12px", borderRadius: 10, border: `1px solid ${C.bord}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 260 }}>
            {/* Search Input */}
            <div style={{ position: "relative", flex: 1, minWidth: 150 }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.mute }} />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%", background: C.card, border: `1px solid ${C.bord}`, borderRadius: 8,
                  padding: "6px 12px 6px 30px", color: C.txt, outline: "none", fontSize: 13, boxSizing: "border-box"
                }}
              />
            </div>
            
            {/* Project Filter */}
            <div style={{ width: 130 }}>
              <Select
                value={projectFilter}
                onChange={(val) => setProjectFilter(val)}
                options={[{ value: "All Projects", label: "Project ▼" }, ...projects.map(p => ({ value: p.name, label: p.name }))] }
              />
            </div>

            {/* Executive Filter */}
            <div style={{ width: 130 }}>
              <Select
                value={executiveFilter}
                onChange={(val) => setExecutiveFilter(val)}
                options={[{ value: "All Executives", label: "Executive ▼" }, ...uniqueExecutives.map(e => ({ value: e, label: e }))] }
              />
            </div>

            {/* Status Filter */}
            <div style={{ width: 130 }}>
              <Select
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                options={[{ value: "All Statuses", label: "Status ▼" }, ...stages.map(s => ({ value: s, label: s }))] }
              />
            </div>
          </div>

          {/* Quick Buttons */}
          <div style={{ display: "flex", gap: 6 }}>
            <Btn 
              v={showAdvancedFilters ? "primary" : "outline"} 
              icon={Filter} 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              Advanced Filters
            </Btn>
            

          </div>
        </div>

        {/* Collapsible Advanced Filters panel */}
        {showAdvancedFilters && (
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 12, 
            flexWrap: "wrap",
            background: C.raise,
            border: `1px solid ${C.bord}`,
            borderRadius: 10,
            padding: "10px 14px",
            boxShadow: "inset 0 1px 3px rgba(0,0,0,0.03)"
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.sub }}>Advanced Filters:</span>
            
            {/* Source Filter */}
            <div style={{ width: 130 }}>
              <Select
                value={sourceFilter}
                onChange={(val) => setSourceFilter(val)}
                options={[{ value: "All Sources", label: "Source: All" }, ...sources.map(s => ({ value: s, label: s }))] }
              />
            </div>

            {/* Priority Filter */}
            <div style={{ width: 130 }}>
              <Select
                value={priorityFilter}
                onChange={(val) => setPriorityFilter(val)}
                options={[
                  { value: "All Priorities", label: "Priority: All" },
                  { value: "High", label: "High" },
                  { value: "Medium", label: "Medium" },
                  { value: "Low", label: "Low" }
                ]}
              />
            </div>

            {/* Budget Filter */}
            <div style={{ width: 130 }}>
              <Select
                value={budgetFilter}
                onChange={(val) => setBudgetFilter(val)}
                options={[
                  { value: "All Budgets", label: "Budget: All" },
                  { value: "Under 50L", label: "Under 50L" },
                  { value: "50L - 1Cr", label: "50L - 1Cr" },
                  { value: "1Cr - 2Cr", label: "1Cr - 2Cr" },
                  { value: "2Cr+", label: "2Cr+" }
                ]}
              />
            </div>

            {/* Date range picker */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, background: C.card, border: `1px solid ${C.bord}`, borderRadius: 8, padding: "3px 8px", height: 32, boxSizing: "border-box" }}>
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                style={{ background: "transparent", border: "none", color: C.txt, fontSize: 11, outline: "none" }}
              />
              <span style={{ fontSize: 11, color: C.mute }}>to</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
                style={{ background: "transparent", border: "none", color: C.txt, fontSize: 11, outline: "none" }}
              />
              {(startDate || endDate) && (
                <X size={12} color={C.mute} style={{ cursor: "pointer" }} onClick={() => { setStartDate(""); setEndDate(""); }} />
              )}
            </div>

            {/* Quick filter pills */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", borderLeft: `1px solid ${C.bord}`, paddingLeft: 12 }}>
              <button 
                type="button"
                onClick={() => setFilterTodayFollowUp(!filterTodayFollowUp)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  background: filterTodayFollowUp ? `${C.amb}18` : C.card,
                  border: `1px solid ${filterTodayFollowUp ? C.amb : C.bord}`,
                  color: filterTodayFollowUp ? C.amb : C.sub,
                  borderRadius: 8, padding: "4px 8px", fontSize: 10.5, fontWeight: 700,
                  cursor: "pointer", transition: "all 0.15s"
                }}
              >
                <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: C.amb }}></span>
                Follow-up Today
              </button>
              
              <button 
                type="button"
                onClick={() => setFilterOverdue(!filterOverdue)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  background: filterOverdue ? `${C.red}18` : C.card,
                  border: `1px solid ${filterOverdue ? C.red : C.bord}`,
                  color: filterOverdue ? C.red : C.sub,
                  borderRadius: 8, padding: "4px 8px", fontSize: 10.5, fontWeight: 700,
                  cursor: "pointer", transition: "all 0.15s"
                }}
              >
                <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: C.red }}></span>
                Overdue
              </button>

              <button 
                type="button"
                onClick={() => setFilterSiteVisitToday(!filterSiteVisitToday)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  background: filterSiteVisitToday ? `${C.teal}18` : C.card,
                  border: `1px solid ${filterSiteVisitToday ? C.teal : C.bord}`,
                  color: filterSiteVisitToday ? C.teal : C.sub,
                  borderRadius: 8, padding: "4px 8px", fontSize: 10.5, fontWeight: 700,
                  cursor: "pointer", transition: "all 0.15s"
                }}
              >
                <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: C.teal }}></span>
                Visit Today
              </button>

              <button 
                type="button"
                onClick={() => setFilterHighProb(!filterHighProb)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  background: filterHighProb ? `${C.gold}18` : C.card,
                  border: `1px solid ${filterHighProb ? C.gold : C.bord}`,
                  color: filterHighProb ? C.gold : C.sub,
                  borderRadius: 8, padding: "4px 8px", fontSize: 10.5, fontWeight: 700,
                  cursor: "pointer", transition: "all 0.15s"
                }}
              >
                <span style={{ color: C.gold, fontSize: 10 }}>★</span>
                High Prob
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── MAIN CRM WORKSPACE CONTAINER (Flexbox for Board + Collapsible My Day Sidebar) ─── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative", gap: 12, width: "100%", boxSizing: "border-box" }}>
        
        {/* Kanban Board Container (Left Side) */}
        <div style={{ 
          flex: 1, 
          display: "flex", 
          gap: 12, 
          overflowX: "auto", 
          overflowY: "auto",
          padding: "12px 0 12px 2px", 
          height: "100%",
          boxSizing: "border-box"
        }}>
          {stages.filter(stage => statusFilter === "All Statuses" || stage === statusFilter).map(stage => {
            const sl = getFilteredLeadsForStage(stage);
            const HeaderIcon = getStageHeaderIcon(stage);
            const isCollapsed = !!collapsedStages[stage];
            
            if (isCollapsed) {
              return (
                <div 
                  key={stage} 
                  style={{ 
                    minWidth: 44, 
                    width: "44px", 
                    flexShrink: 0, 
                    display: "flex", 
                    flexDirection: "column", 
                    alignItems: "center",
                    gap: 12,
                    height: "100%",
                    background: `${C.raise}60`,
                    border: `1px solid ${C.bord}`,
                    borderRadius: 12,
                    padding: "12px 4px",
                    boxSizing: "border-box",
                    cursor: "pointer",
                    position: "relative"
                  }}
                  onClick={() => toggleStageCollapse(stage)}
                  title={`Expand ${stage} column`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStageCollapse(stage);
                    }}
                    style={{ background: "transparent", border: "none", color: C.sub, cursor: "pointer", display: "flex", padding: 2 }}
                  >
                    <ChevronRight size={14} />
                  </button>

                  <span style={{ 
                    background: SC[stage] || C.blue, 
                    display: "inline-block", 
                    width: 8, 
                    height: 8, 
                    borderRadius: "50%" 
                  }} />

                  <div style={{
                    writingMode: "vertical-rl",
                    textOrientation: "mixed",
                    color: C.txt,
                    fontSize: 11,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    transform: "rotate(180deg)",
                    margin: "10px 0"
                  }}>
                    {stage}
                  </div>

                  <span style={{ 
                    background: C.card, 
                    border: `1px solid ${C.bord}`,
                    color: C.sub, 
                    fontSize: 9.5, 
                    padding: "2px 6px", 
                    borderRadius: 8, 
                    fontWeight: 700,
                    marginTop: "auto"
                  }}>
                    {sl.length}
                  </span>
                </div>
              );
            }

            return (
              <div 
                key={stage} 
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage)}
                style={{ 
                  minWidth: 260, 
                  width: "260px", 
                  flexShrink: 0, 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: 10,
                  height: "fit-content",
                  boxSizing: "border-box",
                  background: `${C.raise}30`,
                  borderRadius: 12,
                  padding: 6
                }}
              >
                {/* Stage Header - Fixed inside Column */}
                <div style={{
                  background: C.card, border: `1px solid ${C.bord}`, borderRadius: 10,
                  padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center",
                  flexShrink: 0, borderTop: `3px solid ${SC[stage] || C.blue}`
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                    {HeaderIcon && <HeaderIcon size={12} color={SC[stage] || C.blue} style={{ flexShrink: 0 }} />}
                    <span style={{ color: C.txt, fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={stage}>{stage}</span>
                    <span style={{ background: `${SC[stage]}12`, color: SC[stage] || C.blue, fontSize: 10, padding: "1px 6px", borderRadius: 8, fontWeight: 700 }}>
                      {sl.length}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStageCollapse(stage);
                    }}
                    style={{ background: "transparent", border: "none", color: C.mute, cursor: "pointer", display: "flex", padding: 2 }}
                    title="Collapse column"
                  >
                    <ChevronLeft size={13} />
                  </button>
                </div>

                {/* Column Progress Bar */}
                <div style={{ padding: "0 4px" }}>
                  {renderProgress(stage)}
                </div>

                {/* Column Cards List - no inner scrollbar */}
                <div style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: 10, 
                  overflow: "visible", 
                  flex: 1, 
                  padding: "2px",
                  boxSizing: "border-box"
                }}>
                  {sl.map(lead => {
                    const prio = getPriority(lead.score);
                    return (
                      <div 
                        key={lead.id} 
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead)}
                        onClick={() => handleCardClick(lead, "info")}
                        style={{
                          background: C.card, 
                          border: `1px solid ${C.bord}`,
                          borderLeft: `4px solid ${prio.color}`,
                          borderRadius: 12, padding: "12px", cursor: "pointer",
                          display: "flex", flexDirection: "column", gap: 8, transition: "transform 0.15s, box-shadow 0.15s",
                          width: "100%", boxSizing: "border-box", position: "relative"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-1.5px)";
                          e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.06)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "none";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        {/* Header Row */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 9.5, color: C.mute, fontWeight: 700 }}>#{lead.id}</span>
                          <span style={{ 
                            fontSize: 9, 
                            fontWeight: 800, 
                            color: prio.color,
                            background: `${prio.color}15`,
                            padding: "2px 6px",
                            borderRadius: 4
                          }}>
                            {prio.label}
                          </span>
                        </div>

                        {/* Lead Name */}
                        <div style={{ color: C.txt, fontWeight: 800, fontSize: 13, wordBreak: "break-word", lineHeight: 1.2 }}>
                          {lead.name}
                        </div>

                        {/* Project and Budget Line */}
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.sub }}>
                          <span style={{ color: C.gold, fontWeight: 700 }}>₹{fmtCr(lead.budget)}</span>
                          <span style={{ color: C.mute }}>·</span>
                          <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {lead.project?.name || "General"}
                          </span>
                        </div>

                        {/* Representative and Phone */}
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, color: C.mute, flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 600, color: C.sub }}>{lead.assignedTo || "Unassigned"}</span>
                          <span>·</span>
                          <span>{lead.phone}</span>
                        </div>

                        {/* Next Activity Indicator */}
                        {lead.nextFollowUpDate && (
                          <div style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            gap: 4, 
                            fontSize: 9.5, 
                            fontWeight: 700, 
                            color: isOverdue(lead.nextFollowUpDate, lead.stage) ? C.red : isToday(lead.nextFollowUpDate, lead.stage) ? C.amb : C.sub,
                            marginTop: 2
                          }}>
                            <Calendar size={10} />
                            <span>Next: {formatFollowUpDate(lead.nextFollowUpDate)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {sl.length === 0 && (
                    <div style={{
                      color: C.mute, fontSize: 11, textAlign: "center", padding: "30px 10px",
                      border: `1px dashed ${C.bord}`, borderRadius: 10, background: C.card
                    }}>
                      Empty Column
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── ADD NEW LEAD MODAL ───────────────────────────────────────── */}
      {showModal && (
        <Modal title="Add New Lead" onClose={() => setShowModal(false)} width={560}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Full Name" required><Input value={form.name} onChange={f("name")} placeholder="e.g. Rahul Sharma" /></Field>
            <Field label="Phone" required><Input value={form.phone} onChange={f("phone")} placeholder="98XXXXXXXX" /></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={f("email")} placeholder="email@example.com" /></Field>
            <Field label="Source">
              <Select value={form.source} onChange={f("source")} options={sources} />
            </Field>
            <Field label="Project Interest">
              <Select value={form.projectId} onChange={f("projectId")} placeholder="Select Project"
                options={projects.map(p => ({ value: p.id, label: p.name }))} />
            </Field>
            <Field label="Assigned To"><Input value={form.assignedTo} onChange={f("assignedTo")} placeholder="Agent name" /></Field>
            <Field label="Budget (₹)"><Input type="number" value={form.budget} onChange={f("budget")} placeholder="12000000" /></Field>
            <Field label="Score (0-100)"><Input type="number" value={form.score} onChange={f("score")} placeholder="50" /></Field>
            <div style={{ gridColumn: "1/-1" }}>
              <Field label="Interest Description"><Input value={form.interest} onChange={f("interest")} placeholder="e.g. Skyline Heights 3BHK" /></Field>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.bord}` }}>
            <Btn v="outline" onClick={() => setShowModal(false)}>Cancel</Btn>
            <Btn onClick={handleSubmit} disabled={saving} icon={saving ? Loader2 : Plus}>{saving ? "Adding..." : "Add Lead"}</Btn>
          </div>
        </Modal>
      )}

      {/* ─── CONFIRM STAGE TRANSITION MODAL ───────────────────────────── */}
      {showConfirmModal && pendingMove && (() => {
        const PrevIcon = getStageHeaderIcon(pendingMove.prevStage);
        const TargetIcon = getStageHeaderIcon(pendingMove.targetStage);
        const prevColor = SC[pendingMove.prevStage] || C.sub;
        const targetColor = SC[pendingMove.targetStage] || C.sub;

        return (
          <Modal 
            title="Confirm Stage Transition" 
            onClose={() => {
              setShowConfirmModal(false);
              setPendingMove(null);
              setComment("");
            }} 
            width={450}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Lead Name */}
              <div>
                <div style={{ fontSize: 10, color: C.mute, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 2 }}>Lead</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.txt }}>{pendingMove.leadName}</div>
              </div>

              {/* Stage Transition Visualizer */}
              <div style={{ 
                background: C.raise, 
                border: `1px solid ${C.bord}`, 
                borderRadius: 8, 
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4
              }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <span style={{ fontSize: 8.5, color: C.mute, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>From</span>
                  <span style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 6, 
                    fontSize: 12.5, 
                    fontWeight: 700, 
                    color: C.txt 
                  }}>
                    <span style={{ display: "inline-flex", width: 6, height: 6, borderRadius: "50%", background: prevColor }}></span>
                    <PrevIcon size={13} style={{ color: prevColor }} />
                    {pendingMove.prevStage}
                  </span>
                </div>
                
                <div style={{ color: C.mute, fontSize: 13, margin: "2px 0" }}>↓</div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <span style={{ fontSize: 8.5, color: C.mute, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>To</span>
                  <span style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 6, 
                    fontSize: 12.5, 
                    fontWeight: 700, 
                    color: C.txt 
                  }}>
                    <span style={{ display: "inline-flex", width: 6, height: 6, borderRadius: "50%", background: targetColor }}></span>
                    <TargetIcon size={13} style={{ color: targetColor }} />
                    {pendingMove.targetStage}
                  </span>
                </div>
              </div>

              {/* Impact Section */}
              <div>
                <div style={{ fontSize: 10, color: C.mute, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6 }}>This will:</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 2 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: C.sub }}>
                    <Check size={13} style={{ color: C.teal, flexShrink: 0 }} />
                    <span>Update lead stage to <strong>{pendingMove.targetStage}</strong></span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: C.sub }}>
                    <Check size={13} style={{ color: C.teal, flexShrink: 0 }} />
                    <span>Record timeline activity audit trail</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: C.sub }}>
                    <Check size={13} style={{ color: C.teal, flexShrink: 0 }} />
                    <span>Notify assigned sales executives & managers</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: C.sub }}>
                    <Check size={13} style={{ color: C.teal, flexShrink: 0 }} />
                    <span>Trigger real-time automation rules</span>
                  </div>
                </div>
              </div>

              {/* Acting User Selection */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontSize: 10, color: C.mute, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase" }}>Perform Action As</div>
                <Select 
                  value={simulatedUser} 
                  onChange={(val) => setSimulatedUser(val)} 
                  options={[
                    { value: "Arjun Kapoor|Super Admin", label: "Arjun Kapoor (Super Admin)" },
                    { value: "Amit Kumar|Manager", label: "Amit Kumar (Manager)" },
                    { value: "Priya Mehta|Sales Agent", label: "Priya Mehta (Sales Agent)" },
                    { value: "Vikram Sen|Support Agent", label: "Vikram Sen (Support Agent)" }
                  ]}
                />
              </div>

              {/* Comments Field */}
              <Field 
                label={isCommentRequired(pendingMove.prevStage, pendingMove.targetStage) ? "Reason / Comments (Required)" : "Reason / Comments (Optional)"} 
                required={isCommentRequired(pendingMove.prevStage, pendingMove.targetStage)}
              >
                <Input 
                  value={comment} 
                  onChange={(val) => setComment(val)} 
                  placeholder={isCommentRequired(pendingMove.prevStage, pendingMove.targetStage) ? "A comment is required for reverting or closing leads..." : "Add comments for this transition..."}
                />
              </Field>

              {isCommentRequired(pendingMove.prevStage, pendingMove.targetStage) && !comment.trim() && (
                <div style={{ color: C.red, fontSize: 11, fontWeight: 700, marginTop: -6 }}>
                  * Reason comment is mandatory when reverting stage or closing/cancelling a lead.
                </div>
              )}

              {/* Log warning */}
              <div style={{ 
                fontSize: 10.5, 
                color: C.mute, 
                display: "flex", 
                alignItems: "center", 
                gap: 6,
                borderTop: `1px solid ${C.bord}`,
                paddingTop: 12,
                marginTop: 2
              }}>
                <AlertCircle size={13} style={{ color: C.gold, flexShrink: 0 }} />
                <span>This action will be recorded in the audit log.</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.bord}` }}>
              <Btn v="outline" onClick={() => {
                setShowConfirmModal(false);
                setPendingMove(null);
                setComment("");
              }}>Cancel</Btn>
              <Btn 
                onClick={executePendingMove} 
                disabled={isCommentRequired(pendingMove.prevStage, pendingMove.targetStage) && !comment.trim()}
              >
                Confirm Transition
              </Btn>
            </div>
          </Modal>
        );
      })()}

      {/* ─── SLIDING DRAWER (42% Width) ────────────────────────────────── */}
      <div 
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, left: 0,
          background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2.5px)", zIndex: 1000, 
          visibility: selectedLead ? "visible" : "hidden",
          opacity: selectedLead ? 1 : 0,
          transition: "opacity 0.25s ease",
          display: "flex", justifyContent: "flex-end"
        }} 
        onClick={() => setSelectedLead(null)}
      >
        <div 
          style={{
            width: "42%", minWidth: 460, height: "100%", background: C.side,
            borderLeft: `1px solid ${C.bord}`, display: "flex", flexDirection: "column",
            boxSizing: "border-box", transform: selectedLead ? "translateX(0)" : "translateX(100%)",
            transition: "transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)", position: "relative"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {selectedLead && (
            <>
              {/* Drawer Header */}
              <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.bord}`, flexShrink: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: 10, color: C.gold, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>Lead Management Portal</span>
                    <h2 style={{ color: C.txt, fontSize: 18, fontWeight: 800, marginTop: 2 }}>{selectedLead.name}</h2>
                    <span style={{ fontSize: 11, color: C.sub }}>Lead ID: #{selectedLead.id} · Priority: {getPriority(selectedLead.score).label}</span>
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <a href={`tel:${selectedLead.phone}`} title="Call Customer" style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 6, background: `${C.teal}12`, border: `1px solid ${C.teal}22`, fontSize: 11, color: C.teal, fontWeight: 700, textDecoration: "none" }}>
                        <Phone size={11} /> Call
                      </a>
                      <a href={`https://api.whatsapp.com/send?phone=${selectedLead.phone}`} target="_blank" rel="noreferrer" title="WhatsApp" style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 6, background: `${C.teal}12`, border: `1px solid ${C.teal}22`, fontSize: 11, color: C.teal, fontWeight: 700, textDecoration: "none" }}>
                        <MessageCircle size={11} /> WhatsApp
                      </a>
                      {selectedLead.email && (
                        <a href={`mailto:${selectedLead.email}`} title="Email Customer" style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 6, background: `${C.blue}12`, border: `1px solid ${C.blue}22`, fontSize: 11, color: C.blue, fontWeight: 700, textDecoration: "none" }}>
                          <Mail size={11} color={C.blue} /> Email
                        </a>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setSelectedLead(null)} style={{ background: C.raise, border: `1px solid ${C.bord}`, borderRadius: "50%", padding: 6, color: C.txt, cursor: "pointer" }}><X size={16} /></button>
                </div>

                {/* Status Dropdown inside Drawer */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.raise, padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.bord}` }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.sub }}>Change Status:</span>
                  <div style={{ flex: 1 }}>
                    <select
                      value={selectedLead.stage}
                      onChange={(e) => handleStatusChange(selectedLead, e.target.value)}
                      style={{
                        width: "100%", background: C.card, border: `1px solid ${C.bord}`, borderRadius: 6,
                        color: C.txt, fontSize: 12, padding: "4px 8px", outline: "none", cursor: "pointer"
                      }}
                    >
                      {stages.map(stg => (
                        <option key={stg} value={stg} style={{ background: C.bg }}>{stg}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Drawer Tabs Bar */}
              <div style={{ display: "flex", flexWrap: "wrap", borderBottom: `1px solid ${C.bord}`, background: C.raise, flexShrink: 0, padding: "6px 12px", gap: "4px" }}>
                {[
                  { id: "info", label: "Info", icon: User },
                  { id: "timeline", label: "Timeline", icon: Clock },
                  { id: "followups", label: "Follow-ups", icon: Calendar },
                  { id: "calls", label: "Calls", icon: Phone },
                  { id: "visits", label: "Visits", icon: MapPin },
                  { id: "docs", label: "Docs", icon: FileText },
                  { id: "quote", label: "Quotes", icon: FileText },
                  { id: "payments", label: "Payments", icon: CreditCard },
                  { id: "notes", label: "Notes", icon: MessageSquare }
                ].map(tab => {
                  const TabIcon = tab.icon;
                  const active = drawerTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setDrawerTab(tab.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", border: "none",
                        background: active ? C.blue : "transparent",
                        color: active ? "#ffffff" : C.sub, 
                        fontSize: 11, fontWeight: 700,
                        borderRadius: 6, cursor: "pointer",
                        transition: "all 0.15s"
                      }}
                    >
                      <TabIcon size={11} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Drawer Content Body (Scrollable) */}
              <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", boxSizing: "border-box" }}>
                
                {/* 1. LEAD INFO TAB */}
                {drawerTab === "info" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h3 style={{ fontSize: 13, fontWeight: 700, color: C.txt }}>Lead Profile Information</h3>
                      {!isEditingInfo ? (
                        <Btn size="sm" icon={Edit} onClick={() => setIsEditingInfo(true)}>Edit Details</Btn>
                      ) : (
                        <div style={{ display: "flex", gap: 6 }}>
                          <Btn size="sm" v="outline" onClick={() => setIsEditingInfo(false)}>Cancel</Btn>
                          <Btn size="sm" icon={Check} onClick={handleSaveInfo}>Save</Btn>
                        </div>
                      )}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <Field label="Full Name">
                        <Input value={infoForm.name || ""} disabled={!isEditingInfo} onChange={val => setInfoForm(p => ({ ...p, name: val }))} />
                      </Field>
                      <Field label="Mobile / Phone">
                        <Input value={infoForm.phone || ""} disabled={!isEditingInfo} onChange={val => setInfoForm(p => ({ ...p, phone: val }))} />
                      </Field>
                      <Field label="Email Address">
                        <Input type="email" value={infoForm.email || ""} disabled={!isEditingInfo} onChange={val => setInfoForm(p => ({ ...p, email: val }))} />
                      </Field>
                      <Field label="Lead Source">
                        <select 
                          value={infoForm.source || ""} 
                          disabled={!isEditingInfo}
                          onChange={e => setInfoForm(p => ({ ...p, source: e.target.value }))}
                          style={{ width: "100%", background: C.card, border: `1px solid ${C.bord}`, borderRadius: 6, color: C.txt, padding: 8 }}
                        >
                          {sources.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </Field>
                      <Field label="Project Interest">
                        <select 
                          value={infoForm.projectId || ""} 
                          disabled={!isEditingInfo}
                          onChange={e => setInfoForm(p => ({ ...p, projectId: e.target.value }))}
                          style={{ width: "100%", background: C.card, border: `1px solid ${C.bord}`, borderRadius: 6, color: C.txt, padding: 8 }}
                        >
                          <option value="">Select Project</option>
                          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </Field>
                      <Field label="Unit Preference">
                        <Input value={infoForm.interest || ""} disabled={!isEditingInfo} onChange={val => setInfoForm(p => ({ ...p, interest: val }))} />
                      </Field>
                      <Field label="Budget (₹)">
                        <Input type="number" value={infoForm.budget || ""} disabled={!isEditingInfo} onChange={val => setInfoForm(p => ({ ...p, budget: val }))} />
                      </Field>
                      <Field label="Lead Score (0-100)">
                        <Input type="number" value={infoForm.score || ""} disabled={!isEditingInfo} onChange={val => setInfoForm(p => ({ ...p, score: val }))} />
                      </Field>
                      <Field label="Assigned Executive">
                        <Input value={infoForm.assignedTo || ""} disabled={!isEditingInfo} onChange={val => setInfoForm(p => ({ ...p, assignedTo: val }))} />
                      </Field>
                      <Field label="Created Date">
                        <Input value={new Date(selectedLead.createdAt).toLocaleString("en-IN")} disabled />
                      </Field>
                      <Field label="Last Updated">
                        <Input value={getLastUpdatedTime(selectedLead)} disabled />
                      </Field>
                    </div>
                  </div>
                )}

                {/* 2. TIMELINE TAB */}
                {drawerTab === "timeline" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: C.txt }}>CRM Audit Timeline Logs</h3>
                    
                    {timelineLoading ? (
                      <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Loader2 className="spin" color={C.gold} /></div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", position: "relative", paddingLeft: 18 }}>
                        <div style={{ position: "absolute", left: 6, top: 8, bottom: 8, width: 2, background: C.bord }} />
                        {timelineData.map((log, i) => (
                          <div key={i} style={{ position: "relative", marginBottom: 16 }}>
                            <div style={{
                              position: "absolute", left: -18, top: 2, width: 14, height: 14, borderRadius: "50%",
                              background: C.raise, border: `2px solid ${C.bord}`, display: "flex", alignItems: "center",
                              justifyContent: "center", fontSize: 9, zIndex: 1
                            }}>
                              {log.icon || "🎯"}
                            </div>
                            <div style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 8, padding: 10 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                                <span style={{ fontWeight: 700, fontSize: 11, color: C.txt }}>{log.activity}</span>
                                <span style={{ fontSize: 8.5, color: C.mute, whiteSpace: "nowrap" }}>
                                  {new Date(log.dateTime).toLocaleString("en-IN", {
                                    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                                  })}
                                </span>
                              </div>
                              <div style={{ fontSize: 10, color: C.sub, marginTop: 4, lineHeight: 1.4 }}>{log.comments}</div>
                              <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 8.5, color: C.mute, marginTop: 4 }}>
                                <User size={8} />
                                <span>{log.performedBy}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. FOLLOW-UPS TAB */}
                {drawerTab === "followups" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: C.txt }}>Follow-up Schedules</h3>
                    
                    <form onSubmit={handleAddFollowUp} style={{ background: C.raise, padding: 14, borderRadius: 8, border: `1px solid ${C.bord}`, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ fontWeight: 700, fontSize: 11, color: C.gold }}>Add New Follow-up Schedule</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <Field label="Follow-up Date" required>
                          <input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} style={{ width: "100%", background: C.card, border: `1px solid ${C.bord}`, borderRadius: 6, color: C.txt, padding: 6, fontSize: 12 }} />
                        </Field>
                        <Field label="Follow-up Time">
                          <input type="time" value={followUpTime} onChange={e => setFollowUpTime(e.target.value)} style={{ width: "100%", background: C.card, border: `1px solid ${C.bord}`, borderRadius: 6, color: C.txt, padding: 6, fontSize: 12 }} />
                        </Field>
                      </div>
                      <Field label="Remarks" required>
                        <Input value={followUpRemarks} onChange={setFollowUpRemarks} placeholder="Enter action remarks..." />
                      </Field>
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <Btn type="submit" size="sm" icon={Plus}>Add Schedule</Btn>
                      </div>
                    </form>

                    <div style={{ fontWeight: 700, fontSize: 11, color: C.sub, borderBottom: `1px solid ${C.bord}`, paddingBottom: 6 }}>Follow-up Audit History</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {timelineData.filter(t => /follow-up/i.test(t.activity) || /follow-up/i.test(t.comments)).map((log, i) => (
                        <div key={i} style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 8, padding: 10, fontSize: 10.5 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", color: C.sub, marginBottom: 4, fontSize: 9 }}>
                            <span><strong>Date:</strong> {new Date(log.dateTime).toLocaleDateString()}</span>
                            <span><strong>Executive:</strong> {log.performedBy}</span>
                          </div>
                          <div style={{ color: C.txt }}>{log.comments}</div>
                        </div>
                      ))}
                      {timelineData.filter(t => /follow-up/i.test(t.activity) || /follow-up/i.test(t.comments)).length === 0 && (
                        <div style={{ fontSize: 10, color: C.mute, textAlign: "center", padding: 10 }}>No scheduled follow-up history logged yet.</div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. CALL LOG TAB */}
                {drawerTab === "calls" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: C.txt }}>Call Logging & History</h3>
                    
                    <form onSubmit={handleLogCall} style={{ background: C.raise, padding: 14, borderRadius: 8, border: `1px solid ${C.bord}`, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ fontWeight: 700, fontSize: 11, color: C.gold }}>Log Customer Interaction</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <Field label="Call Type">
                          <select value={callType} onChange={e => setCallType(e.target.value)} style={{ width: "100%", background: C.card, border: `1px solid ${C.bord}`, borderRadius: 6, color: C.txt, padding: 6, fontSize: 12 }}>
                            <option value="Outgoing">Outgoing Call</option>
                            <option value="Incoming">Incoming Call</option>
                            <option value="Missed">Missed Call</option>
                          </select>
                        </Field>
                        <Field label="Duration (MM:SS)">
                          <Input value={callDuration} onChange={setCallDuration} />
                        </Field>
                      </div>
                      <Field label="Call Notes / Remarks" required>
                        <Input value={callRemarks} onChange={setCallRemarks} placeholder="Enter details of conversation..." />
                      </Field>
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <Btn type="submit" size="sm" icon={Phone}>Log Interaction</Btn>
                      </div>
                    </form>

                    <div style={{ fontWeight: 700, fontSize: 11, color: C.sub, borderBottom: `1px solid ${C.bord}`, paddingBottom: 6 }}>Recent Call Logs</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {(simulatedCallHistory[selectedLead.id] || []).map((call, i) => (
                        <div key={i} style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 8, padding: 10, fontSize: 10.5 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", color: C.sub, marginBottom: 4, fontSize: 9 }}>
                            <span><strong>Type:</strong> {call.type} ({call.duration})</span>
                            <span>{new Date(call.dateTime).toLocaleString("en-IN", { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div style={{ color: C.txt }}>{call.remarks}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, background: C.raise, padding: "4px 8px", borderRadius: 4, marginTop: 6, fontSize: 9 }}>
                            <Phone size={10} style={{ color: C.mute }} />
                            <span style={{ color: C.sub }}>Play Recording ({call.recording})</span>
                            <Btn size="xs" v="ghost" icon={Download} onClick={() => setToast({ msg: `Downloading ${call.recording}...`, type: "success" })}>Play</Btn>
                          </div>
                        </div>
                      ))}
                      {(simulatedCallHistory[selectedLead.id] || []).length === 0 && (
                        <div style={{ fontSize: 10, color: C.mute, textAlign: "center", padding: 10 }}>No logged calls. Outbound actions via quick call buttons are logged here.</div>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. SITE VISITS TAB */}
                {drawerTab === "visits" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: C.txt }}>Site Visit Log Registry</h3>
                    
                    <form onSubmit={handleScheduleVisit} style={{ background: C.raise, padding: 14, borderRadius: 8, border: `1px solid ${C.bord}`, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ fontWeight: 700, fontSize: 11, color: C.gold }}>Schedule / Record Site Visit</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <Field label="Visit Date" required>
                          <input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} style={{ width: "100%", background: C.card, border: `1px solid ${C.bord}`, borderRadius: 6, color: C.txt, padding: 6, fontSize: 12 }} />
                        </Field>
                        <Field label="Visit Time">
                          <input type="text" value={visitTime} onChange={e => setVisitTime(e.target.value)} placeholder="e.g. 11:00 AM" style={{ width: "100%", background: C.card, border: `1px solid ${C.bord}`, borderRadius: 6, color: C.txt, padding: 6, fontSize: 12 }} />
                        </Field>
                        <Field label="Family Members (Guests)">
                          <input type="number" value={visitGuests} onChange={e => setVisitGuests(parseInt(e.target.value) || 0)} style={{ width: "100%", background: C.card, border: `1px solid ${C.bord}`, borderRadius: 6, color: C.txt, padding: 6, fontSize: 12 }} />
                        </Field>
                        <Field label="Rating (1-5)">
                          <select value={visitRating} onChange={e => setVisitRating(e.target.value)} style={{ width: "100%", background: C.card, border: `1px solid ${C.bord}`, borderRadius: 6, color: C.txt, padding: 6, fontSize: 12 }}>
                            <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
                            <option value="4">⭐⭐⭐⭐ Good</option>
                            <option value="3">⭐⭐⭐ Neutral</option>
                            <option value="2">⭐⭐ Poor</option>
                            <option value="1">⭐ Bad</option>
                          </select>
                        </Field>
                      </div>
                      <Field label="Client Feedback & Comments" required>
                        <Input value={visitFeedback} onChange={setVisitFeedback} placeholder="Enter customer feedback during visit..." />
                      </Field>
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <Btn type="submit" size="sm" icon={Calendar}>Schedule & Log</Btn>
                      </div>
                    </form>

                    <div style={{ fontWeight: 700, fontSize: 11, color: C.sub, borderBottom: `1px solid ${C.bord}`, paddingBottom: 6 }}>Logged Visits</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {(selectedLead.siteVisits || []).map((v, i) => (
                        <div key={i} style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 8, padding: 10, fontSize: 10.5 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", color: C.sub, marginBottom: 4, fontSize: 9 }}>
                            <span><strong>Date:</strong> {new Date(v.visitDate).toLocaleDateString()} at {v.visitTime}</span>
                            <span style={{ color: C.teal, fontWeight: 700 }}>{v.status || "Completed"}</span>
                          </div>
                          <div><strong>Project Interest:</strong> {v.interest || "Skyline Heights"}</div>
                          <div style={{ color: C.txt, marginTop: 4 }}>{v.notes}</div>
                        </div>
                      ))}
                      {(selectedLead.siteVisits || []).length === 0 && (
                        <div style={{ fontSize: 10, color: C.mute, textAlign: "center", padding: 10 }}>No visits scheduled or completed for this lead.</div>
                      )}
                    </div>
                  </div>
                )}

                {/* 6. DOCUMENTS TAB */}
                {drawerTab === "docs" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: C.txt }}>Documents Upload & Verification</h3>
                    
                    {!matchedCustomer ? (
                      <div style={{ background: `${C.red}12`, border: `1px solid ${C.red}33`, borderRadius: 8, padding: 12, fontSize: 11, color: C.red, display:"flex", alignItems:"center", gap:8 }}>
                        <AlertCircle size={16} />
                        <div>No linked Customer records. Lead must be moved to <strong>Booking Confirmed</strong> to seed a customer and unlock document uploads.</div>
                      </div>
                    ) : (
                      <>
                        <form onSubmit={handleUploadDoc} style={{ background: C.raise, padding: 14, borderRadius: 8, border: `1px solid ${C.bord}`, display: "flex", flexDirection: "column", gap: 10 }}>
                          <div style={{ fontWeight: 700, fontSize: 11, color: C.gold }}>Upload Verification Document</div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            <Field label="Document Category">
                              <select value={docType} onChange={e => setDocType(e.target.value)} style={{ width: "100%", background: C.card, border: `1px solid ${C.bord}`, borderRadius: 6, color: C.txt, padding: 6, fontSize: 12 }}>
                                <option value="Aadhaar">Aadhaar Card</option>
                                <option value="PAN">PAN Card</option>
                                <option value="Passport">Passport</option>
                                <option value="Salary Slip">Salary Slip</option>
                                <option value="Bank Statement">Bank Statement</option>
                                <option value="Booking Form">Booking Form</option>
                                <option value="Agreement">Agreement</option>
                                <option value="Other">Other</option>
                              </select>
                            </Field>
                            <Field label="Custom Document Name">
                              <Input value={docName} onChange={setDocName} placeholder="Aadhaar_Rahul.pdf" />
                            </Field>
                          </div>
                          <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <Btn type="submit" size="sm" icon={Paperclip}>Upload & Verify</Btn>
                          </div>
                        </form>

                        <div style={{ fontWeight: 700, fontSize: 11, color: C.sub, borderBottom: `1px solid ${C.bord}`, paddingBottom: 6 }}>Verified Customer Documents</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {customerDocuments.map((doc, i) => (
                            <div key={i} style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 8, padding: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: C.txt }}>{doc.name}</div>
                                <div style={{ fontSize: 9.5, color: C.sub }}>Type: {doc.documentType} · Size: {doc.fileSize} · Date: {new Date(doc.createdAt).toLocaleDateString()}</div>
                              </div>
                              <span style={{ fontSize: 9, background: `${C.teal}18`, color: C.teal, padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                                {doc.status || "Signed"}
                              </span>
                            </div>
                          ))}
                          {customerDocuments.length === 0 && (
                            <div style={{ fontSize: 10, color: C.mute, textAlign: "center", padding: 10 }}>No customer verification documents uploaded yet.</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* 7. QUOTATION TAB */}
                {drawerTab === "quote" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: C.txt }}>Sales Quotation Generator</h3>
                    
                    <form onSubmit={handleGenerateQuote} style={{ background: C.raise, padding: 14, borderRadius: 8, border: `1px solid ${C.bord}`, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ fontWeight: 700, fontSize: 11, color: C.gold }}>Generate Official Quotation</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <Field label="Quotation Amount (₹)" required>
                          <input type="number" value={quoteAmount} onChange={e => setQuoteAmount(e.target.value)} placeholder="18000000" style={{ width: "100%", background: C.card, border: `1px solid ${C.bord}`, borderRadius: 6, color: C.txt, padding: 6, fontSize: 12 }} />
                        </Field>
                        <Field label="Discount (%)">
                          <input type="number" value={quoteDiscount} onChange={e => setQuoteDiscount(e.target.value)} placeholder="2" style={{ width: "100%", background: C.card, border: `1px solid ${C.bord}`, borderRadius: 6, color: C.txt, padding: 6, fontSize: 12 }} />
                        </Field>
                      </div>
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <Btn type="submit" size="sm" icon={FileText}>Generate & Log</Btn>
                      </div>
                    </form>

                    {quoteHistory[selectedLead.id] && (
                      <div style={{ background: C.card, border: `2px solid ${C.gold}`, borderRadius: 8, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.bord}`, paddingBottom: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: C.gold }}>CURRENT ACTIVE QUOTATION</span>
                          <span style={{ fontSize: 9.5, color: C.mute }}>{new Date(quoteHistory[selectedLead.id].date).toLocaleDateString()}</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11 }}>
                          <div><strong>Quotation No:</strong> {quoteHistory[selectedLead.id].quoteNo}</div>
                          <div><strong>Base Amount:</strong> ₹{quoteHistory[selectedLead.id].amount.toLocaleString()}</div>
                          <div><strong>Discount Applied:</strong> {quoteHistory[selectedLead.id].discount}%</div>
                          <div style={{ color: C.gold, fontSize: 12 }}><strong>Final Total:</strong> ₹{quoteHistory[selectedLead.id].finalAmount.toLocaleString()}</div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                          <Btn size="sm" icon={Download} onClick={() => handleDownloadQuotationPDF(quoteHistory[selectedLead.id])}>Download PDF Quote</Btn>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 8. PAYMENTS TAB */}
                {drawerTab === "payments" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: C.txt }}>Booking Ledger & Payments</h3>
                    
                    {!matchedCustomer ? (
                      <div style={{ background: `${C.red}12`, border: `1px solid ${C.red}33`, borderRadius: 8, padding: 12, fontSize: 11, color: C.red, display:"flex", alignItems:"center", gap:8 }}>
                        <AlertCircle size={16} />
                        <div>No booking ledger generated. Re-stage lead to <strong>Booking Confirmed</strong> to auto-sync a customer ledger.</div>
                      </div>
                    ) : (
                      <>
                        <div style={{ background: C.raise, padding: 12, borderRadius: 8, border: `1px solid ${C.bord}`, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 11 }}>
                          <div><strong>Total Value:</strong> ₹{matchedCustomer.totalAmount?.toLocaleString()}</div>
                          <div><strong>Paid Ledger:</strong> <span style={{ color: C.teal, fontWeight: 700 }}>₹{matchedCustomer.paidAmount?.toLocaleString()}</span></div>
                          <div><strong>Pending:</strong> <span style={{ color: C.red, fontWeight: 700 }}>₹{(matchedCustomer.totalAmount - matchedCustomer.paidAmount)?.toLocaleString()}</span></div>
                        </div>

                        <form onSubmit={handleAddPayment} style={{ background: C.raise, padding: 14, borderRadius: 8, border: `1px solid ${C.bord}`, display: "flex", flexDirection: "column", gap: 10 }}>
                          <div style={{ fontWeight: 700, fontSize: 11, color: C.gold }}>Record Received Payment</div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            <Field label="Payment Amount (₹)" required>
                              <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="500000" style={{ width: "100%", background: C.card, border: `1px solid ${C.bord}`, borderRadius: 6, color: C.txt, padding: 6, fontSize: 12 }} />
                            </Field>
                            <Field label="Payment Mode">
                              <select value={payMode} onChange={e => setPayMode(e.target.value)} style={{ width: "100%", background: C.card, border: `1px solid ${C.bord}`, borderRadius: 6, color: C.txt, padding: 6, fontSize: 12 }}>
                                <option value="NEFT">NEFT Transfer</option>
                                <option value="RTGS">RTGS Transfer</option>
                                <option value="Cheque">Cheque</option>
                                <option value="Cash">Cash Ledger</option>
                                <option value="UPI">UPI Portal</option>
                              </select>
                            </Field>
                            <div style={{ gridColumn: "1/-1" }}>
                              <Field label="Transaction Reference ID">
                                <Input value={payTxnId} onChange={setPayTxnId} placeholder="UTR / Bank Txn Ref No..." />
                              </Field>
                            </div>
                          </div>
                          <Field label="Ledger Remarks">
                            <Input value={payRemarks} onChange={setPayRemarks} placeholder="Payment details..." />
                          </Field>
                          <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <Btn type="submit" size="sm" icon={CreditCard}>Process Ledger Payment</Btn>
                          </div>
                        </form>

                        <div style={{ fontWeight: 700, fontSize: 11, color: C.sub, borderBottom: `1px solid ${C.bord}`, paddingBottom: 6 }}>Payment Registry History</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {customerPayments.map((p, i) => (
                            <div key={i} style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 8, padding: 10, fontSize: 11 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                <span><strong>Mode:</strong> {p.paymentMode}</span>
                                <span style={{ color: C.teal, fontWeight: 700 }}>₹{p.amount.toLocaleString("en-IN")}</span>
                              </div>
                              <div style={{ fontSize: 9.5, color: C.sub }}>
                                <div><strong>Date:</strong> {new Date(p.paymentDate).toLocaleDateString()}</div>
                                <div><strong>Txn ID:</strong> {p.attachmentUrl || "N/A"}</div>
                              </div>
                              {p.remarks && <div style={{ color: C.mute, fontStyle: "italic", marginTop: 4, fontSize: 10 }}>Notes: {p.remarks}</div>}
                            </div>
                          ))}
                          {customerPayments.length === 0 && (
                            <div style={{ fontSize: 10, color: C.mute, textAlign: "center", padding: 10 }}>No processed payments for this customer booking.</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* 9. NOTES TAB */}
                {drawerTab === "notes" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: C.txt }}>Rich Text Lead Notes</h3>
                    
                    <form onSubmit={handleAddNote} style={{ display: "flex", gap: 8 }}>
                      <input 
                        type="text" 
                        value={newNote} 
                        onChange={e => setNewNote(e.target.value)} 
                        placeholder="Type standard or rich text notes..." 
                        style={{
                          flex: 1, background: C.card, border: `1px solid ${C.bord}`, borderRadius: 8,
                          padding: "8px 12px", color: C.txt, fontSize: 12.5, outline: "none"
                        }} 
                      />
                      <Btn type="submit" icon={Send}>Log Note</Btn>
                    </form>

                    <div style={{ fontWeight: 700, fontSize: 11, color: C.sub, borderBottom: `1px solid ${C.bord}`, paddingBottom: 6 }}>Stored Notes</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {timelineData.filter(t => /note/i.test(t.activity) || /note/i.test(t.comments)).map((log, i) => (
                        <div key={i} style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 8, padding: 12 }}>
                          <div style={{ fontSize: 11, color: C.txt, lineHeight: 1.4 }}>{log.comments}</div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8.5, color: C.mute, marginTop: 6 }}>
                            <span>Logged by: {log.performedBy}</span>
                            <span>{new Date(log.dateTime).toLocaleString("en-IN")}</span>
                          </div>
                        </div>
                      ))}
                      {timelineData.filter(t => /note/i.test(t.activity) || /note/i.test(t.comments)).length === 0 && (
                        <div style={{ fontSize: 10, color: C.mute, textAlign: "center", padding: 10 }}>No logged notes. Logs added here are synced with the CRM Audit Trail.</div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}