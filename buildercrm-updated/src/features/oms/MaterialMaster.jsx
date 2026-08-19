import { useState, useEffect } from "react";
import { Plus, Search, Trash2, Tag, Layers, RefreshCw, BarChart3, Check, HelpCircle, Package, ArrowRight, User } from "lucide-react";
import { C } from "../../config/theme.js";
import { Badge, Btn, Modal, Field, Input, Select, Stat, STitle, Toast, LoadingState, ErrorState } from "../../components/ui";
import { api } from "../../services/api.js";

const INITIAL_MATERIALS = [
  { id: 1, name: "UltraTech OPC 53 Grade Cement (50 Kg)", category: "Cement", code: "CEM-ULT-OPC53-00001", brand: "UltraTech", unit: "Bag (50 Kg)", price: 385, gst: 28, reorderLevel: 200, warehouse: "Main Warehouse", vendor: "UltraTech Cement Ltd.", hsn: "25232910", variant: "50 Kg Bag", currentStock: 450 },
  { id: 2, name: "Tata Tiscon 12mm TMT Bar", category: "Steel", code: "STL-TAT-TMT12-00002", brand: "Tata Tiscon", unit: "Tons", price: 61000, gst: 18, reorderLevel: 5, warehouse: "Steel Yard", vendor: "Tata Steel Ltd.", hsn: "72142090", variant: "12mm Rod", currentStock: 14 }
];

const MASTER_DATABASE = {
  Cement: {
    brands: ["UltraTech", "ACC", "Ambuja"],
    materials: {
      "UltraTech": [
        { name: "UltraTech OPC 53 Grade Cement (50 Kg)", code: "CEM-ULT-OPC53-00001", unit: "Bag (50 Kg)", gst: "28%", hsn: "25232910", warehouse: "Main Warehouse", vendor: "UltraTech Cement Ltd.", reorder: "200 Bag", leadTime: "3 - 5 Days", minStock: 200, maxStock: 1000 },
        { name: "UltraTech PPC Cement (50 Kg)", code: "CEM-ULT-PPC-00002", unit: "Bag (50 Kg)", gst: "28%", hsn: "25232912", warehouse: "Main Warehouse", vendor: "UltraTech Cement Ltd.", reorder: "150 Bag", leadTime: "3 - 5 Days", minStock: 150, maxStock: 800 },
        { name: "UltraTech Premium Cement (50 Kg)", code: "CEM-ULT-PREM-00003", unit: "Bag (50 Kg)", gst: "28%", hsn: "25232915", warehouse: "Main Warehouse", vendor: "UltraTech Cement Ltd.", reorder: "100 Bag", leadTime: "2 - 4 Days", minStock: 100, maxStock: 500 },
        { name: "UltraTech Weather Plus Cement (50 Kg)", code: "CEM-ULT-WTHR-00004", unit: "Bag (50 Kg)", gst: "28%", hsn: "25232920", warehouse: "Main Warehouse", vendor: "UltraTech Cement Ltd.", reorder: "200 Bag", leadTime: "3 - 5 Days", minStock: 200, maxStock: 1000 }
      ],
      "ACC": [
        { name: "ACC F2R Super Fast Cement (50 Kg)", code: "CEM-ACC-F2R-00001", unit: "Bag (50 Kg)", gst: "28%", hsn: "25232930", warehouse: "Main Warehouse", vendor: "ACC Limited", reorder: "100 Bag", leadTime: "2 - 3 Days", minStock: 100, maxStock: 600 },
        { name: "ACC Gold Water Shield (50 Kg)", code: "CEM-ACC-GOLD-00002", unit: "Bag (50 Kg)", gst: "28%", hsn: "25232935", warehouse: "Main Warehouse", vendor: "ACC Limited", reorder: "150 Bag", leadTime: "2 - 4 Days", minStock: 150, maxStock: 800 }
      ],
      "Ambuja": [
        { name: "Ambuja Kawach Cement (50 Kg)", code: "CEM-AMB-KWCH-00001", unit: "Bag (50 Kg)", gst: "28%", hsn: "25232940", warehouse: "Main Warehouse", vendor: "Ambuja Cement Ltd.", reorder: "120 Bag", leadTime: "3 - 4 Days", minStock: 120, maxStock: 700 }
      ]
    },
    variants: ["50 Kg Bag", "Bulk Loose"]
  },
  Steel: {
    brands: ["Tata Tiscon", "JSW Neosteel", "Jindal Panther"],
    materials: {
      "Tata Tiscon": [
        { name: "Tata Tiscon 12mm TMT Bar", code: "STL-TAT-TMT12-00002", unit: "Tons", gst: "18%", hsn: "72142090", warehouse: "Steel Yard", vendor: "Tata Steel Ltd.", reorder: "5 Tons", leadTime: "5 - 7 Days", minStock: 5, maxStock: 30 },
        { name: "Tata Tiscon 8mm TMT Bar", code: "STL-TAT-TMT08-00001", unit: "Tons", gst: "18%", hsn: "72142080", warehouse: "Steel Yard", vendor: "Tata Steel Ltd.", reorder: "6 Tons", leadTime: "5 - 7 Days", minStock: 6, maxStock: 40 }
      ],
      "JSW Neosteel": [
        { name: "JSW Neosteel Fe 550D TMT Bar", code: "STL-JSW-550D-00001", unit: "Tons", gst: "18%", hsn: "72142100", warehouse: "Steel Yard", vendor: "JSW Steel Ltd.", reorder: "8 Tons", leadTime: "4 - 6 Days", minStock: 8, maxStock: 50 }
      ]
    },
    variants: ["12mm Rod", "8mm Rod", "16mm Rod", "20mm Rod"]
  },
  Plumbing: {
    brands: ["Supreme Pipes", "Astral Pipes"],
    materials: {
      "Supreme Pipes": [
        { name: "Supreme PVC Pipe 25mm", code: "PLM-SUP-PVC25-00003", unit: "Meter", gst: "18%", hsn: "39172310", warehouse: "Basement Store", vendor: "Supreme Pipes Ltd.", reorder: "100 Meter", leadTime: "2 - 4 Days", minStock: 100, maxStock: 500 }
      ]
    },
    variants: ["25mm Pipe", "32mm Pipe", "50mm Pipe"]
  }
};

