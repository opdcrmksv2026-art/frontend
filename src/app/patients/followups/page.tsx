"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  Search, 
  User, 
  Phone, 
  MessageSquare, 
  Calendar, 
  Plus, 
  X, 
  CheckCircle,
  AlertCircle,
  Clock,
  CheckSquare,
  RefreshCw,
  SearchCode
} from "lucide-react"

interface Patient {
  id: string;
  uniqueId: string;
  name: string;
  callingNumber?: string | null;
  whatsappNumber?: string | null;
  nextFollowUpDate?: string | null;
  followUpStatus?: string | null;
  followUpNotes?: string | null;
}

export default function FollowUpsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("PENDING")
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Scheduling Form / Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  
  // Follow Up Form
  const [followUpForm, setFollowUpForm] = useState({
    nextFollowUpDate: new Date().toISOString().split("T")[0],
    followUpNotes: ""
  })
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState("")

  // Reschedule & Resolve Modals
  const [activePatient, setActivePatient] = useState<Patient | null>(null)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [showResolveModal, setShowResolveModal] = useState(false)
  const [actionForm, setActionForm] = useState({
    date: new Date().toISOString().split("T")[0],
    notes: ""
  })

  const loadPatients = async (silent = false) => {
    if (!silent) setLoading(true)
    setError("")
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      const res = await fetch(`${API_URL}/api/patients`)
      if (!res.ok) {
        throw new Error("Failed to load patient directory")
      }
      const data = await res.json()
      setPatients(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading data")
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadPatients()
  }, [])

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadPatients(true)
  }

  // Submit new follow-up scheduling
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient) return

    setModalLoading(true)
    setModalError("")
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      const res = await fetch(`${API_URL}/api/patients/${selectedPatient.uniqueId}/followup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nextFollowUpDate: followUpForm.nextFollowUpDate,
          followUpStatus: "PENDING",
          followUpNotes: followUpForm.followUpNotes
        })
      })

      if (!res.ok) {
        throw new Error("Failed to schedule follow-up")
      }

      setShowScheduleModal(false)
      setSelectedPatient(null)
      setSearchQuery("")
      setFollowUpForm({
        nextFollowUpDate: new Date().toISOString().split("T")[0],
        followUpNotes: ""
      })
      await loadPatients(true)
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Error scheduling")
    } finally {
      setModalLoading(false)
    }
  }

  // Reschedule follow-up
  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activePatient) return

    setModalLoading(true)
    setModalError("")
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      const res = await fetch(`${API_URL}/api/patients/${activePatient.uniqueId}/followup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nextFollowUpDate: actionForm.date,
          followUpStatus: "PENDING",
          followUpNotes: actionForm.notes || activePatient.followUpNotes
        })
      })

      if (!res.ok) throw new Error("Failed to reschedule follow-up")

      setShowRescheduleModal(false)
      setActivePatient(null)
      await loadPatients(true)
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Error updating")
    } finally {
      setModalLoading(false)
    }
  }

  // Resolve follow-up
  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activePatient) return

    setModalLoading(true)
    setModalError("")
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      const res = await fetch(`${API_URL}/api/patients/${activePatient.uniqueId}/followup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          followUpStatus: "COMPLETED",
          followUpNotes: actionForm.notes || "Follow-up resolved."
        })
      })

      if (!res.ok) throw new Error("Failed to resolve follow-up")

      setShowResolveModal(false)
      setActivePatient(null)
      setActionForm({ date: new Date().toISOString().split("T")[0], notes: "" })
      await loadPatients(true)
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Error resolving")
    } finally {
      setModalLoading(false)
    }
  }

  // Filtering follow-up lists
  const followUpPatients = patients.filter(p => p.nextFollowUpDate)

  // Status and date checker helpers
  const todayStr = new Date().toISOString().split("T")[0]

  const metrics = {
    today: followUpPatients.filter(p => p.nextFollowUpDate === todayStr && p.followUpStatus === "PENDING").length,
    overdue: followUpPatients.filter(p => p.nextFollowUpDate && p.nextFollowUpDate < todayStr && p.followUpStatus === "PENDING").length,
    completed: followUpPatients.filter(p => p.followUpStatus === "COMPLETED").length
  }

  const filteredPatients = followUpPatients.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.uniqueId.includes(search) ||
      (p.callingNumber && p.callingNumber.includes(search))

    const matchesStatus = p.followUpStatus === statusFilter

    return matchesSearch && matchesStatus
  })

  // Autocomplete patient search inside scheduler modal
  const autocompletePatients = searchQuery.trim() === ""
    ? []
    : patients.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.uniqueId.includes(searchQuery)
      ).slice(0, 5)

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-700 w-full pb-12">
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100/80 flex items-center gap-4 relative overflow-hidden group">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm">
            <Clock className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-slate-400 font-bold text-xs tracking-wider uppercase">Pending Today</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{metrics.today}</h3>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100/80 flex items-center gap-4 relative overflow-hidden group">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shadow-sm">
            <AlertCircle className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-slate-400 font-bold text-xs tracking-wider uppercase">Overdue Calls</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{metrics.overdue}</h3>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100/80 flex items-center gap-4 relative overflow-hidden group">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
            <CheckSquare className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-slate-400 font-bold text-xs tracking-wider uppercase">Total Completed</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{metrics.completed}</h3>
          </div>
        </div>
      </div>

      {/* Filter and Schedule Bar */}
      <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search scheduled patients by name, unique ID, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-2 border-slate-100 focus:border-primary/20 rounded-2xl outline-none transition-all text-sm font-semibold text-slate-700"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto shrink-0 justify-between sm:justify-start">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3.5 bg-slate-50 hover:bg-slate-100/50 border-2 border-slate-100 rounded-2xl outline-none text-sm font-bold text-slate-600 cursor-pointer transition-all"
          >
            <option value="PENDING">Pending Check-in</option>
            <option value="COMPLETED">Resolved / Done</option>
          </select>

          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-2xl shadow-sm hover:shadow transition-all duration-200 disabled:opacity-50 cursor-pointer shrink-0"
            title="Refresh list"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-4 py-3 rounded-2xl shadow-md hover:bg-primary/95 transition-all duration-200 shrink-0 cursor-pointer select-none"
          >
            <Plus className="w-5 h-5" />
            Schedule Follow-Up
          </button>
        </div>
      </div>

      {/* Main List display */}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-medium">
          {error}. Please verify the backend is running.
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4 animate-pulse">
          <div className="h-6 bg-slate-100 rounded-lg w-1/3"></div>
          <div className="h-4 bg-slate-100 rounded-lg w-1/2"></div>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center flex flex-col items-center justify-center min-h-[300px] shadow-[0_8px_30px_rgb(0,0,0,0.01)] animate-in fade-in">
          <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-4">
            <Clock className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No Follow-ups Found</h3>
          <p className="text-slate-500 mt-1 max-w-sm text-sm">
            {search
              ? "Try adjusting your search criteria."
              : "All scheduled check-ins for this status are completed!"}
          </p>
        </div>
      ) : (
        /* TABLE VIEW of follow-ups */
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.01)] overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/70 text-left text-xs font-black text-slate-400 tracking-wider uppercase select-none">
                <tr>
                  <th className="px-6 py-4">Patient Profile</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Follow-Up Date</th>
                  <th className="px-6 py-4">Scheduled Remarks</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-50 text-slate-600 text-sm font-semibold">
                {filteredPatients.map((patient) => {
                  const dateStr = patient.nextFollowUpDate || ""
                  const isOverdue = dateStr < todayStr && patient.followUpStatus === "PENDING"
                  const isToday = dateStr === todayStr && patient.followUpStatus === "PENDING"

                  const dateColor = isOverdue
                    ? "text-red-500 font-black bg-red-50 border-red-100/50"
                    : isToday
                      ? "text-amber-600 font-black bg-amber-50 border-amber-100/50"
                      : "text-slate-500 bg-slate-50 border-slate-100";

                  return (
                    <tr key={patient.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-bold text-slate-800 group-hover:text-primary transition-colors">{patient.name}</p>
                          <p className="text-[10px] font-mono text-slate-400 mt-0.5">ID: {patient.uniqueId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-3 items-center">
                          {patient.callingNumber && (
                            <a 
                              href={`tel:${patient.callingNumber}`}
                              className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                              title="Call patient"
                            >
                              <Phone className="w-4 h-4" />
                            </a>
                          )}
                          {patient.whatsappNumber && (
                            <a 
                              href={`https://wa.me/${patient.whatsappNumber.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors"
                              title="Message on WhatsApp"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs border rounded-full ${dateColor}`}>
                          {new Date(dateStr).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-slate-500 font-medium line-clamp-2 max-w-xs leading-relaxed">
                          {patient.followUpNotes || "No remarks logged."}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-bold space-x-2">
                        {patient.followUpStatus === "PENDING" ? (
                          <>
                            <button
                              onClick={() => {
                                setActivePatient(patient)
                                setActionForm({ date: dateStr, notes: "" })
                                setShowRescheduleModal(true)
                              }}
                              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl transition-all cursor-pointer"
                            >
                              Reschedule
                            </button>
                            <button
                              onClick={() => {
                                setActivePatient(patient)
                                setActionForm({ date: todayStr, notes: "" })
                                setShowResolveModal(true)
                              }}
                              className="px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/95 rounded-xl shadow-sm transition-all cursor-pointer"
                            >
                              Mark Done
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-black tracking-wider uppercase bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                            Resolved
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 1. SCHEDULE NEW FOLLOW-UP MODAL */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-slate-50/70 border-b border-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Schedule Check-in</h3>
                <p className="text-slate-400 text-xs font-semibold mt-0.5">Select a patient and set follow-up date</p>
              </div>
              <button 
                onClick={() => {
                  setShowScheduleModal(false)
                  setSelectedPatient(null)
                  setSearchQuery("")
                }}
                className="p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-600 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit}>
              <div className="p-6 space-y-4">
                {modalError && <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 text-xs">{modalError}</div>}

                {/* Patient Lookup autocomplete */}
                <div className="flex flex-col relative z-30">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Search Patient</label>
                  {selectedPatient ? (
                    <div className="flex justify-between items-center p-3 bg-emerald-50 border-2 border-emerald-100 rounded-xl">
                      <div>
                        <p className="text-sm font-bold text-emerald-800">{selectedPatient.name}</p>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase mt-0.5">ID: {selectedPatient.uniqueId}</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setSelectedPatient(null)}
                        className="text-emerald-700 hover:text-emerald-900 p-1 bg-white rounded-lg border border-emerald-100"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="text"
                          required={!selectedPatient}
                          placeholder="Type patient name or ID..."
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value)
                            setShowAutocomplete(true)
                          }}
                          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-2 border-slate-100 focus:border-primary/20 rounded-xl outline-none transition-all text-xs font-semibold text-slate-700"
                        />
                      </div>

                      {/* Dropdown Overlay */}
                      {showAutocomplete && autocompletePatients.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-100 rounded-xl shadow-lg z-40 overflow-hidden divide-y divide-slate-50">
                          {autocompletePatients.map(p => (
                            <div 
                              key={p.id}
                              onClick={() => {
                                setSelectedPatient(p)
                                setShowAutocomplete(false)
                              }}
                              className="px-3 py-2.5 hover:bg-slate-50 cursor-pointer flex justify-between items-center text-xs font-semibold"
                            >
                              <span className="text-slate-800 font-bold">{p.name}</span>
                              <span className="text-slate-400 font-mono text-[10px]">ID: {p.uniqueId}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Check-in Date</label>
                  <input
                    type="date"
                    required
                    value={followUpForm.nextFollowUpDate}
                    onChange={(e) => setFollowUpForm(prev => ({ ...prev, nextFollowUpDate: e.target.value }))}
                    className="px-4 py-2.5 bg-slate-50 border-2 border-slate-100 focus:border-primary/20 rounded-xl outline-none transition-all text-xs font-semibold text-slate-700"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Remarks / Notes</label>
                  <textarea
                    rows={3}
                    value={followUpForm.followUpNotes}
                    onChange={(e) => setFollowUpForm(prev => ({ ...prev, followUpNotes: e.target.value }))}
                    className="px-4 py-2.5 bg-slate-50 border-2 border-slate-100 focus:border-primary/20 rounded-xl outline-none transition-all text-xs font-semibold text-slate-700 resize-none"
                    placeholder="Enter reason for follow-up, kit usage instructions check, etc..."
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-50 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowScheduleModal(false)
                    setSelectedPatient(null)
                    setSearchQuery("")
                  }}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading || !selectedPatient}
                  className="px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/95 font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  Schedule Call
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. RESCHEDULE MODAL */}
      {showRescheduleModal && activePatient && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-slate-50/70 border-b border-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Reschedule Check-in</h3>
                <p className="text-slate-400 text-xs font-semibold mt-0.5">Reschedule follow-up for {activePatient.name}</p>
              </div>
              <button 
                onClick={() => {
                  setShowRescheduleModal(false)
                  setActivePatient(null)
                }}
                className="p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-600 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit}>
              <div className="p-6 space-y-4">
                {modalError && <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 text-xs">{modalError}</div>}

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">New Check-in Date</label>
                  <input
                    type="date"
                    required
                    value={actionForm.date}
                    onChange={(e) => setActionForm(prev => ({ ...prev, date: e.target.value }))}
                    className="px-4 py-2.5 bg-slate-50 border-2 border-slate-100 focus:border-primary/20 rounded-xl outline-none transition-all text-xs font-semibold text-slate-700"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Remarks / Notes</label>
                  <textarea
                    rows={3}
                    value={actionForm.notes}
                    onChange={(e) => setActionForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="px-4 py-2.5 bg-slate-50 border-2 border-slate-100 focus:border-primary/20 rounded-xl outline-none transition-all text-xs font-semibold text-slate-700 resize-none"
                    placeholder="Update reasons, check-up instructions..."
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-50 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowRescheduleModal(false)
                    setActivePatient(null)
                  }}
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
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. RESOLVE CALL (MARK DONE) MODAL */}
      {showResolveModal && activePatient && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-slate-50/70 border-b border-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Resolve Follow-up</h3>
                <p className="text-slate-400 text-xs font-semibold mt-0.5">Complete check-in details for {activePatient.name}</p>
              </div>
              <button 
                onClick={() => {
                  setShowResolveModal(false)
                  setActivePatient(null)
                }}
                className="p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-600 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResolveSubmit}>
              <div className="p-6 space-y-4">
                {modalError && <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 text-xs">{modalError}</div>}

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Resolution Note (Doctor Remarks)</label>
                  <textarea
                    rows={4}
                    required
                    value={actionForm.notes}
                    onChange={(e) => setActionForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="px-4 py-2.5 bg-slate-50 border-2 border-slate-100 focus:border-primary/20 rounded-xl outline-none transition-all text-xs font-semibold text-slate-700 resize-none"
                    placeholder="Patient response, health status outcome notes..."
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-50 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowResolveModal(false)
                    setActivePatient(null)
                  }}
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
                  Mark Resolved
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
