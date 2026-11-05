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
  Edit,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  Calendar,
  Clock
} from "lucide-react"

import { calculateGSTInvoice, getStateCode, STATE_GST_CODES } from "@/utils/gstCalculator"
import { numberToIndianWords } from "@/lib/tallyNumberToWords"
import { API_URL } from "@/lib/apiConfig"

interface PaymentRecord {
  id: string
  invoiceNo: string
  tokenNo?: string
  entity?: "MAXXI" | "KSV" | "KIYAVA"
  opdSection?: string
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
  consultancyVal?: number
  gstVal: number
  totalDueVal: number
  cashVal: number
  onlineVal: number
  totalPaidVal: number
  nextFollowUpDate?: string
  calcResult?: any
  state?: string
  stateCode?: string
  city?: string
  houseNumber?: string
  pincode?: string
  address?: string
  whatsappNumber?: string
  callingNumber?: string
}

const formatReceiptDate = (dateVal?: any) => {
  if (!dateVal) return ""
  const cleanStr = String(dateVal).split("T")[0]
  const parts = cleanStr.split("-")
  if (parts.length === 3 && parts[0].length === 4) {
    const [y, m, d] = parts
    return `${d}-${m}-${y}`
  }
  const d = new Date(dateVal)
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, "0")
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const year = d.getFullYear()
    return `${day}-${month}-${year}`
  }
  return String(dateVal)
}

const formatFollowUpDate = (dateVal?: any) => {
  if (!dateVal) return "-"
  try {
    const d = new Date(dateVal)
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })
    }
  } catch (e) {}
  return String(dateVal)
}