const SUBCATEGORIES_MAP = {
  Cement: ["OPC 53 Grade", "PPC Grade", "White Cement", "Rapid Hardening"],
  Steel: ["TMT Rebars", "Structural Steel", "Binding Wire", "Mesh"],
  Sand: ["River Sand", "M-Sand", "Plaster Sand", "Concrete Sand"],
  Aggregate: ["10mm Aggregate", "20mm Aggregate", "40mm Aggregate", "Crushed Stone"],
  Bricks: ["Red Clay Bricks", "Fly Ash Bricks", "AAC Blocks", "Concrete Blocks"],
  Blocks: ["AAC Blocks", "Concrete Solid Blocks", "Hollow Blocks"],
  Tiles: ["Ceramic Tiles", "Vitrified Tiles", "Marble Tiles", "Granite Tiles"],
  Plumbing: ["PVC Pipes", "CPVC Pipes", "Fittings", "Valves & Taps"],
  Electrical: ["Wires & Wires", "Cables", "Switches & Sockets", "Conduits"],
  Paint: ["Interior Emulsion", "Exterior Emulsion", "Primers & Putty", "Enamel Paint"],
  Hardware: ["Nails & Screws", "Hinges & Handles", "Tower Bolts", "Locks"],
  Doors: ["Flush Doors", "Wooden Doors", "PVC Doors", "Fittings"],
  Windows: ["Sliding Windows", "Casement Windows", "UPVC Windows", "Glass Panes"],
  Glass: ["Clear Glass", "Toughened Glass", "Tinted Glass", "Frosted Glass"],
  Roofing: ["GI Sheets", "Polycarbonate Sheets", "Asbestos Sheets", "Clay Roof Tiles"],
  Waterproofing: ["Liquid Membranes", "Acrylic Coatings", "Waterproofing Powders"],
  Chemicals: ["Admixtures", "Epoxy Resins", "Curing Compounds", "Sealants"],
  Wood: ["Teak Wood", "Sal Wood", "Pine Wood", "MDF Boards"],
  Plywood: ["Commercial Plywood", "Marine Plywood", "Block Boards", "Laminates"],
  HVAC: ["Copper Pipes", "Insulation Roll", "Ducting Sheets", "Grilles"],
  Safety: ["Helmets & Gloves", "Safety Shoes", "Reflective Jackets", "Safety Nets"]
};

