"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  CreditCard,
  Search,
  Plus,
  Printer,
  DollarSign,
  RefreshCw,
  CheckCircle2,
  User,
  ArrowLeft,
  X,
  Receipt,
  Banknote,
  Smartphone,
  Wallet,
  Layers,
  LayoutGrid,
  Trash2,
  RotateCcw,
  AlertTriangle
} from "lucide-react"

interface PaymentRecord {
  id: string
  invoiceNo: string
  date: string
  patientName: string
  patientId: string
  age?: string | number
  gender?: string
  combinedKitName: string
  treatments?: any[]
  symptoms?: string
  notes?: string
  billingType: string
  priceVal: number
  discountVal: number
  gstVal: number
  totalDueVal: number
  cashVal: number
  onlineVal: number
  totalPaidVal: number
  nextFollowUpDate?: string
}

export default function PaymentsPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

  const [records, setRecords] = useState<PaymentRecord[]>([])
  const [trashRecords, setTrashRecords] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Tabs state: ACTIVE or TRASH
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "TRASH">("ACTIVE")

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [paymentFilter, setPaymentFilter] = useState("ALL") // ALL, CASH, SPLIT

  // Printable Receipt Modal State
  const [selectedBill, setSelectedBill] = useState<PaymentRecord | null>(null)
  const [showReceiptModal, setShowReceiptModal] = useState(false)

  // Fetch all payment records on mount
  const fetchRecords = async () => {
    setLoading(true)
    setError("")
    try {
      // 1. Read offline bills from localStorage first
      let localBills: PaymentRecord[] = []
      try {
        const stored = localStorage.getItem("ksv_offline_bills")
        if (stored) {
          localBills = JSON.parse(stored)
        }
      } catch (e) {
        console.warn("Could not parse local bills:", e)
      }

      // 2. Fetch from backend API
      let apiBills: PaymentRecord[] = []
      try {
        const res = await fetch(`${API_URL}/api/patients`)
        if (res.ok) {
          const patientsData = await res.json()
          
          patientsData.forEach((p: any) => {
            if (p.orders && Array.isArray(p.orders)) {
              p.orders.forEach((o: any, idx: number) => {
                const totalDue = parseFloat(o.totalAmount || 0)
                const cash = parseFloat(o.amountCash || 0)
                const online = parseFloat(o.amountOnline || 0)
                const paid = cash + online

                apiBills.push({
                  id: o.id || `ord_${p.uniqueId}_${idx}`,
                  invoiceNo: `INV-${(o.id || idx).toString().slice(-6).toUpperCase()}`,
                  date: o.createdAt ? new Date(o.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
                  patientName: p.name || "Patient",
                  patientId: p.uniqueId || "N/A",
                  age: p.age,
                  gender: p.gender,
                  combinedKitName: o.kitName || "General Consultation Kit",
                  treatments: [
                    {
                      id: "1",
                      disease: o.kitName?.split("(")[0] || "General Checkup",
                      kitName: o.kitName || "OPD Kit",
                      durationDays: "30",
                      price: totalDue.toString()
                    }
                  ],
                  symptoms: o.symptoms || "",
                  notes: o.notes || "",
                  billingType: o.billingType || "Non-GST",
                  priceVal: totalDue,
                  discountVal: 0,
                  gstVal: o.billingType?.includes("+18%") ? Math.round(totalDue * 0.18) : 0,
                  totalDueVal: totalDue,
                  cashVal: cash > 0 ? cash : (online === 0 ? totalDue : 0),
                  onlineVal: online,
                  totalPaidVal: paid > 0 ? paid : totalDue,
                  nextFollowUpDate: p.nextFollowUpDate
                })
              })
            }
          })
        }
      } catch (err) {
        console.warn("Backend offline, relying on local records:", err)
      }

      // Merge local and API bills without duplicates
      const mergedMap = new Map<string, PaymentRecord>()
      apiBills.forEach(b => mergedMap.set(b.id || b.invoiceNo, b))
      localBills.forEach(b => mergedMap.set(b.id || b.invoiceNo, b))

      // Filter out bills that are already in Trash Bin
      let trashList: PaymentRecord[] = []
      try {
        const storedTrash = localStorage.getItem("ksv_trash_bills")
        if (storedTrash) trashList = JSON.parse(storedTrash)
      } catch (e) {}

      setTrashRecords(trashList)

      const trashNos = new Set(trashList.map(t => t.invoiceNo))
      const sorted = Array.from(mergedMap.values())
        .filter(b => !trashNos.has(b.invoiceNo))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      setRecords(sorted)
    } catch (err) {
      setError("Payment history record load karne me issue aaya")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  // Calculated Stats
  const totalRevenue = records.reduce((sum, r) => sum + (r.totalPaidVal || 0), 0)
  const cashRevenue = records.reduce((sum, r) => sum + (r.cashVal || 0), 0)
  const onlineRevenue = records.reduce((sum, r) => sum + (r.onlineVal || 0), 0)
  const totalInvoices = records.length

  // Filtered active records
  const filteredRecords = records.filter(r => {
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      r.patientName.toLowerCase().includes(query) ||
      r.patientId.toLowerCase().includes(query) ||
      r.invoiceNo.toLowerCase().includes(query) ||
      r.combinedKitName.toLowerCase().includes(query)

    if (!matchesSearch) return false

    if (paymentFilter === "CASH") return r.cashVal > 0 && r.onlineVal === 0
    if (paymentFilter === "SPLIT") return r.cashVal > 0 && r.onlineVal > 0

    return true
  })

  // Filtered trash records
  const filteredTrash = trashRecords.filter(r => {
    const query = searchQuery.toLowerCase()
    return (
      r.patientName.toLowerCase().includes(query) ||
      r.patientId.toLowerCase().includes(query) ||
      r.invoiceNo.toLowerCase().includes(query) ||
      r.combinedKitName.toLowerCase().includes(query)
    )
  })

  const openReceipt = (record: PaymentRecord) => {
    setSelectedBill(record)
    setShowReceiptModal(true)
  }

  // Move record to Trash Bin
  const handleDeleteRecord = (record: PaymentRecord) => {
    if (!confirm(`Invoice ${record.invoiceNo} (${record.patientName}) ko Trash Bin me move karein?`)) {
      return
    }

    setRecords(prev => prev.filter(r => (r.id ? r.id !== record.id : r.invoiceNo !== record.invoiceNo)))
    setTrashRecords(prev => [record, ...prev])

    try {
      const storedOffline = localStorage.getItem("ksv_offline_bills")
      if (storedOffline) {
        const localBills: PaymentRecord[] = JSON.parse(storedOffline)
        const updatedLocal = localBills.filter(b => b.invoiceNo !== record.invoiceNo && b.id !== record.id)
        localStorage.setItem("ksv_offline_bills", JSON.stringify(updatedLocal))
      }

      const storedTrash = localStorage.getItem("ksv_trash_bills")
      const existingTrash: PaymentRecord[] = storedTrash ? JSON.parse(storedTrash) : []
      existingTrash.unshift(record)
      localStorage.setItem("ksv_trash_bills", JSON.stringify(existingTrash))
    } catch (e) {
      console.warn("Could not update local storage on delete:", e)
    }
  }

  // Restore record from Trash Bin back to Active List
  const handleRestoreRecord = (record: PaymentRecord) => {
    setTrashRecords(prev => prev.filter(r => (r.id ? r.id !== record.id : r.invoiceNo !== record.invoiceNo)))
    setRecords(prev => [record, ...prev])

    try {
      const storedTrash = localStorage.getItem("ksv_trash_bills")
      if (storedTrash) {
        const localTrash: PaymentRecord[] = JSON.parse(storedTrash)
        const updatedTrash = localTrash.filter(b => b.invoiceNo !== record.invoiceNo && b.id !== record.id)
        localStorage.setItem("ksv_trash_bills", JSON.stringify(updatedTrash))
      }

      const storedOffline = localStorage.getItem("ksv_offline_bills")
      const existingOffline: PaymentRecord[] = storedOffline ? JSON.parse(storedOffline) : []
      existingOffline.unshift(record)
      localStorage.setItem("ksv_offline_bills", JSON.stringify(existingOffline))
    } catch (e) {
      console.warn("Could not restore record:", e)
    }
  }

  // Permanently Purge single item from Trash Bin
  const handlePermanentDelete = (record: PaymentRecord) => {
    if (!confirm(`Kya aap Invoice ${record.invoiceNo} ko permanently system se delete karna chahte hain? Yeh dubara recover nahi hoga.`)) {
      return
    }

    setTrashRecords(prev => prev.filter(r => (r.id ? r.id !== record.id : r.invoiceNo !== record.invoiceNo)))

    try {
      const storedTrash = localStorage.getItem("ksv_trash_bills")
      if (storedTrash) {
        const localTrash: PaymentRecord[] = JSON.parse(storedTrash)
        const updatedTrash = localTrash.filter(b => b.invoiceNo !== record.invoiceNo && b.id !== record.id)
        localStorage.setItem("ksv_trash_bills", JSON.stringify(updatedTrash))
      }
    } catch (e) {
      console.warn("Permanent delete error:", e)
    }
  }

  // Empty all items from Trash Bin
  const handleEmptyTrash = () => {
    if (!confirm("Kya aap Trash Bin ke SARE deleted invoices permanently delete karna chahte hain?")) {
      return
    }
    setTrashRecords([])
    localStorage.removeItem("ksv_trash_bills")
  }

  return (
    <div className="w-full pt-0 pb-16 animate-in fade-in duration-500 text-slate-700">
      
      {/* Sleek Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200/60">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 text-slate-400 hover:text-slate-700 bg-white border border-slate-200/80 hover:bg-slate-50 rounded-xl transition-all shadow-sm"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Payments &amp; Financial Records
            </h1>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              View all transaction receipts, payment mode splits &amp; invoices
            </p>
          </div>
        </div>

        {/* Top Header Buttons & Trash Tab Switch */}
        <div className="flex items-center gap-2">
          
          {/* Main Active vs Trash View Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60 text-xs font-extrabold">
            <button
              onClick={() => setActiveTab("ACTIVE")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === "ACTIVE"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Active Invoices ({records.length})
            </button>
            <button
              onClick={() => setActiveTab("TRASH")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === "TRASH"
                  ? "bg-rose-500 text-white shadow-sm font-black"
                  : "text-slate-500 hover:text-rose-600"
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Trash Bin ({trashRecords.length})
            </button>
          </div>

          <button
            onClick={fetchRecords}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl shadow-sm transition-all cursor-pointer"
            title="Refresh payments list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <Link
            href="/billing/new"
            className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Invoice
          </Link>

        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        
        {/* Total Revenue */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Total Revenue</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">₹{totalRevenue.toLocaleString("en-IN")}</h3>
          </div>
        </div>

        {/* Cash Revenue */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <Banknote className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Cash Collected</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">₹{cashRevenue.toLocaleString("en-IN")}</h3>
          </div>
        </div>

        {/* Online Revenue */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Online / UPI Paid</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">₹{onlineRevenue.toLocaleString("en-IN")}</h3>
          </div>
        </div>

        {/* Total Invoices */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Active Invoices</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">{totalInvoices} Bills</h3>
          </div>
        </div>

      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Live Search */}
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={activeTab === "TRASH" ? "Search deleted invoices..." : "Search by Patient name, phone, or invoice no..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 focus:border-blue-500 rounded-2xl outline-none text-xs font-semibold text-slate-700 placeholder-slate-400 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Conditional Toolbar Controls based on activeTab */}
        {activeTab === "ACTIVE" ? (
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-200/60 text-xs w-full sm:w-auto justify-center">
            <button
              onClick={() => setPaymentFilter("ALL")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer ${
                paymentFilter === "ALL" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> All Modes
            </button>
            <button
              onClick={() => setPaymentFilter("CASH")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer ${
                paymentFilter === "CASH" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Banknote className="w-3.5 h-3.5 text-emerald-600" /> Cash Only
            </button>
            <button
              onClick={() => setPaymentFilter("SPLIT")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer ${
                paymentFilter === "SPLIT" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Wallet className="w-3.5 h-3.5 text-blue-600" /> Cash + Online Split
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">
              {trashRecords.length} Deleted Invoices in Trash
            </span>
            {trashRecords.length > 0 && (
              <button
                onClick={handleEmptyTrash}
                className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Empty Trash Bin
              </button>
            )}
          </div>
        )}

      </div>

      {/* --- TAB 1: ACTIVE INVOICES TRANSACTIONS TABLE --- */}
      {activeTab === "ACTIVE" && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)] overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500" />
              <p className="text-xs font-semibold">Loading payment transactions...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-20 text-center text-slate-400 space-y-3">
              <Receipt className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm font-extrabold text-slate-700">No payment records found</p>
              <p className="text-xs text-slate-400">Try creating a new invoice or changing search filters.</p>
              <div className="pt-2">
                <Link
                  href="/billing/new"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow-md shadow-blue-500/20"
                >
                  <Plus className="w-4 h-4" /> Create Invoice
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-4 px-6">Invoice &amp; Date</th>
                    <th className="py-4 px-6">Patient Name</th>
                    <th className="py-4 px-6">Prescribed Kit / Disease</th>
                    <th className="py-4 px-6 text-right">Subtotal</th>
                    <th className="py-4 px-6 text-center">Payment Split</th>
                    <th className="py-4 px-6 text-right">Total Paid</th>
                    <th className="py-4 px-6 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {filteredRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      
                      {/* Invoice No & Date */}
                      <td className="py-4 px-6">
                        <span className="font-extrabold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg block w-fit text-[11px]">
                          {r.invoiceNo}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-1 font-semibold">{r.date}</span>
                      </td>

                      {/* Patient Details */}
                      <td className="py-4 px-6">
                        <div className="font-extrabold text-slate-800 text-sm">{r.patientName}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">ID: {r.patientId}</div>
                      </td>

                      {/* Kit & Disease */}
                      <td className="py-4 px-6 max-w-[220px]">
                        <div className="font-bold text-slate-800 truncate" title={r.combinedKitName}>
                          {r.combinedKitName}
                        </div>
                        <span className="text-[10px] text-indigo-600 font-extrabold bg-indigo-50 px-2 py-0.5 rounded-md mt-1 inline-block">
                          {r.billingType}
                        </span>
                      </td>

                      {/* Price & Subtotal */}
                      <td className="py-4 px-6 text-right">
                        <div className="font-bold text-slate-700">₹{r.priceVal.toLocaleString("en-IN")}</div>
                        {r.gstVal > 0 && <span className="text-[10px] text-slate-400 block">+ ₹{r.gstVal} GST</span>}
                      </td>

                      {/* Payment Mode Breakdown Split */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {r.cashVal > 0 && (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Banknote className="w-3 h-3 text-emerald-600" /> ₹{r.cashVal.toLocaleString("en-IN")}
                            </span>
                          )}
                          {r.onlineVal > 0 && (
                            <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Smartphone className="w-3 h-3 text-indigo-600" /> ₹{r.onlineVal.toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total Paid */}
                      <td className="py-4 px-6 text-right">
                        <div className="font-extrabold text-slate-900 text-sm">
                          ₹{r.totalPaidVal.toLocaleString("en-IN")}
                        </div>
                        <span className="text-[10px] text-emerald-600 font-extrabold flex items-center justify-end gap-1 mt-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Paid in Full
                        </span>
                      </td>

                      {/* View / Print Receipt Action & Delete */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openReceipt(r)}
                            className="bg-white hover:bg-blue-50 text-blue-600 hover:text-blue-700 border border-slate-200 hover:border-blue-300 font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                          >
                            <Printer className="w-3.5 h-3.5" /> View Receipt
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(r)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100 cursor-pointer"
                            title="Move invoice to Trash Bin"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: TRASH BIN RECYCLE VIEW --- */}
      {activeTab === "TRASH" && (
        <div className="bg-white rounded-3xl border border-rose-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)] overflow-hidden">
          
          <div className="p-4 bg-rose-50/60 border-b border-rose-100 flex items-center justify-between text-xs text-rose-800 font-semibold">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              Trash Bin: Deleted invoices are stored here. You can restore them anytime or purge them permanently.
            </span>
          </div>

          {filteredTrash.length === 0 ? (
            <div className="py-20 text-center text-slate-400 space-y-3">
              <Trash2 className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm font-extrabold text-slate-700">Trash Bin is Empty</p>
              <p className="text-xs text-slate-400">No deleted invoice records stored in trash.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-4 px-6">Deleted Invoice</th>
                    <th className="py-4 px-6">Patient Name</th>
                    <th className="py-4 px-6">Kit / Condition</th>
                    <th className="py-4 px-6 text-right">Total Amount</th>
                    <th className="py-4 px-6 text-center">Restore / Purge Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {filteredTrash.map((r) => (
                    <tr key={r.id || r.invoiceNo} className="hover:bg-slate-50/60 transition-colors">
                      
                      <td className="py-4 px-6">
                        <span className="font-extrabold text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-lg block w-fit text-[11px]">
                          {r.invoiceNo}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-1 font-semibold">{r.date}</span>
                      </td>

                      <td className="py-4 px-6">
                        <div className="font-extrabold text-slate-800 text-sm">{r.patientName}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">ID: {r.patientId}</div>
                      </td>

                      <td className="py-4 px-6 max-w-[220px]">
                        <div className="font-bold text-slate-800 truncate" title={r.combinedKitName}>
                          {r.combinedKitName}
                        </div>
                      </td>

                      <td className="py-4 px-6 text-right font-extrabold text-slate-800 text-sm">
                        ₹{r.totalPaidVal.toLocaleString("en-IN")}
                      </td>

                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleRestoreRecord(r)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                            title="Restore invoice back to Active list"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Restore Bill
                          </button>
                          <button
                            onClick={() => handlePermanentDelete(r)}
                            className="bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 font-bold p-1.5 rounded-xl transition-all cursor-pointer active:scale-95"
                            title="Permanently delete forever"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* REPRINTABLE RECEIPT MODAL */}
      {showReceiptModal && selectedBill && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300 print:bg-transparent print:p-0"
          onClick={() => setShowReceiptModal(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 relative my-8 text-slate-800 flex flex-col overflow-hidden print:shadow-none print:border-none print:my-0 print:max-w-none print:w-full"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Top Modal Actions Header Bar (Non-printable) */}
            <div className="px-6 py-4 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between gap-3 shrink-0 print:hidden">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Paid Invoice Record
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
                    handleDeleteRecord(selectedBill)
                    setShowReceiptModal(false)
                  }}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 font-extrabold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  title="Move invoice to Trash Bin"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Move to Trash
                </button>
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(false)}
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
                      {selectedBill.invoiceNo}
                    </div>
                    <p className="text-[11px] text-slate-400 font-bold mt-1.5">Date: {selectedBill.date}</p>
                  </div>
                </div>

                {/* Patient Details */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold text-slate-700">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient Name</span>
                    <strong className="text-slate-900 text-sm font-extrabold">{selectedBill.patientName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient ID / Mobile</span>
                    <span>{selectedBill.patientId}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Age / Gender</span>
                    <span>{selectedBill.age ? `${selectedBill.age} yrs` : "-"} / {selectedBill.gender || "Male"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Billing Type</span>
                    <span className="font-bold text-indigo-600">{selectedBill.billingType}</span>
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
                        {(selectedBill.treatments || []).map((t: any, idx: number) => (
                          <tr key={t.id || idx}>
                            <td className="py-3 px-4 font-bold text-slate-400">{idx + 1}</td>
                            <td className="py-3 px-4 font-extrabold text-slate-900">{t.disease || "General Checkup"}</td>
                            <td className="py-3 px-4 text-slate-600">{t.kitName || "Custom Kit"}</td>
                            <td className="py-3 px-4 text-center text-slate-500">{t.durationDays || "30"} Days</td>
                            <td className="py-3 px-4 text-right font-extrabold text-slate-800">₹{parseFloat(t.price || selectedBill.priceVal || "0").toLocaleString("en-IN")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Medical Notes */}
                {(selectedBill.symptoms || selectedBill.notes) && (
                  <div className="bg-slate-50/60 rounded-xl p-3.5 border border-slate-100 text-xs space-y-1">
                    {selectedBill.symptoms && (
                      <p><strong className="text-slate-600">Symptoms:</strong> <span className="text-slate-500">{selectedBill.symptoms}</span></p>
                    )}
                    {selectedBill.notes && (
                      <p><strong className="text-slate-600">Notes / Dosage:</strong> <span className="text-slate-500">{selectedBill.notes}</span></p>
                    )}
                  </div>
                )}

                {/* Financial Calculation Breakdown */}
                <div className="flex justify-end pt-2">
                  <div className="w-full sm:w-72 space-y-2 text-xs font-semibold text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                    <div className="flex justify-between">
                      <span>Medicine Subtotal:</span>
                      <span>₹{selectedBill.priceVal.toLocaleString("en-IN")}</span>
                    </div>
                    {selectedBill.discountVal > 0 && (
                      <div className="flex justify-between text-rose-500">
                        <span>Discount Applied:</span>
                        <span>- ₹{selectedBill.discountVal.toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    {selectedBill.gstVal > 0 && (
                      <div className="flex justify-between text-indigo-600">
                        <span>GST (18%):</span>
                        <span>₹{selectedBill.gstVal.toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    <div className="border-t border-slate-300 pt-2 flex justify-between font-extrabold text-sm text-slate-900">
                      <span>Total Amount Payable:</span>
                      <span className="text-blue-600 font-black">₹{selectedBill.totalDueVal.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="border-t border-slate-200/80 pt-2 space-y-1 text-[11px]">
                      <div className="flex justify-between text-slate-500">
                        <span>Cash Paid:</span>
                        <span>₹{selectedBill.cashVal.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Online / UPI Paid:</span>
                        <span>₹{selectedBill.onlineVal.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between font-bold text-emerald-600 border-t border-slate-200/60 pt-1">
                        <span>Total Paid:</span>
                        <span>₹{selectedBill.totalPaidVal.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Follow-up Note & Signatures */}
                <div className="border-t border-slate-200 pt-4 flex justify-between items-end text-xs">
                  <div>
                    {selectedBill.nextFollowUpDate && (
                      <p className="font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg inline-block border border-emerald-100">
                        📅 Next Checkup Date: {new Date(selectedBill.nextFollowUpDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
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
                onClick={() => setShowReceiptModal(false)}
                className="w-full py-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-extrabold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer text-xs shadow-sm active:scale-[0.99]"
              >
                <X className="w-4 h-4" />
                Close Receipt Window
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
