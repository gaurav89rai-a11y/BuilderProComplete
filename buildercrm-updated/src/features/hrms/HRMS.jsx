import { useState, useEffect, useCallback } from "react";
import { Users, Calendar, Plus, Edit, Trash2, Check, X, Loader2, DollarSign, Briefcase, Clock, FileText } from "lucide-react";
import { api } from "../../services/api.js";
import { C } from "../../config/theme.js";
import { Badge, Btn, Modal, Field, Input, Select, LoadingState, ErrorState, Toast, STitle, Stat } from "../../components/ui";
import { useConfig } from "../../config/ConfigContext.jsx";

export function HRMS({ activeModule, currentUser }) {
  const isSuperOrHR = currentUser?.role === "Super Admin" || currentUser?.role === "HR Manager" || currentUser?.email === "raj@builderpro.com";
  const isProjectManager = currentUser?.role === "Manager";
  const isRegularEmployee = !isSuperOrHR && !isProjectManager;

  const [tab, setTab] = useState("employees"); // employees, attendance, leaves, profile
  const { department: departments, employeeStatus: employeeStatuses, attendanceStatus: attendanceStatuses, leaveType: leaveTypes, leaveStatus: leaveStatuses, getDefault } = useConfig();
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  // Filter states
  const [attnDate, setAttnDate] = useState(new Date().toISOString().split("T")[0]);

  const defaultDept = getDefault("department", "Construction");
  const defaultEmpStatus = getDefault("employeeStatus", "Active");
  const defaultAttnStatus = getDefault("attendanceStatus", "Present");
  const defaultLeaveType = getDefault("leaveType", "Casual");
  const pendingLeaveStatus = getDefault("leaveStatus", "Pending");

  // Modal states
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [empForm, setEmpForm] = useState({ name: "", email: "", phone: "", department: defaultDept, designation: "", salary: 0, status: defaultEmpStatus });

  const [showAttnModal, setShowAttnModal] = useState(false);
  const [attnForm, setAttnForm] = useState({ employeeId: "", checkIn: "09:00 AM", checkOut: "", status: defaultAttnStatus });

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ employeeId: "", leaveType: defaultLeaveType, startDate: "", endDate: "", reason: "" });

  const myEmployee = employees.find(e => e.email === currentUser?.email);

  useEffect(() => {
    if (currentUser) {
      if (activeModule === "hrms_attendance") {
        setTab("attendance");
      } else if (activeModule === "hrms_leaves") {
        setTab("leaves");
      } else if (!isSuperOrHR && !isProjectManager) {
        setTab("profile");
      } else {
        setTab("employees");
      }
    }
  }, [currentUser, activeModule, isSuperOrHR, isProjectManager]);

  useEffect(() => {
    if (showAttnModal && isRegularEmployee && myEmployee) {
      setAttnForm(p => ({ ...p, employeeId: myEmployee.id.toString() }));
    }
  }, [showAttnModal, isRegularEmployee, myEmployee]);

  useEffect(() => {
    if (showLeaveModal && isRegularEmployee && myEmployee) {
      setLeaveForm(p => ({ ...p, employeeId: myEmployee.id.toString() }));
    }
  }, [showLeaveModal, isRegularEmployee, myEmployee]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const emps = await api.getEmployees();
      setEmployees(emps);
      
      const attns = await api.getAttendances({ date: attnDate });
      setAttendance(attns);
      
      const lvs = await api.getLeaves();
      setLeaves(lvs);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [attnDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Employee submissions
  const handleEmpSubmit = async () => {
    if (!empForm.name || !empForm.email || !empForm.designation) {
      return setToast({ msg: "Name, Email and Designation are required", type: "error" });
    }
    setSaving(true);
    try {
      if (editingEmp) {
        await api.updateEmployee(editingEmp.id, { ...empForm, id: editingEmp.id, salary: +empForm.salary });
        setToast({ msg: "Employee updated successfully!", type: "success" });
      } else {
        await api.createEmployee({ ...empForm, salary: +empForm.salary });
        setToast({ msg: "Employee created successfully!", type: "success" });
      }
      setShowEmpModal(false);
      setEditingEmp(null);
      setEmpForm({ name: "", email: "", phone: "", department: defaultDept, designation: "", salary: 0, status: defaultEmpStatus });
      loadData();
    } catch (e) {
      setToast({ msg: e.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleEditEmp = (emp) => {
    setEditingEmp(emp);
    setEmpForm({
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      department: emp.department,
      designation: emp.designation,
      salary: emp.salary,
      status: emp.status
    });
    setShowEmpModal(true);
  };

  const handleDeleteEmp = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) return;
    try {
      await api.deleteEmployee(id);
      setToast({ msg: "Employee deleted successfully!", type: "success" });
      loadData();
    } catch (e) {
      setToast({ msg: "Cannot delete employee: " + e.message, type: "error" });
    }
  };

  // Attendance submissions
  const handleAttnSubmit = async () => {
    if (!attnForm.employeeId) return setToast({ msg: "Select an employee", type: "error" });
    setSaving(true);
    try {
      await api.logAttendance({
        employeeId: +attnForm.employeeId,
        date: new Date(attnDate).toISOString(),
        checkIn: attnForm.checkIn,
        checkOut: attnForm.checkOut || "",
        status: attnForm.status
      });
      setToast({ msg: "Attendance logged successfully!", type: "success" });
      setShowAttnModal(false);
      setAttnForm({ employeeId: "", checkIn: "09:00 AM", checkOut: "", status: defaultAttnStatus });
      loadData();
    } catch (e) {
      setToast({ msg: e.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleCheckOut = async (record) => {
    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      await api.updateAttendance(record.id, {
        ...record,
        checkOut: timeStr
      });
      setToast({ msg: "Checked out successfully!", type: "success" });
      loadData();
    } catch (e) {
      setToast({ msg: e.message, type: "error" });
    }
  };

  // Leave submissions
  const handleLeaveSubmit = async () => {
    if (!leaveForm.employeeId || !leaveForm.startDate || !leaveForm.endDate) {
      return setToast({ msg: "Employee and leave dates are required", type: "error" });
    }
    setSaving(true);
    try {
      await api.createLeave({
        employeeId: +leaveForm.employeeId,
        leaveType: leaveForm.leaveType,
        startDate: new Date(leaveForm.startDate).toISOString(),
        endDate: new Date(leaveForm.endDate).toISOString(),
        reason: leaveForm.reason,
        status: "Pending"
      });
      setToast({ msg: "Leave requested successfully!", type: "success" });
      setShowLeaveModal(false);
      setForm ? setForm : null; // safegaurd
      setLeaveForm({ employeeId: "", leaveType: defaultLeaveType, startDate: "", endDate: "", reason: "" });
      loadData();
    } catch (e) {
      setToast({ msg: e.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateLeave = async (id, status) => {
    try {
      await api.updateLeaveStatus(id, status);
      setToast({ msg: `Leave request ${status.toLowerCase()}!`, type: "success" });
      loadData();
    } catch (e) {
      setToast({ msg: e.message, type: "error" });
    }
  };

  const fEmp = (k) => (v) => setEmpForm(p => ({ ...p, [k]: v }));
  const fAttn = (k) => (v) => setAttnForm(p => ({ ...p, [k]: v }));
  const fLeave = (k) => (v) => setLeaveForm(p => ({ ...p, [k]: v }));

  if (loading && employees.length === 0) return <LoadingState />;
  if (error) return <ErrorState msg={error} onRetry={loadData} />;

  // Quick stats
  // Apply dynamic visibility filters:
  let visibleEmployees = employees;
  if (isProjectManager) {
    visibleEmployees = employees.filter(e => e.department !== "HR");
  } else if (isRegularEmployee) {
    visibleEmployees = myEmployee ? [myEmployee] : [];
  }

  let visibleAttendance = attendance;
  if (isProjectManager) {
    visibleAttendance = attendance.filter(a => a.employee?.department !== "HR");
  } else if (isRegularEmployee) {
    visibleAttendance = myEmployee ? attendance.filter(a => a.employeeId === myEmployee.id) : [];
  }

  let visibleLeaves = leaves;
  if (isProjectManager) {
    visibleLeaves = leaves.filter(l => l.employee?.department !== "HR");
  } else if (isRegularEmployee) {
    visibleLeaves = myEmployee ? leaves.filter(l => l.employeeId === myEmployee.id) : [];
  }

  // Quick stats computed on filtered lists
  const activeCount = visibleEmployees.filter(e => e.status === defaultEmpStatus).length;
  const presentToday = visibleAttendance.filter(a => a.status === defaultAttnStatus || a.status === "Half-Day").length;
  const pendingLeaves = visibleLeaves.filter(l => l.status === pendingLeaveStatus).length;

  return (
    <div className="fi">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      <STitle title="HR Management System (HRMS)" sub="Manage employee directories, verify attendance logs, and track leave requests." 
        action={
          <div style={{ display: "flex", gap: 10 }}>
            {tab === "employees" && isSuperOrHR && (
              <Btn icon={Plus} onClick={() => { setEditingEmp(null); setEmpForm({ name: "", email: "", phone: "", department: defaultDept, designation: "", salary: 0, status: defaultEmpStatus }); setShowEmpModal(true); }}>
                Add Employee
              </Btn>
            )}
            {tab === "attendance" && (isSuperOrHR || isProjectManager || (isRegularEmployee && myEmployee)) && (
              <Btn icon={Clock} onClick={() => setShowAttnModal(true)}>
                Log Attendance
              </Btn>
            )}
            {tab === "leaves" && (isSuperOrHR || isProjectManager || (isRegularEmployee && myEmployee)) && (
              <Btn icon={FileText} onClick={() => setShowLeaveModal(true)}>
                Request Leave
              </Btn>
            )}
          </div>
        }
      />

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
        <Stat icon={Users} label={isRegularEmployee ? "My Profile Status" : "Active Employees"} value={isRegularEmployee ? (myEmployee?.status || "Active") : activeCount} color={C.blue} />
        <Stat icon={Calendar} label={isRegularEmployee ? "My Check-Ins" : "Present Today"} value={presentToday} color={C.teal} />
        <Stat icon={FileText} label={isRegularEmployee ? "My Pending Leaves" : "Pending Leave Requests"} value={pendingLeaves} color={C.amb} />
      </div>

      {/* Custom Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.bord}`, marginBottom: 20, gap: 10 }}>
        {[
          ...((isSuperOrHR || isProjectManager) ? [
            { id: "employees", label: isProjectManager ? "Team Members" : "Employee Directory", count: visibleEmployees.length },
            { id: "attendance", label: isProjectManager ? "Team Attendance" : "Attendance Logs", count: visibleAttendance.length },
            { id: "leaves", label: isProjectManager ? "Team Leave Requests" : "Leave Requests", count: visibleLeaves.length }
          ] : [
            { id: "profile", label: "My Profile" },
            { id: "attendance", label: "My Attendance Logs", count: visibleAttendance.length },
            { id: "leaves", label: "My Leave Requests", count: visibleLeaves.length }
          ])
        ].map(t => {
          const on = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                background: "none", border: "none", borderBottom: on ? `2px solid ${C.gold}` : "2px solid transparent",
                color: on ? C.gold : C.mute, fontSize: 13, fontWeight: on ? 600 : 400, padding: "8px 16px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s"
              }}
            >
              {t.label}
              {t.count !== undefined && (
                <span style={{ fontSize: 10, background: on ? `${C.gold}20` : C.raise, color: on ? C.gold : C.mute, padding: "1px 6px", borderRadius: 10 }}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Profile Tab (Employee Portal) */}
      {tab === "profile" && (
        <div style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 14, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24, borderBottom: `1px solid ${C.bord}`, paddingBottom: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: `${C.gold}18`, display: "flex", alignItems: "center", justifyContent: "center", color: C.gold }}>
              <Users size={32} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.txt }}>{myEmployee?.name || currentUser?.name}</h3>
              <p style={{ margin: "4px 0 0 0", fontSize: 13, color: C.sub }}>{myEmployee?.designation || currentUser?.role} · {myEmployee?.employeeCode || "Pending Employee ID"}</p>
            </div>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            <div>
              <span style={{ color: C.mute, display: "block", fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Email Address</span>
              <span style={{ color: C.txt, fontSize: 13, fontWeight: 500 }}>{myEmployee?.email || currentUser?.email}</span>
            </div>
            <div>
              <span style={{ color: C.mute, display: "block", fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Phone Number</span>
              <span style={{ color: C.txt, fontSize: 13, fontWeight: 500 }}>{myEmployee?.phone || "--"}</span>
            </div>
            <div>
              <span style={{ color: C.mute, display: "block", fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Department</span>
              <span style={{ color: C.txt, fontSize: 13, fontWeight: 500 }}>{myEmployee?.department || "General"}</span>
            </div>
            <div>
              <span style={{ color: C.mute, display: "block", fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Date of Joining</span>
              <span style={{ color: C.txt, fontSize: 13, fontWeight: 500 }}>{myEmployee ? new Date(myEmployee.dateOfJoining).toLocaleDateString() : "--"}</span>
            </div>
            <div>
              <span style={{ color: C.mute, display: "block", fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Monthly Salary</span>
              <span style={{ color: C.gold, fontSize: 13, fontWeight: 600 }}>₹{myEmployee?.salary?.toLocaleString() || "0"}</span>
            </div>
            <div>
              <span style={{ color: C.mute, display: "block", fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Employment Status</span>
              <span style={{ color: C.txt, fontSize: 13 }}><Badge s={myEmployee?.status || "Active"} /></span>
            </div>
          </div>
        </div>
      )}

      {/* Employees Tab */}
      {tab === "employees" && (
        <div style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 14, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.bord}`, background: C.raise }}>
                {["Code", "Name", "Department", "Designation", "Salary", "Status", "Joined", ...(isSuperOrHR ? ["Actions"] : [])].map(h => (
                  <th key={h} style={{ padding: "12px 18px", color: C.mute, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleEmployees.map(emp => (
                <tr key={emp.id} style={{ borderBottom: `1px solid ${C.bord}`, fontSize: 13, color: C.txt }}>
                  <td style={{ padding: "14px 18px", fontWeight: 700, fontFamily: "monospace", color: C.gold }}>{emp.employeeCode}</td>
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ fontWeight: 600 }}>{emp.name}</div>
                    <div style={{ fontSize: 11, color: C.mute }}>{emp.email} · {emp.phone}</div>
                  </td>
                  <td style={{ padding: "14px 18px" }}>{emp.department}</td>
                  <td style={{ padding: "14px 18px" }}>{emp.designation}</td>
                  <td style={{ padding: "14px 18px", fontWeight: 600, color: C.gold }}>
                    {isSuperOrHR ? `₹${emp.salary.toLocaleString()}` : "Confidential"}
                  </td>
                  <td style={{ padding: "14px 18px" }}><Badge s={emp.status} /></td>
                  <td style={{ padding: "14px 18px", fontSize: 12, color: C.sub }}>
                    {new Date(emp.dateOfJoining).toLocaleDateString()}
                  </td>
                  {isSuperOrHR && (
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <Btn v="outline" icon={Edit} onClick={() => handleEditEmp(emp)} style={{ padding: 6 }} title="Edit" />
                        <Btn v="outline" icon={Trash2} onClick={() => handleDeleteEmp(emp.id)} style={{ padding: 6, color: C.red }} title="Delete" />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Attendance Tab */}
      {tab === "attendance" && (
        <div>
          {(isSuperOrHR || isProjectManager) && (
            <div style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 14, padding: "14px 18px", marginBottom: 14, display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 13, color: C.sub, fontWeight: 500 }}>Filter Date:</span>
              <input type="date" value={attnDate} onChange={(e) => setAttnDate(e.target.value)}
                style={{
                  background: C.bg, border: `1px solid ${C.bord}`, borderRadius: 8, padding: "6px 12px",
                  color: C.txt, outline: "none", fontSize: 13, cursor: "pointer"
                }}
              />
            </div>
          )}

          <div style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 14, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.bord}`, background: C.raise }}>
                  {["Code", "Employee", "Date", "Check-In", "Check-Out", "Status", "Actions"].map(h => (
                    <th key={h} style={{ padding: "12px 18px", color: C.mute, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 24, textAlign: "center", color: C.mute, fontSize: 13 }}>No attendance records found.</td>
                  </tr>
                ) : visibleAttendance.map(record => {
                  const canCheckOut = isSuperOrHR || isProjectManager || (myEmployee && record.employeeId === myEmployee.id);
                  return (
                    <tr key={record.id} style={{ borderBottom: `1px solid ${C.bord}`, fontSize: 13, color: C.txt }}>
                      <td style={{ padding: "14px 18px", fontFamily: "monospace", color: C.gold }}>{record.attendanceCode}</td>
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ fontWeight: 600 }}>{record.employee?.name || `Employee #${record.employeeId}`}</div>
                        <div style={{ fontSize: 11, color: C.mute }}>{record.employee?.employeeCode} · {record.employee?.designation}</div>
                      </td>
                      <td style={{ padding: "14px 18px" }}>{new Date(record.date).toLocaleDateString()}</td>
                      <td style={{ padding: "14px 18px", color: C.teal, fontWeight: 500 }}>{record.checkIn}</td>
                      <td style={{ padding: "14px 18px", color: record.checkOut ? C.teal : C.mute }}>{record.checkOut || "--"}</td>
                      <td style={{ padding: "14px 18px" }}><Badge s={record.status} /></td>
                      <td style={{ padding: "14px 18px" }}>
                        {!record.checkOut && record.status === "Present" && canCheckOut && (
                          <Btn v="outline" icon={Clock} onClick={() => handleCheckOut(record)}>Check Out</Btn>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Leaves Tab */}
      {tab === "leaves" && (
        <div style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 14, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.bord}`, background: C.raise }}>
                {["Code", "Employee", "Leave Type", "Start Date", "End Date", "Reason", "Status", ...((isSuperOrHR || isProjectManager) ? ["Actions"] : [])].map(h => (
                  <th key={h} style={{ padding: "12px 18px", color: C.mute, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleLeaves.length === 0 ? (
                <tr>
                  <td colSpan={isSuperOrHR || isProjectManager ? 8 : 7} style={{ padding: 24, textAlign: "center", color: C.mute, fontSize: 13 }}>No leave requests logged.</td>
                </tr>
              ) : visibleLeaves.map(req => (
                <tr key={req.id} style={{ borderBottom: `1px solid ${C.bord}`, fontSize: 13, color: C.txt }}>
                  <td style={{ padding: "14px 18px", fontFamily: "monospace", color: C.gold }}>{req.leaveCode}</td>
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ fontWeight: 600 }}>{req.employee?.name || `Employee #${req.employeeId}`}</div>
                    <div style={{ fontSize: 11, color: C.mute }}>{req.employee?.employeeCode} · {req.employee?.designation}</div>
                  </td>
                  <td style={{ padding: "14px 18px" }}>{req.leaveType}</td>
                  <td style={{ padding: "14px 18px" }}>{new Date(req.startDate).toLocaleDateString()}</td>
                  <td style={{ padding: "14px 18px" }}>{new Date(req.endDate).toLocaleDateString()}</td>
                  <td style={{ padding: "14px 18px", color: C.sub, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={req.reason}>{req.reason}</td>
                  <td style={{ padding: "14px 18px" }}><Badge s={req.status} /></td>
                  {(isSuperOrHR || isProjectManager) && (
                    <td style={{ padding: "14px 18px" }}>
                      {req.status === "Pending" && (
                        <div style={{ display: "flex", gap: 8 }}>
                          <Btn icon={Check} onClick={() => handleUpdateLeave(req.id, "Approved")} style={{ background: C.teal, padding: "4px 8px" }} />
                          <Btn icon={X} onClick={() => handleUpdateLeave(req.id, "Rejected")} style={{ background: C.red, padding: "4px 8px" }} />
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Employee Modal */}
      {showEmpModal && (
        <Modal title={editingEmp ? "Edit Employee" : "Add Employee"} onClose={() => setShowEmpModal(false)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <Field label="Full Name" required>
                <Input value={empForm.name} onChange={fEmp("name")} placeholder="e.g. John Doe" />
              </Field>
            </div>
            <Field label="Email" required>
              <Input type="email" value={empForm.email} onChange={fEmp("email")} placeholder="e.g. john@builderpro.com" />
            </Field>
            <Field label="Phone">
              <Input value={empForm.phone} onChange={fEmp("phone")} placeholder="e.g. 9800000000" />
            </Field>
            <Field label="Department">
              <Select value={empForm.department} onChange={fEmp("department")} options={departments} />
            </Field>
            <Field label="Designation" required>
              <Input value={empForm.designation} onChange={fEmp("designation")} placeholder="e.g. Supervisor" />
            </Field>
            <Field label="Monthly Salary (₹)">
              <Input type="number" value={empForm.salary} onChange={fEmp("salary")} placeholder="60000" />
            </Field>
            <Field label="Status">
              <Select value={empForm.status} onChange={fEmp("status")} options={employeeStatuses} />
            </Field>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.bord}` }}>
            <Btn v="outline" onClick={() => setShowEmpModal(false)}>Cancel</Btn>
            <Btn onClick={handleEmpSubmit} disabled={saving}>{saving ? "Saving..." : editingEmp ? "Save Changes" : "Create Employee"}</Btn>
          </div>
        </Modal>
      )}

      {/* Attendance Modal */}
      {showAttnModal && (() => {
        const selectedEmp = employees.find(e => e.id === parseInt(attnForm.employeeId));
        return (
          <Modal title="Log Attendance" onClose={() => setShowAttnModal(false)}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Select Employee" required>
                {isRegularEmployee ? (
                  <div style={{ padding: "10px 14px", background: C.raise, border: `1px solid ${C.bord}`, borderRadius: 8, fontSize: 13, color: C.txt, fontWeight: 600 }}>
                    {myEmployee?.name || currentUser?.name} ({myEmployee?.employeeCode || "My Account"})
                  </div>
                ) : (
                  <Select value={attnForm.employeeId} onChange={fAttn("employeeId")} 
                    options={[{ label: "-- Select Employee --", value: "" }, ...visibleEmployees.map(e => ({ label: `${e.name} (${e.department})`, value: e.id }))]} 
                  />
                )}
              </Field>
              {selectedEmp && !isRegularEmployee && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, padding: 12, background: C.raise, borderRadius: 8, fontSize: 12, border: `1px solid ${C.bord}` }}>
                  <div><span style={{ color: C.mute, display: "block", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Employee ID</span><span style={{ color: C.gold, fontWeight: 600 }}>{selectedEmp.employeeCode}</span></div>
                  <div><span style={{ color: C.mute, display: "block", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Department</span><span style={{ color: C.txt }}>{selectedEmp.department}</span></div>
                  <div><span style={{ color: C.mute, display: "block", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Designation</span><span style={{ color: C.txt }}>{selectedEmp.designation}</span></div>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Check-In Time" required>
                  <Input value={attnForm.checkIn} onChange={fAttn("checkIn")} placeholder="09:00 AM" />
                </Field>
                <Field label="Status">
                  <Select value={attnForm.status} onChange={fAttn("status")} options={attendanceStatuses} />
                </Field>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.bord}` }}>
              <Btn v="outline" onClick={() => setShowAttnModal(false)}>Cancel</Btn>
              <Btn onClick={handleAttnSubmit} disabled={saving}>{saving ? "Logging..." : "Log Attendance"}</Btn>
            </div>
          </Modal>
        );
      })()}

      {/* Leave Request Modal */}
      {showLeaveModal && (() => {
        const selectedEmp = employees.find(e => e.id === parseInt(leaveForm.employeeId));
        return (
          <Modal title="Request Leave" onClose={() => setShowLeaveModal(false)}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Select Employee" required>
                {isRegularEmployee ? (
                  <div style={{ padding: "10px 14px", background: C.raise, border: `1px solid ${C.bord}`, borderRadius: 8, fontSize: 13, color: C.txt, fontWeight: 600 }}>
                    {myEmployee?.name || currentUser?.name} ({myEmployee?.employeeCode || "My Account"})
                  </div>
                ) : (
                  <Select value={leaveForm.employeeId} onChange={fLeave("employeeId")} 
                    options={[{ label: "-- Select Employee --", value: "" }, ...visibleEmployees.map(e => ({ label: `${e.name} (${e.designation})`, value: e.id }))]} 
                  />
                )}
              </Field>
              {selectedEmp && !isRegularEmployee && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, padding: 12, background: C.raise, borderRadius: 8, fontSize: 12, border: `1px solid ${C.bord}` }}>
                  <div><span style={{ color: C.mute, display: "block", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Employee ID</span><span style={{ color: C.gold, fontWeight: 600 }}>{selectedEmp.employeeCode}</span></div>
                  <div><span style={{ color: C.mute, display: "block", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Department</span><span style={{ color: C.txt }}>{selectedEmp.department}</span></div>
                  <div><span style={{ color: C.mute, display: "block", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Designation</span><span style={{ color: C.txt }}>{selectedEmp.designation}</span></div>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Start Date" required>
                  <Input type="date" value={leaveForm.startDate} onChange={fLeave("startDate")} />
                </Field>
                <Field label="End Date" required>
                  <Input type="date" value={leaveForm.endDate} onChange={fLeave("endDate")} />
                </Field>
              </div>
              <Field label="Leave Type">
                <Select value={leaveForm.leaveType} onChange={fLeave("leaveType")} options={leaveTypes} />
              </Field>
              <Field label="Reason">
                <Input value={leaveForm.reason} onChange={fLeave("reason")} placeholder="Reason for leave" />
              </Field>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.bord}` }}>
              <Btn v="outline" onClick={() => setShowLeaveModal(false)}>Cancel</Btn>
              <Btn onClick={handleLeaveSubmit} disabled={saving}>{saving ? "Requesting..." : "Submit Request"}</Btn>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}
