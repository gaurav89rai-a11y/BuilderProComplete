import { useState, useEffect, useCallback, useMemo } from "react";
import {
  FileText, Filter, Download, Printer, RefreshCw, Search, ArrowLeft,
  CheckCircle, AlertCircle, Calendar, ChevronDown, ChevronRight,
  LayoutDashboard, Target, DollarSign, Handshake, Building2, Shield,
  Layers, Table, Clock, Check, X, Sparkles
} from "lucide-react";
import { C } from "../../config/theme.js";
import { api } from "../../services/api.js";
import { Badge, Btn, LoadingState, ErrorState, Toast, STitle } from "../../components/ui";

const CATEGORY_ICONS = {
  dashboard: LayoutDashboard,
  sales: Target,
  financial: DollarSign,
  partners: Handshake,
  operations: Building2,
  governance: Shield,
};

export function Reports({ currentUser }) {
  const role = currentUser?.role || localStorage.getItem("current_user_role") || "Super Admin";
  const channelPartnerId = currentUser?.channelPartnerId || localStorage.getItem("current_channel_partner_id");

  // State
  const [categories, setCategories] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  
  // Active Report State
  const [paramDefs, setParamDefs] = useState([]);
  const [filterValues, setFilterValues] = useState({});
  const [filterErrors, setFilterErrors] = useState({});
  const [reportData, setReportData] = useState(null);
  
  // UI & Loading State
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [serverHealth, setServerHealth] = useState(null);
  const [toast, setToast] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);

  // Pagination & Sorting State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [sortKey, setSortKey] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);

  // ─── 1. Load Initial Categories, Catalog & Server Health ──────────────
  const loadInitialData = useCallback(async () => {
    setLoadingCatalog(true);
    try {
      const [cats, reports, health] = await Promise.all([
        api.getReportCategories().catch(() => []),
        api.getReportCatalog().catch(() => []),
        api.getReportHealth().catch(() => null)
      ]);
      setCategories(cats || []);
      setCatalog(reports || []);
      setServerHealth(health);

      // Auto-select if channel partner has only one report
      if (role === "Channel Partner" && reports?.length === 1) {
        handleSelectReport(reports[0]);
      }
    } catch (err) {
      console.error("Failed to load reporting catalog", err);
      setToast({ msg: "Could not load reporting catalog: " + err.message, type: "error" });
    } finally {
      setLoadingCatalog(false);
    }
  }, [role]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // ─── 2. Select Report & Load Parameters ───────────────────────────────
  const handleSelectReport = async (report) => {
    setSelectedReport(report);
    setReportData(null);
    setFilterErrors({});
    setPage(1);

    try {
      const pDefs = await api.getReportParameters(report.id);
      setParamDefs(pDefs || []);

      // Initialize default values
      const initialVals = {};
      (pDefs || []).forEach(p => {
        initialVals[p.name] = p.defaultValue || "";
      });

      // Strict Channel Partner enforcement
      if (role === "Channel Partner" && channelPartnerId) {
        initialVals["PartnerId"] = channelPartnerId.toString();
      }

      setFilterValues(initialVals);

      // Auto-generate report on open
      executeReport(report.id, initialVals);
    } catch (err) {
      console.error("Failed to load parameters", err);
      setToast({ msg: "Failed to load parameters for report", type: "error" });
    }
  };

  // ─── 3. Parameter Validation & Execution ──────────────────────────────
  const validateFilters = () => {
    const errors = {};
    if (filterValues.FromDate && filterValues.ToDate) {
      const from = new Date(filterValues.FromDate);
      const to = new Date(filterValues.ToDate);
      if (from > to) {
        errors.DateRange = "'From Date' cannot be later than 'To Date'.";
      }
    }
    setFilterErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const executeReport = async (reportId = selectedReport?.id, currentFilters = filterValues) => {
    if (!reportId) return;
    if (!validateFilters()) return;

    setGeneratingReport(true);
    try {
      const payload = {
        reportId,
        parameters: currentFilters,
        format: "JSON"
      };
      const result = await api.renderReport(payload);
      setReportData(result);
      setPage(1);
    } catch (err) {
      console.error("Report generation failed", err);
      setToast({ msg: err.message || "Failed to generate report", type: "error" });
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleResetFilters = () => {
    const resetVals = {};
    paramDefs.forEach(p => {
      resetVals[p.name] = p.defaultValue || "";
    });
    if (role === "Channel Partner" && channelPartnerId) {
      resetVals["PartnerId"] = channelPartnerId.toString();
    }
    setFilterValues(resetVals);
    setFilterErrors({});
    executeReport(selectedReport.id, resetVals);
  };

  const setDatePreset = (preset) => {
    const now = new Date();
    let from = new Date();
    let to = new Date();

    if (preset === "today") {
      from = now;
      to = now;
    } else if (preset === "month") {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (preset === "last30") {
      from.setDate(now.getDate() - 30);
      to = now;
    } else if (preset === "ytd") {
      from = new Date(now.getFullYear(), 0, 1);
      to = now;
    } else if (preset === "all") {
      setFilterValues(prev => ({ ...prev, FromDate: "", ToDate: "" }));
      return;
    }

    const fmt = (d) => d.toISOString().split("T")[0];
    setFilterValues(prev => ({ ...prev, FromDate: fmt(from), ToDate: fmt(to) }));
  };

  // ─── 4. Export & Print Handlers ───────────────────────────────────────
  const handleExport = async (format) => {
    setShowExportMenu(false);
    if (!selectedReport) return;

    setToast({ msg: `Generating ${format} export for ${selectedReport.title}...`, type: "info" });
    try {
      const res = await api.downloadReportFile(selectedReport.id, filterValues, format);
      setToast({ msg: `Downloaded ${res.filename || selectedReport.title}!`, type: "success" });
    } catch (err) {
      console.error("Export download failed:", err);
      setToast({ msg: `Export failed: ${err.message || "Could not generate file"}`, type: "error" });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // ─── 5. Sorting & Pagination Computations ─────────────────────────────
  const sortedRows = useMemo(() => {
    if (!reportData?.rows) return [];
    if (!sortKey) return reportData.rows;

    return [...reportData.rows].sort((a, b) => {
      let va = a[sortKey];
      let vb = b[sortKey];

      if (va == null) return 1;
      if (vb == null) return -1;

      if (typeof va === "number" && typeof vb === "number") {
        return sortAsc ? va - vb : vb - va;
      }
      return sortAsc
        ? va.toString().localeCompare(vb.toString())
        : vb.toString().localeCompare(va.toString());
    });
  }, [reportData, sortKey, sortAsc]);

  const totalPages = Math.ceil((sortedRows?.length || 0) / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, page, pageSize]);

  // Compute Column Totals
  const columnTotals = useMemo(() => {
    if (!reportData?.rows || !reportData?.columns) return {};
    const totals = {};
    reportData.columns.forEach(col => {
      if (col.dataType === "currency" || col.dataType === "number") {
        const sum = reportData.rows.reduce((acc, r) => acc + (parseFloat(r[col.key]) || 0), 0);
        totals[col.key] = sum;
      }
    });
    return totals;
  }, [reportData]);

  // Filter Catalog
  const filteredCatalog = useMemo(() => {
    return catalog.filter(r => {
      const matchCat = selectedCategory === "all" || r.categoryId === selectedCategory;
      const matchSearch = !searchQuery || 
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        r.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [catalog, selectedCategory, searchQuery]);

  if (loadingCatalog) return <LoadingState />;

  return (
    <div className="fi report-page-container">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* ─── Top Header Bar ────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 14 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <STitle 
              title={selectedReport ? selectedReport.title : "SSRS Reporting & Business Intelligence"} 
              sub={selectedReport ? selectedReport.description : "Enterprise SQL Server Reporting Services (SSRS) and live database analytics suite"} 
            />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Server Health Status Pill */}
          <div 
            onClick={() => setShowHealthModal(true)}
            style={{
              display: "flex", alignItems: "center", gap: 7, background: C.card,
              border: `1px solid ${serverHealth?.isConnected ? `${C.teal}40` : `${C.gold}40`}`,
              borderRadius: 20, padding: "5px 12px", cursor: "pointer", fontSize: 11
            }}
            title="Click to view SSRS server diagnostics"
          >
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: serverHealth?.isConnected ? C.teal : C.gold,
              boxShadow: `0 0 8px ${serverHealth?.isConnected ? C.teal : C.gold}`
            }} />
            <span style={{ color: C.txt, fontWeight: 600 }}>
              {serverHealth?.isConnected ? "SSRS Online" : "Enterprise SQL Engine"}
            </span>
            <span style={{ color: C.mute, fontSize: 10 }}>ⓘ</span>
          </div>

          {selectedReport && (
            <Btn icon={ArrowLeft} v="outline" onClick={() => setSelectedReport(null)}>
              Back to Catalog
            </Btn>
          )}
        </div>
      </div>

      {/* ─── Health & Diagnostics Modal ─────────────────────────────────── */}
      {showHealthModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: C.card, border: `1px solid ${C.bord}`, borderRadius: 14,
            padding: 24, width: 540, maxWidth: "90vw", boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ color: C.txt, fontWeight: 700, fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={18} color={C.gold} />
                Reporting Engine & SSRS Diagnostics
              </div>
              <button onClick={() => setShowHealthModal(false)} style={{ background: "transparent", border: "none", color: C.mute, cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: C.raise, borderRadius: 10, padding: 14, marginBottom: 16, border: `1px solid ${C.bord}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
                <span style={{ color: C.sub }}>Configured Report Server:</span>
                <span style={{ color: C.txt, fontFamily: "monospace" }}>{serverHealth?.serverUrl || "http://localhost/ReportServer"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
                <span style={{ color: C.sub }}>SSRS Connection Status:</span>
                <span style={{ color: serverHealth?.isConnected ? C.teal : C.gold, fontWeight: 700 }}>
                  {serverHealth?.isConnected ? "Connected (Live)" : "Standby / Fallback Active"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
                <span style={{ color: C.sub }}>Active Engine:</span>
                <span style={{ color: C.txt, fontWeight: 600 }}>
                  {serverHealth?.isConnected ? "Microsoft SQL Server Reporting Services (SSRS)" : "High-Performance Direct SQL Stored Procedure Engine"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: C.sub }}>Latency / Response:</span>
                <span style={{ color: C.txt }}>{serverHealth?.responseTimeMs || 0} ms</span>
              </div>
            </div>

            <div style={{ color: C.sub, fontSize: 12, lineHeight: 1.5, marginBottom: 20 }}>
              {serverHealth?.message || "The reporting system seamlessly integrates Microsoft SSRS with an optimized direct SQL execution engine. All exports, filtering, and role-based data isolation operate uninterrupted."}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Btn onClick={() => setShowHealthModal(false)}>Close</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ─── VIEW 1: REPORT CATALOG / SELECTION SCREEN ─────────────────── */}
      {!selectedReport ? (
        <>
          {/* Category Tabs & Search Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", background: C.raise, padding: 4, borderRadius: 10, border: `1px solid ${C.bord}` }}>
              <button
                onClick={() => setSelectedCategory("all")}
                style={{
                  background: selectedCategory === "all" ? C.gold : "transparent",
                  color: selectedCategory === "all" ? "#000" : C.sub,
                  border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer"
                }}
              >
                All Reports ({catalog.length})
              </button>
              {categories.map(cat => {
                const Icon = CATEGORY_ICONS[cat.id] || Layers;
                const count = catalog.filter(r => r.categoryId === cat.id).length;
                if (count === 0 && role !== "Super Admin") return null;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    style={{
                      background: selectedCategory === cat.id ? C.gold : "transparent",
                      color: selectedCategory === cat.id ? "#000" : C.sub,
                      border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 6
                    }}
                  >
                    <Icon size={13} />
                    {cat.name} ({count})
                  </button>
                );
              })}
            </div>

            <div style={{ position: "relative", minWidth: 260 }}>
              <Search size={14} color={C.mute} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search reports by keyword..."
                style={{
                  width: "100%", background: C.raise, border: `1px solid ${C.bord}`,
                  borderRadius: 10, padding: "9px 12px 9px 34px", color: C.txt, fontSize: 12, outline: "none"
                }}
              />
            </div>
          </div>

          {/* Catalog Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 16 }}>
            {filteredCatalog.map(report => {
              const Icon = CATEGORY_ICONS[report.categoryId] || FileText;
              return (
                <div
                  key={report.id}
                  onClick={() => handleSelectReport(report)}
                  style={{
                    background: C.card, border: `1px solid ${C.bord}`, borderRadius: 14,
                    padding: 22, display: "flex", flexDirection: "column", justifyContent: "space-between",
                    cursor: "pointer", transition: "all 0.2s ease"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.bord; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: 10, background: `${C.gold}18`,
                        display: "flex", alignItems: "center", justifyContent: "center", color: C.gold
                      }}>
                        <Icon size={20} />
                      </div>
                      <span style={{
                        background: C.raise, border: `1px solid ${C.bord}`, borderRadius: 6,
                        padding: "3px 8px", fontSize: 10, color: C.sub, textTransform: "uppercase", fontWeight: 700
                      }}>
                        SSRS: {report.rdlReportName || "RDL"}
                      </span>
                    </div>

                    <div style={{ color: C.txt, fontWeight: 700, fontSize: 15, marginBottom: 8, lineHeight: 1.3 }}>
                      {report.title}
                    </div>

                    <div style={{ color: C.sub, fontSize: 12, lineHeight: 1.5, marginBottom: 16 }}>
                      {report.description}
                    </div>
                  </div>

                  <div style={{ borderTop: `1px solid ${C.bord}`, paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {(report.parameters || []).slice(0, 3).map(p => (
                        <span key={p.name} style={{ background: C.raise, color: C.mute, fontSize: 9, padding: "2px 6px", borderRadius: 4 }}>
                          {p.label}
                        </span>
                      ))}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 4, color: C.gold, fontSize: 12, fontWeight: 700 }}>
                      Open Report <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* ─── VIEW 2: ACTIVE REPORT VIEWER & FILTER PANEL ─────────────── */
        <div>
          {/* Filter Panel */}
          <div style={{
            background: C.card, border: `1px solid ${C.bord}`, borderRadius: 14,
            padding: "18px 20px", marginBottom: 20
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.txt, fontWeight: 700, fontSize: 13 }}>
                <Filter size={15} color={C.gold} />
                Report Filters & Parameters
              </div>

              {/* Quick Date Presets */}
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {[
                  { label: "Today", val: "today" },
                  { label: "This Month", val: "month" },
                  { label: "Last 30 Days", val: "last30" },
                  { label: "YTD", val: "ytd" },
                  { label: "All Time", val: "all" }
                ].map(p => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => setDatePreset(p.val)}
                    style={{
                      background: C.raise, border: `1px solid ${C.bord}`, borderRadius: 6,
                      padding: "4px 9px", color: C.sub, fontSize: 10, fontWeight: 600, cursor: "pointer"
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Filter Controls Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 14 }}>
              {paramDefs.map(param => {
                const val = filterValues[param.name] ?? "";

                if (param.type === "select") {
                  return (
                    <div key={param.name}>
                      <label style={{ display: "block", color: C.sub, fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 5 }}>
                        {param.label}
                      </label>
                      <select
                        value={val}
                        disabled={role === "Channel Partner" && param.name === "PartnerId"}
                        onChange={e => setFilterValues(p => ({ ...p, [param.name]: e.target.value }))}
                        style={{
                          width: "100%", background: C.raise, border: `1px solid ${C.bord}`,
                          borderRadius: 8, padding: "8px 12px", color: C.txt, fontSize: 12, outline: "none",
                          opacity: (role === "Channel Partner" && param.name === "PartnerId") ? 0.7 : 1
                        }}
                      >
                        {param.options?.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  );
                }

                if (param.type === "date") {
                  return (
                    <div key={param.name}>
                      <label style={{ display: "block", color: C.sub, fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 5 }}>
                        {param.label}
                      </label>
                      <input
                        type="date"
                        value={val}
                        onChange={e => setFilterValues(p => ({ ...p, [param.name]: e.target.value }))}
                        style={{
                          width: "100%", background: C.raise, border: `1px solid ${C.bord}`,
                          borderRadius: 8, padding: "8px 12px", color: C.txt, fontSize: 12, outline: "none"
                        }}
                      />
                    </div>
                  );
                }

                return (
                  <div key={param.name}>
                    <label style={{ display: "block", color: C.sub, fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 5 }}>
                      {param.label}
                    </label>
                    <input
                      type="text"
                      value={val}
                      placeholder={`Filter by ${param.label.toLowerCase()}...`}
                      onChange={e => setFilterValues(p => ({ ...p, [param.name]: e.target.value }))}
                      style={{
                        width: "100%", background: C.raise, border: `1px solid ${C.bord}`,
                        borderRadius: 8, padding: "8px 12px", color: C.txt, fontSize: 12, outline: "none"
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Validation Errors */}
            {Object.keys(filterErrors).length > 0 && (
              <div style={{
                background: `${C.red}18`, border: `1px solid ${C.red}40`, borderRadius: 8,
                padding: "8px 12px", color: C.red, fontSize: 12, marginBottom: 12, display: "flex", alignItems: "center", gap: 6
              }}>
                <AlertCircle size={14} />
                {Object.values(filterErrors).join(" ")}
              </div>
            )}

            {/* Filter Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <Btn v="outline" onClick={handleResetFilters} icon={RefreshCw}>
                Reset
              </Btn>
              <Btn onClick={() => executeReport()} disabled={generatingReport} icon={Filter}>
                {generatingReport ? "Generating..." : "Generate Report"}
              </Btn>
            </div>
          </div>

          {/* ─── Viewer Container & Toolbar ────────────────────────────── */}
          <div style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 14, overflow: "hidden" }}>
            {/* Toolbar */}
            <div style={{
              background: C.raise, borderBottom: `1px solid ${C.bord}`, padding: "12px 20px",
              display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Table size={16} color={C.gold} />
                <div>
                  <span style={{ color: C.txt, fontWeight: 700, fontSize: 13 }}>
                    {reportData?.reportTitle || selectedReport.title}
                  </span>
                  <span style={{ color: C.mute, fontSize: 11, marginLeft: 8 }}>
                    ({reportData?.totalRows || 0} records)
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
                <Btn v="outline" icon={Printer} onClick={handlePrint}>
                  Print
                </Btn>

                {/* Export Dropdown */}
                <div style={{ position: "relative" }}>
                  <Btn icon={Download} onClick={() => setShowExportMenu(!showExportMenu)}>
                    Export <ChevronDown size={13} style={{ marginLeft: 4 }} />
                  </Btn>

                  {showExportMenu && (
                    <div style={{
                      position: "absolute", right: 0, top: "115%", width: 190,
                      background: C.card, border: `1px solid ${C.bord}`, borderRadius: 10,
                      boxShadow: "0 10px 30px rgba(0,0,0,0.4)", zIndex: 100, overflow: "hidden"
                    }}>
                      <div style={{ padding: "8px 12px", borderBottom: `1px solid ${C.bord}`, color: C.mute, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>
                        Select Export Format
                      </div>
                      {[
                        { label: "PDF Document (.pdf)", format: "PDF", icon: "📄" },
                        { label: "Excel Spreadsheet (.xlsx)", format: "EXCEL", icon: "📊" },
                        { label: "Word Document (.docx)", format: "WORD", icon: "📝" },
                        { label: "CSV Data File (.csv)", format: "CSV", icon: "📑" }
                      ].map(opt => (
                        <div
                          key={opt.format}
                          onClick={() => handleExport(opt.format)}
                          style={{
                            padding: "9px 14px", fontSize: 12, color: C.txt, cursor: "pointer",
                            display: "flex", alignItems: "center", gap: 8, transition: "background 0.15s"
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = C.raise}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                          <span>{opt.icon}</span>
                          <span>{opt.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Btn v="outline" icon={RefreshCw} onClick={() => executeReport()} disabled={generatingReport}>
                  Refresh
                </Btn>
              </div>
            </div>

            {/* KPI Summary Cards Bar */}
            {reportData?.kpis?.length > 0 && (
              <div style={{
                padding: "16px 20px", borderBottom: `1px solid ${C.bord}`,
                display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(180px, 1fr))`, gap: 12, background: `${C.raise}30`
              }}>
                {reportData.kpis.map((kpi, idx) => (
                  <div key={idx} style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ color: C.sub, fontSize: 10, textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>
                      {kpi.label}
                    </div>
                    <div style={{ color: C[kpi.color] || C.gold, fontSize: 18, fontWeight: 800, margin: "4px 0" }}>
                      {kpi.value}
                    </div>
                    <div style={{ color: C.mute, fontSize: 10 }}>
                      {kpi.subtext}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Table or Empty/Loading States */}
            {generatingReport ? (
              <div style={{ padding: 60, textAlign: "center" }}>
                <LoadingState text="Executing stored procedure and rendering report..." />
              </div>
            ) : !reportData || reportData.rows?.length === 0 ? (
              <div style={{ padding: 60, textAlign: "center", color: C.mute }}>
                <div style={{ background: `${C.gold}15`, width: 50, height: 50, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: C.gold }}>
                  <Filter size={24} />
                </div>
                <div style={{ color: C.txt, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
                  No Records Match Current Filters
                </div>
                <div style={{ color: C.sub, fontSize: 12, maxWidth: 380, margin: "0 auto 16px" }}>
                  Try expanding the date range, selecting all projects, or clearing search criteria to retrieve more results.
                </div>
                <Btn v="outline" onClick={handleResetFilters} icon={RefreshCw}>
                  Reset Filters
                </Btn>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }} className="report-data-table">
                  <thead>
                    <tr style={{ background: C.raise }}>
                      {reportData.columns.map(col => (
                        <th
                          key={col.key}
                          onClick={() => {
                            if (sortKey === col.key) setSortAsc(!sortAsc);
                            else { setSortKey(col.key); setSortAsc(true); }
                          }}
                          style={{
                            padding: "10px 14px", textAlign: col.align || "left",
                            color: C.mute, fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
                            textTransform: "uppercase", borderBottom: `1px solid ${C.bord}`,
                            cursor: "pointer", userSelect: "none"
                          }}
                        >
                          {col.label}
                          {sortKey === col.key && (sortAsc ? " ↑" : " ↓")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((row, i) => (
                      <tr
                        key={i}
                        style={{
                          borderBottom: `1px solid ${C.bord}`,
                          background: i % 2 === 0 ? "transparent" : `${C.raise}30`
                        }}
                      >
                        {reportData.columns.map(col => {
                          const val = row[col.key];

                          if (col.dataType === "badge") {
                            return (
                              <td key={col.key} style={{ padding: "10px 14px", textAlign: col.align || "center" }}>
                                <Badge s={val || "N/A"} />
                              </td>
                            );
                          }

                          if (col.dataType === "currency") {
                            const num = parseFloat(val);
                            return (
                              <td key={col.key} style={{ padding: "10px 14px", textAlign: "right", fontFamily: "monospace", fontWeight: 600, color: num > 0 ? C.txt : C.mute }}>
                                {isNaN(num) ? "-" : `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                              </td>
                            );
                          }

                          if (col.dataType === "date") {
                            const d = val ? new Date(val) : null;
                            return (
                              <td key={col.key} style={{ padding: "10px 14px", textAlign: col.align || "center", color: C.sub }}>
                                {d && !isNaN(d.getTime()) ? d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                              </td>
                            );
                          }

                          if (col.dataType === "number") {
                            return (
                              <td key={col.key} style={{ padding: "10px 14px", textAlign: "right", fontFamily: "monospace", color: C.txt }}>
                                {val != null ? Number(val).toLocaleString("en-IN") : "-"}
                              </td>
                            );
                          }

                          return (
                            <td key={col.key} style={{ padding: "10px 14px", textAlign: col.align || "left", color: C.txt }}>
                              {val ?? "-"}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>

                  {/* Summary Totals Row */}
                  {Object.keys(columnTotals).length > 0 && (
                    <tfoot>
                      <tr style={{ background: `${C.gold}12`, borderTop: `2px solid ${C.gold}44` }}>
                        {reportData.columns.map((col, idx) => {
                          if (idx === 0) {
                            return (
                              <td key={col.key} style={{ padding: "12px 14px", fontWeight: 800, color: C.gold, fontSize: 11, textTransform: "uppercase" }}>
                                Total Summary:
                              </td>
                            );
                          }
                          const sum = columnTotals[col.key];
                          if (sum !== undefined) {
                            return (
                              <td key={col.key} style={{ padding: "12px 14px", textAlign: "right", fontWeight: 800, color: C.gold, fontFamily: "monospace" }}>
                                {col.dataType === "currency" ? `₹${sum.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : sum.toLocaleString("en-IN")}
                              </td>
                            );
                          }
                          return <td key={col.key} style={{ padding: "12px 14px" }}></td>;
                        })}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {reportData?.rows?.length > 0 && (
              <div style={{
                padding: "12px 20px", borderTop: `1px solid ${C.bord}`,
                display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10
              }}>
                <div style={{ color: C.mute, fontSize: 11 }}>
                  Showing {Math.min((page - 1) * pageSize + 1, reportData.rows.length)} - {Math.min(page * pageSize, reportData.rows.length)} of {reportData.rows.length} records
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <select
                    value={pageSize}
                    onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                    style={{
                      background: C.raise, border: `1px solid ${C.bord}`, borderRadius: 6,
                      padding: "4px 8px", color: C.txt, fontSize: 11, outline: "none"
                    }}
                  >
                    {[10, 15, 25, 50, 100].map(s => (
                      <option key={s} value={s}>{s} per page</option>
                    ))}
                  </select>

                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage(p => p - 1)}
                      style={{
                        background: C.raise, border: `1px solid ${C.bord}`, borderRadius: 6,
                        padding: "5px 10px", color: page <= 1 ? C.mute : C.txt, cursor: page <= 1 ? "not-allowed" : "pointer"
                      }}
                    >
                      Prev
                    </button>
                    <span style={{ color: C.txt, padding: "5px 10px", fontSize: 11 }}>
                      {page} / {totalPages}
                    </span>
                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage(p => p + 1)}
                      style={{
                        background: C.raise, border: `1px solid ${C.bord}`, borderRadius: 6,
                        padding: "5px 10px", color: page >= totalPages ? C.mute : C.txt, cursor: page >= totalPages ? "not-allowed" : "pointer"
                      }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
