"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  Search, 
  User, 
  Plus, 
  Phone, 
  MessageSquare, 
  MapPin, 
  RefreshCw, 
  Users, 
  UserCheck, 
  UserPlus,
  LayoutGrid,
  List,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react"

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
  agentId?: string | null;
  referredById?: string | null;
  createdAt: string;
}

type SortField = "name" | "uniqueId" | "age" | "createdAt";
type SortOrder = "asc" | "desc";

export default function PatientsListPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [search, setSearch] = useState("")
  const [genderFilter, setGenderFilter] = useState("All")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Layout and Pagination states
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  // Sorting states
  const [sortField, setSortField] = useState<SortField>("createdAt")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")

  const fetchPatients = async (silent = false) => {
    if (!silent) setLoading(true)
    setError("")
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      const res = await fetch(`${API_URL}/api/patients`)
      
      if (!res.ok) {
        throw new Error("Failed to fetch patients list")
      }
      
      const data = await res.json()
      setPatients(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchPatients()
  }, [])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchPatients(true)
  }

  // Reset page when search filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, genderFilter, sortField, sortOrder, itemsPerPage])

  // Filter logic
  const filteredPatients = patients.filter((patient) => {
    const matchesSearch = 
      patient.name.toLowerCase().includes(search.toLowerCase()) ||
      patient.uniqueId.includes(search) ||
      (patient.callingNumber && patient.callingNumber.includes(search)) ||
      (patient.whatsappNumber && patient.whatsappNumber.includes(search))

    const matchesGender = 
      genderFilter === "All" || 
      patient.gender?.toLowerCase() === genderFilter.toLowerCase()

    return matchesSearch && matchesGender
  })

  // Sorting logic
  const sortedPatients = [...filteredPatients].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (valA === undefined || valA === null) valA = "";
    if (valB === undefined || valB === null) valB = "";

    if (typeof valA === "string" && typeof valB === "string") {
      return sortOrder === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }

    if (typeof valA === "number" && typeof valB === "number") {
      return sortOrder === "asc" ? valA - valB : valB - valA;
    }

    // Date fallback (createdAt)
    return sortOrder === "asc"
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  })

  // Pagination logic
  const totalPages = Math.ceil(sortedPatients.length / itemsPerPage)
  const paginatedPatients = sortedPatients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  // Calculations for Stats Card
  const totalCount = patients.length
  const maleCount = patients.filter(p => p.gender?.toLowerCase() === "male").length
  const femaleCount = patients.filter(p => p.gender?.toLowerCase() === "female").length

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-700 w-full pb-12">
      


      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100/80 flex items-center gap-4 relative overflow-hidden group">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
            <Users className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-slate-400 font-bold text-xs tracking-wider uppercase">Total Patients</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{totalCount}</h3>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100/80 flex items-center gap-4 relative overflow-hidden group">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
            <UserCheck className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-slate-400 font-bold text-xs tracking-wider uppercase">Male Patients</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{maleCount}</h3>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100/80 flex items-center gap-4 relative overflow-hidden group">
          <div className="w-14 h-14 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center shadow-sm">
            <UserPlus className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-slate-400 font-bold text-xs tracking-wider uppercase">Female Patients</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{femaleCount}</h3>
          </div>
        </div>
      </div>

      {/* Search & Filter & Layout Toggle section */}
      <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, unique ID, phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-2 border-slate-100 focus:border-primary/20 rounded-2xl outline-none transition-all text-sm font-semibold text-slate-700"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto shrink-0 justify-between sm:justify-start">
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="px-4 py-3.5 bg-slate-50 hover:bg-slate-100/50 border-2 border-slate-100 rounded-2xl outline-none text-sm font-bold text-slate-600 cursor-pointer transition-all"
          >
            <option value="All">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>

          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
            className="px-4 py-3.5 bg-slate-50 hover:bg-slate-100/50 border-2 border-slate-100 rounded-2xl outline-none text-sm font-bold text-slate-600 cursor-pointer transition-all"
          >
            <option value="10">10 / Page</option>
            <option value="25">25 / Page</option>
            <option value="50">50 / Page</option>
          </select>

          {/* Grid vs List View Toggle Switch */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50 shrink-0">
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-xl transition-all ${viewMode === "table" ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
              title="Compact list view"
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-xl transition-all ${viewMode === "grid" ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
              title="Detailed grid view"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
          </div>

          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-2xl shadow-sm hover:shadow transition-all duration-200 disabled:opacity-50 cursor-pointer shrink-0"
            title="Refresh directory"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>

          <Link href="/patients/new" className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-4 py-3 rounded-2xl shadow-md hover:bg-primary/95 transition-all duration-200 shrink-0 select-none">
            <Plus className="w-5 h-5" />
            Add Patient
          </Link>
        </div>
      </div>

      {/* Main List display */}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-medium">
          {error}. Please verify the backend is running.
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4 animate-pulse">
              <div className="h-6 bg-slate-100 rounded-lg w-2/3"></div>
              <div className="h-4 bg-slate-100 rounded-lg w-1/2"></div>
              <div className="space-y-2 pt-4">
                <div className="h-4 bg-slate-100 rounded-lg w-full"></div>
                <div className="h-4 bg-slate-100 rounded-lg w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      ) : sortedPatients.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-4">
            <User className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No Patients Found</h3>
          <p className="text-slate-500 mt-1 max-w-sm text-sm">
            {search || genderFilter !== "All" 
              ? "Try adjusting your search query or filters." 
              : "Register your first patient to populate this list."}
          </p>
          {(search || genderFilter !== "All") && (
            <button 
              onClick={() => { setSearch(""); setGenderFilter("All"); }}
              className="mt-4 text-primary font-bold text-sm hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : viewMode === "table" ? (
        /* TABLE VIEW (Compact list format) */
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.01)] overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/70 text-left text-xs font-black text-slate-400 tracking-wider uppercase select-none">
                <tr>
                  <th 
                    onClick={() => handleSort("name")}
                    className="px-6 py-4 cursor-pointer hover:bg-slate-100/50 hover:text-slate-600 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Patient Name
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort("uniqueId")}
                    className="px-6 py-4 cursor-pointer hover:bg-slate-100/50 hover:text-slate-600 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Unique ID
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort("age")}
                    className="px-6 py-4 cursor-pointer hover:bg-slate-100/50 hover:text-slate-600 transition-colors animate-in"
                  >
                    <div className="flex items-center gap-1">
                      Age &amp; Gender
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </div>
                  </th>
                  <th className="px-6 py-4">Contact Numbers</th>
                  <th className="px-6 py-4">State &amp; Pin</th>
                  <th 
                    onClick={() => handleSort("createdAt")}
                    className="px-6 py-4 cursor-pointer hover:bg-slate-100/50 hover:text-slate-600 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Registered On
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-50 text-slate-600 text-sm font-semibold">
                {paginatedPatients.map((patient) => {
                  const isMale = patient.gender?.toLowerCase() === "male";
                  const isFemale = patient.gender?.toLowerCase() === "female";
                  const genderBadgeClass = isMale 
                    ? "bg-indigo-50 text-indigo-600 border-indigo-100/50" 
                    : isFemale 
                      ? "bg-pink-50 text-pink-600 border-pink-100/50" 
                      : "bg-slate-50 text-slate-600 border-slate-100/50";

                  // Extract concise address row
                  const addressParts = [
                    patient.houseNumber ? `H.No. ${patient.houseNumber}` : "",
                    patient.galiNumber ? `Gali ${patient.galiNumber}` : ""
                  ].filter(Boolean).join(", ");

                  return (
                    <tr 
                      key={patient.id} 
                      className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-800 group-hover:text-primary transition-colors">
                        {patient.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono text-xs">
                        {patient.uniqueId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 text-xs font-black tracking-wide border rounded-full ${genderBadgeClass}`}>
                            {patient.gender || "N/A"}
                          </span>
                          {patient.age && (
                            <span className="text-slate-400 font-medium text-xs">{patient.age} yrs</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1.5 justify-center">
                          {patient.callingNumber && (
                            <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                              <a 
                                href={`tel:${patient.callingNumber}`} 
                                className="flex items-center gap-1 hover:text-blue-500 transition-colors"
                              >
                                <Phone className="w-3.5 h-3.5 text-blue-500" />
                                <span>{patient.callingNumber}</span>
                              </a>
                            </div>
                          )}
                          {patient.whatsappNumber && (
                            <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                              <a 
                                href={`https://wa.me/${patient.whatsappNumber.replace(/[^0-9]/g, "")}`} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="flex items-center gap-1 hover:text-emerald-600 transition-colors"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                                <span>{patient.whatsappNumber}</span>
                              </a>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <div className="flex flex-col">
                            {addressParts && <p className="text-slate-600 font-medium">{addressParts}</p>}
                            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                              {[patient.state, patient.pincode].filter(Boolean).join(" - ") || "No address"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400 font-bold">
                        {new Date(patient.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW (Detailed card format) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedPatients.map((patient) => {
            const isMale = patient.gender?.toLowerCase() === "male";
            const isFemale = patient.gender?.toLowerCase() === "female";
            const genderBadgeClass = isMale 
              ? "bg-indigo-50 text-indigo-600 border-indigo-100" 
              : isFemale 
                ? "bg-pink-50 text-pink-600 border-pink-100" 
                : "bg-slate-50 text-slate-600 border-slate-100";

            return (
              <div 
                key={patient.id} 
                className="bg-white border border-slate-100/80 rounded-[2rem] p-6 shadow-[0_4px_20px_rgb(0,0,0,0.01)] hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(4,120,87,0.04)] transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br opacity-0 group-hover:opacity-10 pointer-events-none rounded-full blur-xl transition-all duration-300"></div>

                <div>
                  {/* Top line: Name & Gender Badge */}
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-primary transition-colors line-clamp-1">
                      {patient.name}
                    </h3>
                    <span className={`px-2.5 py-1 text-xs font-black tracking-wide border rounded-full ${genderBadgeClass}`}>
                      {patient.gender || "N/A"}
                    </span>
                  </div>

                  {/* ID and age detail */}
                  <div className="flex items-center gap-3 mt-1.5 text-xs font-bold text-slate-400">
                    <span>ID: {patient.uniqueId}</span>
                    {patient.age && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span>{patient.age} yrs</span>
                      </>
                    )}
                  </div>

                  <hr className="border-slate-50 my-4" />

                  {/* Contact section */}
                  <div className="space-y-3">
                    {patient.callingNumber && (
                      <div className="flex items-center justify-between group/btn text-xs font-semibold text-slate-600">
                        <span className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-blue-500" />
                          <span>{patient.callingNumber}</span>
                        </span>
                        <a 
                          href={`tel:${patient.callingNumber}`}
                          className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                          title="Call patient"
                        >
                          <Phone className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    {patient.whatsappNumber && (
                      <div className="flex items-center justify-between group/btn text-xs font-semibold text-slate-600">
                        <span className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-emerald-500" />
                          <span>{patient.whatsappNumber}</span>
                        </span>
                        <a 
                          href={`https://wa.me/${patient.whatsappNumber.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                          title="Message on WhatsApp"
                        >
                          <MessageSquare className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Address block */}
                  {(patient.houseNumber || patient.galiNumber || patient.state || patient.pincode || patient.address) && (
                    <div className="mt-4 pt-4 border-t border-slate-50">
                      <div className="flex gap-2 items-start text-xs font-medium text-slate-500">
                        <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <div className="flex flex-col gap-0.5">
                          {patient.houseNumber || patient.galiNumber || patient.state || patient.pincode ? (
                            <>
                              {(patient.houseNumber || patient.galiNumber) && (
                                <p className="text-slate-600 font-bold">
                                  {[
                                    patient.houseNumber ? `H.No. ${patient.houseNumber}` : "",
                                    patient.galiNumber ? `Gali ${patient.galiNumber}` : ""
                                  ].filter(Boolean).join(", ")}
                                </p>
                              )}
                              {(patient.state || patient.pincode) && (
                                <p className="text-slate-400 text-[11px] font-bold tracking-wide">
                                  {[patient.state, patient.pincode].filter(Boolean).join(" - ")}
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="line-clamp-2">{patient.address}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer notes: Agent or referrals */}
                {(patient.agentId || patient.referredById) && (
                  <div className="mt-4 pt-3 border-t border-slate-50/50 flex gap-2 justify-end text-[10px] font-black tracking-wider uppercase text-slate-400">
                    {patient.agentId && <span className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-md">Agent linked</span>}
                    {patient.referredById && <span className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-md">Referral linked</span>}
                  </div>
                )}

              </div>
            )
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && sortedPatients.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm font-semibold text-slate-400">
            Showing <span className="text-slate-700">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
            <span className="text-slate-700">{Math.min(currentPage * itemsPerPage, sortedPatients.length)}</span> of{" "}
            <span className="text-slate-700">{sortedPatients.length}</span> patients
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2 select-none">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200/80 hover:bg-slate-50 rounded-xl disabled:opacity-40 disabled:hover:bg-white text-slate-500 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Simple page numbers */}
              <div className="flex items-center gap-1.5">
                {[...Array(totalPages)].map((_, index) => {
                  const pageNum = index + 1
                  const isCurrent = currentPage === pageNum
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-9 h-9 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                        isCurrent 
                          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20" 
                          : "border border-slate-200/80 hover:bg-slate-50 text-slate-500"
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200/80 hover:bg-slate-50 rounded-xl disabled:opacity-40 disabled:hover:bg-white text-slate-500 transition-all cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
