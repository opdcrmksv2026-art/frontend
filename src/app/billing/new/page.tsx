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
  Wallet
} from "lucide-react"

interface TreatmentItem {
  id: string
  disease: string
  kitName: string
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
  galiNumber?: string
  state?: string
  pincode?: string
}

export default function CreateInvoicePage() {
  const router = useRouter()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

  // Master lists
  const [patients, setPatients] = useState<Patient[]>([])
  const [loadingPatients, setLoadingPatients] = useState(true)

  // Step-by-Step State
  const [currentStep, setCurrentStep] = useState(1)

  // Search & selection states
  const [searchQuery, setSearchQuery] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  
  // Form mode: true = existing patient selected/autofilled, false = register new on-the-fly
  const [isExistingPatient, setIsExistingPatient] = useState(false)

  // Treatments list (multiple diseases support)
  const [treatments, setTreatments] = useState<TreatmentItem[]>([
    { id: "1", disease: "", kitName: "", durationDays: "30", price: "0" }
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
    galiNumber: "",
    state: "",
    pincode: "",
    
    // Pricing & Payments
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

  // Treatment list manipulators
  const handleAddTreatment = () => {
    setTreatments(prev => [
      ...prev,
      { id: Date.now().toString(), disease: "", kitName: "", durationDays: "30", price: "0" }
    ])
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
      galiNumber: patient.galiNumber || "",
      state: patient.state || "",
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
      galiNumber: "",
      state: "",
      pincode: ""
    }))
  }

  // Generic input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => {
      const updated = { ...prev, [name]: value }
      if (name === "billingType") {
        let tDue = netSubtotal
        if (value.includes("+18%")) {
          tDue = Math.round((netSubtotal + netSubtotal * 0.18) * 100) / 100
        }
        if (updated.amountOnline === "0" || !updated.amountOnline) {
          updated.amountCash = tDue.toString()
        }
      }
      return updated
    })
  }

  // Numeric change helper
  const handleNumericChange = (name: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [name]: value }
      if (name === "discountApplied") {
        const dVal = parseFloat(value || "0")
        const net = Math.max(0, priceVal - dVal)
        let tDue = net
        if (prev.billingType.includes("+18%")) {
          tDue = Math.round((net + net * 0.18) * 100) / 100
        }
        if (updated.amountOnline === "0" || !updated.amountOnline) {
          updated.amountCash = tDue.toString()
        }
      }
      return updated
    })
  }

  // Financial values calculations
  const priceVal = treatments.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0)
  const discountVal = parseFloat(formData.discountApplied || "0")
  const netSubtotal = Math.max(0, priceVal - discountVal)

  let gstVal = 0
  let totalDueVal = netSubtotal

  if (formData.billingType.includes("+18%") || formData.billingType === "GST (+18% Extra)") {
    gstVal = Math.round(netSubtotal * 0.18 * 100) / 100
    totalDueVal = Math.round((netSubtotal + gstVal) * 100) / 100
  } else if (formData.billingType.includes("Inclusive") || formData.billingType === "GST (18% Inclusive)" || formData.billingType === "GST") {
    gstVal = Math.round((netSubtotal - netSubtotal / 1.18) * 100) / 100
    totalDueVal = netSubtotal
  } else {
    gstVal = 0
    totalDueVal = netSubtotal
  }

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
      // Auto-fill Cash Collected to full amount by default
      setFormData(prev => ({
        ...prev,
        amountCash: totalDueVal.toString(),
        amountOnline: "0"
      }))
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
    const combinedKitName = treatments.map(t => `${t.disease || t.kitName || 'Treatment'} (${t.durationDays}d)`).join(" + ")
    const combinedDiseases = treatments.map(t => t.disease).filter(Boolean).join(", ")

    const billData = {
      invoiceNo,
      patientName: formData.name,
      patientId: formData.uniqueId,
      age: formData.age,
      gender: formData.gender,
      whatsappNumber: formData.whatsappNumber,
      treatments,
      combinedKitName,
      combinedDiseases,
      symptoms: formData.symptoms,
      notes: formData.notes,
      billingType: formData.billingType,
      date: formData.date,
      nextFollowUpDate: formData.nextFollowUpDate,
      priceVal,
      discountVal,
      gstVal,
      totalDueVal,
      cashVal,
      onlineVal,
      totalPaidVal,
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
            galiNumber: formData.galiNumber || null,
            state: formData.state || null,
            pincode: formData.pincode || null
          })
        }).catch(() => {})
      }

      await fetch(`${API_URL}/api/patients/${formData.uniqueId}/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kitName: combinedKitName,
          totalAmount: totalDueVal,
          amountCash: cashVal,
          amountOnline: onlineVal,
          billingType: formData.billingType,
          status: "COMPLETED",
          symptoms: formData.symptoms,
          notes: formData.notes,
          date: formData.date
        })
      }).catch(() => {})

      if (formData.nextFollowUpDate) {
        await fetch(`${API_URL}/api/patients/${formData.uniqueId}/followup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nextFollowUpDate: formData.nextFollowUpDate,
            followUpStatus: "PENDING",
            followUpNotes: `Next checkup for ${combinedKitName}`
          })
        }).catch(() => {})
      }
    } catch (err) {
      console.warn("Backend offline or network error, generating local bill receipt:", err)
    } finally {
      // Save locally to localStorage so offline bill generation ALWAYS works
      try {
        const existingOffline = JSON.parse(localStorage.getItem("ksv_offline_bills") || "[]")
        existingOffline.unshift(billData)
        localStorage.setItem("ksv_offline_bills", JSON.stringify(existingOffline))
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
          <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2.5 gap-x-4 mt-4 text-xs text-slate-500 font-semibold">
                <div><span className="text-slate-400">ID / Mobile:</span> {selectedPatient.uniqueId}</div>
                <div><span className="text-slate-400">Age / Gender:</span> {selectedPatient.age || "N/A"} yrs / {selectedPatient.gender || "N/A"}</div>
                {selectedPatient.whatsappNumber && <div><span className="text-slate-400">WhatsApp:</span> {selectedPatient.whatsappNumber}</div>}
                {selectedPatient.address && <div className="col-span-1 sm:col-span-2 md:col-span-3 border-t border-slate-100/80 pt-3 mt-1"><span className="text-slate-400">Full Address:</span> {selectedPatient.address}</div>}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  Patient Mobile / ID
                </label>
                <input
                  type="text"
                  disabled
                  value={formData.uniqueId}
                  className="w-full px-4 py-3 bg-slate-100 border-2 border-slate-200 rounded-2xl text-sm font-semibold text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  Patient Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter patient full name to register..."
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 pl-11 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-2 border-slate-100/50 focus:border-blue-500/20 rounded-2xl outline-none transition-all text-sm font-semibold text-slate-700 placeholder-slate-400"
                  />
                </div>
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
                  Disease / Treatment #{index + 1}
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
                  <input
                    type="text"
                    value={treatment.disease}
                    onChange={(e) => handleTreatmentChange(treatment.id, "disease", e.target.value)}
                    placeholder="e.g. Sugar / Diabetes, BP, Joint Pain, Liver..."
                    className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none text-sm font-semibold text-slate-700 placeholder-slate-400"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Kit / Medicine Name</label>
                  <input
                    type="text"
                    value={treatment.kitName}
                    onChange={(e) => handleTreatmentChange(treatment.id, "kitName", e.target.value)}
                    placeholder="e.g. Sugar Control Kit, BP Care Pack..."
                    className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none text-sm font-semibold text-slate-700 placeholder-slate-400"
                  />
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
              
              {/* Discount selection */}
              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">Discount (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-slate-400 text-sm font-semibold">₹</span>
                  <input
                    type="number"
                    value={formData.discountApplied}
                    onChange={(e) => handleNumericChange("discountApplied", e.target.value)}
                    className="w-full px-4 py-3 pl-8 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-2 border-slate-100/50 focus:border-blue-500/20 rounded-2xl outline-none transition-all text-sm font-bold text-slate-700 text-right"
                  />
                </div>
              </div>

              {/* Billing type */}
              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">Invoice Billing Type</label>
                <select
                  name="billingType"
                  value={formData.billingType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-2 border-slate-100/50 focus:border-blue-500/20 rounded-2xl outline-none transition-all text-sm font-bold text-slate-700 cursor-pointer"
                >
                  <option value="Non-GST">Non-GST Invoice</option>
                  <option value="GST (+18% Extra)">GST Invoice (+18% GST Extra)</option>
                  <option value="GST (18% Inclusive)">GST Invoice (18% Inclusive)</option>
                  <option value="Govt Claim">Govt Claim / Insurance</option>
                </select>
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
                        value={formData.amountOnline}
                        onChange={(e) => handleNumericChange("amountOnline", e.target.value)}
                        placeholder="0"
                        className="w-full px-4 py-2.5 pl-7 bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none text-sm font-bold text-slate-700 text-right transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Clean Total Payment Summary bar */}
                <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-sm">
                  <div className="flex items-center gap-6">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Payable: <strong className="text-slate-800 text-sm font-extrabold ml-1">₹{totalDueVal.toLocaleString("en-IN")}</strong></span>
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
                        {t.disease || t.kitName || `Treatment #${idx + 1}`}
                      </span>
                      <span className="text-[11px] font-extrabold text-slate-700">₹{parseFloat(t.price || "0").toLocaleString("en-IN")}</span>
                    </div>
                    {(t.kitName || t.durationDays) && (
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
                  <span>Medicine Subtotal:</span>
                  <span>₹{priceVal.toLocaleString("en-IN")}</span>
                </div>
                {discountVal > 0 && (
                  <div className="flex justify-between text-rose-500">
                    <span>Discount:</span>
                    <span>- ₹{discountVal.toLocaleString("en-IN")}</span>
                  </div>
                )}
                {gstVal > 0 && (
                  <div className="flex justify-between text-indigo-600">
                    <span>GST (18%):</span>
                    <span>{formData.billingType.includes("+18%") ? `+ ₹${gstVal.toLocaleString("en-IN")}` : `₹${gstVal.toLocaleString("en-IN")} (Included)`}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>Billing Type:</span>
                  <span>{formData.billingType}</span>
                </div>
                <div className="flex justify-between font-extrabold text-sm border-t border-slate-100 pt-2 text-slate-800">
                  <span>Total Amount Payable:</span>
                  <span className="text-blue-600 text-base">₹{totalDueVal.toLocaleString("en-IN")}</span>
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
              currentStep === 1
                ? "bg-white text-blue-600 font-extrabold shadow-sm"
                : currentStep > 1
                  ? "text-emerald-600 font-bold"
                  : "text-slate-400 font-medium"
            }`}
          >
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
              currentStep === 1
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
              currentStep === 2
                ? "bg-white text-blue-600 font-extrabold shadow-sm"
                : currentStep > 2
                  ? "text-emerald-600 font-bold"
                  : "text-slate-400 font-medium"
            }`}
          >
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
              currentStep === 2
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
              currentStep === 3
                ? "bg-white text-blue-600 font-extrabold shadow-sm"
                : "text-slate-400 font-medium"
            }`}
          >
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
              currentStep === 3
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

      {/* PRINTABLE RECEIPT MODAL TEMPLATE */}
      {showReceiptModal && generatedBill && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300 print:bg-transparent print:p-0"
          onClick={() => {
            setShowReceiptModal(false)
            router.push("/patients")
          }}
        >
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 relative my-8 text-slate-800 flex flex-col overflow-hidden print:shadow-none print:border-none print:my-0 print:max-w-none print:w-full"
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
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">KSV HEALTHCARE &amp; AYURVEDA</h1>
                    <p className="text-xs font-bold text-slate-500 mt-0.5">Specialized Medical Care &amp; Ayurvedic OPD Clinic</p>
                    <p className="text-[11px] text-slate-400 font-semibold mt-1">Helpline: +91 98765 43210 | GSTIN: 07AAAAA0000A1Z5</p>
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
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Billing Type</span>
                    <span className="font-bold text-indigo-600">{generatedBill.billingType}</span>
                  </div>
                </div>

                {/* Treatment Items Table */}
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">Prescribed Treatments &amp; Medicine Kits</h3>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
                        <tr>
                          <th className="py-3 px-4">#</th>
                          <th className="py-3 px-4">Disease / Condition</th>
                          <th className="py-3 px-4">Medicine Kit Name</th>
                          <th className="py-3 px-4 text-center">Duration</th>
                          <th className="py-3 px-4 text-right">Price (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        {generatedBill.treatments.map((t: any, idx: number) => (
                          <tr key={t.id}>
                            <td className="py-3 px-4 font-bold text-slate-400">{idx + 1}</td>
                            <td className="py-3 px-4 font-extrabold text-slate-900">{t.disease || "General Checkup"}</td>
                            <td className="py-3 px-4 text-slate-600">{t.kitName || "Custom Kit"}</td>
                            <td className="py-3 px-4 text-center text-slate-500">{t.durationDays} Days</td>
                            <td className="py-3 px-4 text-right font-extrabold text-slate-800">₹{parseFloat(t.price || "0").toLocaleString("en-IN")}</td>
                          </tr>
                        ))}
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
                <div className="flex justify-end pt-2">
                  <div className="w-full sm:w-72 space-y-2 text-xs font-semibold text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                    <div className="flex justify-between">
                      <span>Medicine Subtotal:</span>
                      <span>₹{generatedBill.priceVal.toLocaleString("en-IN")}</span>
                    </div>
                    {generatedBill.discountVal > 0 && (
                      <div className="flex justify-between text-rose-500">
                        <span>Discount Applied:</span>
                        <span>- ₹{generatedBill.discountVal.toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    {generatedBill.gstVal > 0 && (
                      <div className="flex justify-between text-indigo-600">
                        <span>GST (18%):</span>
                        <span>₹{generatedBill.gstVal.toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    <div className="border-t border-slate-300 pt-2 flex justify-between font-extrabold text-sm text-slate-900">
                      <span>Total Amount Payable:</span>
                      <span className="text-blue-600 font-black">₹{generatedBill.totalDueVal.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="border-t border-slate-200/80 pt-2 space-y-1 text-[11px]">
                      <div className="flex justify-between text-slate-500">
                        <span>Cash Paid:</span>
                        <span>₹{generatedBill.cashVal.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Online / UPI Paid:</span>
                        <span>₹{generatedBill.onlineVal.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between font-bold text-emerald-600 border-t border-slate-200/60 pt-1">
                        <span>Total Paid:</span>
                        <span>₹{generatedBill.totalPaidVal.toLocaleString("en-IN")}</span>
                      </div>
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
