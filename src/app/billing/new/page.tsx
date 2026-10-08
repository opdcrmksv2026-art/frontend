"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Search,
  User,
  Pill,
  Calendar,
  CreditCard,
  Plus,
  Check,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Receipt,
  AlertTriangle,
  Printer,
  Trash2,
  Banknote,
  Smartphone,
  Wallet,
  Edit
} from "lucide-react"

import { calculateGSTInvoice, findDiscountForTargetPayable } from "@/utils/gstCalculator"

interface TreatmentProduct {
  name: string
  quantity: string
  rate: number
  hsnCode?: string
  taxRate?: number
}

interface TreatmentItem {
  id: string
  disease: string
  kitName: string
  products: TreatmentProduct[]
  durationDays: string
  price: string
}

interface Patient {
  id: string
  uniqueId: string
  name: string
  age?: number
  gender?: string
  whatsappNumber?: string
  callingNumber?: string
  address?: string
  houseNumber?: string
  city?: string
  state?: string
  pincode?: string
}

const INDIAN_STATES = [
  "Himachal Pradesh",
  "Punjab",
  "Haryana",
  "Delhi",
  "Chandigarh",
  "Uttarakhand",
  "Uttar Pradesh",
  "Rajasthan",
  "Jammu and Kashmir",
  "Ladakh",
  "Madhya Pradesh",
  "Maharashtra",
  "Gujarat",
  "Bihar",
  "West Bengal",
  "Karnataka",
  "Tamil Nadu",
  "Telangana",
  "Andhra Pradesh",
  "Kerala",
  "Assam",
  "Odisha",
  "Jharkhand",
  "Chhattisgarh",
  "Goa",
  "Other"
]

