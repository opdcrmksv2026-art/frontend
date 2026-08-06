"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  Search, 
  User, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Calendar, 
  Plus, 
  X, 
  FileText, 
  CreditCard,
  CheckCircle,
  Activity,
  UserCheck,
  ClipboardList
} from "lucide-react"

interface Visit {
  id: string;
  patientId: string;
  kitName: string;
  totalAmount: number;
  amountCash: number;
  amountOnline: number;
  billingType: string;
  status: string;
  symptoms: string;
  notes: string;
  createdAt: string;
}

interface Patient {
  id: string;
  uniqueId: string;
  name: string;
  address?: string | null;
  houseNumber?: string | null;
  galiNumber?: string | null;
  state?: string | null;
  pincode?: string | null;
  age?: number | null;
  gender?: string | null;
  whatsappNumber?: string | null;
  callingNumber?: string | null;
  orders?: Visit[];
}

export default function PatientHistoryPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<Visit[]>([])
  
  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState("")
  const [visitForm, setVisitForm] = useState({
    symptoms: "",
    kitName: "",
    totalAmount: "",
    amountCash: "",
    amountOnline: "",
    billingType: "Non-GST",
    status: "COMPLETED",
    notes: "",
    date: new Date().toISOString().split("T")[0]
  })

  // Load patient directory for autocomplete list
  useEffect(() => {
    const loadPatients = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
        const res = await fetch(`${API_URL}/api/patients`)
        if (res.ok) {
          const data = await res.json()
          setPatients(data)
        }
      } catch (err) {
        console.error("Failed to load autocomplete patient directory:", err)
      }
    }
    loadPatients()
  }, [])

  // Search filter
  const filteredSearchPatients = searchQuery.trim() === "" 
    ? [] 
    : patients.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.uniqueId.includes(searchQuery) ||
        (p.callingNumber && p.callingNumber.includes(searchQuery))
      ).slice(0, 5)

  // Fetch patient history details
  const loadPatientHistory = async (uniqueId: string) => {
    setLoading(true)
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      const res = await fetch(`${API_URL}/api/patients/${uniqueId}/history`)
      if (!res.ok) {
        throw new Error("Failed to load patient history")
      }
      const data = await res.json()
      setSelectedPatient(data)
      setHistory(data.orders || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPatient = (patient: Patient) => {
    setSearchQuery("")
    setShowDropdown(false)
    loadPatientHistory(patient.uniqueId)
  }

  // Handle Add Visit form input change
  const handleVisitChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setVisitForm(prev => {
      const updated = { ...prev, [name]: value }
      
      // Auto balance online/cash splits if totalAmount changes
      if (name === "totalAmount") {
        updated.amountCash = value
        updated.amountOnline = "0"
      }
      return updated
    })
  }

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient) return

    setModalLoading(true)
    setModalError("")

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      const res = await fetch(`${API_URL}/api/patients/${selectedPatient.uniqueId}/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...visitForm,
          totalAmount: parseFloat(visitForm.totalAmount || "0"),
          amountCash: parseFloat(visitForm.amountCash || "0"),
          amountOnline: parseFloat(visitForm.amountOnline || "0")
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to add visit record")
      }

      // Success
      setShowModal(false)
      // Reset form
      setVisitForm({
        symptoms: "",
        kitName: "",
        totalAmount: "",
        amountCash: "",
        amountOnline: "",
        billingType: "Non-GST",
        status: "COMPLETED",
        notes: "",
        date: new Date().toISOString().split("T")[0]
      })

      // Refetch history
      await loadPatientHistory(selectedPatient.uniqueId)
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Error saving visit record")
    } finally {
      setModalLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-4 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-700 w-full pb-16">
      
      {/* Search Header block */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.01)] relative z-20">
        <h2 className="text-sm font-black text-slate-400 tracking-wider uppercase mb-3 flex items-center gap-1.5 select-none">
          <Search className="w-4 h-4 text-primary" />
          Look Up Patient History
        </h2>
        
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Type Patient Name, Unique ID (Aadhar/Mobile), or Phone number..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowDropdown(true)
            }}
            onFocus={() => setShowDropdown(true)}
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-2 border-slate-100 focus:border-primary/20 rounded-2xl outline-none transition-all text-sm font-semibold text-slate-700"
          />

          {/* Autocomplete Dropdown overlay */}
          {showDropdown && filteredSearchPatients.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-50">
              {filteredSearchPatients.map(p => (
                <div 
                  key={p.id}
                  onClick={() => handleSelectPatient(p)}
                  className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition-colors group"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors">{p.name}</p>
                    <p className="text-[11px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">ID: {p.uniqueId}</p>
                  </div>
                  <span className="text-xs font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full uppercase">
                    {p.gender}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="mt-8 bg-white border border-slate-100 rounded-3xl p-8 space-y-4 animate-pulse">
          <div className="h-6 bg-slate-100 rounded-lg w-1/3"></div>
          <div className="h-4 bg-slate-100 rounded-lg w-1/2"></div>
          <div className="h-24 bg-slate-50 rounded-2xl"></div>
        </div>
      ) : !selectedPatient ? (
        /* Empty / Search Call-to-action view */
        <div className="mt-8 bg-white rounded-3xl border border-slate-100 p-12 text-center flex flex-col items-center justify-center min-h-[350px] shadow-[0_8px_30px_rgb(0,0,0,0.01)] animate-in fade-in duration-500">
          <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-4">
            <ClipboardList className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Select a Patient</h3>
          <p className="text-slate-500 mt-1 max-w-sm text-sm">
            Search for a registered patient profile above to manage their treatment logs and order timeline.
          </p>
        </div>
      ) : (
        /* Patient History View */
        <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Patient Details Summary Card */}
          <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">{selectedPatient.name}</h2>
                <span className={`px-2.5 py-0.5 text-xs font-black tracking-wide border rounded-full ${
                  selectedPatient.gender?.toLowerCase() === "male" 
                    ? "bg-indigo-50 text-indigo-600 border-indigo-100" 
                    : selectedPatient.gender?.toLowerCase() === "female"
                      ? "bg-pink-50 text-pink-600 border-pink-100"
                      : "bg-slate-50 text-slate-600 border-slate-100"
                }`}>
                  {selectedPatient.gender || "N/A"}
                </span>
                {selectedPatient.age && (
                  <span className="text-slate-400 text-sm font-bold">{selectedPatient.age} yrs</span>
                )}
              </div>
              <p className="text-slate-400 font-mono text-xs mt-1.5">Unique ID: {selectedPatient.uniqueId}</p>

              {/* Contacts and Address row */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-xs font-semibold text-slate-500">
                {selectedPatient.callingNumber && (
                  <a href={`tel:${selectedPatient.callingNumber}`} className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
                    <Phone className="w-4 h-4 text-blue-500" />
                    {selectedPatient.callingNumber}
                  </a>
                )}
                {selectedPatient.whatsappNumber && (
                  <a 
                    href={`https://wa.me/${selectedPatient.whatsappNumber.replace(/[^0-9]/g, "")}`}
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-500" />
                    {selectedPatient.whatsappNumber}
                  </a>
                )}
                {(selectedPatient.houseNumber || selectedPatient.galiNumber || selectedPatient.state || selectedPatient.pincode) && (
                  <span className="flex items-start gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>
                      {[
                        selectedPatient.houseNumber ? `H.No. ${selectedPatient.houseNumber}` : "",
                        selectedPatient.galiNumber ? `Gali ${selectedPatient.galiNumber}` : "",
                        selectedPatient.state,
                        selectedPatient.pincode
                      ].filter(Boolean).join(", ")}
                    </span>
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-5 py-3 rounded-2xl shadow-md hover:bg-primary/95 transition-all duration-200 shrink-0 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              Add Visit Record
            </button>
          </div>

          {/* Visit History timeline */}
          <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              Treatment History Logs
            </h3>

            {history.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-3">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <p className="text-slate-500 font-bold text-sm">No Treatment Records Registered</p>
                <p className="text-slate-400 text-xs mt-1">Click the "+ Add Visit Record" button above to add the patient's first medical log.</p>
              </div>
            ) : (
              /* Timeline */
              <div className="relative pl-6 border-l-2 border-slate-100 space-y-8 ml-3 py-2">
                {history.map((visit) => {
                  const statusColors = 
                    visit.status?.toLowerCase() === "ongoing" 
                      ? "bg-amber-50 text-amber-600 border-amber-100/50" 
                      : visit.status?.toLowerCase() === "pending"
                        ? "bg-red-50 text-red-600 border-red-100/50"
                        : "bg-emerald-50 text-emerald-600 border-emerald-100/50";

                  return (
                    <div key={visit.id} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white bg-primary shadow-sm"></span>

                      {/* Timeline card content */}
                      <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 hover:bg-slate-50 transition-colors duration-200">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(visit.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                            <span className={`px-2.5 py-0.5 text-[10px] font-black tracking-wider border rounded-full uppercase ${statusColors}`}>
                              {visit.status || "COMPLETED"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                            <span className="px-2 py-0.5 bg-white border border-slate-100 rounded-md text-[10px] uppercase font-black">
                              {visit.billingType || "Non-GST"}
                            </span>
                            <span className="flex items-center gap-1 font-bold text-slate-700">
                              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                              ₹{visit.totalAmount} 
                              {(visit.amountCash > 0 || visit.amountOnline > 0) && (
                                <span className="text-slate-400 text-[10px] font-medium ml-1">
                                  ({visit.amountCash > 0 ? `Cash: ₹${visit.amountCash}` : ""}{visit.amountCash > 0 && visit.amountOnline > 0 ? ", " : ""}{visit.amountOnline > 0 ? `Online: ₹${visit.amountOnline}` : ""})
                                </span>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Prescribed Item / Kit */}
                        <div className="mt-3">
                          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                            <Activity className="w-4 h-4 text-primary" />
                            {visit.kitName}
                          </h4>
                        </div>

                        {/* Symptoms block */}
                        {visit.symptoms && (
                          <div className="mt-2 text-xs text-slate-600 font-semibold bg-white border border-slate-100 rounded-lg py-1.5 px-3 inline-block">
                            Symptoms: <span className="text-slate-500 font-medium">{visit.symptoms}</span>
                          </div>
                        )}

                        {/* Notes block */}
                        {visit.notes && (
                          <div className="mt-3 pt-3 border-t border-slate-100/50 text-xs text-slate-500 font-medium">
                            <p className="font-bold text-slate-700 mb-1 flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5 text-slate-400" /> Notes:
                            </p>
                            <p className="whitespace-pre-wrap leading-relaxed bg-white border border-slate-100/60 p-2.5 rounded-lg">{visit.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modern Add Visit Dialog Modal */}
      {showModal && selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-5 bg-slate-50/70 border-b border-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Add Visit Record</h3>
                <p className="text-slate-400 text-xs font-semibold mt-0.5">Register visit details for {selectedPatient.name}</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleModalSubmit}>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {modalError && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 text-xs font-medium">
                    {modalError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Visit Date</label>
                    <input
                      type="date"
                      name="date"
                      required
                      value={visitForm.date}
                      onChange={handleVisitChange}
                      className="px-4 py-2.5 bg-slate-50 border-2 border-slate-100 focus:border-primary/20 rounded-xl outline-none transition-all text-xs font-semibold text-slate-700"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Treatment Status</label>
                    <select
                      name="status"
                      value={visitForm.status}
                      onChange={handleVisitChange}
                      className="px-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none text-xs font-bold text-slate-600 cursor-pointer"
                    >
                      <option value="COMPLETED">Completed</option>
                      <option value="ONGOING">Ongoing</option>
                      <option value="PENDING">Pending</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Prescribed Course / Kit</label>
                  <input
                    type="text"
                    name="kitName"
                    required
                    value={visitForm.kitName}
                    onChange={handleVisitChange}
                    className="px-4 py-2.5 bg-slate-50 border-2 border-slate-100 focus:border-primary/20 rounded-xl outline-none transition-all text-xs font-semibold text-slate-700"
                    placeholder="e.g. Gallstone Kit, Consultation"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Symptoms / Disease</label>
                  <input
                    type="text"
                    name="symptoms"
                    value={visitForm.symptoms}
                    onChange={handleVisitChange}
                    className="px-4 py-2.5 bg-slate-50 border-2 border-slate-100 focus:border-primary/20 rounded-xl outline-none transition-all text-xs font-semibold text-slate-700"
                    placeholder="e.g. Acid reflux, stomach pain"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Amount (₹)</label>
                    <input
                      type="number"
                      name="totalAmount"
                      required
                      value={visitForm.totalAmount}
                      onChange={handleVisitChange}
                      className="px-4 py-2.5 bg-slate-50 border-2 border-slate-100 focus:border-primary/20 rounded-xl outline-none transition-all text-xs font-semibold text-slate-700"
                      placeholder="0"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Billing Type</label>
                    <select
                      name="billingType"
                      value={visitForm.billingType}
                      onChange={handleVisitChange}
                      className="px-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none text-xs font-bold text-slate-600 cursor-pointer"
                    >
                      <option value="Non-GST">Non-GST</option>
                      <option value="GST">GST</option>
                      <option value="Govt Claim">Govt Claim</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 p-4 border border-slate-100 rounded-2xl">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Paid via Cash (₹)</label>
                    <input
                      type="number"
                      name="amountCash"
                      value={visitForm.amountCash}
                      onChange={handleVisitChange}
                      className="px-3 py-2 bg-white border-2 border-slate-100 focus:border-primary/20 rounded-lg outline-none transition-all text-xs font-semibold text-slate-700"
                      placeholder="0"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Paid Online (₹)</label>
                    <input
                      type="number"
                      name="amountOnline"
                      value={visitForm.amountOnline}
                      onChange={handleVisitChange}
                      className="px-3 py-2 bg-white border-2 border-slate-100 focus:border-primary/20 rounded-lg outline-none transition-all text-xs font-semibold text-slate-700"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Visit / Doctor Notes</label>
                  <textarea
                    name="notes"
                    rows={3}
                    value={visitForm.notes}
                    onChange={handleVisitChange}
                    className="px-4 py-2.5 bg-slate-50 border-2 border-slate-100 focus:border-primary/20 rounded-xl outline-none transition-all text-xs font-semibold text-slate-700 resize-none"
                    placeholder="Enter patient diagnosis, dosage details, etc..."
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-50 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/95 font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  {modalLoading ? "Saving Visit..." : "Save Visit Record"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  )
}