export default function PaymentsPage() {

  const [records, setRecords] = useState<PaymentRecord[]>([])
  const [trashRecords, setTrashRecords] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Tabs state: ACTIVE or TRASH
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "TRASH">("ACTIVE")

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [paymentFilter, setPaymentFilter] = useState("ALL") // ALL, SOLAN, SABATHU, COD, ONLINE_SALE, KSV, KIYAVA, CASH, SPLIT
  const [reportMode, setReportMode] = useState<"DAILY" | "MONTHLY">("DAILY") // DAILY or MONTHLY
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split("T")[0])
  const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().slice(0, 7)) // "ALL" or "YYYY-MM"
  const [selectedEntity, setSelectedEntity] = useState<"ALL" | "MAXXI" | "KSV" | "KIYAVA">("ALL")
  const [showProductSummary, setShowProductSummary] = useState(false)

  // Printable Receipt Modal State
  const [selectedBill, setSelectedBill] = useState<PaymentRecord | null>(null)
  const [showReceiptModal, setShowReceiptModal] = useState(false)

  // Edit Bill Modal State
  const [editingBill, setEditingBill] = useState<PaymentRecord | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  // Fetch all payment records on mount
  const fetchRecords = async () => {
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

      // Read deleted records to prevent resurrection
      let permanentlyDeleted = new Set<string>()
      try {
        const storedDel = localStorage.getItem("ksv_deleted_invoices")
        if (storedDel) {
          permanentlyDeleted = new Set(JSON.parse(storedDel))
        }
      } catch (e) { }

      // Filter out bills that are already in Trash Bin
      let trashList: PaymentRecord[] = []
      try {
        const storedTrash = localStorage.getItem("ksv_trash_bills")
        if (storedTrash) trashList = JSON.parse(storedTrash)
      } catch (e) { }

      setTrashRecords(trashList)
      const trashNos = new Set(trashList.map(t => t.invoiceNo))
      const trashIds = new Set(trashList.map(t => t.id).filter(Boolean))

      // INSTANT RENDER (0ms): If local bills exist, display immediately without waiting for API
      const initialSorted = localBills
        .map((b, idx) => ({ ...b, id: b.id || `loc_${b.invoiceNo || idx}` }))
        .filter(b => !trashNos.has(b.invoiceNo) && !permanentlyDeleted.has(b.invoiceNo))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      if (initialSorted.length > 0) {
        setRecords(initialSorted)
        setLoading(false)
      }

      // 2. Fetch from backend API with 4500ms timeout
      let apiBills: PaymentRecord[] = []
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 4500)

        const res = await fetch(`${API_URL}/api/patients`, { signal: controller.signal })
        clearTimeout(timeoutId)

        if (res.ok) {
          const patientsData = await res.json()

          patientsData.forEach((p: any) => {
            if (p.orders && Array.isArray(p.orders)) {
              p.orders.forEach((o: any, idx: number) => {
                const totalDue = parseFloat(o.totalAmount || 0)
                const cash = parseFloat(o.amountCash || 0)
                const online = parseFloat(o.amountOnline || 0)
                const paid = cash + online
                const invoiceNumber = o.invoiceNo || `INV-${(o.id || idx).toString().slice(-6).toUpperCase()}`

                apiBills.push({
                  id: o.id || `ord_${p.uniqueId}_${idx}`,
                  invoiceNo: invoiceNumber,
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
                  opdSection: o.opdSection || "SOLAN OPD SALE",
                  priceVal: totalDue,
                  discountVal: 0,
                  gstVal: o.billingType?.includes("+18%") ? Math.round(totalDue * 0.18) : 0,
                  totalDueVal: totalDue,
                  cashVal: cash > 0 ? cash : (online === 0 ? totalDue : 0),
                  onlineVal: online,
                  totalPaidVal: paid > 0 ? paid : totalDue,
                  nextFollowUpDate: p.nextFollowUpDate,
                  state: p.state,
                  city: p.city,
                  houseNumber: p.houseNumber,
                  pincode: p.pincode,
                  address: p.address,
                  whatsappNumber: p.whatsappNumber,
                  callingNumber: p.callingNumber
                })
              })
            }
          })
        }
      } catch (err) {
        console.warn("Backend sync finished or timed out, relying on local records:", err)
      }

      // Deduplicate: local bills take highest priority for offline-first speed and detail
      const mergedMap = new Map<string, PaymentRecord>()
      
      localBills.forEach((b, idx) => {
        const normalized = {
          ...b,
          id: b.id || `loc_${b.invoiceNo || idx}`
        }
        if (!trashNos.has(normalized.invoiceNo) && !permanentlyDeleted.has(normalized.invoiceNo)) {
          mergedMap.set(normalized.invoiceNo, normalized)
        }
      })

      apiBills.forEach(b => {
        if (
          !mergedMap.has(b.invoiceNo) &&
          !trashNos.has(b.invoiceNo) &&
          !trashIds.has(b.id) &&
          !permanentlyDeleted.has(b.invoiceNo) &&
          !permanentlyDeleted.has(b.id)
        ) {
          mergedMap.set(b.invoiceNo, b)
        }
      })

      // 3. Load KSV Pharmacy Sales Invoices
      try {
        const ksvStored = localStorage.getItem("ksv_app_invoices")
        if (ksvStored) {
          const ksvList = JSON.parse(ksvStored)
          if (Array.isArray(ksvList)) {
            ksvList.filter((inv: any) => (inv.type || "SALE") === "SALE").forEach((inv: any, idx: number) => {
              const invNo = inv.invoiceNo || `KSV-${idx + 1}`
              if (!mergedMap.has(invNo) && !trashNos.has(invNo) && !permanentlyDeleted.has(invNo)) {
                mergedMap.set(invNo, {
                  id: inv.id || `ksv_${invNo}`,
                  invoiceNo: invNo,
                  entity: "KSV",
                  opdSection: "KSV PHARMACY",
                  date: inv.invoiceDate || (inv.createdAt ? inv.createdAt.split("T")[0] : new Date().toISOString().split("T")[0]),
                  patientName: inv.buyer?.name || "Direct Buyer",
                  patientId: inv.buyer?.gstin || "KSV-BUYER",
                  city: inv.buyer?.city || "Solan",
                  state: inv.buyer?.state || "Himachal Pradesh",
                  combinedKitName: (inv.items || []).map((it: any) => `${it.description || it.name} (${it.quantity} ${it.unit || 'NOS'})`).join(", ") || "Formulations",
                  treatments: (inv.items || []).map((it: any, i: number) => ({
                    id: String(i + 1),
                    disease: "Formulation Sale",
                    kitName: it.description || it.name,
                    quantity: it.quantity,
                    price: (it.amount || it.totalAmount || 0).toString(),
                    products: [{
                      name: it.description || it.name,
                      hsnCode: it.hsnSac || it.hsnCode || "3004",
                      quantity: String(it.quantity || "1"),
                      rate: it.rate || 0,
                      taxRate: it.taxRate || 0
                    }]
                  })),
                  billingType: inv.isInterState ? "GST (IGST)" : "GST (CGST+SGST)",
                  priceVal: inv.subtotal || inv.grandTotal || 0,
                  discountVal: inv.extraDiscount || 0,
                  gstVal: inv.totalTaxAmount || 0,
                  totalDueVal: inv.grandTotal || 0,
                  cashVal: inv.paymentMode === "Cash" ? (inv.grandTotal || 0) : 0,
                  onlineVal: inv.paymentMode !== "Cash" ? (inv.grandTotal || 0) : 0,
                  totalPaidVal: inv.grandTotal || 0,
                  whatsappNumber: inv.buyer?.phone || ""
                })
              }
            })
          }
        }
      } catch (e) {
        console.warn("Could not parse KSV invoices:", e)
      }

      // 4. Load Kiyava Subathu Sales Invoices
      try {
        const kiyavaStored = localStorage.getItem("ksv_kiyava_invoices")
        if (kiyavaStored) {
          const kiyavaList = JSON.parse(kiyavaStored)
          if (Array.isArray(kiyavaList)) {
            kiyavaList.filter((inv: any) => (inv.type || "SALE") === "SALE").forEach((inv: any, idx: number) => {
              const invNo = inv.invoiceNo || `KYV-${idx + 1}`
              if (!mergedMap.has(invNo) && !trashNos.has(invNo) && !permanentlyDeleted.has(invNo)) {
                mergedMap.set(invNo, {
                  id: inv.id || `kyv_${invNo}`,
                  invoiceNo: invNo,
                  entity: "KIYAVA",
                  opdSection: "KIYAVA SUBATHU",
                  date: inv.invoiceDate || (inv.createdAt ? inv.createdAt.split("T")[0] : new Date().toISOString().split("T")[0]),
                  patientName: inv.buyer?.name || "Herbal Buyer",
                  patientId: inv.buyer?.gstin || "KYV-BUYER",
                  city: inv.buyer?.city || "Subathu",
                  state: inv.buyer?.state || "Himachal Pradesh",
                  combinedKitName: (inv.items || []).map((it: any) => `${it.description || it.name} (${it.quantity} ${it.unit || 'kg'})`).join(", ") || "Herbs & Extracts",
                  treatments: (inv.items || []).map((it: any, i: number) => ({
                    id: String(i + 1),
                    disease: "Herbal Procurement",
                    kitName: it.description || it.name,
                    quantity: it.quantity,
                    price: (it.amount || it.totalAmount || 0).toString(),
                    products: [{
                      name: it.description || it.name,
                      hsnCode: it.hsnSac || it.hsnCode || "1211",
                      quantity: String(it.quantity || "1"),
                      rate: it.rate || 0,
                      taxRate: it.taxRate || 0
                    }]
                  })),
                  billingType: inv.isInterState ? "GST (IGST)" : "GST (CGST+SGST)",
                  priceVal: inv.subtotal || inv.grandTotal || 0,
                  discountVal: inv.extraDiscount || 0,
                  gstVal: inv.totalTaxAmount || 0,
                  totalDueVal: inv.grandTotal || 0,
                  cashVal: inv.paymentMode === "Cash" ? (inv.grandTotal || 0) : 0,
                  onlineVal: inv.paymentMode !== "Cash" ? (inv.grandTotal || 0) : 0,
                  totalPaidVal: inv.grandTotal || 0,
                  whatsappNumber: inv.buyer?.phone || ""
                })
              }
            })
          }
        }
      } catch (e) {
        console.warn("Could not parse Kiyava invoices:", e)
      }

      // 5. Load Maxxi Pharma B2B Invoices
      try {
        const maxxiStored = localStorage.getItem("maxxi_app_invoices")
        if (maxxiStored) {
          const maxxiList = JSON.parse(maxxiStored)
          if (Array.isArray(maxxiList)) {
            maxxiList.filter((inv: any) => (inv.type || "SALE") === "SALE").forEach((inv: any, idx: number) => {
              const invNo = inv.invoiceNo || `MXP-${idx + 1}`
              if (!mergedMap.has(invNo) && !trashNos.has(invNo) && !permanentlyDeleted.has(invNo)) {
                mergedMap.set(invNo, {
                  id: inv.id || `mxp_${invNo}`,
                  invoiceNo: invNo,
                  entity: "MAXXI",
                  opdSection: "MAXXI B2B SALE",
                  date: inv.invoiceDate || (inv.createdAt ? inv.createdAt.split("T")[0] : new Date().toISOString().split("T")[0]),
                  patientName: inv.buyer?.name || "Chemist / Distributor",
                  patientId: inv.buyer?.gstin || "MX-BUYER",
                  city: inv.buyer?.city || "Solan",
                  state: inv.buyer?.state || "Himachal Pradesh",
                  combinedKitName: (inv.items || []).map((it: any) => `${it.description || it.name} (${it.quantity})`).join(", ") || "Finished Medicines",
                  treatments: (inv.items || []).map((it: any, i: number) => ({
                    id: String(i + 1),
                    disease: "Pharma Distribution",
                    kitName: it.description || it.name,
                    quantity: it.quantity,
                    price: (it.amount || it.totalAmount || 0).toString(),
                    products: [{
                      name: it.description || it.name,
                      hsnCode: it.hsnSac || it.hsnCode || "3004",
                      quantity: String(it.quantity || "1"),
                      rate: it.rate || 0,
                      taxRate: it.taxRate || 0
                    }]
                  })),
                  billingType: inv.isInterState ? "GST (IGST)" : "GST (CGST+SGST)",
                  priceVal: inv.subtotal || inv.grandTotal || 0,
                  discountVal: inv.extraDiscount || 0,
                  gstVal: inv.totalTaxAmount || 0,
                  totalDueVal: inv.grandTotal || 0,
                  cashVal: inv.paymentMode === "Cash" ? (inv.grandTotal || 0) : 0,
                  onlineVal: inv.paymentMode !== "Cash" ? (inv.grandTotal || 0) : 0,
                  totalPaidVal: inv.grandTotal || 0,
                  whatsappNumber: inv.buyer?.phone || ""
                })
              }
            })
          }
        }
      } catch (e) {
        console.warn("Could not parse Maxxi invoices:", e)
      }

      const sorted = Array.from(mergedMap.values())
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      setRecords(sorted)
    } catch (err) {
      console.warn("Payment records load warning:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  // Helper to extract YYYY-MM-DD from a record's date
  const getRecordDateStr = (dateVal?: any) => {
    if (!dateVal) return ""
    const clean = String(dateVal).split("T")[0].trim()
    if (/^\d{4}-\d{2}-\d{2}/.test(clean)) return clean.slice(0, 10)
    const d = new Date(dateVal)
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    }
    return ""
  }

  // Helper to extract YYYY-MM from a record's date
  const getRecordYearMonth = (dateVal?: string) => {
    if (!dateVal) return ""
    const clean = String(dateVal).split("T")[0]
    if (/^\d{4}-\d{2}/.test(clean)) return clean.slice(0, 7)
    const d = new Date(dateVal)
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    }
    return ""
  }

  // Records filtered by selected period (DAILY or MONTHLY) and entity
  const periodFilteredRecords = records.filter(r => {
    // 1. Entity filter
    if (selectedEntity !== "ALL") {
      const ent = r.entity || "MAXXI"
      if (ent !== selectedEntity) return false
    }

    // 2. Period filter
    if (reportMode === "DAILY") {
      if (!selectedDate) return true
      return getRecordDateStr(r.date) === selectedDate
    } else {
      if (selectedMonth === "ALL" || !selectedMonth) return true
      return getRecordYearMonth(r.date) === selectedMonth
    }
  })

  // Calculated Stats (respecting selected period and entity)
  const totalRevenue = periodFilteredRecords.reduce((sum, r) => sum + (r.totalPaidVal || 0), 0)
  const cashRevenue = periodFilteredRecords.reduce((sum, r) => sum + (r.cashVal || 0), 0)
  const onlineRevenue = periodFilteredRecords.reduce((sum, r) => sum + (r.onlineVal || 0), 0)
  const totalInvoices = periodFilteredRecords.length

  // Section-wise Breakdown for selected period
  const solanRecords = periodFilteredRecords.filter(r => (r.opdSection || "SOLAN OPD SALE") === "SOLAN OPD SALE")
  const sabathuRecords = periodFilteredRecords.filter(r => r.opdSection === "SABATHU OPD SALE" || r.opdSection === "SABATHU OPD SALES")
  const codRecords = periodFilteredRecords.filter(r => r.opdSection === "COD SALE" || r.opdSection === "COD & ONLINE SALE")
  const onlineSaleRecords = periodFilteredRecords.filter(r => r.opdSection === "ONLINE SALE")
  const ksvRecords = periodFilteredRecords.filter(r => r.entity === "KSV" || r.opdSection === "KSV PHARMACY")
  const kiyavaRecords = periodFilteredRecords.filter(r => r.entity === "KIYAVA" || r.opdSection === "KIYAVA SUBATHU")
  const maxxiRecords = periodFilteredRecords.filter(r => (r.entity || "MAXXI") === "MAXXI")

  const getUnitsSoldInRecord = (r: PaymentRecord) => {
    if (r.treatments && Array.isArray(r.treatments)) {
      const prodCount = r.treatments.reduce((sum, t) => {
        if (t.products && Array.isArray(t.products) && t.products.length > 0) {
          return sum + t.products.reduce((pSum: number, p: any) => pSum + (parseFloat(p.quantity || "1") || 1), 0)
        }
        return sum + 1
      }, 0)
      return prodCount
    }
    return 1
  }

  const solanStats = {
    bills: solanRecords.length,
    units: solanRecords.reduce((s, r) => s + getUnitsSoldInRecord(r), 0),
    cash: solanRecords.reduce((s, r) => s + (r.cashVal || 0), 0),
    online: solanRecords.reduce((s, r) => s + (r.onlineVal || 0), 0),
    total: solanRecords.reduce((s, r) => s + (r.totalPaidVal || 0), 0)
  }

  const sabathuStats = {
    bills: sabathuRecords.length,
    units: sabathuRecords.reduce((s, r) => s + getUnitsSoldInRecord(r), 0),
    cash: sabathuRecords.reduce((s, r) => s + (r.cashVal || 0), 0),
    online: sabathuRecords.reduce((s, r) => s + (r.onlineVal || 0), 0),
    total: sabathuRecords.reduce((s, r) => s + (r.totalPaidVal || 0), 0)
  }

  const codStats = {
    bills: codRecords.length,
    units: codRecords.reduce((s, r) => s + getUnitsSoldInRecord(r), 0),
    cash: codRecords.reduce((s, r) => s + (r.cashVal || 0), 0),
    online: codRecords.reduce((s, r) => s + (r.onlineVal || 0), 0),
    total: codRecords.reduce((s, r) => s + (r.totalPaidVal || 0), 0)
  }

  const onlineSaleStats = {
    bills: onlineSaleRecords.length,
    units: onlineSaleRecords.reduce((s, r) => s + getUnitsSoldInRecord(r), 0),
    cash: onlineSaleRecords.reduce((s, r) => s + (r.cashVal || 0), 0),
    online: onlineSaleRecords.reduce((s, r) => s + (r.onlineVal || 0), 0),
    total: onlineSaleRecords.reduce((s, r) => s + (r.totalPaidVal || 0), 0)
  }

  const ksvStats = {
    bills: ksvRecords.length,
    units: ksvRecords.reduce((s, r) => s + getUnitsSoldInRecord(r), 0),
    cash: ksvRecords.reduce((s, r) => s + (r.cashVal || 0), 0),
    online: ksvRecords.reduce((s, r) => s + (r.onlineVal || 0), 0),
    total: ksvRecords.reduce((s, r) => s + (r.totalPaidVal || 0), 0)
  }

  const kiyavaStats = {
    bills: kiyavaRecords.length,
    units: kiyavaRecords.reduce((s, r) => s + getUnitsSoldInRecord(r), 0),
    cash: kiyavaRecords.reduce((s, r) => s + (r.cashVal || 0), 0),
    online: kiyavaRecords.reduce((s, r) => s + (r.onlineVal || 0), 0),
    total: kiyavaRecords.reduce((s, r) => s + (r.totalPaidVal || 0), 0)
  }

  // Product-wise Quantity & Revenue Breakdown (Solan OPD vs Sabathu OPD vs COD Sale vs Online Sale)
  const productWiseBreakdown = (() => {
    const map = new Map<string, {
      name: string
      hsnCode: string
      solanQty: number
      sabathuQty: number
      codQty: number
      onlineQty: number
      totalQty: number
      solanAmount: number
      sabathuAmount: number
      codAmount: number
      onlineAmount: number
      totalAmount: number
    }>()

    periodFilteredRecords.forEach(r => {
      const isSabathu = r.opdSection === "SABATHU OPD SALE" || r.opdSection === "SABATHU OPD SALES"
      const isCod = r.opdSection === "COD SALE" || r.opdSection === "COD & ONLINE SALE"
      const isOnline = r.opdSection === "ONLINE SALE"
      if (r.treatments && Array.isArray(r.treatments)) {
        r.treatments.forEach((t: any) => {
          if (t.products && Array.isArray(t.products) && t.products.length > 0) {
            t.products.forEach((p: any) => {
              const pName = (p.name || t.kitName || "Medicine").trim()
              const key = pName.toLowerCase()
              const qty = parseFloat(p.quantity || "1") || 1
              const rate = parseFloat(p.rate || "0") || 0
              const taxRate = parseFloat(p.taxRate || "0") || 0
              const lineTotal = qty * rate * (1 + taxRate / 100)

              const existing = map.get(key) || {
                name: pName,
                hsnCode: p.hsnCode || p.hsnSac || "",
                solanQty: 0,
                sabathuQty: 0,
                codQty: 0,
                onlineQty: 0,
                totalQty: 0,
                solanAmount: 0,
                sabathuAmount: 0,
                codAmount: 0,
                onlineAmount: 0,
                totalAmount: 0
              }
              if (isSabathu) {
                existing.sabathuQty += qty
                existing.sabathuAmount += lineTotal
              } else if (isCod) {
                existing.codQty += qty
                existing.codAmount += lineTotal
              } else if (isOnline) {
                existing.onlineQty += qty
                existing.onlineAmount += lineTotal
              } else {
                existing.solanQty += qty
                existing.solanAmount += lineTotal
              }
              existing.totalQty += qty
              existing.totalAmount += lineTotal
              if (!existing.hsnCode && (p.hsnCode || p.hsnSac)) {
                existing.hsnCode = p.hsnCode || p.hsnSac
              }
              map.set(key, existing)
            })
          } else if (t.kitName || t.disease) {
            const pName = (t.kitName || t.disease || "OPD Kit").trim()
            const key = pName.toLowerCase()
            const lineTotal = parseFloat(t.price || "0") || (r.totalPaidVal || 0)
            const existing = map.get(key) || {
              name: pName,
              hsnCode: "",
              solanQty: 0,
              sabathuQty: 0,
              codQty: 0,
              onlineQty: 0,
              totalQty: 0,
              solanAmount: 0,
              sabathuAmount: 0,
              codAmount: 0,
              onlineAmount: 0,
              totalAmount: 0
            }
            if (isSabathu) {
              existing.sabathuQty += 1
              existing.sabathuAmount += lineTotal
            } else if (isCod) {
              existing.codQty += 1
              existing.codAmount += lineTotal
            } else if (isOnline) {
              existing.onlineQty += 1
              existing.onlineAmount += lineTotal
            } else {
              existing.solanQty += 1
              existing.solanAmount += lineTotal
            }
            existing.totalQty += 1
            existing.totalAmount += lineTotal
            map.set(key, existing)
          }
        })
      }
    })

    return Array.from(map.values()).sort((a, b) => b.totalQty - a.totalQty)
  })()

  // Filtered active records
  const filteredRecords = periodFilteredRecords.filter(r => {
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      r.patientName.toLowerCase().includes(query) ||
      r.patientId.toLowerCase().includes(query) ||
      r.invoiceNo.toLowerCase().includes(query) ||
      r.combinedKitName.toLowerCase().includes(query) ||
      (r.opdSection || "SOLAN OPD SALE").toLowerCase().includes(query)

    if (!matchesSearch) return false

    if (paymentFilter === "CASH") return r.cashVal > 0 && r.onlineVal === 0
    if (paymentFilter === "SPLIT") return r.cashVal > 0 && r.onlineVal > 0
    if (paymentFilter === "SOLAN") return (r.opdSection || "SOLAN OPD SALE") === "SOLAN OPD SALE"
    if (paymentFilter === "SABATHU") return r.opdSection === "SABATHU OPD SALE" || r.opdSection === "SABATHU OPD SALES"
    if (paymentFilter === "COD") return r.opdSection === "COD SALE" || r.opdSection === "COD & ONLINE SALE"
    if (paymentFilter === "ONLINE_SALE") return r.opdSection === "ONLINE SALE"
    if (paymentFilter === "KSV") return r.entity === "KSV" || r.opdSection === "KSV PHARMACY"
    if (paymentFilter === "KIYAVA") return r.entity === "KIYAVA" || r.opdSection === "KIYAVA SUBATHU"

    return true
  })

  // Export Daily / Month-End Report to Excel (.csv with UTF-8 BOM for Microsoft Excel)
  const handleExportExcel = (scope: "ALL" | "SOLAN" | "SABATHU" | "COD" | "ONLINE_SALE" | "KSV" | "KIYAVA" | "MAXXI" = "ALL") => {
    const targetRecords =
      scope === "SOLAN"
        ? solanRecords
        : scope === "SABATHU"
        ? sabathuRecords
        : scope === "COD"
        ? codRecords
        : scope === "ONLINE_SALE"
        ? onlineSaleRecords
        : scope === "KSV"
        ? ksvRecords
        : scope === "KIYAVA"
        ? kiyavaRecords
        : scope === "MAXXI"
        ? maxxiRecords
        : filteredRecords

    if (targetRecords.length === 0) {
      alert("No invoice records found for the selected period / section to export.")
      return
    }

    const esc = (val: any) => {
      const str = String(val ?? "").replace(/"/g, '""')
      return `"${str}"`
    }

    const periodLabel = reportMode === "DAILY" ? `Daily Date: ${selectedDate}` : `Month: ${selectedMonth}`
    const entityLabel =
      selectedEntity === "ALL"
        ? "KIYAVA / KSV / MAXXI"
        : selectedEntity === "KSV"
        ? "KSV PHARMACY"
        : selectedEntity === "KIYAVA"
        ? "KIYAVA SUBATHU"
        : "MAXXI PHARMA"
    const reportTypeTitle = reportMode === "DAILY" ? "DAILY SALES REPORT" : "MONTH-END SALES REPORT"
    const scopeLabel =
      scope === "SOLAN"
        ? "SOLAN-OPD-SALE"
        : scope === "SABATHU"
        ? "SABATHU-OPD-SALE"
        : scope === "COD"
        ? "COD-SALE"
        : scope === "ONLINE_SALE"
        ? "ONLINE-SALE"
        : scope === "KSV"
        ? "KSV-PHARMACY"
        : scope === "KIYAVA"
        ? "KIYAVA-SUBATHU"
        : "ALL-SECTIONS"

  // Export Clean, Column-Aligned Daily / Month-End Sales Register to Excel (.csv)
  const handleExportExcel = (scope: "ALL" | "SOLAN" | "SABATHU" | "COD" | "ONLINE_SALE" | "KSV" | "KIYAVA" | "MAXXI" = "ALL") => {
    const targetRecords =
      scope === "SOLAN"
        ? solanRecords
        : scope === "SABATHU"
        ? sabathuRecords
        : scope === "COD"
        ? codRecords
        : scope === "ONLINE_SALE"
        ? onlineSaleRecords
        : scope === "KSV"
        ? ksvRecords
        : scope === "KIYAVA"
        ? kiyavaRecords
        : scope === "MAXXI"
        ? maxxiRecords
        : filteredRecords

    if (targetRecords.length === 0) {
      alert("No invoice records found for the selected period / section to export.")
      return
    }

    const escStr = (val: any) => `"${String(val ?? "").replace(/"/g, '""')}"`
    const escNum = (val: any) => {
      const num = Number(val)
      return isNaN(num) ? "0.00" : num.toFixed(2)
    }

    const periodLabel = reportMode === "DAILY" ? `Daily-${selectedDate}` : `Month-${selectedMonth}`
    const entityLabel =
      selectedEntity === "ALL"
        ? "KIYAVA-KSV-MAXXI"
        : selectedEntity === "KSV"
        ? "KSV-PHARMACY"
        : selectedEntity === "KIYAVA"
        ? "KIYAVA-SUBATHU"
        : "MAXXI-PHARMA"
    const reportTypeTitle = reportMode === "DAILY" ? "DAILY-SALES-REPORT" : "MONTH-END-SALES-REGISTER"
    const scopeLabel =
      scope === "SOLAN"
        ? "SOLAN-OPD"
        : scope === "SABATHU"
        ? "SABATHU-OPD"
        : scope === "COD"
        ? "COD-SALE"
        : scope === "ONLINE_SALE"
        ? "ONLINE-SALE"
        : scope === "KSV"
        ? "KSV-PHARMACY"
        : scope === "KIYAVA"
        ? "KIYAVA-SUBATHU"
        : "ALL-SECTIONS"

    const headers = [
      "Sr No",
      "Invoice Date",
      "Invoice No",
      "Entity",
      "OPD Section / Bill Source",
      "Patient / Buyer Name",
      "Patient Mobile / ID",
      "City",
      "State",
      "State Code",
      "Prescribed Products & Quantities",
      "Units Sold",
      "Gross Taxable Amount (Before Discount) (Rs.)",
      "Discount (Rs.)",
      "Taxable Amount (After Discount) (Rs.)",
      "CGST (Rs.)",
      "SGST (Rs.)",
      "IGST (Rs.)",
      "Total GST (Rs.)",
      "Grand Total (Rs.)",
      "Payment Mode",
      "Cash Paid (Rs.)",
      "Online / UPI Paid (Rs.)",
      "Total Paid (Rs.)"
    ]

    const rows: string[] = []

    // Row 1: EXACT 24-Column Header Row!
    rows.push(headers.map(h => `"${h}"`).join(","))

    let sumUnits = 0
    let sumGross = 0
    let sumDisc = 0
    let sumTaxable = 0
    let sumCgst = 0
    let sumSgst = 0
    let sumIgst = 0
    let sumTotalGst = 0
    let sumGrand = 0
    let sumCash = 0
    let sumOnline = 0
    let sumTotalPaid = 0

    targetRecords.forEach((r, idx) => {
      const patientState = r.state || (r.calcResult?.isInterState ? "Punjab" : "Himachal Pradesh")
      const patientStateCode = getStateCode(patientState)
      const calc = calculateGSTInvoice(
        r.treatments || [],
        r.discountVal || 0,
        r.consultancyVal || 0,
        "Himachal Pradesh",
        patientState,
        true,
        patientStateCode
      )

      const u = getUnitsSoldInRecord(r)
      const g = calc.grossAmount
      const d = calc.discountApplied || r.discountVal || 0
      const t = calc.totalTaxableValue
      const cg = calc.totalCgst
      const sg = calc.totalSgst
      const ig = calc.totalIgst
      const gst = calc.totalTax
      const grand = calc.grandTotal
      const cash = r.cashVal || 0
      const on = r.onlineVal || 0
      const paid = r.totalPaidVal || (cash + on) || grand

      sumUnits += u
      sumGross += g
      sumDisc += d
      sumTaxable += t
      sumCgst += cg
      sumSgst += sg
      sumIgst += ig
      sumTotalGst += gst
      sumGrand += grand
      sumCash += cash
      sumOnline += on
      sumTotalPaid += paid

      rows.push([
        idx + 1,
        escStr(r.date),
        escStr(r.invoiceNo),
        escStr(r.entity === "KSV" ? "KSV Pharmacy" : r.entity === "KIYAVA" ? "Kiyava Subathu" : "Maxxi Pharma"),
        escStr(r.opdSection || "SOLAN OPD SALE"),
        escStr(r.patientName),
        escStr(r.patientId || r.whatsappNumber || "-"),
        escStr(r.city || "-"),
        escStr(patientState),
        escStr(patientStateCode || "02"),
        escStr(r.combinedKitName),
        escNum(u),
        escNum(g),
        escNum(d),
        escNum(t),
        escNum(cg),
        escNum(sg),
        escNum(ig),
        escNum(gst),
        escNum(grand),
        escStr(cash > 0 && on > 0 ? "Cash + Online Split" : (cash > 0 ? "Cash" : "Online / UPI")),
        escNum(cash),
        escNum(on),
        escNum(paid)
      ].join(","))
    })

    // Blank separator line (exactly 24 columns)
    rows.push(Array(24).fill("").join(","))

    // Clean, Column-Aligned TOTAL Row (exactly 24 columns)
    rows.push([
      `"TOTAL (${targetRecords.length} Bills)"`,
      '""',
      '""',
      '""',
      '""',
      '""',
      '""',
      '""',
      '""',
      '""',
      '""',
      escNum(sumUnits),
      escNum(sumGross),
      escNum(sumDisc),
      escNum(sumTaxable),
      escNum(sumCgst),
      escNum(sumSgst),
      escNum(sumIgst),
      escNum(sumTotalGst),
      escNum(sumGrand),
      '""',
      escNum(sumCash),
      escNum(sumOnline),
      escNum(sumTotalPaid)
    ].join(","))

    const csvContent = "\uFEFF" + rows.join("\r\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    const safeDate = reportMode === "DAILY" ? selectedDate : (selectedMonth === "ALL" ? "All-Months" : selectedMonth)
    link.download = `${entityLabel}-${reportTypeTitle}-${safeDate}-${scopeLabel}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Export Dedicated Product-Wise Sold Breakdown (clean 13-column Excel)
  const handleExportProductExcel = () => {
    if (productWiseBreakdown.length === 0) {
      alert("No product breakdown records to export for this period.")
      return
    }

    const escStr = (val: any) => `"${String(val ?? "").replace(/"/g, '""')}"`
    const escNum = (val: any) => {
      const num = Number(val)
      return isNaN(num) ? "0.00" : num.toFixed(2)
    }

    const headers = [
      "Sr No",
      "Product / Medicine Name",
      "HSN Code",
      "Solan OPD Qty Sold",
      "Sabathu OPD Qty Sold",
      "COD Sale Qty Sold",
      "Online Sale Qty Sold",
      "Total Qty Sold",
      "Solan OPD Sales (Rs.)",
      "Sabathu OPD Sales (Rs.)",
      "COD Sale Sales (Rs.)",
      "Online Sale Sales (Rs.)",
      "Total Product Revenue (Rs.)"
    ]

    const rows: string[] = []
    rows.push(headers.map(h => `"${h}"`).join(","))

    let sumSolanQty = 0
    let sumSabathuQty = 0
    let sumCodQty = 0
    let sumOnlineQty = 0
    let sumTotalQty = 0
    let sumSolanAmt = 0
    let sumSabathuAmt = 0
    let sumCodAmt = 0
    let sumOnlineAmt = 0
    let sumTotalAmt = 0

    productWiseBreakdown.forEach((prod, idx) => {
      sumSolanQty += prod.solanQty
      sumSabathuQty += prod.sabathuQty
      sumCodQty += prod.codQty
      sumOnlineQty += prod.onlineQty
      sumTotalQty += prod.totalQty
      sumSolanAmt += prod.solanAmount
      sumSabathuAmt += prod.sabathuAmount
      sumCodAmt += prod.codAmount
      sumOnlineAmt += prod.onlineAmount
      sumTotalAmt += prod.totalAmount

      rows.push([
        idx + 1,
        escStr(prod.name),
        escStr(prod.hsnCode || "-"),
        escNum(prod.solanQty),
        escNum(prod.sabathuQty),
        escNum(prod.codQty),
        escNum(prod.onlineQty),
        escNum(prod.totalQty),
        escNum(prod.solanAmount),
        escNum(prod.sabathuAmount),
        escNum(prod.codAmount),
        escNum(prod.onlineAmount),
        escNum(prod.totalAmount)
      ].join(","))
    })

    rows.push(Array(13).fill("").join(","))
    rows.push([
      `"TOTAL (${productWiseBreakdown.length} Products)"`,
      '""',
      '""',
      escNum(sumSolanQty),
      escNum(sumSabathuQty),
      escNum(sumCodQty),
      escNum(sumOnlineQty),
      escNum(sumTotalQty),
      escNum(sumSolanAmt),
      escNum(sumSabathuAmt),
      escNum(sumCodAmt),
      escNum(sumOnlineAmt),
      escNum(sumTotalAmt)
    ].join(","))

    const csvContent = "\uFEFF" + rows.join("\r\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `PRODUCT-SALES-BREAKDOWN-${reportMode === "DAILY" ? selectedDate : selectedMonth}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
  }

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

      // Also restore inventory to Maxxi Pharma
      const maxxiCat = JSON.parse(localStorage.getItem("maxxi_app_catalog") || "[]")
      let updatedCatalog = [...maxxiCat]
      if (record.treatments) {
        record.treatments.forEach((t: any) => {
          if (t.products) {
            t.products.forEach((p: any) => {
              const qtyToRestore = parseFloat(p.quantity || "1");
              const index = updatedCatalog.findIndex((c: any) => c.name === p.name);
              if (index !== -1) {
                const currentQty = updatedCatalog[index].quantity || 0;
                updatedCatalog[index] = {
                  ...updatedCatalog[index],
                  quantity: currentQty + qtyToRestore
                }
              }
            })
          }
        })
        localStorage.setItem("maxxi_app_catalog", JSON.stringify(updatedCatalog))
      }

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

      // Also deduct inventory from Maxxi Pharma
      const maxxiCat = JSON.parse(localStorage.getItem("maxxi_app_catalog") || "[]")
      let updatedCatalog = [...maxxiCat]
      if (record.treatments) {
        record.treatments.forEach((t: any) => {
          if (t.products) {
            t.products.forEach((p: any) => {
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
      }
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

      const storedDel = JSON.parse(localStorage.getItem("ksv_deleted_invoices") || "[]")
      if (!storedDel.includes(record.invoiceNo)) storedDel.push(record.invoiceNo)
      if (record.id && !storedDel.includes(record.id)) storedDel.push(record.id)
      localStorage.setItem("ksv_deleted_invoices", JSON.stringify(storedDel))
    } catch (e) {
      console.warn("Permanent delete error:", e)
    }
  }

  // Empty all items from Trash Bin
  const handleEmptyTrash = () => {
    if (!confirm("Kya aap Trash Bin ke SARE deleted invoices permanently delete karna chahte hain?")) {
      return
    }
    try {
      const storedDel = JSON.parse(localStorage.getItem("ksv_deleted_invoices") || "[]")
      trashRecords.forEach(r => {
        if (!storedDel.includes(r.invoiceNo)) storedDel.push(r.invoiceNo)
        if (r.id && !storedDel.includes(r.id)) storedDel.push(r.id)
      })
      localStorage.setItem("ksv_deleted_invoices", JSON.stringify(storedDel))
    } catch (e) { }

    setTrashRecords([])
    localStorage.removeItem("ksv_trash_bills")
  }

  // Save changes from Edit Invoice modal
  const handleSaveEditedBill = (updated: PaymentRecord) => {
    setRecords(prev => prev.map(r => r.invoiceNo === updated.invoiceNo ? updated : r))
    try {
      const storedOffline = localStorage.getItem("ksv_offline_bills")
      if (storedOffline) {
        const localBills: PaymentRecord[] = JSON.parse(storedOffline)
        const idx = localBills.findIndex(b => b.invoiceNo === updated.invoiceNo)
        if (idx !== -1) {
          localBills[idx] = updated
        } else {
          localBills.unshift(updated)
        }
        localStorage.setItem("ksv_offline_bills", JSON.stringify(localBills))
      }
    } catch (e) {
      console.warn("Error persisting updated bill:", e)
    }
    setShowEditModal(false)
    setEditingBill(null)
  }

  return (
    <div className="w-full pt-0 pb-16 animate-in fade-in duration-500 text-slate-700">
      <div className="print:hidden">
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
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === "ACTIVE"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
                }`}
            >
              Active Invoices ({records.length})
            </button>
            <button
              onClick={() => setActiveTab("TRASH")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === "TRASH"
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

          <button
            onClick={() => handleExportExcel("ALL")}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            title="Download Month-End Sales Report in Excel"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Excel Report
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">

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

      {/* DAILY SALES REPORT (DALY REPOT) & MONTH-END REGISTER PANEL */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm mb-6 space-y-4">
        {/* Panel Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                Live Reports
              </span>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                {reportMode === "DAILY" ? "Daily Sales Report (Daly Repot)" : "Month-End Sales Register"}
              </h2>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              {reportMode === "DAILY" 
                ? `Daily revenue & GST breakdown across Kiyava Subathu, KSV Pharmacy, and Maxxi Pharma for ${selectedDate || "selected date"}`
                : `Monthly consolidated sales register & product quantity breakdown for ${selectedMonth === "ALL" ? "All Months" : selectedMonth}`}
            </p>
          </div>

          {/* Action & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Daily vs Monthly Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-black">
              <button
                type="button"
                onClick={() => setReportMode("DAILY")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  reportMode === "DAILY" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" /> Daily Report
              </button>
              <button
                type="button"
                onClick={() => setReportMode("MONTHLY")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  reportMode === "MONTHLY" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Clock className="w-3.5 h-3.5" /> Monthly
              </button>
            </div>

            {/* Date Picker (Daily Mode) */}
            {reportMode === "DAILY" ? (
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
                  className={`px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-all ${
                    selectedDate === new Date().toISOString().split("T")[0]
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const y = new Date()
                    y.setDate(y.getDate() - 1)
                    setSelectedDate(y.toISOString().split("T")[0])
                  }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-all ${
                    selectedDate === new Date(Date.now() - 86400000).toISOString().split("T")[0]
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Yesterday
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent font-extrabold text-slate-800 outline-none cursor-pointer text-xs ml-1"
                />
              </div>
            ) : (
              /* Month Picker (Monthly Mode) */
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-bold text-slate-500 text-[11px] uppercase">Month:</span>
                <input
                  type="month"
                  value={selectedMonth === "ALL" ? "" : selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value || "ALL")}
                  className="bg-transparent font-extrabold text-slate-800 outline-none cursor-pointer text-xs"
                />
                {selectedMonth !== "ALL" && (
                  <button
                    type="button"
                    onClick={() => setSelectedMonth("ALL")}
                    className="text-[10px] font-black text-blue-600 hover:underline ml-1 cursor-pointer"
                  >
                    All Months
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowProductSummary(prev => !prev)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
            >
              {showProductSummary ? "Hide Breakdown" : `Product-Wise (${productWiseBreakdown.length})`}
            </button>

            <button
              type="button"
              onClick={() => handleExportExcel("ALL")}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="Download Excel Report with Taxable Amount, Discount & GST details"
            >
              <Download className="w-3.5 h-3.5" /> Export Excel Report
            </button>
          </div>
        </div>

        {/* Entity Selector Pills (Kiyava, KSV, Maxxi, All) */}
        <div className="flex flex-wrap items-center gap-1.5 pb-2">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mr-1">
            Entity Filter:
          </span>
          <button
            type="button"
            onClick={() => setSelectedEntity("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              selectedEntity === "ALL"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Entities (Kiyava + KSV + Maxxi)
          </button>
          <button
            type="button"
            onClick={() => setSelectedEntity("MAXXI")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              selectedEntity === "MAXXI"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
            }`}
          >
            Maxxi Pharma (Solan/Sabathu OPD + B2B)
          </button>
          <button
            type="button"
            onClick={() => setSelectedEntity("KSV")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              selectedEntity === "KSV"
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-purple-50 hover:text-purple-700"
            }`}
          >
            KSV Pharmacy
          </button>
          <button
            type="button"
            onClick={() => setSelectedEntity("KIYAVA")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              selectedEntity === "KIYAVA"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700"
            }`}
          >
            Kiyava Subathu
          </button>
        </div>

        {/* Section & Entity Comparison Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* 1. Solan OPD Sale Card */}
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-3.5 flex flex-col justify-between gap-2.5">
            <div className="flex items-start justify-between gap-1.5">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  SOLAN OPD
                </span>
                <h3 className="text-lg font-black text-emerald-900 mt-1.5 font-mono">
                  ₹{solanStats.total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => handleExportExcel("SOLAN")}
                className="p-1.5 bg-white hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-black transition-all cursor-pointer shadow-xs"
                title="Download Solan OPD Excel"
              >
                <Download className="w-3 h-3" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-emerald-200/60 text-[11px]">
              <div>
                <span className="text-[9px] text-emerald-700/80 font-bold uppercase block">Bills / Units</span>
                <strong className="font-black text-slate-800 font-mono">{solanStats.bills} / {solanStats.units}</strong>
              </div>
              <div>
                <span className="text-[9px] text-emerald-700/80 font-bold uppercase block">Cash / Online</span>
                <span className="font-mono text-[10px] font-bold text-slate-700 block">
                  ₹{solanStats.cash.toLocaleString("en-IN")} / ₹{solanStats.online.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Sabathu OPD Sale Card */}
          <div className="bg-teal-50/60 border border-teal-100 rounded-2xl p-3.5 flex flex-col justify-between gap-2.5">
            <div className="flex items-start justify-between gap-1.5">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                  SABATHU OPD
                </span>
                <h3 className="text-lg font-black text-teal-900 mt-1.5 font-mono">
                  ₹{sabathuStats.total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => handleExportExcel("SABATHU")}
                className="p-1.5 bg-white hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg text-[10px] font-black transition-all cursor-pointer shadow-xs"
                title="Download Sabathu OPD Excel"
              >
                <Download className="w-3 h-3" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-teal-200/60 text-[11px]">
              <div>
                <span className="text-[9px] text-teal-700/80 font-bold uppercase block">Bills / Units</span>
                <strong className="font-black text-slate-800 font-mono">{sabathuStats.bills} / {sabathuStats.units}</strong>
              </div>
              <div>
                <span className="text-[9px] text-teal-700/80 font-bold uppercase block">Cash / Online</span>
                <span className="font-mono text-[10px] font-bold text-slate-700 block">
                  ₹{sabathuStats.cash.toLocaleString("en-IN")} / ₹{sabathuStats.online.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* 3. COD Sale Card */}
          <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-3.5 flex flex-col justify-between gap-2.5">
            <div className="flex items-start justify-between gap-1.5">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  COD SALE
                </span>
                <h3 className="text-lg font-black text-amber-900 mt-1.5 font-mono">
                  ₹{codStats.total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => handleExportExcel("COD")}
                className="p-1.5 bg-white hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-black transition-all cursor-pointer shadow-xs"
                title="Download COD Sale Excel"
              >
                <Download className="w-3 h-3" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-amber-200/60 text-[11px]">
              <div>
                <span className="text-[9px] text-amber-800/80 font-bold uppercase block">Bills / Units</span>
                <strong className="font-black text-slate-800 font-mono">{codStats.bills} / {codStats.units}</strong>
              </div>
              <div>
                <span className="text-[9px] text-amber-800/80 font-bold uppercase block">Cash / Online</span>
                <span className="font-mono text-[10px] font-bold text-slate-700 block">
                  ₹{codStats.cash.toLocaleString("en-IN")} / ₹{codStats.online.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Online Sale Card */}
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-3.5 flex flex-col justify-between gap-2.5">
            <div className="flex items-start justify-between gap-1.5">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                  ONLINE SALE
                </span>
                <h3 className="text-lg font-black text-indigo-900 mt-1.5 font-mono">
                  ₹{onlineSaleStats.total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => handleExportExcel("ONLINE_SALE")}
                className="p-1.5 bg-white hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg text-[10px] font-black transition-all cursor-pointer shadow-xs"
                title="Download Online Sale Excel"
              >
                <Download className="w-3 h-3" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-indigo-200/60 text-[11px]">
              <div>
                <span className="text-[9px] text-indigo-800/80 font-bold uppercase block">Bills / Units</span>
                <strong className="font-black text-slate-800 font-mono">{onlineSaleStats.bills} / {onlineSaleStats.units}</strong>
              </div>
              <div>
                <span className="text-[9px] text-indigo-800/80 font-bold uppercase block">Cash / Online</span>
                <span className="font-mono text-[10px] font-bold text-slate-700 block">
                  ₹{onlineSaleStats.cash.toLocaleString("en-IN")} / ₹{onlineSaleStats.online.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* 5. KSV Pharmacy Card */}
          <div className="bg-purple-50/60 border border-purple-100 rounded-2xl p-3.5 flex flex-col justify-between gap-2.5">
            <div className="flex items-start justify-between gap-1.5">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                  KSV PHARMACY
                </span>
                <h3 className="text-lg font-black text-purple-900 mt-1.5 font-mono">
                  ₹{ksvStats.total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => handleExportExcel("KSV")}
                className="p-1.5 bg-white hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg text-[10px] font-black transition-all cursor-pointer shadow-xs"
                title="Download KSV Pharmacy Excel"
              >
                <Download className="w-3 h-3" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-purple-200/60 text-[11px]">
              <div>
                <span className="text-[9px] text-purple-800/80 font-bold uppercase block">Invoices / Qty</span>
                <strong className="font-black text-slate-800 font-mono">{ksvStats.bills} / {ksvStats.units}</strong>
              </div>
              <div>
                <span className="text-[9px] text-purple-800/80 font-bold uppercase block">Cash / Online</span>
                <span className="font-mono text-[10px] font-bold text-slate-700 block">
                  ₹{ksvStats.cash.toLocaleString("en-IN")} / ₹{ksvStats.online.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* 6. Kiyava Subathu Card */}
          <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-3.5 flex flex-col justify-between gap-2.5">
            <div className="flex items-start justify-between gap-1.5">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  KIYAVA SUBATHU
                </span>
                <h3 className="text-lg font-black text-blue-900 mt-1.5 font-mono">
                  ₹{kiyavaStats.total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => handleExportExcel("KIYAVA")}
                className="p-1.5 bg-white hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-[10px] font-black transition-all cursor-pointer shadow-xs"
                title="Download Kiyava Subathu Excel"
              >
                <Download className="w-3 h-3" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-blue-200/60 text-[11px]">
              <div>
                <span className="text-[9px] text-blue-800/80 font-bold uppercase block">Invoices / Qty</span>
                <strong className="font-black text-slate-800 font-mono">{kiyavaStats.bills} / {kiyavaStats.units}</strong>
              </div>
              <div>
                <span className="text-[9px] text-blue-800/80 font-bold uppercase block">Cash / Online</span>
                <span className="font-mono text-[10px] font-bold text-slate-700 block">
                  ₹{kiyavaStats.cash.toLocaleString("en-IN")} / ₹{kiyavaStats.online.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Product-Wise Sales Breakdown Table */}
        {showProductSummary && (
          <div className="border border-slate-200 rounded-2xl overflow-hidden mt-3">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                Product-Wise Quantity Sold (Solan OPD vs Sabathu OPD vs COD Sale vs Online Sale)
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                {productWiseBreakdown.length} Product(s)
              </span>
            </div>
            {productWiseBreakdown.length > 0 ? (
              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 text-slate-600 uppercase font-extrabold text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">#</th>
                      <th className="py-2.5 px-4">Product / Medicine Name</th>
                      <th className="py-2.5 px-4">HSN</th>
                      <th className="py-2.5 px-4 text-right text-emerald-700">Solan OPD Qty</th>
                      <th className="py-2.5 px-4 text-right text-teal-700">Sabathu OPD Qty</th>
                      <th className="py-2.5 px-4 text-right text-amber-700">COD Sale Qty</th>
                      <th className="py-2.5 px-4 text-right text-indigo-700">Online Sale Qty</th>
                      <th className="py-2.5 px-4 text-right">Total Qty Sold</th>
                      <th className="py-2.5 px-4 text-right">Total Sales (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold">
                    {productWiseBreakdown.map((prod, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-4 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-4 font-bold text-slate-800 uppercase">{prod.name}</td>
                        <td className="py-2 px-4 font-mono text-[10px] text-slate-500">{prod.hsnCode || "—"}</td>
                        <td className="py-2 px-4 text-right font-mono font-bold text-emerald-700">{prod.solanQty}</td>
                        <td className="py-2 px-4 text-right font-mono font-bold text-teal-700">{prod.sabathuQty}</td>
                        <td className="py-2 px-4 text-right font-mono font-bold text-amber-700">{prod.codQty}</td>
                        <td className="py-2 px-4 text-right font-mono font-bold text-indigo-700">{prod.onlineQty}</td>
                        <td className="py-2 px-4 text-right font-mono font-black text-slate-900">{prod.totalQty}</td>
                        <td className="py-2 px-4 text-right font-mono font-extrabold text-blue-700">
                          ₹{prod.totalAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 font-semibold">
                No product sales recorded for the selected month.
              </div>
            )}
          </div>
        )}
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
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-200/60 text-xs w-full sm:w-auto justify-center">
            <button
              onClick={() => setPaymentFilter("ALL")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer ${paymentFilter === "ALL" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> All Bills
            </button>
            <button
              onClick={() => setPaymentFilter("SOLAN")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer ${paymentFilter === "SOLAN" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
            >
              Solan OPD Sale
            </button>
            <button
              onClick={() => setPaymentFilter("SABATHU")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer ${paymentFilter === "SABATHU" ? "bg-white text-teal-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
            >
              Sabathu OPD Sale
            </button>
            <button
              onClick={() => setPaymentFilter("COD")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer ${paymentFilter === "COD" ? "bg-white text-amber-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
            >
              COD Sale
            </button>
            <button
              onClick={() => setPaymentFilter("ONLINE_SALE")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer ${paymentFilter === "ONLINE_SALE" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
            >
              Online Sale
            </button>
            <button
              onClick={() => setPaymentFilter("KSV")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer ${paymentFilter === "KSV" ? "bg-white text-purple-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
            >
              KSV Pharmacy
            </button>
            <button
              onClick={() => setPaymentFilter("KIYAVA")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer ${paymentFilter === "KIYAVA" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
            >
              Kiyava Subathu
            </button>
            <button
              onClick={() => setPaymentFilter("CASH")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer ${paymentFilter === "CASH" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
            >
              <Banknote className="w-3.5 h-3.5 text-emerald-600" /> Cash Only
            </button>
            <button
              onClick={() => setPaymentFilter("SPLIT")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer ${paymentFilter === "SPLIT" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
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
                  {filteredRecords.map((r) => {
                    const patientState = r.state || (r.calcResult?.isInterState ? "Punjab" : "Himachal Pradesh");
                    const patientStateCode = getStateCode(patientState);
                    const rowCalc = calculateGSTInvoice(
                      r.treatments || [],
                      r.discountVal || 0,
                      r.consultancyVal || 0,
                      "Himachal Pradesh", 
                      patientState, 
                      true,
                      patientStateCode
                    );
                    const grandTotal = rowCalc.grandTotal;
                    const balanceDue = Math.max(0, grandTotal - (r.totalPaidVal || 0));
                    const isFullyPaid = balanceDue === 0;

                    return (
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
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                            r.opdSection === "COD SALE" || r.opdSection === "COD & ONLINE SALE"
                              ? "text-amber-700 bg-amber-50 border-amber-200"
                              : r.opdSection === "ONLINE SALE"
                              ? "text-indigo-700 bg-indigo-50 border-indigo-200"
                              : r.opdSection === "SABATHU OPD SALE" || r.opdSection === "SABATHU OPD SALES"
                              ? "text-teal-700 bg-teal-50 border-teal-200"
                              : "text-emerald-700 bg-emerald-50 border-emerald-200"
                          }`}>
                            {r.opdSection || "SOLAN OPD SALE"}
                          </span>
                          <span className="text-[10px] text-indigo-600 font-extrabold bg-indigo-50 px-2 py-0.5 rounded-md">
                            {r.billingType}
                          </span>
                        </div>
                      </td>

                      {/* Price & Subtotal */}
                      <td className="py-4 px-6 text-right">
                        <div className="font-bold text-slate-700">₹{rowCalc.totalTaxableValue.toLocaleString("en-IN")}</div>
                        {rowCalc.totalTax > 0 && <span className="text-[10px] text-slate-400 block">+ ₹{rowCalc.totalTax.toLocaleString("en-IN")} GST</span>}
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
                        {isFullyPaid ? (
                          <span className="text-[10px] text-emerald-600 font-extrabold flex items-center justify-end gap-1 mt-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Paid in Full
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-600 font-extrabold flex items-center justify-end gap-1 mt-0.5">
                            <Banknote className="w-3 h-3" /> Due: ₹{balanceDue.toLocaleString("en-IN")}
                          </span>
                        )}
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
                            onClick={() => {
                              setEditingBill(r)
                              setShowEditModal(true)
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all border border-transparent hover:border-amber-100 cursor-pointer"
                            title="Edit Invoice"
                          >
                            <Edit className="w-4 h-4" />
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
                  )})}
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
      </div>

      {/* REPRINTABLE RECEIPT MODAL */}
      {showReceiptModal && selectedBill && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300 print:relative print:inset-auto print:bg-transparent print:p-0 print:block print:overflow-visible print:z-auto"
          onClick={() => setShowReceiptModal(false)}
        >
          {(() => {
            const patientState = selectedBill.state || (selectedBill.calcResult?.isInterState ? "Punjab" : "Himachal Pradesh");
            const patientStateCode = getStateCode(patientState);
            const calcData = calculateGSTInvoice(
              selectedBill.treatments || [],
              selectedBill.discountVal || 0,
              selectedBill.consultancyVal || 0,
              "Himachal Pradesh", 
              patientState, 
              true,
              patientStateCode
            );

            const totalPaid = (selectedBill.cashVal || 0) + (selectedBill.onlineVal || 0);
            const balanceDue = Math.max(0, calcData.grandTotal - totalPaid);
            const isFullyPaid = balanceDue === 0;

            return (
          <div
            className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 relative my-8 text-slate-800 flex flex-col overflow-hidden print:shadow-none print:border-none print:my-0 print:max-w-none print:w-full print:rounded-none print:overflow-visible print:block"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Top Modal Actions Header Bar (Non-printable) */}
            <div className="px-6 py-4 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between gap-3 shrink-0 print:hidden">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-full border flex items-center gap-1.5 ${isFullyPaid ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-amber-600 bg-amber-50 border-amber-200'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> {isFullyPaid ? "Paid Invoice Record" : "Partial / Due Record"}
                </span>
              </div>

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
                  <Trash2 className="w-4 h-4" /> Move to Trash
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
            <div className="p-6 sm:p-8 print:p-0 overflow-y-auto max-h-[75vh] print:max-h-none print:overflow-visible">
              
              <div id="printable-receipt" className="space-y-4 print:space-y-2">

                {/* Header Letterhead */}
                <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4">
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                      Maxxi Pharma Private Limited
                    </h1>
                    <p className="text-xs font-bold text-slate-500 mt-0.5">
                      Pharmaceutical Manufacturing &amp; Healthcare Formulations
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                      Plot No. 45, Industrial Area Phase 1, Near ESI Hospital, Solan, H.P. - 173212
                    </p>
                    <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                      GSTIN/UIN: 02AASCM1970C1ZN | State: Himachal Pradesh, Code: 02
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-2 justify-end flex-wrap">
                      <div className={`text-[11px] font-black px-2.5 py-1 rounded-lg border ${
                        selectedBill.opdSection === "COD SALE" || selectedBill.opdSection === "COD & ONLINE SALE"
                          ? "text-amber-700 bg-amber-50 border-amber-200"
                          : selectedBill.opdSection === "ONLINE SALE"
                          ? "text-indigo-700 bg-indigo-50 border-indigo-200"
                          : selectedBill.opdSection === "SABATHU OPD SALE" || selectedBill.opdSection === "SABATHU OPD SALES"
                          ? "text-teal-700 bg-teal-50 border-teal-200"
                          : "text-emerald-700 bg-emerald-50 border-emerald-200"
                      }`}>
                        {selectedBill.opdSection || "SOLAN OPD SALE"}
                      </div>
                      <div className="text-xs font-black text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg">
                        TOKEN NO: {selectedBill.tokenNo || (selectedBill as any).agentToken || "TK-01"}
                      </div>
                      <div className="text-sm font-black text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-lg">
                        {selectedBill.invoiceNo}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 font-bold mt-1">Date: {formatReceiptDate(selectedBill.date)}</p>
                  </div>
                </div>

                {/* Patient Details */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-semibold text-slate-700">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient Name</span>
                    <strong className="text-slate-900 text-sm font-extrabold">{selectedBill.patientName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient ID / Mobile</span>
                    <span>{selectedBill.patientId}</span>
                    {(selectedBill.whatsappNumber || selectedBill.callingNumber) && selectedBill.whatsappNumber !== selectedBill.patientId && (
                      <span className="block text-[10px] text-slate-500 mt-0.5">{selectedBill.whatsappNumber ? `WA: ${selectedBill.whatsappNumber}` : `Call: ${selectedBill.callingNumber}`}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Gender</span>
                    <span className="capitalize">{selectedBill.gender || "Male"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Next Checkup Date</span>
                    <span className="font-extrabold text-emerald-700">
                      {formatFollowUpDate(selectedBill.nextFollowUpDate)}
                    </span>
                  </div>

                  {/* Customer Address & State Code Row */}
                  <div className="col-span-2 sm:col-span-4 border-t border-slate-200/60 pt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Customer Address</span>
                      <p className="text-slate-800 font-bold text-xs mt-0.5">
                        {selectedBill.address || [selectedBill.houseNumber, selectedBill.city, selectedBill.pincode].filter(Boolean).join(", ") || "Local Address"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">State Code &amp; Place of Supply</span>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-slate-900 font-extrabold">{patientState}</span>
                        {(() => {
                          const isOther = (patientState || "").trim().toLowerCase() === "other";
                          if (!patientStateCode || patientStateCode === "99" || isOther) return null;
                          return (
                            <span className="font-mono text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[11px] font-black">
                              STATE CODE: {patientStateCode}
                            </span>
                          );
                        })()}
                        {calcData.isInterState ? (
                          <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded font-black">IGST (Inter-State)</span>
                        ) : (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-black">CGST + SGST</span>
                        )}
                      </div>
                    </div>
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
                          return (selectedBill.treatments || []).map((t: any, idx: number) => {
                            const products = t.products && t.products.length > 0 
                              ? t.products 
                              : [{}];
                            
                            return products.map((p: any, pIdx: number) => {
                              const medLines = calcData.lines.filter((l: any) => !l.isConsultation);
                              const calcLine = medLines[flatIdx++];
                              if (!calcLine) return null;

                              return (
                                <tr key={`${t.id || idx}-${pIdx}`}>
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
                                  <td className="py-3 px-3 text-right text-slate-500">
                                    ₹{(calcLine.grossAmount * calcLine.taxRate / 100).toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                  </td>
                                  <td className="py-3 px-3 text-right font-extrabold text-slate-800">
                                    ₹{(calcLine.grossAmount + (calcLine.grossAmount * calcLine.taxRate / 100)).toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}
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
                <div className="flex flex-col sm:flex-row justify-between pt-2 gap-4">
                  {/* HSN Summary */}
                  {calcData.hsnSummary && calcData.hsnSummary.length > 0 && (
                    <div className="flex-1 max-w-lg overflow-x-auto border border-slate-200/80 rounded-xl p-2 bg-white">
                      <h4 className="text-[10px] font-extrabold text-slate-500 uppercase mb-2 px-1">HSN/SAC Tax Summary</h4>
                      <table className="w-full text-[10px] text-right">
                        <thead className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100">
                          <tr>
                            <th className="py-1 px-2 text-left">HSN/SAC</th>
                            <th className="py-1 px-2">Taxable Value</th>
                            {calcData.isInterState ? (
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
                          {calcData.hsnSummary.map((hsn: any, idx: number) => (
                            <tr key={idx}>
                              <td className="py-1.5 px-2 text-left font-mono">{hsn.hsn}</td>
                              <td className="py-1.5 px-2">₹{hsn.taxableValue.toLocaleString("en-IN", {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                              {calcData.isInterState ? (
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
                            <td className="py-2 px-2 font-black">₹{calcData.totalTaxableValue.toLocaleString("en-IN", {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                            {calcData.isInterState ? (
                              <>
                                <td className="py-2 px-2 text-center text-slate-400">-</td>
                                <td className="py-2 px-2 font-black">₹{calcData.totalIgst.toLocaleString("en-IN", {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                              </>
                            ) : (
                              <>
                                <td className="py-2 px-2 text-center text-slate-400">-</td>
                                <td className="py-2 px-2 font-black">₹{calcData.totalCgst.toLocaleString("en-IN", {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                                <td className="py-2 px-2 text-center text-slate-400">-</td>
                                <td className="py-2 px-2 font-black">₹{calcData.totalSgst.toLocaleString("en-IN", {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                              </>
                            )}
                            <td className="py-2 px-2 font-black text-slate-900">₹{calcData.totalTax.toLocaleString("en-IN", {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                  <div className="w-full sm:w-72 space-y-1.5 text-[11px] font-semibold text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                    <div className="flex justify-between">
                      <span>Gross Medicines:</span>
                      <span>₹{calcData.grossAmount.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                    {calcData.consultancyCharges > 0 && (
                      <div className="flex justify-between text-slate-700">
                        <span>Consultation Charges:</span>
                        <span>+ ₹{calcData.consultancyCharges.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-slate-200 pt-1.5 mt-1.5 font-bold text-slate-800">
                      <span>{calcData.consultancyCharges > 0 ? "Taxable Value (incl. Consult.):" : "Taxable Value:"}</span>
                      <span>₹{calcData.totalTaxableValue.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                    {calcData.isInterState ? (
                      <div className="flex justify-between text-indigo-600">
                        <span>IGST:</span>
                        <span>₹{calcData.totalIgst.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between text-indigo-600">
                          <span>CGST:</span>
                          <span>₹{calcData.totalCgst.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                        <div className="flex justify-between text-indigo-600">
                          <span>SGST:</span>
                          <span>₹{calcData.totalSgst.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between border-t border-slate-200/80 pt-1 font-bold text-slate-700">
                      <span>Original Bill Total:</span>
                      <span>₹{calcData.originalInvoiceTotal?.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                    {calcData.discountApplied > 0 && (
                      <div className="flex justify-between text-rose-500 font-semibold">
                        <span>Product Discount:</span>
                        <span>- ₹{calcData.discountApplied.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      </div>
                    )}
                    {calcData.roundOff !== 0 && (
                      <div className="flex justify-between text-slate-500">
                        <span>Round Off:</span>
                        <span>{calcData.roundOff > 0 ? "+" : ""} ₹{calcData.roundOff.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      </div>
                    )}
                    <div className="border-t border-slate-300 pt-2 flex justify-between font-extrabold text-[13px] text-slate-900">
                      <span>Final Payable:</span>
                      <span className="text-blue-600 font-black">₹{calcData.grandTotal.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                    <div className="border-t border-slate-200/80 pt-2 mt-2 space-y-1">
                      <div className="flex justify-between text-slate-500">
                        <span>Cash Paid:</span>
                        <span>₹{(selectedBill.cashVal || 0).toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Online / UPI Paid:</span>
                        <span>₹{(selectedBill.onlineVal || 0).toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      </div>
                      <div className="flex justify-between font-bold text-emerald-600 border-t border-slate-200/60 pt-1">
                        <span>Total Paid:</span>
                        <span>₹{totalPaid.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      </div>
                      {balanceDue > 0 && (
                        <div className="flex justify-between font-bold text-amber-600 pt-1">
                          <span>Balance Due:</span>
                          <span>₹{balanceDue.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tax & Total Amount in Words */}
                <div className="bg-slate-50/90 rounded-2xl p-3.5 print:p-2 border border-slate-200/80 space-y-1.5 print:space-y-1 text-xs print:text-[10.5px]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200/60 pb-1.5 print:pb-1">
                    <span className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">
                      Total Invoice Amount (in words):
                    </span>
                    <strong className="text-slate-900 text-xs print:text-[10.5px] sm:text-right font-serif tracking-wide">
                      {numberToIndianWords(calcData.grandTotal || 0, "Rupees", "Only")}
                    </strong>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">
                      Total Tax Amount (in words):
                    </span>
                    <strong className="text-slate-800 text-xs print:text-[10.5px] sm:text-right font-serif tracking-wide">
                      {numberToIndianWords(calcData.totalTax || 0, "Rupees", "Only")}
                    </strong>
                  </div>
                </div>

                {/* Follow-up Note & Signatures */}
                <div className="border-t border-slate-200 pt-3 print:pt-1.5 flex justify-between items-end text-xs">
                  <div>
                    <p className="text-[10px] text-slate-400 mt-2 font-semibold">Thank you! Wish you a healthy speedy recovery.</p>
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
          );
          })()}
        </div>
      )}

      {/* EDIT INVOICE MODAL */}
      {showEditModal && editingBill && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => {
            setShowEditModal(false)
            setEditingBill(null)
          }}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 p-6 sm:p-8 space-y-5 text-slate-800 my-8 max-h-[90vh] overflow-y-auto custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                    Edit Invoice Record
                    <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-lg border border-blue-200 font-mono">
                      {editingBill.invoiceNo}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">Update patient details, payment amounts &amp; notes</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false)
                  setEditingBill(null)
                }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const cash = parseFloat(editingBill.cashVal?.toString() || "0") || 0
                const online = parseFloat(editingBill.onlineVal?.toString() || "0") || 0
                const updated: PaymentRecord = {
                  ...editingBill,
                  cashVal: cash,
                  onlineVal: online,
                  totalPaidVal: cash + online
                }
                handleSaveEditedBill(updated)
              }}
              className="space-y-4 text-xs font-semibold"
            >
              {/* Patient Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Patient Full Name</label>
                  <input
                    type="text"
                    required
                    value={editingBill.patientName}
                    onChange={(e) => setEditingBill({ ...editingBill, patientName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Patient ID / Aadhaar / Mobile</label>
                  <input
                    type="text"
                    value={editingBill.patientId}
                    onChange={(e) => setEditingBill({ ...editingBill, patientId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">OPD Section (Bill Source)</label>
                  <select
                    value={editingBill.opdSection || "SOLAN OPD SALE"}
                    onChange={(e) => setEditingBill({ ...editingBill, opdSection: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="SOLAN OPD SALE">SOLAN OPD SALE</option>
                    <option value="SABATHU OPD SALE">SABATHU OPD SALE</option>
                    <option value="COD SALE">COD SALE</option>
                    <option value="ONLINE SALE">ONLINE SALE</option>
                  </select>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">WhatsApp Number</label>
                  <input
                    type="text"
                    value={editingBill.whatsappNumber || ""}
                    onChange={(e) => setEditingBill({ ...editingBill, whatsappNumber: e.target.value })}
                    placeholder="10-digit mobile"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Calling Number</label>
                  <input
                    type="text"
                    value={editingBill.callingNumber || ""}
                    onChange={(e) => setEditingBill({ ...editingBill, callingNumber: e.target.value })}
                    placeholder="10-digit mobile"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Age &amp; Gender</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={editingBill.age || ""}
                      onChange={(e) => setEditingBill({ ...editingBill, age: e.target.value })}
                      placeholder="Age"
                      className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-800 outline-none focus:border-blue-500"
                    />
                    <select
                      value={editingBill.gender || "Male"}
                      onChange={(e) => setEditingBill({ ...editingBill, gender: e.target.value })}
                      className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-slate-800 outline-none focus:border-blue-500 font-bold"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Payment Breakdown Fields */}
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-3">
                <p className="text-[11px] font-black uppercase text-blue-800 tracking-wider">Payment Breakdown (Split Cash / Online)</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Total Bill Due (₹)</label>
                    <input
                      type="number"
                      value={editingBill.totalDueVal || 0}
                      onChange={(e) => setEditingBill({ ...editingBill, totalDueVal: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Cash Received (₹)</label>
                    <input
                      type="number"
                      value={editingBill.cashVal || 0}
                      onChange={(e) => setEditingBill({ ...editingBill, cashVal: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-emerald-700 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Online / UPI (₹)</label>
                    <input
                      type="number"
                      value={editingBill.onlineVal || 0}
                      onChange={(e) => setEditingBill({ ...editingBill, onlineVal: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-indigo-700 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Clinical Notes & Follow-up */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Next Follow-Up Date</label>
                  <input
                    type="date"
                    value={editingBill.nextFollowUpDate || ""}
                    onChange={(e) => setEditingBill({ ...editingBill, nextFollowUpDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Clinical Symptoms</label>
                  <input
                    type="text"
                    value={editingBill.symptoms || ""}
                    onChange={(e) => setEditingBill({ ...editingBill, symptoms: e.target.value })}
                    placeholder="Patient symptoms..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Notes / Instructions</label>
                <textarea
                  rows={2}
                  value={editingBill.notes || ""}
                  onChange={(e) => setEditingBill({ ...editingBill, notes: e.target.value })}
                  placeholder="Doctor prescription notes..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingBill(null)
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> Save Invoice Changes
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}