export default function CreateInvoicePage() {
  const router = useRouter()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

  // Master lists
  const [patients, setPatients] = useState<Patient[]>([])
  const [loadingPatients, setLoadingPatients] = useState(true)

  // Step-by-Step State
  const [currentStep, setCurrentStep] = useState(1)

  // Catalog for autocomplete
  const [catalog, setCatalog] = useState<any[]>([])
  const [activeTreatmentId, setActiveTreatmentId] = useState<string | null>(null)

  // Search & selection states
  const [searchQuery, setSearchQuery] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  // Form mode: true = existing patient selected/autofilled, false = register new on-the-fly
  const [isExistingPatient, setIsExistingPatient] = useState(false)

  // Treatments list (multiple diseases support)
  const [treatments, setTreatments] = useState<TreatmentItem[]>([
    { id: "1", disease: "", kitName: "", products: [], durationDays: "30", price: "0" }
  ])

  // Printable Modal state
  const [generatedBill, setGeneratedBill] = useState<any | null>(null)
  const [showReceiptModal, setShowReceiptModal] = useState(false)

  // Invoice form state
  const [formData, setFormData] = useState({
    // Patient details
    uniqueId: "",
    name: "",
    age: "",
    gender: "Male",
    whatsappNumber: "",
    callingNumber: "",
    houseNumber: "",
    city: "",
    state: "Himachal Pradesh",
    stateCode: "02",
    pincode: "",

    // Pricing & Payments
    consultancyCharges: "0",
    discountApplied: "0",
    amountCash: "0",
    amountOnline: "0",
    billingType: "Non-GST",

    // Medical notes
    symptoms: "",
    notes: "",
    date: new Date().toISOString().split("T")[0],
    nextFollowUpDate: ""
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Fetch patients list for autocomplete on mount
  useEffect(() => {
    async function fetchPatients() {
      try {
        const res = await fetch(`${API_URL}/api/patients`)
        if (res.ok) {
          const data = await res.json()
          setPatients(data)
        }
      } catch (err) {
        console.error("Error loading patients:", err)
      } finally {
        setLoadingPatients(false)
      }
    }
    fetchPatients()
  }, [API_URL])

  // Load Maxxi catalog for product autocomplete (only Maxxi as requested)
  useEffect(() => {
    import("@/lib/maxxiDefaults")
      .then(maxxi => {
        const maxxiCat = localStorage.getItem("maxxi_app_catalog") 
          ? JSON.parse(localStorage.getItem("maxxi_app_catalog")!) 
          : maxxi.DEFAULT_MAXXI_CATALOG

        setCatalog([...(maxxiCat || [])])
      })
      .catch(err => console.error("Error loading Maxxi catalog:", err))
  }, [])

  // Treatment list manipulators
  const handleAddTreatment = () => {
    setTreatments(prev => [
      ...prev,
      { id: Date.now().toString(), disease: "", kitName: "", products: [], durationDays: "30", price: "0" }
    ])
  }

  const handleProductQuantityChange = (treatmentId: string, productIndex: number, newQuantity: string) => {
    setTreatments(prev => prev.map(t => {
      if (t.id === treatmentId) {
        const updatedProducts = [...t.products];
        updatedProducts[productIndex].quantity = newQuantity;
        const newPrice = updatedProducts.reduce((sum, p) => sum + (parseFloat(p.quantity || "0") * p.rate), 0).toString();
        return { ...t, products: updatedProducts, price: newPrice };
      }
      return t;
    }))
  }
  
  const handleRemoveProduct = (treatmentId: string, productIndex: number) => {
    setTreatments(prev => prev.map(t => {
      if (t.id === treatmentId) {
        const updatedProducts = t.products.filter((_, i) => i !== productIndex);
        const newPrice = updatedProducts.reduce((sum, p) => sum + (parseFloat(p.quantity || "0") * p.rate), 0).toString();
        return { ...t, products: updatedProducts, price: newPrice };
      }
      return t;
    }))
  }

  const handleRemoveTreatment = (id: string) => {
    if (treatments.length === 1) return
    setTreatments(prev => prev.filter(t => t.id !== id))
  }

  const handleTreatmentChange = (id: string, field: keyof TreatmentItem, value: string) => {
    setTreatments(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t))
  }

  // Filter patients based on query (uniqueId or name)
  const filteredPatients = patients.filter(
    p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.uniqueId.includes(searchQuery)
  )

  // Handle patient selection
  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    setIsExistingPatient(true)
    setShowDropdown(false)
    setSearchQuery(`${patient.name} (${patient.uniqueId})`)

    setFormData(prev => ({
      ...prev,
      uniqueId: patient.uniqueId,
      name: patient.name,
      age: patient.age?.toString() || "",
      gender: patient.gender || "Male",
      whatsappNumber: patient.whatsappNumber || "",
      callingNumber: patient.callingNumber || "",
      houseNumber: patient.houseNumber || "",
      city: patient.city || "",
      state: patient.state || "Himachal Pradesh",
      pincode: patient.pincode || ""
    }))
  }

  // Handle clearing patient selection to type a new one
  const handleClearPatient = () => {
    setSelectedPatient(null)
    setIsExistingPatient(false)
    setSearchQuery("")

    setFormData(prev => ({
      ...prev,
      uniqueId: "",
      name: "",
      age: "",
      gender: "Male",
      whatsappNumber: "",
      callingNumber: "",
      houseNumber: "",
      city: "",
      state: "Himachal Pradesh",
      pincode: ""
    }))
  }

  // Generic input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => {
      const updated = { ...prev, [name]: value }
      if (name === "billingType" || name === "state") {
        const tempCalc = calculateGSTInvoice(
          treatments,
          parseFloat(updated.discountApplied || "0"),
          parseFloat(updated.consultancyCharges || "0"),
          "Himachal Pradesh",
          updated.state || "Himachal Pradesh",
          true
        );
        if (updated.amountOnline === "0" || !updated.amountOnline) {
          updated.amountCash = tempCalc.grandTotal.toString()
        }
      }
      return updated
    })
  }

  // Numeric change helper
  const handleNumericChange = (name: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [name]: value }
      
      const baseCalc = calculateGSTInvoice(
        treatments as any,
        0,
        parseFloat(updated.consultancyCharges || "0"),
        "Himachal Pradesh",
        updated.state || "Himachal Pradesh",
        true,
        updated.stateCode
      );

      if (name === "discountApplied") {
        const typedDiscount = Math.max(0, parseFloat(value || "0"));
        if (typedDiscount > baseCalc.grossAmount) {
          setError(`Product discount (₹${typedDiscount.toLocaleString("en-IN")}) cannot exceed gross pre-tax total (₹${baseCalc.grossAmount.toLocaleString("en-IN")})`);
        } else {
          setError("");
        }
      } else {
        setError("");
      }

      return updated
    })
  }

  // Financial values calculations
  const calcResult = calculateGSTInvoice(
    treatments as any,
    parseFloat(formData.discountApplied || "0"),
    parseFloat(formData.consultancyCharges || "0"),
    "Himachal Pradesh",
    formData.state || "Himachal Pradesh",
    true,
    formData.stateCode
  )
  const originalBillTotal = calcResult.originalInvoiceTotal

  const priceVal = calcResult.grossAmount
  const discountVal = calcResult.discountApplied
  const netSubtotal = calcResult.medicineTaxableValue
  const gstVal = calcResult.totalTax
  const consultancyVal = calcResult.consultancyCharges
  const totalDueVal = calcResult.grandTotal

  const cashVal = parseFloat(formData.amountCash || "0")
  const onlineVal = parseFloat(formData.amountOnline || "0")
  const totalPaidVal = cashVal + onlineVal

  // Next Step validation and movement
  const handleNextStep = () => {
    setError("")
    if (currentStep === 1) {
      if (!formData.uniqueId) {
        setError("Patient Mobile or Aadhar ID is required")
        return
      }
      if (!formData.name) {
        setError("Patient Name is required")
        return
      }
      setCurrentStep(2)
    } else if (currentStep === 2) {
      const validTreatment = treatments.some(t => t.disease.trim() || t.kitName.trim())
      if (!validTreatment) {
        setError("Kam se kam 1 Bimari ya Kit Name enter karein")
        return
      }
      
      // Auto-fill Cash Collected to full amount by default if not already set
      setFormData(prev => {
        const cash = parseFloat(prev.amountCash || "0");
        const online = parseFloat(prev.amountOnline || "0");
        if (cash === 0 && online === 0) {
          return {
            ...prev,
            amountCash: calcResult.grandTotal.toString(),
            amountOnline: "0"
          };
        }
        return prev;
      });
      setCurrentStep(3)
    }
  }

  const handlePrevStep = () => {
    setError("")
    setCurrentStep(prev => Math.max(1, prev - 1))
  }

  // Submit invoice generator
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    const invoiceNo = `INV-${Math.floor(100000 + Math.random() * 900000)}`
    const combinedKitName = treatments.map(t => {
      const prodString = t.products.map(p => `${p.quantity}x ${p.name}`).join(" + ");
      return `${prodString || t.kitName || 'Treatment'} (${t.durationDays}d)`;
    }).join(" | ")
    const combinedDiseases = treatments.map(t => t.disease).filter(Boolean).join(", ")

    const billData = {
      invoiceNo,
      patientName: formData.name,
      patientId: formData.uniqueId,
      age: formData.age,
      gender: formData.gender,
      whatsappNumber: formData.whatsappNumber,
      callingNumber: formData.callingNumber,
      houseNumber: formData.houseNumber,
      city: formData.city,
      state: formData.state || "Himachal Pradesh",
      stateCode: formData.stateCode || "02",
      pincode: formData.pincode,
      treatments,
      combinedKitName,
      combinedDiseases,
      symptoms: formData.symptoms,
      notes: formData.notes,
      billingType: formData.billingType,
      date: formData.date,
      nextFollowUpDate: formData.nextFollowUpDate,
      priceVal,
      consultancyVal: parseFloat(formData.consultancyCharges || "0"),
      discountVal,
      gstVal,
      totalDueVal,
      cashVal,
      onlineVal,
      totalPaidVal,
      calcResult,
    }

    // Try posting to backend (non-blocking)
    try {
      if (!isExistingPatient) {
        await fetch(`${API_URL}/api/patients/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uniqueId: formData.uniqueId,
            name: formData.name,
            age: formData.age ? parseInt(formData.age) : null,
            gender: formData.gender,
            whatsappNumber: formData.whatsappNumber || null,
            callingNumber: formData.callingNumber || null,
            houseNumber: formData.houseNumber || null,
            city: formData.city || null,
            state: formData.state || null,
            pincode: formData.pincode || null
          })
        }).catch(() => { })
      }

      await fetch(`${API_URL}/api/patients/${formData.uniqueId}/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kitName: combinedKitName,
          treatments: treatments,
          totalAmount: totalDueVal,
          amountCash: cashVal,
          amountOnline: onlineVal,
          billingType: formData.billingType,
          status: "COMPLETED",
          symptoms: formData.symptoms,
          notes: formData.notes,
          date: formData.date
        })
      }).catch(() => { })

      if (formData.nextFollowUpDate) {
        await fetch(`${API_URL}/api/patients/${formData.uniqueId}/followup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nextFollowUpDate: formData.nextFollowUpDate,
            followUpStatus: "PENDING",
            followUpNotes: `Next checkup for ${combinedKitName}`
          })
        }).catch(() => { })
      }
    } catch (err) {
      console.warn("Backend offline or network error, generating local bill receipt:", err)
    } finally {
      // Save locally to localStorage so offline bill generation ALWAYS works
      // Save locally to localStorage so offline bill generation ALWAYS works
      try {
        const existingOffline = JSON.parse(localStorage.getItem("ksv_offline_bills") || "[]")
        existingOffline.unshift(billData)
        localStorage.setItem("ksv_offline_bills", JSON.stringify(existingOffline))
        
        // Also deduct inventory from Maxxi Pharma catalog
        const maxxiCat = JSON.parse(localStorage.getItem("maxxi_app_catalog") || "[]")
        let updatedCatalog = [...maxxiCat]
        treatments.forEach(t => {
          if (t.products) {
            t.products.forEach(p => {
              const qtyToDeduct = parseFloat(p.quantity || "1");
              const index = updatedCatalog.findIndex((c: any) => c.name === p.name);
              if (index !== -1) {
                const currentQty = updatedCatalog[index].quantity || 0;
                updatedCatalog[index] = {
                  ...updatedCatalog[index],
                  quantity: currentQty - qtyToDeduct
                }
              }
            })
          }
        })
        localStorage.setItem("maxxi_app_catalog", JSON.stringify(updatedCatalog))
        
      } catch (e) {
        console.warn("Local storage write error:", e)
      }

      setLoading(false)
      setSuccess("✅ Invoice bill successfully generate ho gaya!")
      setGeneratedBill(billData)
      setShowReceiptModal(true)
    }
  }

  // --- RENDERING STEP 1: PATIENT PROFILE ---
  const renderStep1 = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)] space-y-6">

        <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3.5">
          <User className="w-5 h-5 text-blue-500" />
          Patient Selection &amp; Identification
        </h2>

        {/* Live Search Patient */}
        <div className="mb-6 relative">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">Search Existing Patient (By Mobile/Aadhar/Name)</label>
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Type patient mobile, name, or Aadhaar number..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowDropdown(true)
                if (!selectedPatient) {
                  setFormData(prev => ({ ...prev, uniqueId: e.target.value }))
                }
              }}
              className="w-full px-4 py-3.5 pl-11 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-2 border-slate-100/50 focus:border-blue-500/20 rounded-2xl outline-none transition-all text-sm font-semibold text-slate-700 placeholder-slate-400"
            />
            {(searchQuery || selectedPatient) && (
              <button
                type="button"
                onClick={handleClearPatient}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Autocomplete dropdown */}
          {showDropdown && searchQuery && filteredPatients.length > 0 && (
            <div className="absolute z-20 left-0 right-0 mt-2 max-h-60 overflow-y-auto bg-white border border-slate-100 rounded-2xl shadow-xl custom-scrollbar">
              {filteredPatients.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPatient(p)}
                  className="w-full text-left px-5 py-3.5 hover:bg-slate-50 transition-colors border-b border-slate-50 flex items-center justify-between text-slate-700 cursor-pointer"
                >
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{p.name}</div>
                    <div className="text-xs text-slate-400 font-semibold mt-0.5">Mobile / Aadhaar: {p.uniqueId}</div>
                  </div>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">Select Profile</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Existing Patient Selected Profile */}
        {isExistingPatient && selectedPatient ? (
          <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100/50 rounded-xl text-blue-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-800 text-base">{selectedPatient.name}</h3>
                  <span className="text-[10px] font-extrabold tracking-wider uppercase text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                    Verified Patient
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2.5 gap-x-4 mt-3 text-xs text-slate-500 font-semibold">
                  <div><span className="text-slate-400">ID / Mobile:</span> {selectedPatient.uniqueId}</div>
                  <div><span className="text-slate-400">Age / Gender:</span> {selectedPatient.age || "N/A"} yrs / {selectedPatient.gender || "N/A"}</div>
                  {selectedPatient.whatsappNumber && <div><span className="text-slate-400">WhatsApp:</span> {selectedPatient.whatsappNumber}</div>}
                  {selectedPatient.city && <div><span className="text-slate-400">City:</span> {selectedPatient.city}</div>}
                  {selectedPatient.address && <div className="col-span-1 sm:col-span-2 md:col-span-3"><span className="text-slate-400">Address:</span> {selectedPatient.address}</div>}
                </div>
              </div>
            </div>

            {/* State & Tax Mode Bar */}
            <div className="pt-3 border-t border-blue-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Billing State:</label>
                <select
                  name="state"
                  value={formData.state || "Himachal Pradesh"}
                  onChange={handleInputChange}
                  className="px-3 py-1.5 bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-xs font-extrabold text-slate-800 outline-none cursor-pointer"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div>
                {(formData.state || "Himachal Pradesh").trim().toLowerCase() === "himachal pradesh" ? (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100/60 px-3 py-1.5 rounded-xl border border-emerald-200 inline-flex items-center gap-1.5">
                    🏛️ Intra-State Billing (CGST + SGST applied)
                  </span>
                ) : (
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-100/60 px-3 py-1.5 rounded-xl border border-indigo-200 inline-flex items-center gap-1.5">
                    🚚 Inter-State Billing ({formData.state || "Other"} → IGST applied)
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* New Patient Quick Auto-Register Block */
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 mb-2 bg-amber-50 border border-amber-100 p-3.5 rounded-2xl text-amber-800">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider">Patient Not Registered — Quick Auto-Register Mode</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Patient Mobile / ID
                </label>
                <input
                  type="text"
                  disabled
                  value={formData.uniqueId}
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Patient Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter patient full name..."
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 pl-10 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all text-sm font-semibold text-slate-700 placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Age &amp; Gender
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    name="age"
                    placeholder="Age"
                    value={formData.age}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none text-sm font-semibold text-slate-700"
                  />
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl outline-none text-sm font-semibold text-slate-700"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  WhatsApp / Alternate Number
                </label>
                <input
                  type="tel"
                  name="whatsappNumber"
                  placeholder="WhatsApp number..."
                  value={formData.whatsappNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none text-sm font-semibold text-slate-700"
                />
              </div>

              {/* State Selection Dropdown */}
              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>State (GST Calculation) *</span>
                </label>
                <select
                  name="state"
                  value={formData.state || "Himachal Pradesh"}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 focus:border-blue-500 rounded-xl outline-none text-sm font-bold text-slate-800 transition-all cursor-pointer"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
                <div className="mt-1.5">
                  {(formData.state || "Himachal Pradesh").trim().toLowerCase() === "himachal pradesh" ? (
                    <span className="text-[11px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block">
                      🏛️ Intra-State GST: CGST + SGST applied
                    </span>
                  ) : (
                    <span className="text-[11px] font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 inline-block">
                      🚚 Inter-State GST: IGST applied
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  City / District &amp; Pincode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    name="city"
                    placeholder="City / District"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none text-sm font-semibold text-slate-700"
                  />
                  <input
                    type="text"
                    name="pincode"
                    placeholder="Pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none text-sm font-semibold text-slate-700"
                  />
                </div>
              </div>

              <div className="flex flex-col md:col-span-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Full House / Clinic Address (Optional)
                </label>
                <input
                  type="text"
                  name="houseNumber"
                  placeholder="House / Street / Locality..."
                  value={formData.houseNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none text-sm font-semibold text-slate-700"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleNextStep}
          className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-6 py-3.5 rounded-2xl flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all text-sm"
        >
          Next: Disease &amp; Kit Details
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )

  // --- RENDERING STEP 2: TREATMENT & KIT SELECTION (MULTIPLE DISEASES SUPPORT) ---
  const renderStep2 = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)] space-y-6">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
          <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <Pill className="w-5 h-5 text-emerald-500" />
            Disease Treatment &amp; Kit Prescriptions ({treatments.length})
          </h2>
          <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Total Subtotal: ₹{priceVal.toLocaleString("en-IN")}
          </span>
        </div>

        {/* Treatment Items List */}
        <div className="space-y-6">
          {treatments.map((treatment, index) => (
            <div key={treatment.id} className="p-5 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-4 relative">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {index + 1}
                  </span>
                  Disease / Kit #{index + 1}
                </span>
                {treatments.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTreatment(treatment.id)}
                    className="text-xs font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Bimari / Disease Condition *</label>
                  <textarea
                    rows={2}
                    value={treatment.disease}
                    onChange={(e) => handleTreatmentChange(treatment.id, "disease", e.target.value)}
                    placeholder="e.g. Sugar / Diabetes, BP, Joint Pain, Liver..."
                    className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none text-sm font-semibold text-slate-700 placeholder-slate-400 resize-none"
                  />
                </div>

                <div className="flex flex-col relative md:col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Search & Add Product</label>
                  <input
                    type="text"
                    value={treatment.kitName}
                    onChange={(e) => handleTreatmentChange(treatment.id, "kitName", e.target.value)}
                    onFocus={() => setActiveTreatmentId(treatment.id)}
                    onBlur={() => setTimeout(() => setActiveTreatmentId(null), 200)}
                    placeholder="e.g. KSG 80-1, KSGA 12-1..."
                    className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none text-sm font-semibold text-slate-700 placeholder-slate-400"
                  />

                  {/* Autocomplete */}
                  {activeTreatmentId === treatment.id && treatment.kitName.trim() !== '' && (() => {
                    const matches = catalog.filter(c => c.name.toLowerCase().includes(treatment.kitName.toLowerCase()))
                      
                    if (matches.length > 0) {
                      return (
                        <div className="absolute z-50 left-0 top-[80px] w-full bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                          {matches.map(c => (
                            <div
                              key={c.id}
                              onMouseDown={(e) => {
                                e.preventDefault()
                                setTreatments(prev => prev.map(t => {
                                  if (t.id === treatment.id) {
                                    const newProducts = [...t.products, { name: c.name, quantity: "1", rate: c.defaultRate || 0, hsnCode: c.hsnCode || '-', taxRate: c.defaultTaxRate || 0 }];
                                    const newPrice = newProducts.reduce((sum, p) => sum + (parseFloat(p.quantity || "0") * p.rate), 0).toString();
                                    return { ...t, kitName: "", products: newProducts, price: newPrice };
                                  }
                                  return t;
                                }))
                                setTimeout(() => setActiveTreatmentId(null), 0)
                              }}
                              className="px-3 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer border-b border-slate-100 last:border-0 transition-colors flex justify-between"
                            >
                              <span>{c.name}</span>
                              {c.defaultRate > 0 && <span className="text-slate-400">₹{c.defaultRate}</span>}
                            </div>
                          ))}
                        </div>
                      )
                    }
                    return null
                  })()}

                  {/* Selected Products List */}
                  {treatment.products.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {treatment.products.map((p, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-200 p-2.5 rounded-xl shadow-sm">
                          <span className="text-sm font-extrabold text-slate-700 flex-1 truncate pr-4" title={p.name}>{p.name}</span>
                          <div className="flex items-center gap-4 shrink-0">
                             <div className="flex items-center gap-2">
                               <span className="text-[10px] uppercase font-bold text-slate-400">Qty:</span>
                               <input type="number" min="1" value={p.quantity} onChange={(e) => handleProductQuantityChange(treatment.id, idx, e.target.value)} className="w-16 px-2 py-1.5 bg-white border border-slate-200 focus:border-blue-500 rounded-lg text-sm text-center font-bold outline-none" />
                             </div>
                             <div className="text-sm font-black text-slate-800 w-20 text-right">
                               ₹{(parseFloat(p.quantity || "0") * p.rate).toLocaleString("en-IN")}
                             </div>
                             <button type="button" onClick={() => handleRemoveProduct(treatment.id, idx)} className="text-rose-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-colors" title="Remove Product">
                               <Trash2 className="w-4 h-4" />
                             </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Duration (Days)</label>
                  <input
                    type="number"
                    value={treatment.durationDays}
                    onChange={(e) => handleTreatmentChange(treatment.id, "durationDays", e.target.value)}
                    placeholder="30"
                    className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none text-sm font-semibold text-slate-700 placeholder-slate-400"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Treatment Price (₹)</label>
                  <input
                    type="number"
                    value={treatment.price}
                    onChange={(e) => handleTreatmentChange(treatment.id, "price", e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none text-sm font-semibold text-slate-700 placeholder-slate-400"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Add Another Disease Button */}
          <button
            type="button"
            onClick={handleAddTreatment}
            className="w-full py-3.5 border-2 border-dashed border-blue-200 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50 text-blue-600 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            + Aur Dusri Bimari / Treatment Add Karein
          </button>
        </div>

        {/* Symptoms & Consultation notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Symptoms</label>
            <textarea
              name="symptoms"
              rows={3}
              placeholder="e.g. High Sugar levels, frequent urination, joint pain..."
              value={formData.symptoms}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-2 border-slate-100/50 focus:border-blue-500/20 rounded-2xl outline-none transition-all text-sm font-semibold text-slate-700 resize-y placeholder-slate-400"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Prescription &amp; Consultation Notes</label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Dosage details, diet guidance, restrictions, next checkup instructions..."
              value={formData.notes}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-2 border-slate-100/50 focus:border-blue-500/20 rounded-2xl outline-none transition-all text-sm font-semibold text-slate-700 resize-y placeholder-slate-400"
            />
          </div>
        </div>

      </div>

      <div className="flex justify-between items-center pt-2">
        <button
          type="button"
          onClick={handlePrevStep}
          className="bg-slate-50 hover:bg-slate-100 border-2 border-slate-100 text-slate-600 font-extrabold px-6 py-3.5 rounded-2xl flex items-center gap-2 cursor-pointer transition-all text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Back: Patient Details
        </button>

        <button
          type="button"
          onClick={handleNextStep}
          className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-6 py-3.5 rounded-2xl flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all text-sm"
        >
          Next: Billing &amp; Payment Split
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )

  // --- RENDERING STEP 3: BILLING & PAYMENT ---
  const renderStep3 = () => (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Visual Invoice Receipt / Bill Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Form controls */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)] space-y-6">
            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3.5">
              <CreditCard className="w-5 h-5 text-indigo-500" />
              Collect Payment Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Discount and Consultancy */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:col-span-2">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">Consultancy Charges (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-slate-400 text-sm font-semibold">₹</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={formData.consultancyCharges}
                      onChange={(e) => handleNumericChange("consultancyCharges", e.target.value)}
                      className="w-full px-4 py-3 pl-8 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-2 border-slate-100/50 focus:border-blue-500/20 rounded-2xl outline-none transition-all text-sm font-bold text-slate-700 text-right"
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">Product Discount (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-slate-400 text-sm font-semibold">₹</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={formData.discountApplied}
                      onChange={(e) => handleNumericChange("discountApplied", e.target.value)}
                      className="w-full px-4 py-3 pl-8 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-2 border-slate-100/50 focus:border-blue-500/20 rounded-2xl outline-none transition-all text-sm font-bold text-slate-700 text-right"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Mode Breakdown */}
              <div className="md:col-span-2 space-y-4 pt-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Payment Mode Breakdown</label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Cash collection */}
                  <div className="bg-slate-50/80 border border-slate-100 p-4 rounded-2xl">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Banknote className="w-4 h-4 text-emerald-600" /> Cash Collected (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-slate-400 text-sm font-bold">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={formData.amountCash}
                        onChange={(e) => handleNumericChange("amountCash", e.target.value)}
                        placeholder="0"
                        className="w-full px-4 py-2.5 pl-7 bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none text-sm font-bold text-slate-700 text-right transition-all"
                      />
                    </div>
                  </div>

                  {/* Online / Google Pay / UPI collection */}
                  <div className="bg-slate-50/80 border border-slate-100 p-4 rounded-2xl">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-indigo-600" /> Online / UPI / Card (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-slate-400 text-sm font-bold">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={formData.amountOnline}
                        onChange={(e) => handleNumericChange("amountOnline", e.target.value)}
                        placeholder="0"
                        className="w-full px-4 py-2.5 pl-7 bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none text-sm font-bold text-slate-700 text-right transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Clean Total Payment Summary bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-sm">
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Original Bill: <strong className="text-slate-700 text-sm font-extrabold ml-1">₹{originalBillTotal.toLocaleString("en-IN")}</strong></span>
                    {discountVal > 0 && (
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Product Discount: <strong className="text-rose-600 text-sm font-extrabold ml-1">-₹{discountVal.toLocaleString("en-IN")}</strong></span>
                    )}
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Final Payable: <strong className="text-slate-900 text-sm font-extrabold ml-1">₹{totalDueVal.toLocaleString("en-IN")}</strong></span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Collected: <strong className="text-blue-600 text-sm font-extrabold ml-1">₹{totalPaidVal.toLocaleString("en-IN")}</strong></span>
                  </div>
                  {totalPaidVal < totalDueVal ? (
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                      Balance Due: ₹{(totalDueVal - totalPaidVal).toLocaleString("en-IN")}
                    </span>
                  ) : totalPaidVal > totalDueVal ? (
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                      Excess Paid: ₹{(totalPaidVal - totalDueVal).toLocaleString("en-IN")}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      ✓ Paid in Full
                    </span>
                  )}
                </div>
              </div>

              {/* Invoice Date */}
              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">Invoice Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pl-11 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-2 border-slate-100/50 focus:border-blue-500/20 rounded-2xl outline-none transition-all text-sm font-semibold text-slate-700"
                  />
                </div>
              </div>

              {/* Followup Date */}
              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">Next Follow Up Date (Optional)</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    name="nextFollowUpDate"
                    value={formData.nextFollowUpDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pl-11 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-2 border-slate-100/50 focus:border-blue-500/20 rounded-2xl outline-none transition-all text-sm font-semibold text-slate-700"
                  />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Right Invoice Receipt Preview */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.02)] relative overflow-hidden text-slate-600">

            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
              <Receipt className="w-5 h-5 text-indigo-500" />
              <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-800">Bill Receipt Preview</h2>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Patient Name</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{formData.name || "Anonymous Patient"}</p>
                {formData.uniqueId && <p className="text-[10px] text-slate-400 font-semibold mt-0.5">ID: {formData.uniqueId}</p>}
              </div>

              <div className="border-t border-slate-100 pt-3">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Prescribed Treatments ({treatments.length})</p>
                {treatments.map((t, idx) => (
                  <div key={t.id} className="mt-1.5 pb-1.5 border-b border-slate-50 last:border-0">
                    <div className="flex justify-between items-center text-slate-800">
                      <span className="font-bold text-[11px] truncate max-w-[160px]">
                        {t.disease || `Treatment #${idx + 1}`}
                      </span>
                      <span className="text-[11px] font-extrabold text-slate-700">₹{parseFloat(t.price || "0").toLocaleString("en-IN")}</span>
                    </div>
                    {t.products && t.products.length > 0 ? (
                      <div className="mt-1">
                        {t.products.map((p, pIdx) => (
                           <div key={pIdx} className="flex justify-between items-center text-[10px] text-slate-500 font-semibold mt-0.5">
                             <span>{p.quantity}x {p.name} (HSN: {p.hsnCode || "-"})</span>
                             <span>GST: {p.taxRate || 0}% | ₹{(parseFloat(p.quantity || "1") * p.rate).toLocaleString("en-IN")}</span>
                           </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold mt-0.5">
                        <span>{t.kitName || "Course"}</span>
                        <span>{t.durationDays || "30"} Days</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2 font-semibold">
                <div className="flex justify-between text-slate-500">
                  <span>Gross Medicines:</span>
                  <span>₹{priceVal.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                {gstVal > 0 && (
                  <div className="flex justify-between text-indigo-600">
                    <span>GST (Product-wise):</span>
                    <span>+ ₹{gstVal.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                )}
                {consultancyVal > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>Consultancy Charges:</span>
                    <span>+ ₹{consultancyVal.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-700 font-bold border-t border-slate-100/80 pt-1">
                  <span>Original Bill Total:</span>
                  <span>₹{originalBillTotal.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                {discountVal > 0 && (
                  <div className="flex justify-between text-rose-500">
                    <span>Product Discount:</span>
                    <span>- ₹{discountVal.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-sm border-t border-slate-100 pt-2 text-slate-800">
                  <span>Final Amount Payable:</span>
                  <span className="text-blue-600 text-base">₹{totalDueVal.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 bg-slate-50 p-3.5 rounded-xl space-y-1.5">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 font-bold">Payment Summary</p>
                {cashVal > 0 && (
                  <div className="flex justify-between text-slate-500 font-semibold">
                    <span>Cash Payment:</span>
                    <span className="font-bold text-slate-700">₹{cashVal.toLocaleString("en-IN")}</span>
                  </div>
                )}
                {onlineVal > 0 && (
                  <div className="flex justify-between text-slate-500 font-semibold">
                    <span>Online / UPI:</span>
                    <span className="font-bold text-slate-700">₹{onlineVal.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs border-t border-slate-200/80 pt-2 font-bold">
                  <span className="text-slate-600">Total Collected:</span>
                  <span className="font-extrabold text-emerald-600">
                    ₹{totalPaidVal.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {formData.nextFollowUpDate && (
                <div className="border-t border-slate-100 pt-3 font-semibold">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Follow Up Appointment</p>
                  <p className="text-emerald-600 font-bold mt-0.5">{new Date(formData.nextFollowUpDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Button Controls */}
      <div className="flex justify-between items-center pt-2">
        <button
          type="button"
          onClick={handlePrevStep}
          className="bg-slate-50 hover:bg-slate-100 border-2 border-slate-100 text-slate-600 font-extrabold px-6 py-3.5 rounded-2xl flex items-center gap-2 cursor-pointer transition-all text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Back: Treatment
        </button>

        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3.5 text-sm font-extrabold text-white rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg bg-blue-600 hover:bg-blue-500 cursor-pointer shadow-blue-500/20 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving Invoice...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Confirm &amp; Generate Bill
            </>
          )}
        </button>
      </div>
    </div>
  )

  return (
    <div className="w-full pt-0 pb-16 animate-in fade-in duration-500 text-slate-700">
      <div className="print:hidden">
        {/* Sleek Compact Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-3 border-b border-slate-200/60">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 text-slate-400 hover:text-slate-700 bg-white border border-slate-200/80 hover:bg-slate-50 rounded-xl transition-all shadow-sm"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Create Invoice</h1>
        </div>

        {/* Compact Stepper Pills */}
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 text-xs">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${currentStep === 1
              ? "bg-white text-blue-600 font-extrabold shadow-sm"
              : currentStep > 1
                ? "text-emerald-600 font-bold"
                : "text-slate-400 font-medium"
              }`}
          >
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${currentStep === 1
              ? "bg-blue-600 text-white font-bold"
              : currentStep > 1
                ? "bg-emerald-500 text-white font-bold"
                : "bg-slate-200 text-slate-500"
              }`}>
              {currentStep > 1 ? <Check className="w-2.5 h-2.5" /> : "1"}
            </span>
            <span>Patient</span>
          </button>

          <span className="text-slate-300">•</span>

          <button
            type="button"
            onClick={() => currentStep > 1 && setCurrentStep(2)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${currentStep === 2
              ? "bg-white text-blue-600 font-extrabold shadow-sm"
              : currentStep > 2
                ? "text-emerald-600 font-bold"
                : "text-slate-400 font-medium"
              }`}
          >
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${currentStep === 2
              ? "bg-blue-600 text-white font-bold"
              : currentStep > 2
                ? "bg-emerald-500 text-white font-bold"
                : "bg-slate-200 text-slate-500"
              }`}>
              {currentStep > 2 ? <Check className="w-2.5 h-2.5" /> : "2"}
            </span>
            <span>Treatment</span>
          </button>

          <span className="text-slate-300">•</span>

          <button
            type="button"
            onClick={() => currentStep > 2 && setCurrentStep(3)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${currentStep === 3
              ? "bg-white text-blue-600 font-extrabold shadow-sm"
              : "text-slate-400 font-medium"
              }`}
          >
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${currentStep === 3
              ? "bg-blue-600 text-white font-bold"
              : "bg-slate-200 text-slate-500"
              }`}>
              3
            </span>
            <span>Payment</span>
          </button>
        </div>
      </div>

      {/* Messaging alerts */}
      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-700 font-medium text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3 text-emerald-700 font-medium text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <div>{success}</div>
        </div>
      )}

      {/* Main Wizard Form wrapper */}
      <form onSubmit={handleSubmit}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </form>
      </div>

      {/* PRINTABLE RECEIPT MODAL TEMPLATE */}
      {showReceiptModal && generatedBill && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300 print:relative print:inset-auto print:bg-transparent print:p-0 print:block print:overflow-visible print:z-auto"
          onClick={() => {
            setShowReceiptModal(false)
            router.push("/patients")
          }}
        >
          <div
            className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 relative my-8 text-slate-800 flex flex-col overflow-hidden print:shadow-none print:border-none print:my-0 print:max-w-none print:w-full print:overflow-visible print:block"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Top Modal Actions Header Bar (Non-printable) */}
            <div className="px-6 py-4 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between gap-3 shrink-0 print:hidden">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Bill Generated
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" /> Print / Save PDF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReceiptModal(false)
                    // Remove last offline bill to prevent exact duplicate in local storage on next submit
                    try {
                      const existing = JSON.parse(localStorage.getItem("ksv_offline_bills") || "[]")
                      if (existing.length > 0 && existing[0].invoiceNo === generatedBill.invoiceNo) {
                        existing.shift()
                        localStorage.setItem("ksv_offline_bills", JSON.stringify(existing))
                      }
                    } catch (e) { }
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-white font-extrabold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
                >
                  <Edit className="w-4 h-4" /> Edit Bill
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReceiptModal(false)
                    router.push("/patients")
                  }}
                  className="bg-slate-200/80 hover:bg-slate-300/80 text-slate-700 font-extrabold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <X className="w-4 h-4" /> Close
                </button>
              </div>
            </div>

            {/* Scrollable Receipt Body Container */}
            <div className="p-6 sm:p-8 overflow-y-auto max-h-[75vh] print:max-h-none print:p-0 print:overflow-visible">

              {/* PRINT AREA / OFFICIAL CLINIC RECEIPT TEMPLATE */}
              <div id="printable-receipt" className="space-y-6">

                {/* Header Letterhead */}
                <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4">
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Maxxi Pharma Private Limited</h1>
                    <p className="text-xs font-bold text-slate-500 mt-0.5">Kapoor Happy Home 2 Hospital Road Solan, Solan</p>
                    <p className="text-[11px] text-slate-400 font-semibold mt-1">GSTIN/UIN: 02AASCM1970C1ZN | State: Himachal Pradesh, Code: 02</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-lg inline-block">
                      {generatedBill.invoiceNo}
                    </div>
                    <p className="text-[11px] text-slate-400 font-bold mt-1.5">Date: {generatedBill.date}</p>
                  </div>
                </div>

                {/* Patient Details */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold text-slate-700">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient Name</span>
                    <strong className="text-slate-900 text-sm font-extrabold">{generatedBill.patientName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient ID / Mobile</span>
                    <span>{generatedBill.patientId}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Age / Gender</span>
                    <span>{generatedBill.age ? `${generatedBill.age} yrs` : "-"} / {generatedBill.gender || "Male"}</span>
                  </div>
                </div>

                {/* Treatment Items Table */}
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">Prescribed Treatments &amp; Medicine Kits</h3>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
                        <tr>
                          <th className="py-3 px-3">#</th>
                          <th className="py-3 px-3">Course</th>
                          <th className="py-3 px-3">Product Name</th>
                          <th className="py-3 px-3">HSN Code</th>
                          <th className="py-3 px-3 text-center">Qty</th>
                          <th className="py-3 px-3 text-right">Rate (₹)</th>
                          <th className="py-3 px-3 text-center">GST %</th>
                          <th className="py-3 px-3 text-right">GST Amt (₹)</th>
                          <th className="py-3 px-3 text-right">Total (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        {(() => {
                          let flatIdx = 0;
                          return generatedBill.treatments.map((t: any, idx: number) => {
                            const products = t.products && t.products.length > 0 
                              ? t.products 
                              : [{}]; // Dummy for iteration
                            
                            return products.map((p: any, pIdx: number) => {
                              const calcLine = generatedBill.calcResult?.lines[flatIdx++];
                              if (!calcLine) return null;

                              return (
                                <tr key={`${t.id}-${pIdx}`}>
                                  {pIdx === 0 && (
                                    <>
                                      <td className="py-3 px-3 font-bold text-slate-400" rowSpan={products.length}>{idx + 1}</td>
                                      <td className="py-3 px-3 font-extrabold text-slate-900" rowSpan={products.length}>{t.disease || "General Checkup"}</td>
                                    </>
                                  )}
                                  <td className="py-3 px-3 text-slate-600">{calcLine.name}</td>
                                  <td className="py-3 px-3 text-slate-500 font-mono text-[10px]">{calcLine.hsnCode || "-"}</td>
                                  <td className="py-3 px-3 text-center text-slate-600">{calcLine.qty}</td>
                                  <td className="py-3 px-3 text-right text-slate-500">₹{calcLine.rate.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                  <td className="py-3 px-3 text-center text-slate-500">{calcLine.taxRate}%</td>
                                  <td className="py-3 px-3 text-right text-slate-500">₹{calcLine.totalTax.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                  <td className="py-3 px-3 text-right font-extrabold text-slate-800">
                                    ₹{calcLine.finalAmount.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                  </td>
                                </tr>
                              );
                            })
                          })
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Medical Notes if present */}
                {(generatedBill.symptoms || generatedBill.notes) && (
                  <div className="bg-slate-50/60 rounded-xl p-3.5 border border-slate-100 text-xs space-y-1">
                    {generatedBill.symptoms && (
                      <p><strong className="text-slate-600">Symptoms:</strong> <span className="text-slate-500">{generatedBill.symptoms}</span></p>
                    )}
                    {generatedBill.notes && (
                      <p><strong className="text-slate-600">Notes / Dosage:</strong> <span className="text-slate-500">{generatedBill.notes}</span></p>
                    )}
                  </div>
                )}

                {/* Financial Calculation Breakdown */}
                <div className="flex flex-col sm:flex-row justify-between pt-2 gap-4">
                  {/* HSN Summary */}
                  {generatedBill.calcResult?.hsnSummary && generatedBill.calcResult.hsnSummary.length > 0 && (
                    <div className="flex-1 max-w-lg overflow-x-auto border border-slate-200/80 rounded-xl p-2 bg-white">
                      <h4 className="text-[10px] font-extrabold text-slate-500 uppercase mb-2 px-1">HSN/SAC Tax Summary</h4>
                      <table className="w-full text-[10px] text-right">
                        <thead className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100">
                          <tr>
                            <th className="py-1 px-2 text-left">HSN/SAC</th>
                            <th className="py-1 px-2">Taxable Value</th>
                            {generatedBill.calcResult.isInterState ? (
                              <>
                                <th className="py-1 px-2 text-center">IGST Rate</th>
                                <th className="py-1 px-2">IGST Amt</th>
                              </>
                            ) : (
                              <>
                                <th className="py-1 px-2 text-center">CGST Rate</th>
                                <th className="py-1 px-2">CGST Amt</th>
                                <th className="py-1 px-2 text-center">SGST Rate</th>
                                <th className="py-1 px-2">SGST Amt</th>
                              </>
                            )}
                            <th className="py-1 px-2 font-extrabold">Total Tax</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-slate-600 font-semibold">
                          {generatedBill.calcResult.hsnSummary.map((hsn: any, idx: number) => (
                            <tr key={idx}>
                              <td className="py-1.5 px-2 text-left font-mono">{hsn.hsn}</td>
                              <td className="py-1.5 px-2">₹{hsn.taxableValue.toLocaleString("en-IN", {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                              {generatedBill.calcResult.isInterState ? (
                                <>
                                  <td className="py-1.5 px-2 text-center text-slate-400">{hsn.taxRate}%</td>
                                  <td className="py-1.5 px-2">₹{hsn.igstAmount.toLocaleString("en-IN", {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                                </>
                              ) : (
                                <>
                                  <td className="py-1.5 px-2 text-center text-slate-400">{hsn.taxRate > 0 ? `${(hsn.taxRate / 2).toFixed(2).replace(/\.?0+$/, '')}%` : '0%'}</td>
                                  <td className="py-1.5 px-2">₹{hsn.cgstAmount.toLocaleString("en-IN", {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                                  <td className="py-1.5 px-2 text-center text-slate-400">{hsn.taxRate > 0 ? `${(hsn.taxRate / 2).toFixed(2).replace(/\.?0+$/, '')}%` : '0%'}</td>
                                  <td className="py-1.5 px-2">₹{hsn.sgstAmount.toLocaleString("en-IN", {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                                </>
                              )}
                              <td className="py-1.5 px-2 font-extrabold text-slate-800">₹{hsn.totalTax.toLocaleString("en-IN", {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900">
                          <tr>
                            <td className="py-2 px-2 text-left font-black uppercase text-[10px]">Total</td>
                            <td className="py-2 px-2 font-black">₹{generatedBill.calcResult.totalTaxableValue.toLocaleString("en-IN", {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                            {generatedBill.calcResult.isInterState ? (
                              <>
                                <td className="py-2 px-2 text-center text-slate-400">-</td>
                                <td className="py-2 px-2 font-black">₹{generatedBill.calcResult.totalIgst.toLocaleString("en-IN", {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                              </>
                            ) : (
                              <>
                                <td className="py-2 px-2 text-center text-slate-400">-</td>
                                <td className="py-2 px-2 font-black">₹{generatedBill.calcResult.totalCgst.toLocaleString("en-IN", {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                                <td className="py-2 px-2 text-center text-slate-400">-</td>
                                <td className="py-2 px-2 font-black">₹{generatedBill.calcResult.totalSgst.toLocaleString("en-IN", {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                              </>
                            )}
                            <td className="py-2 px-2 font-black text-slate-900">₹{generatedBill.calcResult.totalTax.toLocaleString("en-IN", {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                  <div className="w-full sm:w-72 space-y-1.5 text-[11px] font-semibold text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                    <div className="flex justify-between">
                      <span>Gross Medicines:</span>
                      <span>₹{generatedBill.calcResult?.grossAmount.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                    {generatedBill.consultancyVal > 0 && (
                      <div className="flex justify-between text-slate-700">
                        <span>Consultation Charges:</span>
                        <span>+ ₹{generatedBill.consultancyVal.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-slate-200 pt-1.5 mt-1.5 font-bold text-slate-800">
                      <span>{generatedBill.consultancyVal > 0 ? "Taxable Value (incl. Consult.):" : "Taxable Value:"}</span>
                      <span>₹{generatedBill.calcResult?.totalTaxableValue.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                    {generatedBill.calcResult?.isInterState ? (
                      <div className="flex justify-between text-indigo-600">
                        <span>IGST:</span>
                        <span>₹{generatedBill.calcResult?.totalIgst.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between text-indigo-600">
                          <span>CGST:</span>
                          <span>₹{generatedBill.calcResult?.totalCgst.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                        <div className="flex justify-between text-indigo-600">
                          <span>SGST:</span>
                          <span>₹{generatedBill.calcResult?.totalSgst.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between border-t border-slate-200/80 pt-1 font-bold text-slate-700">
                      <span>Original Bill Total:</span>
                      <span>₹{generatedBill.calcResult?.originalInvoiceTotal?.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                    {generatedBill.discountVal > 0 && (
                      <div className="flex justify-between text-rose-500 font-semibold">
                        <span>Product Discount:</span>
                        <span>- ₹{generatedBill.discountVal.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      </div>
                    )}
                    {generatedBill.calcResult?.roundOff !== 0 && (
                      <div className="flex justify-between text-slate-500">
                        <span>Round Off:</span>
                        <span>{generatedBill.calcResult?.roundOff > 0 ? "+" : ""} ₹{generatedBill.calcResult?.roundOff.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      </div>
                    )}
                    <div className="border-t border-slate-300 pt-2 flex justify-between font-extrabold text-[13px] text-slate-900">
                      <span>Final Payable:</span>
                      <span className="text-blue-600 font-black">₹{generatedBill.totalDueVal.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                    <div className="border-t border-slate-200/80 pt-2 mt-2 space-y-1">
                      <div className="flex justify-between text-slate-500">
                        <span>Cash Paid:</span>
                        <span>₹{generatedBill.cashVal.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Online / UPI Paid:</span>
                        <span>₹{generatedBill.onlineVal.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      </div>
                      <div className="flex justify-between font-bold text-emerald-600 border-t border-slate-200/60 pt-1">
                        <span>Total Paid:</span>
                        <span>₹{generatedBill.totalPaidVal.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      </div>
                      {Math.max(0, generatedBill.totalDueVal - generatedBill.totalPaidVal) > 0 && (
                        <div className="flex justify-between font-bold text-amber-600 pt-1">
                          <span>Balance Due:</span>
                          <span>₹{Math.max(0, generatedBill.totalDueVal - generatedBill.totalPaidVal).toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Follow-up Note & Signatures */}
                <div className="border-t border-slate-200 pt-4 flex justify-between items-end text-xs">
                  <div>
                    {generatedBill.nextFollowUpDate && (
                      <p className="font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg inline-block border border-emerald-100">
                        📅 Next Checkup Date: {new Date(generatedBill.nextFollowUpDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-2 font-semibold">Thank you for visiting KSV Healthcare! Wish you a healthy speedy recovery.</p>
                  </div>

                  <div className="text-center pt-6">
                    <div className="w-32 border-b border-slate-400 mb-1"></div>
                    <p className="text-[10px] font-bold uppercase text-slate-400">Authorized Stamp &amp; Sign</p>
                  </div>
                </div>

              </div>

            </div>

            {/* Bottom Non-printable Close Button Footer */}
            <div className="p-4 bg-slate-50/60 border-t border-slate-100 shrink-0 print:hidden">
              <button
                type="button"
                onClick={() => {
                  setShowReceiptModal(false)
                  router.push("/patients")
                }}
                className="w-full py-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-extrabold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer text-xs shadow-sm active:scale-[0.99]"
              >
                <X className="w-4 h-4" />
                Close Receipt &amp; Return to Directory
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
