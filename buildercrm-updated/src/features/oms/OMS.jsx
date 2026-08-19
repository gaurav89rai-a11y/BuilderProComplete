import { useState, useEffect, useCallback } from "react";
import { ShoppingCart, Plus, Trash2, Eye, CheckCircle, Clock, Trash, DollarSign, Package } from "lucide-react";
import { api } from "../../services/api.js";
import { C } from "../../config/theme.js";
import { Badge, Btn, Modal, Field, Input, Select, LoadingState, ErrorState, Toast, STitle, Stat } from "../../components/ui";
import { useConfig } from "../../config/ConfigContext.jsx";

export function OMS() {
  const [orders, setOrders] = useState([]);
  const [projects, setProjects] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [dbBrands, setDbBrands] = useState([]);
  const { orderStatus, getDefault } = useConfig();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  // Pagination states
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const defaultStatus = getDefault("orderStatus", "Pending");

  // New Order Form states
  const [orderForm, setOrderForm] = useState({ projectId: "", vendorName: "", status: defaultStatus });
  const [orderItems, setOrderItems] = useState([
    { category: "", brand: "", itemName: "", itemCode: "", quantity: 1, unitPrice: 0, grade: "", unit: "", gst: 0, currentStock: 0, warehouse: "", lastPurchaseRate: 0 }
  ]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ords, projs, mats, cats, brs] = await Promise.all([
        api.getOrders(),
        api.getProjects(),
        api.getMaterials(),
        api.getCategories(),
        api.getBrands()
      ]);
      setOrders(ords);
      setProjects(projs);
      setMaterials(mats);
      setDbCategories(cats);
      setDbBrands(brs);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateOrder = async () => {
    if (!orderForm.projectId || !orderForm.vendorName) {
      return setToast({ msg: "Project and Vendor Name are required", type: "error" });
    }
    const validItems = orderItems.filter(item => item.itemCode && item.quantity > 0 && item.unitPrice >= 0);
    if (validItems.length === 0) {
      return setToast({ msg: "At least one valid order item is required (make sure Category, Brand, and Item Name are selected)", type: "error" });
    }

    setSaving(true);
    try {
      await api.createOrder({
        projectId: +orderForm.projectId,
        vendorName: orderForm.vendorName,
        status: orderForm.status,
        orderItems: validItems.map(item => ({
          itemName: `${item.itemName} [${item.itemCode}]`,
          quantity: +item.quantity,
          unitPrice: +item.unitPrice,
          totalPrice: item.quantity * item.unitPrice
        }))
      });

      setToast({ msg: "Purchase Order created successfully!", type: "success" });
      setShowAddModal(false);
      setOrderForm({ projectId: "", vendorName: "", status: defaultStatus });
      setOrderItems([{ category: "", brand: "", itemName: "", itemCode: "", quantity: 1, unitPrice: 0, grade: "", unit: "", gst: 0, currentStock: 0, warehouse: "", lastPurchaseRate: 0 }]);
      loadData();
    } catch (e) {
      setToast({ msg: e.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.updateOrderStatus(id, newStatus);
      setToast({ msg: `Order status updated to ${newStatus}!`, type: "success" });
      loadData();
    } catch (e) {
      setToast({ msg: e.message, type: "error" });
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm("Are you sure you want to cancel and delete this order?")) return;
    try {
      await api.deleteOrder(id);
      setToast({ msg: "Order deleted successfully!", type: "success" });
      loadData();
    } catch (e) {
      setToast({ msg: e.message, type: "error" });
    }
  };

  // Dynamically manage order items inside form
  const addFormItem = () => {
    setOrderItems(prev => [...prev, { category: "", brand: "", itemName: "", itemCode: "", quantity: 1, unitPrice: 0, grade: "", unit: "", gst: 0, currentStock: 0, warehouse: "", lastPurchaseRate: 0 }]);
  };

  const removeFormItem = (index) => {
    if (orderItems.length === 1) return;
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, key, val) => {
    setOrderItems(prev => {
      const copy = [...prev];
      const row = { ...copy[index] };
      row[key] = val;

      if (key === "category") {
        row.brand = "";
        row.itemName = "";
        row.itemCode = "";
        row.grade = "";
        row.unit = "";
        row.gst = 0;
        row.currentStock = 0;
        row.warehouse = "";
        row.lastPurchaseRate = 0;
        row.unitPrice = 0;
      } else if (key === "brand") {
        row.itemName = "";
        row.itemCode = "";
        row.grade = "";
        row.unit = "";
        row.gst = 0;
        row.currentStock = 0;
        row.warehouse = "";
        row.lastPurchaseRate = 0;
        row.unitPrice = 0;
      } else if (key === "itemName") {
        const mat = materials.find(m => m.name === val && m.category === row.category && m.brand === row.brand);
        if (mat) {
          row.itemCode = mat.code;
          row.grade = "Standard";
          row.unit = mat.unit;
          row.gst = mat.gst;
          row.currentStock = mat.currentStock || 0;
          row.warehouse = mat.warehouse || "WH-Main-01";
          row.lastPurchaseRate = mat.price;
          row.unitPrice = mat.price;
        } else {
          row.itemCode = "";
          row.grade = "";
          row.unit = "";
          row.gst = 0;
          row.currentStock = 0;
          row.warehouse = "";
          row.lastPurchaseRate = 0;
          row.unitPrice = 0;
        }
      }
      copy[index] = row;
      return copy;
    });
  };

  const fOrder = (k) => (v) => setOrderForm(p => ({ ...p, [k]: v }));

  if (loading && orders.length === 0) return <LoadingState />;
  if (error) return <ErrorState msg={error} onRetry={loadData} />;

  // Pagination calculations
  const totalRecords = orders.length;
  const totalPages = Math.ceil(totalRecords / pageSize);
  const adjustedPage = Math.min(currentPage, totalPages || 1);
  const startIndex = (adjustedPage - 1) * pageSize;
  const paginatedOrders = orders.slice(startIndex, startIndex + pageSize);

  // Metrics
  const totalCount = orders.length;
  const pendingCount = orders.filter(o => o.status === defaultStatus).length;
  const deliveredCount = orders.filter(o => o.status === getDefault("orderStatus", "Delivered")).length;
  const totalCost = orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);

  const orderFormTotal = orderItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice || 0), 0);

  return (
    <div className="fi">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      <STitle title="Procurement & Order Management (OMS)" sub="Manage construction raw materials purchase orders and suppliers." 
        action={
          <Btn icon={Plus} onClick={() => setShowAddModal(true)}>
            New Purchase Order
          </Btn>
        }
      />

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        <Stat icon={ShoppingCart} label="Total Orders" value={totalCount} color={C.blue} />
        <Stat icon={Clock} label="Pending Orders" value={pendingCount} color={C.amb} />
        <Stat icon={CheckCircle} label="Delivered Orders" value={deliveredCount} color={C.teal} />
        <Stat icon={DollarSign} label="Procurement Cost" value={`₹${totalCost.toLocaleString()}`} color={C.gold} />
      </div>

      {/* Orders Table */}
      <div style={{ background: C.card, border: `1px solid ${C.bord}`, borderTopLeftRadius: 14, borderTopRightRadius: 14, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.bord}`, background: C.raise }}>
              {["Order No.", "Project Name", "Vendor Name", "Order Date", "Total Amount", "Status", "Actions"].map(h => (
                <th key={h} style={{ padding: "12px 18px", color: C.mute, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedOrders.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 24, textAlign: "center", color: C.mute, fontSize: 13 }}>No orders recorded. Click New Purchase Order to add one.</td>
              </tr>
            ) : paginatedOrders.map(order => (
              <tr key={order.id} style={{ borderBottom: `1px solid ${C.bord}`, fontSize: 13, color: C.txt }}>
                <td style={{ padding: "14px 18px", fontWeight: 600, fontFamily: "monospace", color: C.gold }}>{order.orderNumber}</td>
                <td style={{ padding: "14px 18px", fontWeight: 500 }}>{order.project?.name || `Project #${order.projectId}`}</td>
                <td style={{ padding: "14px 18px" }}>{order.vendorName}</td>
                <td style={{ padding: "14px 18px" }}>{new Date(order.orderDate).toLocaleDateString()}</td>
                <td style={{ padding: "14px 18px", fontWeight: 600 }}>₹{order.totalAmount.toLocaleString()}</td>
                <td style={{ padding: "14px 18px" }}><Badge s={order.status} /></td>
                <td style={{ padding: "14px 18px" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn v="outline" icon={Eye} onClick={() => { setSelectedOrder(order); setShowViewModal(true); }} style={{ padding: 6 }} title="View Items" />
                    {order.status === "Pending" && (
                      <>
                        <Btn v="outline" icon={CheckCircle} onClick={() => handleUpdateStatus(order.id, "Delivered")} style={{ padding: 6, color: C.teal }} title="Mark Delivered" />
                        <Btn v="outline" icon={Trash2} onClick={() => handleDeleteOrder(order.id)} style={{ padding: 6, color: C.red }} title="Cancel/Delete" />
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px", background: C.raise, border: `1px solid ${C.bord}`, borderTop: "none", borderBottomLeftRadius: 14, borderBottomRightRadius: 14, fontSize: 13, color: C.sub }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>Show Records:</span>
          <div style={{ width: 80 }}>
            <Select
              value={pageSize}
              onChange={(val) => {
                setPageSize(parseInt(val));
                setCurrentPage(1);
              }}
              options={[
                { value: 5, label: "5" },
                { value: 10, label: "10" },
                { value: 50, label: "50" },
                { value: 100, label: "100" }
              ]}
            />
          </div>
          <span style={{ marginLeft: 8 }}>
            Showing {totalRecords === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + pageSize, totalRecords)} of {totalRecords} records
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn
            size="sm"
            v="outline"
            disabled={adjustedPage <= 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          >
            Previous
          </Btn>
          <Btn
            size="sm"
            v="outline"
            disabled={adjustedPage >= totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          >
            Next
          </Btn>
        </div>
      </div>

      {/* Add Order Modal */}
      {showAddModal && (
        <Modal title="Create Purchase Order" onClose={() => setShowAddModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Select Project" required>
                <Select value={orderForm.projectId} onChange={fOrder("projectId")} 
                  options={[{ label: "-- Select Project --", value: "" }, ...projects.map(p => ({ label: p.name, value: p.id }))]} 
                />
              </Field>
              <Field label="Vendor Name" required>
                <Input value={orderForm.vendorName} onChange={fOrder("vendorName")} placeholder="e.g. Ultratech Cement Ltd" />
              </Field>
            </div>
            <Field label="Initial Status">
              <Select value={orderForm.status} onChange={fOrder("status")} options={orderStatus} />
            </Field>

            <div style={{ borderTop: `1px solid ${C.bord}`, marginTop: 10, paddingTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.txt }}>Order Items</span>
                <Btn v="outline" icon={Plus} onClick={addFormItem} style={{ padding: "4px 8px", fontSize: 11 }}>Add Item</Btn>
              </div>

              {orderItems.map((item, idx) => {
                const categoryOptions = [
                  { label: "-- Category --", value: "" },
                  ...dbCategories.map(c => ({ label: c.name, value: c.name }))
                ];

                const brandOptions = [
                  { label: "-- Brand --", value: "" },
                  ...Array.from(new Set(materials.filter(m => m.category === item.category).map(m => m.brand))).sort().map(b => ({ label: b, value: b }))
                ];

                const nameOptions = [
                  { label: "-- Item Name --", value: "" },
                  ...materials.filter(m => m.category === item.category && m.brand === item.brand).map(m => ({ label: m.name, value: m.name }))
                ];

                return (
                  <div key={idx} style={{ borderBottom: idx < orderItems.length - 1 ? `1px dashed ${C.bord}` : "none", paddingBottom: 12, marginBottom: 12 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 1.5fr 0.8fr 1fr auto", gap: 8, alignItems: "flex-end" }}>
                      <Field label={idx === 0 ? "Category *" : ""}>
                        <Select value={item.category} onChange={(v) => handleItemChange(idx, "category", v)} options={categoryOptions} />
                      </Field>
                      <Field label={idx === 0 ? "Brand *" : ""}>
                        <Select value={item.brand} onChange={(v) => handleItemChange(idx, "brand", v)} options={brandOptions} disabled={!item.category} />
                      </Field>
                      <Field label={idx === 0 ? "Item Name *" : ""}>
                        <Select value={item.itemName} onChange={(v) => handleItemChange(idx, "itemName", v)} options={nameOptions} disabled={!item.brand} />
                      </Field>
                      <Field label={idx === 0 ? "Qty" : ""}>
                        <Input type="number" value={item.quantity} onChange={(v) => handleItemChange(idx, "quantity", +v)} disabled={!item.itemName} />
                      </Field>
                      <Field label={idx === 0 ? "Unit Price (₹)" : ""}>
                        <Input type="number" value={item.unitPrice} onChange={(v) => handleItemChange(idx, "unitPrice", +v)} disabled={!item.itemName} />
                      </Field>
                      <div style={{ paddingBottom: 6 }}>
                        <Btn v="outline" icon={Trash} onClick={() => removeFormItem(idx)} disabled={orderItems.length === 1} style={{ padding: 8, color: C.red }} />
                      </div>
                    </div>

                    {item.itemName && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, padding: "8px 12px", background: C.raise, borderRadius: 8, fontSize: 11, marginTop: 8, border: `1px solid ${C.bord}` }}>
                        <div><span style={{ color: C.mute, fontWeight: 700, display: "block", fontSize: 9 }}>CODE & BRAND</span><span style={{ color: C.txt }}>{item.itemCode} (Brand: {item.brand})</span></div>
                        <div><span style={{ color: C.mute, fontWeight: 700, display: "block", fontSize: 9 }}>UNIT & GST</span><span style={{ color: C.txt }}>{item.unit} · {item.gst}% GST</span></div>
                        <div><span style={{ color: C.mute, fontWeight: 700, display: "block", fontSize: 9 }}>CURRENT STOCK</span><span style={{ color: C.teal, fontWeight: 600 }}>{item.currentStock} {item.unit} in {item.warehouse}</span></div>
                        <div><span style={{ color: C.mute, fontWeight: 700, display: "block", fontSize: 9 }}>LAST PURCHASE RATE</span><span style={{ color: C.gold, fontWeight: 600 }}>₹{item.lastPurchaseRate}</span></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: C.raise, borderRadius: 8, marginTop: 10 }}>
              <span style={{ fontSize: 13, color: C.mute, fontWeight: 500 }}>Estimated Order Total:</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: C.gold }}>₹{orderFormTotal.toLocaleString()}</span>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.bord}` }}>
            <Btn v="outline" onClick={() => setShowAddModal(false)}>Cancel</Btn>
            <Btn onClick={handleCreateOrder} disabled={saving}>{saving ? "Submitting..." : "Submit Purchase Order"}</Btn>
          </div>
        </Modal>
      )}

      {/* View Order Modal */}
      {showViewModal && selectedOrder && (
        <Modal title={`Purchase Order Details - ${selectedOrder.orderNumber}`} onClose={() => setShowViewModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, fontSize: 13, color: C.txt }}>
              <div>
                <span style={{ color: C.mute, display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Project</span>
                <span style={{ fontWeight: 600 }}>{selectedOrder.project?.name || `Project #${selectedOrder.projectId}`}</span>
              </div>
              <div>
                <span style={{ color: C.mute, display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Vendor</span>
                <span style={{ fontWeight: 600 }}>{selectedOrder.vendorName}</span>
              </div>
              <div>
                <span style={{ color: C.mute, display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Order Date</span>
                <span>{new Date(selectedOrder.orderDate).toLocaleDateString()}</span>
              </div>
              <div>
                <span style={{ color: C.mute, display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Status</span>
                <Badge s={selectedOrder.status} />
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${C.bord}`, marginTop: 10, paddingTop: 14 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: C.txt }}>Nested Items List</h4>
              <div style={{ border: `1px solid ${C.bord}`, borderRadius: 10, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.bord}`, background: C.raise }}>
                      {["Item Description", "Quantity", "Unit Price", "Total Price"].map(h => (
                        <th key={h} style={{ padding: "8px 12px", color: C.mute, fontWeight: 700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.orderItems?.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${C.bord}` }}>
                        <td style={{ padding: "10px 12px", color: C.txt, fontWeight: 600 }}>{item.itemName}</td>
                        <td style={{ padding: "10px 12px", color: C.txt }}>{item.quantity}</td>
                        <td style={{ padding: "10px 12px", color: C.txt }}>₹{item.unitPrice.toLocaleString()}</td>
                        <td style={{ padding: "10px 12px", color: C.gold, fontWeight: 600 }}>₹{item.totalPrice.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: C.raise, borderRadius: 8 }}>
              <span style={{ fontSize: 13, color: C.mute }}>Grand Total:</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: C.gold }}>₹{selectedOrder.totalAmount.toLocaleString()}</span>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.bord}` }}>
            <Btn onClick={() => setShowViewModal(false)}>Close</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
