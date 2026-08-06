"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  Search, 
  User, 
  Phone, 
  MessageSquare, 
  Calendar, 
  Users, 
  UserPlus, 
  Award,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Gift
} from "lucide-react"

interface Patient {
  id: string;
  uniqueId: string;
  name: string;
  callingNumber?: string | null;
  whatsappNumber?: string | null;
  referredById?: string | null;
  gender?: string | null;
  createdAt: string;
}

interface ReferrerGroup {
  referrer: Patient;
  referredPatients: Patient[];
}

export default function ReferralPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [isRefreshing, setIsRefreshing] = useState(false)

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
      setError(err instanceof Error ? err.message : "Error loading referrals data")
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

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedIds(newExpanded)
  }

  // Process data to group referred patients by their referrer
  const getReferrerGroups = (): ReferrerGroup[] => {
    const referrersMap = new Map<string, ReferrerGroup>()

    patients.forEach((p) => {
      if (p.referredById) {
        const referrer = patients.find(r => r.id === p.referredById)
        if (referrer) {
          if (!referrersMap.has(referrer.id)) {
            referrersMap.set(referrer.id, {
              referrer,
              referredPatients: []
            })
          }
          referrersMap.get(referrer.id)?.referredPatients.push(p)
        }
      }
    })

    return Array.from(referrersMap.values())
  }

  const referrerGroups = getReferrerGroups()

  // Filter groups by search query (checks referrer name OR referred patient names)
  const filteredGroups = referrerGroups.filter((group) => {
    const matchesReferrer = group.referrer.name.toLowerCase().includes(search.toLowerCase()) || 
                            group.referrer.uniqueId.includes(search)
    
    const matchesReferred = group.referredPatients.some(
      p => p.name.toLowerCase().includes(search.toLowerCase()) || p.uniqueId.includes(search)
    )

    return matchesReferrer || matchesReferred
  })

  // Metrics
  const totalReferredCount = patients.filter(p => p.referredById).length
  const activeReferrersCount = referrerGroups.length

  // Find Top Referrer
  let topReferrerName = "N/A"
  let topReferrerCount = 0
  referrerGroups.forEach((group) => {
    if (group.referredPatients.length > topReferrerCount) {
      topReferrerCount = group.referredPatients.length
      topReferrerName = group.referrer.name
    }
  })

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-700 w-full pb-12">
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100/80 flex items-center gap-4 relative overflow-hidden group">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
            <UserPlus className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-slate-400 font-bold text-xs tracking-wider uppercase">Total Referred</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{totalReferredCount}</h3>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100/80 flex items-center gap-4 relative overflow-hidden group">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
            <Users className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-slate-400 font-bold text-xs tracking-wider uppercase">Active Referrers</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{activeReferrersCount}</h3>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100/80 flex items-center gap-4 relative overflow-hidden group">
          <div className="w-14 h-14 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center shadow-sm">
            <Award className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-slate-400 font-bold text-xs tracking-wider uppercase">Top Referrer</p>
            <h3 className="text-lg font-black text-slate-800 mt-1 line-clamp-1">
              {topReferrerName} {topReferrerCount > 0 ? `(${topReferrerCount})` : ""}
            </h3>
          </div>
        </div>
      </div>

      {/* Filter and Refresh Bar */}
      <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by referrer name or referred patient name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-2 border-slate-100 focus:border-primary/20 rounded-2xl outline-none transition-all text-sm font-semibold text-slate-700"
          />
        </div>

        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-2xl shadow-sm hover:shadow transition-all duration-200 disabled:opacity-50 cursor-pointer shrink-0"
          title="Refresh list"
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Main List Display */}
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
      ) : filteredGroups.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center flex flex-col items-center justify-center min-h-[300px] shadow-[0_8px_30px_rgb(0,0,0,0.01)] animate-in fade-in">
          <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-4">
            <Gift className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No Patient Referrals Found</h3>
          <p className="text-slate-500 mt-1 max-w-sm text-sm">
            {search 
              ? "No referrers or referred patients match your query." 
              : "Referral patient mappings will appear here once new patient registrations are linked to their referrers."}
          </p>
        </div>
      ) : (
        /* Accordion List of Referrer Profiles */
        <div className="space-y-4">
          {filteredGroups.map((group) => {
            const referrerId = group.referrer.id
            const isExpanded = expandedIds.has(referrerId)
            const count = group.referredPatients.length

            return (
              <div 
                key={referrerId}
                className="bg-white border border-slate-100 rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.01)] overflow-hidden transition-all duration-300"
              >
                {/* Accordion Trigger Header */}
                <div 
                  onClick={() => toggleExpand(referrerId)}
                  className="px-6 py-5 flex justify-between items-center cursor-pointer hover:bg-slate-50/50 transition-colors select-none"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-base">{group.referrer.name}</p>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">Referrer ID: {group.referrer.uniqueId}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs font-black tracking-wide rounded-full">
                      {count} {count === 1 ? "Referral" : "Referrals"}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Accordion Expandable Content */}
                {isExpanded && (
                  <div className="border-t border-slate-50 bg-slate-50/35 px-6 py-4 animate-in slide-in-from-top-2 duration-200">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">Referred Patients List</h4>
                    
                    <div className="overflow-x-auto w-full">
                      <table className="min-w-full divide-y divide-slate-100 border border-slate-100 bg-white rounded-2xl overflow-hidden shadow-sm">
                        <thead className="bg-slate-50 text-left text-[10px] font-black text-slate-400 tracking-wider uppercase">
                          <tr>
                            <th className="px-4 py-3">Patient Name</th>
                            <th className="px-4 py-3">Unique ID</th>
                            <th className="px-4 py-3">Gender</th>
                            <th className="px-4 py-3">Contact Links</th>
                            <th className="px-4 py-3">Registered On</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-slate-600 text-xs font-semibold">
                          {group.referredPatients.map((referred) => (
                            <tr key={referred.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3 font-bold text-slate-800">{referred.name}</td>
                              <td className="px-4 py-3 text-slate-400 font-mono">{referred.uniqueId}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 text-[9px] font-black tracking-wider uppercase border rounded-full ${
                                  referred.gender?.toLowerCase() === "male"
                                    ? "bg-indigo-50 text-indigo-600 border-indigo-100/50"
                                    : referred.gender?.toLowerCase() === "female"
                                      ? "bg-pink-50 text-pink-600 border-pink-100/50"
                                      : "bg-slate-50 text-slate-600 border-slate-100/50"
                                }`}>
                                  {referred.gender || "N/A"}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2 items-center">
                                  {referred.callingNumber && (
                                    <a 
                                      href={`tel:${referred.callingNumber}`}
                                      className="p-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                      title="Call patient"
                                    >
                                      <Phone className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                  {referred.whatsappNumber && (
                                    <a 
                                      href={`https://wa.me/${referred.whatsappNumber.replace(/[^0-9]/g, "")}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-1 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                                      title="Message on WhatsApp"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-slate-400 font-bold">
                                {new Date(referred.createdAt).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric"
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