const VARIANTS_MAP = {
  Cement: ["50 Kg Bag", "Bulk Loose", "Paper Bag"],
  Steel: ["12mm Rod", "8mm Rod", "16mm Rod", "20mm Rod", "32mm Rod"],
  Plumbing: ["25mm Pipe", "32mm Pipe", "50mm Pipe", "110mm Pipe"],
  Electrical: ["1.5 sqmm Wire", "2.5 sqmm Wire", "4.0 sqmm Wire"],
  Paint: ["4 Liters Bucket", "20 Liters Drum", "1 Liter Can"],
  Sand: ["Brass", "Tons", "Cubic Meters"],
  Aggregate: ["10mm Rod", "20mm Rod", "Crushed Stone"],
  Bricks: ["Standard Red", "Fly Ash Solid", "AAC Lightweight Block"]
};

export function MaterialMaster() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState(null);

  const [dbCategories, setDbCategories] = useState([]);
  const [dbBrands, setDbBrands] = useState([]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const data = await api.getMaterials();
      setMaterials(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch materials from local SQL database.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      const [cats, brs] = await Promise.all([
        api.getCategories(),
        api.getBrands()
      ]);
      setDbCategories(cats);
      setDbBrands(brs);
    } catch (e) {
      console.error("Failed to fetch master categories or brands", e);
    }
  };

  useEffect(() => {
    fetchMaterials();
    fetchMasterData();
  }, []);

  // Form Wizard States
  const [activeStep, setActiveStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("Cement");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedMaterialName, setSelectedMaterialName] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("");
  const [materialSearchInput, setMaterialSearchInput] = useState("");

  // Input Stock & Pricing
  const [purchasePrice, setPurchasePrice] = useState("385.00");
  const [openingStock, setOpeningStock] = useState("0");
  const [remarks, setRemarks] = useState("");

  // Pagination states
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Auto filled values computed state
  const [autoFilled, setAutoFilled] = useState({
    code: "CEM-ULT-OPC53-00001",
    unit: "Bag (50 Kg)",
    gst: "28%",
    hsn: "25232910",
    warehouse: "Main Warehouse",
    vendor: "UltraTech Cement Ltd.",
    reorder: "200 Bag",
    leadTime: "3 - 5 Days",
    minStock: 200,
    maxStock: 1000
  });

  // Handle auto-fill calculations on dropdown changes
  useEffect(() => {
    if (dbCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(dbCategories[0].name);
    }
  }, [dbCategories]);

  useEffect(() => {
    if (dbBrands.length > 0 && !selectedBrand) {
      setSelectedBrand(dbBrands[0].name);
    }
  }, [dbBrands]);

  useEffect(() => {
    if (!selectedCategory || !selectedBrand || materials.length === 0) return;

    const filteredMats = materials.filter(
      m => m.category === selectedCategory && m.brand === selectedBrand
    );

    if (filteredMats.length > 0) {
      const matched = filteredMats.find(m => m.name === selectedMaterialName);
      const targetMat = matched || filteredMats[0];
      
      setSelectedMaterialName(targetMat.name);
      setAutoFilled({
        code: targetMat.code,
        unit: targetMat.unit,
        gst: targetMat.gst + "%",
        hsn: targetMat.hsn,
        warehouse: targetMat.warehouse,
        vendor: targetMat.vendor,
        reorder: targetMat.reorderLevel,
        leadTime: "3 - 5 Days",
        minStock: targetMat.reorderLevel,
        maxStock: targetMat.reorderLevel * 5
      });
    } else {
      setSelectedMaterialName("");
      setAutoFilled({
        code: "",
        unit: "",
        gst: "",
        hsn: "",
        warehouse: "",
        vendor: "",
        reorder: "",
        leadTime: "",
        minStock: "",
        maxStock: ""
      });
    }

    const subs = SUBCATEGORIES_MAP[selectedCategory] || [];
    if (subs.length > 0) {
      if (!subs.includes(selectedSubCategory)) {
        setSelectedSubCategory(subs[0]);
      }
    } else {
      setSelectedSubCategory("");
    }
  }, [selectedCategory, selectedBrand, materials]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter]);

  const handleBrandChange = (brandVal) => {
    setSelectedBrand(brandVal);
  };

  const handleMaterialDropdownChange = (name) => {
    setSelectedMaterialName(name);
    const targetMat = materials.find(m => m.name === name);
    if (targetMat) {
      setAutoFilled({
        code: targetMat.code,
        unit: targetMat.unit,
        gst: targetMat.gst + "%",
        hsn: targetMat.hsn,
        warehouse: targetMat.warehouse,
        vendor: targetMat.vendor,
        reorder: targetMat.reorderLevel,
        leadTime: "3 - 5 Days",
        minStock: targetMat.reorderLevel,
        maxStock: targetMat.reorderLevel * 5
      });
    }
  };

  const handleMaterialSelect = (matObj) => {
    setSelectedMaterialName(matObj.name);
    setAutoFilled({
      code: matObj.code,
      unit: matObj.unit,
      gst: matObj.gst + "%",
      hsn: matObj.hsn,
      warehouse: matObj.warehouse,
      vendor: matObj.vendor,
      reorder: matObj.reorderLevel,
      leadTime: "3 - 5 Days",
      minStock: matObj.reorderLevel,
      maxStock: matObj.reorderLevel * 5
    });
  };

  const handleSave = async () => {
    if (!purchasePrice) {
      setToast({ type: "error", msg: "Please enter a Purchase Price." });
      return;
    }
    const newMat = {
      name: selectedMaterialName,
      category: selectedCategory,
      code: autoFilled.code,
      brand: selectedBrand,
      unit: autoFilled.unit,
      price: parseFloat(purchasePrice),
      gst: parseInt(autoFilled.gst),
      reorderLevel: parseInt(autoFilled.reorder),
      warehouse: autoFilled.warehouse,
      vendor: autoFilled.vendor,
      hsn: autoFilled.hsn,
      variant: selectedVariant,
      currentStock: parseInt(openingStock || 0)
    };

    try {
      const saved = await api.createMaterial(newMat);
      setMaterials([saved, ...materials]);
      setShowAddModal(false);
      setToast({ type: "success", msg: `${newMat.name} added to catalog successfully!` });
      handleReset();
    } catch (err) {
      console.error(err);
      setToast({ type: "error", msg: "Failed to save material to SQL database." });
    }
  };

  const handleReset = () => {
    setActiveStep(1);
    setSelectedCategory("Cement");
    setPurchasePrice("385.00");
    setOpeningStock("0");
    setRemarks("");
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to remove ${name} from material catalog?`)) {
      try {
        await api.deleteMaterial(id);
        setMaterials(materials.filter(m => m.id !== id));
        setToast({ type: "success", msg: `${name} removed from catalog.` });
      } catch (err) {
        console.error(err);
        setToast({ type: "error", msg: "Failed to remove material from SQL database." });
      }
    }
  };

  const filtered = materials.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === "All" || m.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  // Pagination calculations
  const totalRecords = filtered.length;
  const totalPages = Math.ceil(totalRecords / pageSize);
  const adjustedPage = Math.min(currentPage, totalPages || 1);
  const startIndex = (adjustedPage - 1) * pageSize;
  const paginatedMaterials = filtered.slice(startIndex, startIndex + pageSize);

  // Master lists
  const categoriesList = dbCategories;
  const currentBrands = dbBrands;
  const currentMaterialsList = materials.filter(m => m.category === selectedCategory && m.brand === selectedBrand);
  const currentVariantsList = VARIANTS_MAP[selectedCategory] || ["Standard", "Custom"];

  if (loading) return <LoadingState message="Fetching material master from local SQL..." />;
  if (error) return <ErrorState message={error} onRetry={fetchMaterials} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <STitle title="Material Master Catalog" sub="Maintain structural, plumbing, and electrical material codes" />
        <Btn onClick={() => setShowAddModal(true)} icon={Plus}>Add Material Item</Btn>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        <Stat label="Total Materials cataloged" val={materials.length} icon={Layers} color={C.sub} />
        <Stat label="Total Categories" val={new Set(materials.map(m=>m.category)).size} icon={Tag} color={C.blue} />
        <Stat label="Average Unit Price" val={`₹${Math.round(materials.reduce((acc,cur)=>acc+cur.price, 0)/materials.length)}`} icon={BarChart3} color={C.teal} />
      </div>

      {/* Filter Header */}
      <div style={{ background: C.card, border: `1px solid ${C.bord}`, borderRadius: 12, padding: "14px 18px", display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.mute }} />
          <input
            type="text"
            placeholder="Search catalog by name, code, brand..."
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
            value={categoryFilter}
            onChange={(val) => setCategoryFilter(val)}
            options={["All", ...dbCategories.map(c => c.name)].map(c => ({ value: c, label: c === "All" ? "All Categories" : c }))}
          />
        </div>
      </div>

      {/* Catalog Table */}
      <div style={{ background: C.card, border: `1px solid ${C.bord}`, borderTopLeftRadius: 14, borderTopRightRadius: 14, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 12.5 }}>
          <thead>
            <tr style={{ background: C.raise, borderBottom: `1px solid ${C.bord}`, color: C.mute, fontWeight: 600 }}>
              <th style={{ padding: "12px 18px" }}>Item Code</th>
              <th style={{ padding: "12px 18px" }}>Material Name</th>
              <th style={{ padding: "12px 18px" }}>Category</th>
              <th style={{ padding: "12px 18px" }}>Brand/Manufacturer</th>
              <th style={{ padding: "12px 18px" }}>UOM</th>
              <th style={{ padding: "12px 18px" }}>Base Price</th>
              <th style={{ padding: "12px 18px" }}>GST Rate</th>
              <th style={{ padding: "12px 18px" }}>Reorder Lvl</th>
              <th style={{ padding: "12px 18px", textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedMaterials.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: 30, textAlign: "center", color: C.mute }}>
                  No materials found in the catalog matching your query.
                </td>
              </tr>
            ) : (
              paginatedMaterials.map(mat => (
                <tr key={mat.id} style={{ borderBottom: `1px solid ${C.bord}`, transition: "background 0.15s" }} onMouseEnter={e=>e.currentTarget.style.background=`${C.gold}05`} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{ padding: "12px 18px", fontWeight: 700, color: C.gold }}>{mat.code}</td>
                  <td style={{ padding: "12px 18px", fontWeight: 600, color: C.txt }}>{mat.name}</td>
                  <td style={{ padding: "12px 18px" }}>
                    <Badge label={mat.category} type="blue" />
                  </td>
                  <td style={{ padding: "12px 18px", color: C.sub }}>{mat.brand}</td>
                  <td style={{ padding: "12px 18px", color: C.mute }}>{mat.unit}</td>
                  <td style={{ padding: "12px 18px", fontWeight: 600 }}>₹{mat.price.toLocaleString("en-IN")}</td>
                  <td style={{ padding: "12px 18px", color: C.sub }}>{mat.gst}%</td>
                  <td style={{ padding: "12px 18px", color: C.red, fontWeight: 600 }}>{mat.reorderLevel}</td>
                  <td style={{ padding: "12px 18px", textAlign: "center" }}>
                    <button onClick={() => handleDelete(mat.id, mat.name)} style={{ background: "none", border: "none", color: C.mute, cursor: "pointer", padding: 4 }} onMouseEnter={e=>e.currentTarget.style.color=C.red} onMouseLeave={e=>e.currentTarget.style.color=C.mute}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
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

      {/* Modal - Register Material in Master Registry */}
      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)} title="Register Material in Master Registry" width={700}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            
            {/* 1. Select Category */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: C.txt }}>1. Select Category</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Category *">
                  <Select
                    value={selectedCategory}
                    onChange={(val) => setSelectedCategory(val)}
                    options={dbCategories.map(c => ({ value: c.name, label: c.name }))}
                  />
                </Field>
                <Field label="Sub Category (Optional)">
                  <Select
                    value={selectedSubCategory}
                    onChange={(val) => setSelectedSubCategory(val)}
                    placeholder="Select Sub Category"
                    options={(SUBCATEGORIES_MAP[selectedCategory] || []).map(s => ({ value: s, label: s }))}
                  />
                </Field>
              </div>
            </div>

            {/* 2. Select Material */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: C.txt }}>2. Select Material</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 12 }}>
                <Field label="Brand *">
                  <Select
                    value={selectedBrand}
                    onChange={handleBrandChange}
                    options={dbBrands.map(b => ({ value: b.name, label: b.name }))}
                  />
                </Field>
                <Field label="Material *">
                  <Select
                    value={selectedMaterialName}
                    onChange={handleMaterialDropdownChange}
                    placeholder="Select Material"
                    options={currentMaterialsList.map(m => ({ value: m.name, label: m.name }))}
                  />
                </Field>
              </div>
              <Field label="Variant / Size (If applicable)">
                <Select
                  value={selectedVariant}
                  onChange={(val) => setSelectedVariant(val)}
                  options={currentVariantsList.map(v => ({ value: v, label: v }))}
                />
              </Field>
            </div>

            {/* 3. Auto Filled Details */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: C.txt }}>3. Auto Filled Details (From Master)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                <Field label="Material Code">
                  <Input disabled value={autoFilled.code} />
                </Field>
                <Field label="Unit of Measurement">
                  <Input disabled value={autoFilled.unit} />
                </Field>
                <Field label="GST Rate">
                  <Input disabled value={autoFilled.gst} />
                </Field>
                <Field label="HSN Code">
                  <Input disabled value={autoFilled.hsn} />
                </Field>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                <Field label="Default Warehouse">
                  <Input disabled value={autoFilled.warehouse} />
                </Field>
                <Field label="Preferred Vendor">
                  <Input disabled value={autoFilled.vendor} />
                </Field>
                <Field label="Reorder Level">
                  <Input disabled value={autoFilled.reorder} />
                </Field>
                <Field label="Lead Time (Days)">
                  <Input disabled value={autoFilled.leadTime} />
                </Field>
              </div>
            </div>

            {/* 4. Enter Stock & Pricing Details */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: C.txt }}>4. Enter Stock & Pricing Details</div>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", gap: 12 }}>
                <Field label="Purchase Price (₹) *">
                  <Input
                    type="number"
                    required
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    placeholder="e.g. 385.00"
                  />
                </Field>
                <Field label="Opening Stock">
                  <Input
                    type="number"
                    value={openingStock}
                    onChange={(e) => setOpeningStock(e.target.value)}
                    placeholder="0"
                  />
                </Field>
                <Field label="Minimum Stock">
                  <Input disabled value={autoFilled.minStock} />
                </Field>
                <Field label="Maximum Stock">
                  <Input disabled value={autoFilled.maxStock} />
                </Field>
              </div>
              <Field label="Remarks (Optional)">
                <Input
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter remarks..."
                />
              </Field>
            </div>

            {/* Footer Form Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10, borderTop: `1px solid ${C.bord}`, paddingTop: 14 }}>
              <Btn type="button" v="outline" onClick={() => setShowAddModal(false)}>Cancel</Btn>
              <Btn type="button" v="outline" onClick={handleReset}>Reset</Btn>
              <Btn type="button" v="outline" onClick={() => setToast({ type: "success", msg: "Draft saved successfully!" })}>Save as Draft</Btn>
              <Btn type="button" onClick={handleSave}>Save Material</Btn>
            </div>

          </div>
        </Modal>
      )}

      {toast && <Toast type={toast.type} msg={toast.msg} onClose={() => setToast(null)} />}
    </div>
  );
}
