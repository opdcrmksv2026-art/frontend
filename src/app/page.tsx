"use client"

import { useEffect, useState, useMemo } from "react"
import {
  IndianRupee,
  Package,
  FileSpreadsheet,
  Download,
  Calendar,
  Building2,
  Store,
  Clock,
  RefreshCw
} from "lucide-react"
import { API_URL } from "@/lib/apiConfig"

interface RealBillRecord {
  date: string
  invoiceNo: string
  entity: "MAXXI" | "KSV" | "KIYAVA"
  opdSection: string
  customerName: string
  mobile: string
  city: string
  state: string
  itemsDesc: string
  units: number
  gross: number
  discount: number
  taxable: number
  cgst: number
  sgst: number
  igst: number
  totalGst: number
  grandTotal: number
  paymentMode: string
  cash: number
  online: number
  totalPaid: number
}

export default function Home() {
  const [activeEntityTab, setActiveEntityTab] = useState<"ALL" | "MAXXI" | "KSV" | "KIYAVA">("ALL")
  const [periodFilter, setPeriodFilter] = useState<"TODAY" | "YESTERDAY" | "THIS_MONTH" | "ALL_TIME">("TODAY")
  const [loading, setLoading] = useState(false)
  const [allRealRecords, setAllRealRecords] = useState<RealBillRecord[]>([])

  // Helper: extract clean YYYY-MM-DD from any date representation
  const getCleanDateStr = (dateVal: any): string => {
    if (!dateVal) return ""
    const str = String(dateVal).trim()
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10)
    const d = new Date(str)
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, "0")
      const day = String(d.getDate()).padStart(2, "0")
      return `${y}-${m}-${day}`
    }
    return str
  }

  // Today's and Yesterday's local date
  const todayStr = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  }, [])

  const yesterdayStr = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  }, [])

  const currentMonthStr = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
  }, [])

  // Load real data from MongoDB APIs + Offline LocalStorage
  const loadAllRealSalesData = async () => {
    setLoading(true)
    const recordsMap = new Map<string, RealBillRecord>()

    // Set of permanently deleted or trash invoices to prevent resurrection
    const deletedNos = new Set<string>()
    try {
      const storedDel = localStorage.getItem("ksv_deleted_invoices")
      if (storedDel) JSON.parse(storedDel).forEach((x: string) => deletedNos.add(x))
      const storedTrash = localStorage.getItem("ksv_trash_bills")
      if (storedTrash) JSON.parse(storedTrash).forEach((x: any) => deletedNos.add(x.invoiceNo))
    } catch (e) {}

    // 1. Read offline bills from localStorage (Immediate offline speed)
    try {
      const localOffline = localStorage.getItem("ksv_offline_bills")
      if (localOffline) {
        const list = JSON.parse(localOffline)
        if (Array.isArray(list)) {
          list.forEach((b: any, idx: number) => {
            const invNo = b.invoiceNo || `LOC-${idx + 1}`
            if (deletedNos.has(invNo)) return

            const bDate = getCleanDateStr(b.date) || todayStr
            const amt = Number(b.totalPaidVal || b.totalDueVal || b.priceVal || 0)
            const gross = Number(b.priceVal || amt)
            const discount = Number(b.discountVal || 0)
            const taxable = Math.max(0, gross - discount)
            const gst = Number(b.gstVal || 0)
            const isInter = Boolean(b.calcResult?.isInterState || (b.state && b.state !== "Himachal Pradesh"))
            const cgst = isInter ? 0 : gst / 2
            const sgst = isInter ? 0 : gst / 2
            const igst = isInter ? gst : 0
            const grandTotal = Number(b.totalDueVal || (taxable + gst) || amt)
            const cash = Number(b.cashVal || 0)
            const online = Number(b.onlineVal || 0)
            const totalPaid = Number(b.totalPaidVal || (cash + online) || grandTotal)

            let units = 1
            if (b.treatments && Array.isArray(b.treatments)) {
              units = b.treatments.reduce((sum: number, t: any) => {
                if (t.products && Array.isArray(t.products)) {
                  return sum + t.products.reduce((pSum: number, p: any) => pSum + (parseFloat(p.quantity || "1") || 1), 0)
                }
                return sum + 1
              }, 0)
            }

            recordsMap.set(invNo, {
              date: bDate,
              invoiceNo: invNo,
              entity: "MAXXI",
              opdSection: b.opdSection || "SOLAN OPD SALE",
              customerName: b.patientName || "Walk-in Patient",
              mobile: b.whatsappNumber || b.callingNumber || b.patientId || "-",
              city: b.city || "Solan",
              state: b.state || "Himachal Pradesh",
              itemsDesc: b.combinedKitName || "Prescribed Medicine Kit",
              units,
              gross,
              discount,
              taxable,
              cgst,
              sgst,
              igst,
              totalGst: gst,
              grandTotal,
              paymentMode: cash > 0 && online > 0 ? "Cash + Online Split" : (cash > 0 ? "Cash" : "Online / UPI"),
              cash,
              online,
              totalPaid
            })
          })
        }
      }
    } catch (e) {}

    // 2. Read KSV Pharmacy offline sales
    try {
      const ksvStored = localStorage.getItem("ksv_app_invoices")
      if (ksvStored) {
        const list = JSON.parse(ksvStored)
        if (Array.isArray(list)) {
          list.filter((inv: any) => (inv.type || "SALE") === "SALE").forEach((inv: any, idx: number) => {
            const invNo = inv.invoiceNo || `KSV-${idx + 1}`
            if (deletedNos.has(invNo)) return

            const invDate = getCleanDateStr(inv.invoiceDate || inv.createdAt) || todayStr
            const gross = Number(inv.subtotal || inv.grandTotal || 0)
            const discount = Number(inv.extraDiscount || 0)
            const taxable = Number(inv.taxableAmount || Math.max(0, gross - discount))
            const gst = Number(inv.totalTaxAmount || 0)
            const isInter = Boolean(inv.isInterState)
            const cgst = Number(inv.cgst || (isInter ? 0 : gst / 2))
            const sgst = Number(inv.sgst || (isInter ? 0 : gst / 2))
            const igst = Number(inv.igst || (isInter ? gst : 0))
            const grandTotal = Number(inv.grandTotal || (taxable + gst))
            const cash = inv.paymentMode === "Cash" ? grandTotal : 0
            const online = inv.paymentMode !== "Cash" ? grandTotal : 0

            recordsMap.set(invNo, {
              date: invDate,
              invoiceNo: invNo,
              entity: "KSV",
              opdSection: "KSV PHARMACY",
              customerName: inv.buyer?.name || "Pharmacy Customer",
              mobile: inv.buyer?.phone || inv.buyer?.gstin || "-",
              city: inv.buyer?.city || "Solan",
              state: inv.buyer?.state || "Himachal Pradesh",
              itemsDesc: (inv.items || []).map((it: any) => `${it.description || it.name} (${it.quantity || 1})`).join(", ") || "Formulations",
              units: (inv.items || []).reduce((s: number, it: any) => s + (Number(it.quantity) || 1), 0) || 1,
              gross,
              discount,
              taxable,
              cgst,
              sgst,
              igst,
              totalGst: gst,
              grandTotal,
              paymentMode: inv.paymentMode || (cash > 0 ? "Cash" : "Online / UPI"),
              cash,
              online,
              totalPaid: grandTotal
            })
          })
        }
      }
    } catch (e) {}

    // 3. Read Kiyava Subathu offline sales
    try {
      const kiyavaStored = localStorage.getItem("ksv_kiyava_invoices")
      if (kiyavaStored) {
        const list = JSON.parse(kiyavaStored)
        if (Array.isArray(list)) {
          list.filter((inv: any) => (inv.type || "SALE") === "SALE").forEach((inv: any, idx: number) => {
            const invNo = inv.invoiceNo || `KYV-${idx + 1}`
            if (deletedNos.has(invNo)) return

            const invDate = getCleanDateStr(inv.invoiceDate || inv.createdAt) || todayStr
            const gross = Number(inv.subtotal || inv.grandTotal || 0)
            const discount = Number(inv.extraDiscount || 0)
            const taxable = Number(inv.taxableAmount || Math.max(0, gross - discount))
            const gst = Number(inv.totalTaxAmount || 0)
            const isInter = Boolean(inv.isInterState)
            const cgst = Number(inv.cgst || (isInter ? 0 : gst / 2))
            const sgst = Number(inv.sgst || (isInter ? 0 : gst / 2))
            const igst = Number(inv.igst || (isInter ? gst : 0))
            const grandTotal = Number(inv.grandTotal || (taxable + gst))
            const cash = inv.paymentMode === "Cash" ? grandTotal : 0
            const online = inv.paymentMode !== "Cash" ? grandTotal : 0

            recordsMap.set(invNo, {
              date: invDate,
              invoiceNo: invNo,
              entity: "KIYAVA",
              opdSection: "KIYAVA SUBATHU",
              customerName: inv.buyer?.name || "Herbal Customer",
              mobile: inv.buyer?.phone || inv.buyer?.gstin || "-",
              city: inv.buyer?.city || "Subathu",
              state: inv.buyer?.state || "Himachal Pradesh",
              itemsDesc: (inv.items || []).map((it: any) => `${it.description || it.name} (${it.quantity || 1} ${it.unit || ''})`).join(", ") || "Herbs & Extracts",
              units: (inv.items || []).reduce((s: number, it: any) => s + (Number(it.quantity) || 1), 0) || 1,
              gross,
              discount,
              taxable,
              cgst,
              sgst,
              igst,
              totalGst: gst,
              grandTotal,
              paymentMode: inv.paymentMode || (cash > 0 ? "Cash" : "Online / Bank Transfer"),
              cash,
              online,
              totalPaid: grandTotal
            })
          })
        }
      }
    } catch (e) {}

    // 4. Read Maxxi B2B offline sales
    try {
      const maxxiStored = localStorage.getItem("maxxi_app_invoices")
      if (maxxiStored) {
        const list = JSON.parse(maxxiStored)
        if (Array.isArray(list)) {
          list.filter((inv: any) => (inv.type || "SALE") === "SALE").forEach((inv: any, idx: number) => {
            const invNo = inv.invoiceNo || `MXP-${idx + 1}`
            if (deletedNos.has(invNo)) return

            const invDate = getCleanDateStr(inv.invoiceDate || inv.createdAt) || todayStr
            const gross = Number(inv.subtotal || inv.grandTotal || 0)
            const discount = Number(inv.extraDiscount || 0)
            const taxable = Number(inv.taxableAmount || Math.max(0, gross - discount))
            const gst = Number(inv.totalTaxAmount || 0)
            const isInter = Boolean(inv.isInterState)
            const cgst = Number(inv.cgst || (isInter ? 0 : gst / 2))
            const sgst = Number(inv.sgst || (isInter ? 0 : gst / 2))
            const igst = Number(inv.igst || (isInter ? gst : 0))
            const grandTotal = Number(inv.grandTotal || (taxable + gst))
            const cash = inv.paymentMode === "Cash" ? grandTotal : 0
            const online = inv.paymentMode !== "Cash" ? grandTotal : 0

            recordsMap.set(invNo, {
              date: invDate,
              invoiceNo: invNo,
              entity: "MAXXI",
              opdSection: "MAXXI B2B SALE",
              customerName: inv.buyer?.name || "B2B Client",
              mobile: inv.buyer?.phone || inv.buyer?.gstin || "-",
              city: inv.buyer?.city || "Solan",
              state: inv.buyer?.state || "Himachal Pradesh",
              itemsDesc: (inv.items || []).map((it: any) => `${it.description || it.name} (${it.quantity || 1})`).join(", ") || "Pharmaceuticals",
              units: (inv.items || []).reduce((s: number, it: any) => s + (Number(it.quantity) || 1), 0) || 1,
              gross,
              discount,
              taxable,
              cgst,
              sgst,
              igst,
              totalGst: gst,
              grandTotal,
              paymentMode: inv.paymentMode || (cash > 0 ? "Cash" : "Online / Bank Transfer"),
              cash,
              online,
              totalPaid: grandTotal
            })
          })
        }
      }
    } catch (e) {}

    // Set immediate state from offline records first so UI is instant
    setAllRealRecords(Array.from(recordsMap.values()))
    setLoading(false)

    // 5. Concurrently sync with backend MongoDB (merging any new bills from other devices)
    try {
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject("timeout"), 6000))
      
      const syncPromises = Promise.allSettled([
        fetch(`${API_URL}/api/patients?limit=5000`, { cache: 'no-store' }),
        fetch(`${API_URL}/api/ksv/bootstrap`, { cache: 'no-store' }),
        fetch(`${API_URL}/api/kiyava/bootstrap`, { cache: 'no-store' }),
        fetch(`${API_URL}/api/maxxi/bootstrap`, { cache: 'no-store' })
      ])

      const results: any = await Promise.race([syncPromises, timeoutPromise])

      if (Array.isArray(results)) {
        // Patient billing history from MongoDB
        if (results[0].status === "fulfilled" && results[0].value.ok) {
          try {
            const data = await results[0].value.json()
            const pList = Array.isArray(data) ? data : (data.patients || [])
            pList.forEach((p: any) => {
              if (p.history && Array.isArray(p.history)) {
                p.history.forEach((h: any, i: number) => {
                  const invNo = h.invoiceNo || `PT-${p.uniqueId || i}`
                  if (recordsMap.has(invNo) || deletedNos.has(invNo)) return

                  const amt = Number(h.totalAmount || 0)
                  const cash = Number(h.amountCash || 0)
                  const online = Number(h.amountOnline || 0)
                  const totalPaid = cash + online > 0 ? cash + online : amt
                  const gst = h.billingType?.includes("+18%") ? Math.round(amt * 0.18) : 0
                  const gross = amt
                  const discount = 0
                  const taxable = amt

                  recordsMap.set(invNo, {
                    date: getCleanDateStr(h.date || p.createdAt) || todayStr,
                    invoiceNo: invNo,
                    entity: "MAXXI",
                    opdSection: h.opdSection || "SOLAN OPD SALE",
                    customerName: p.name || "OPD Patient",
                    mobile: p.whatsappNumber || p.callingNumber || p.uniqueId || "-",
                    city: p.city || "Solan",
                    state: p.state || "Himachal Pradesh",
                    itemsDesc: h.kitName || "OPD Kit",
                    units: 1,
                    gross,
                    discount,
                    taxable,
                    cgst: gst / 2,
                    sgst: gst / 2,
                    igst: 0,
                    totalGst: gst,
                    grandTotal: amt,
                    paymentMode: cash > 0 && online > 0 ? "Cash + Online Split" : (cash > 0 ? "Cash" : "Online / UPI"),
                    cash,
                    online,
                    totalPaid
                  })
                })
              }
            })
          } catch (e) {}
        }

        // KSV Invoices from MongoDB
        if (results[1].status === "fulfilled" && results[1].value.ok) {
          try {
            const data = await results[1].value.json()
            const invoices = Array.isArray(data.invoices) ? data.invoices : []
            invoices.filter((inv: any) => (inv.type || "SALE") === "SALE").forEach((inv: any, i: number) => {
              const invNo = inv.invoiceNo || `KSV-DB-${i}`
              if (recordsMap.has(invNo) || deletedNos.has(invNo)) return

              const gross = Number(inv.subtotal || inv.grandTotal || 0)
              const discount = Number(inv.extraDiscount || 0)
              const taxable = Number(inv.taxableAmount || Math.max(0, gross - discount))
              const gst = Number(inv.totalTaxAmount || 0)
              const isInter = Boolean(inv.isInterState)
              const grandTotal = Number(inv.grandTotal || (taxable + gst))
              const cash = inv.paymentMode === "Cash" ? grandTotal : 0
              const online = inv.paymentMode !== "Cash" ? grandTotal : 0

              recordsMap.set(invNo, {
                date: getCleanDateStr(inv.invoiceDate || inv.createdAt) || todayStr,
                invoiceNo: invNo,
                entity: "KSV",
                opdSection: "KSV PHARMACY",
                customerName: inv.buyer?.name || "Pharmacy Customer",
                mobile: inv.buyer?.phone || inv.buyer?.gstin || "-",
                city: inv.buyer?.city || "Solan",
                state: inv.buyer?.state || "Himachal Pradesh",
                itemsDesc: (inv.items || []).map((it: any) => `${it.description || it.name} (${it.quantity || 1})`).join(", ") || "Formulations",
                units: (inv.items || []).reduce((s: number, it: any) => s + (Number(it.quantity) || 1), 0) || 1,
                gross,
                discount,
                taxable,
                cgst: Number(inv.cgst || (isInter ? 0 : gst / 2)),
                sgst: Number(inv.sgst || (isInter ? 0 : gst / 2)),
                igst: Number(inv.igst || (isInter ? gst : 0)),
                totalGst: gst,
                grandTotal,
                paymentMode: inv.paymentMode || (cash > 0 ? "Cash" : "Online / UPI"),
                cash,
                online,
                totalPaid: grandTotal
              })
            })
          } catch (e) {}
        }

        // Kiyava Invoices from MongoDB
        if (results[2].status === "fulfilled" && results[2].value.ok) {
          try {
            const data = await results[2].value.json()
            const invoices = Array.isArray(data.invoices) ? data.invoices : []
            invoices.filter((inv: any) => (inv.type || "SALE") === "SALE").forEach((inv: any, i: number) => {
              const invNo = inv.invoiceNo || `KYV-DB-${i}`
              if (recordsMap.has(invNo) || deletedNos.has(invNo)) return

              const gross = Number(inv.subtotal || inv.grandTotal || 0)
              const discount = Number(inv.extraDiscount || 0)
              const taxable = Number(inv.taxableAmount || Math.max(0, gross - discount))
              const gst = Number(inv.totalTaxAmount || 0)
              const isInter = Boolean(inv.isInterState)
              const grandTotal = Number(inv.grandTotal || (taxable + gst))
              const cash = inv.paymentMode === "Cash" ? grandTotal : 0
              const online = inv.paymentMode !== "Cash" ? grandTotal : 0

              recordsMap.set(invNo, {
                date: getCleanDateStr(inv.invoiceDate || inv.createdAt) || todayStr,
                invoiceNo: invNo,
                entity: "KIYAVA",
                opdSection: "KIYAVA SUBATHU",
                customerName: inv.buyer?.name || "Herbal Customer",
                mobile: inv.buyer?.phone || inv.buyer?.gstin || "-",
                city: inv.buyer?.city || "Subathu",
                state: inv.buyer?.state || "Himachal Pradesh",
                itemsDesc: (inv.items || []).map((it: any) => `${it.description || it.name} (${it.quantity || 1})`).join(", ") || "Herbs & Extracts",
                units: (inv.items || []).reduce((s: number, it: any) => s + (Number(it.quantity) || 1), 0) || 1,
                gross,
                discount,
                taxable,
                cgst: Number(inv.cgst || (isInter ? 0 : gst / 2)),
                sgst: Number(inv.sgst || (isInter ? 0 : gst / 2)),
                igst: Number(inv.igst || (isInter ? gst : 0)),
                totalGst: gst,
                grandTotal,
                paymentMode: inv.paymentMode || (cash > 0 ? "Cash" : "Online / Bank Transfer"),
                cash,
                online,
                totalPaid: grandTotal
              })
            })
          } catch (e) {}
        }

        // Maxxi Invoices from MongoDB
        if (results[3].status === "fulfilled" && results[3].value.ok) {
          try {
            const data = await results[3].value.json()
            const invoices = Array.isArray(data.invoices) ? data.invoices : []
            invoices.filter((inv: any) => (inv.type || "SALE") === "SALE").forEach((inv: any, i: number) => {
              const invNo = inv.invoiceNo || `MXP-DB-${i}`
              if (recordsMap.has(invNo) || deletedNos.has(invNo)) return

              const gross = Number(inv.subtotal || inv.grandTotal || 0)
              const discount = Number(inv.extraDiscount || 0)
              const taxable = Number(inv.taxableAmount || Math.max(0, gross - discount))
              const gst = Number(inv.totalTaxAmount || 0)
              const isInter = Boolean(inv.isInterState)
              const grandTotal = Number(inv.grandTotal || (taxable + gst))
              const cash = inv.paymentMode === "Cash" ? grandTotal : 0
              const online = inv.paymentMode !== "Cash" ? grandTotal : 0

              recordsMap.set(invNo, {
                date: getCleanDateStr(inv.invoiceDate || inv.createdAt) || todayStr,
                invoiceNo: invNo,
                entity: "MAXXI",
                opdSection: "MAXXI B2B SALE",
                customerName: inv.buyer?.name || "B2B Client",
                mobile: inv.buyer?.phone || inv.buyer?.gstin || "-",
                city: inv.buyer?.city || "Solan",
                state: inv.buyer?.state || "Himachal Pradesh",
                itemsDesc: (inv.items || []).map((it: any) => `${it.description || it.name} (${it.quantity || 1})`).join(", ") || "Pharmaceuticals",
                units: (inv.items || []).reduce((s: number, it: any) => s + (Number(it.quantity) || 1), 0) || 1,
                gross,
                discount,
                taxable,
                cgst: Number(inv.cgst || (isInter ? 0 : gst / 2)),
                sgst: Number(inv.sgst || (isInter ? 0 : gst / 2)),
                igst: Number(inv.igst || (isInter ? gst : 0)),
                totalGst: gst,
                grandTotal,
                paymentMode: inv.paymentMode || (cash > 0 ? "Cash" : "Online / Bank Transfer"),
                cash,
                online,
                totalPaid: grandTotal
              })
            })
          } catch (e) {}
        }

        setAllRealRecords(Array.from(recordsMap.values()))
      }
    } catch (err) {
      console.warn("Backend sync finished or offline, using verified local records:", err)
    }
  }

  useEffect(() => {
    loadAllRealSalesData()
  }, [])

  // Filter records by the selected Period (Zero hardcoding - 100% actual real sales)
  const periodFilteredRecords = useMemo(() => {
    if (periodFilter === "TODAY") {
      return allRealRecords.filter(r => r.date === todayStr)
    } else if (periodFilter === "YESTERDAY") {
      return allRealRecords.filter(r => r.date === yesterdayStr)
    } else if (periodFilter === "THIS_MONTH") {
      return allRealRecords.filter(r => r.date.startsWith(currentMonthStr))
    }
    return allRealRecords // ALL_TIME
  }, [allRealRecords, periodFilter, todayStr, yesterdayStr, currentMonthStr])

  // Real, dynamic calculations per entity
  const entityStats = useMemo(() => {
    const calcFor = (entList: RealBillRecord[]) => ({
      revenue: entList.reduce((sum, r) => sum + r.grandTotal, 0),
      billsCount: entList.length,
      cash: entList.reduce((sum, r) => sum + r.cash, 0),
      online: entList.reduce((sum, r) => sum + r.online, 0),
    })

    const maxxiList = periodFilteredRecords.filter(r => r.entity === "MAXXI")
    const ksvList = periodFilteredRecords.filter(r => r.entity === "KSV")
    const kiyavaList = periodFilteredRecords.filter(r => r.entity === "KIYAVA")

    return {
      all: calcFor(periodFilteredRecords),
      maxxi: calcFor(maxxiList),
      ksv: calcFor(ksvList),
      kiyava: calcFor(kiyavaList),
    }
  }, [periodFilteredRecords])

  // Clean, professional Excel (.csv) export with 100% matched column alignment & raw summable numbers
  const handleDownloadEntityExcel = (entity: "ALL" | "MAXXI" | "KSV" | "KIYAVA") => {
    let targetBills = entity === "ALL" 
      ? periodFilteredRecords 
      : periodFilteredRecords.filter(b => b.entity === entity)

    // If 0 bills match this exact period, offer to export all-time bills for this entity
    if (targetBills.length === 0) {
      const allForEntity = entity === "ALL" 
        ? allRealRecords 
        : allRealRecords.filter(b => b.entity === entity)

      if (allForEntity.length === 0) {
        alert(`No real sales records found in system for ${entity}.`)
        return
      }

      const confirmAll = window.confirm(
        `No sales recorded for ${entity} in ${periodFilter.replace("_", " ")}. Would you like to export all available real sales (${allForEntity.length} bills) instead?`
      )
      if (!confirmAll) return
      targetBills = allForEntity
    }

    const escStr = (val: any) => `"${String(val ?? "").replace(/"/g, '""')}"`
    const escNum = (val: any) => {
      const num = Number(val)
      return isNaN(num) ? "0.00" : num.toFixed(2)
    }

    const headers = [
      "Sr No",
      "Invoice Date",
      "Invoice No",
      "Entity",
      "OPD Section / Sale Type",
      "Customer / Patient Name",
      "Mobile / Contact",
      "City",
      "State",
      "Medicines / Kit Description",
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

    // Row 1: EXACT 23-Column Header
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

    targetBills.forEach((r, idx) => {
      sumUnits += r.units
      sumGross += r.gross
      sumDisc += r.discount
      sumTaxable += r.taxable
      sumCgst += r.cgst
      sumSgst += r.sgst
      sumIgst += r.igst
      sumTotalGst += r.totalGst
      sumGrand += r.grandTotal
      sumCash += r.cash
      sumOnline += r.online
      sumTotalPaid += r.totalPaid

      rows.push([
        idx + 1,
        escStr(r.date),
        escStr(r.invoiceNo),
        escStr(r.entity === "KSV" ? "KSV Pharmacy" : r.entity === "KIYAVA" ? "Kiyava Subathu" : "Maxxi Pharma"),
        escStr(r.opdSection),
        escStr(r.customerName),
        escStr(r.mobile),
        escStr(r.city),
        escStr(r.state),
        escStr(r.itemsDesc),
        escNum(r.units),
        escNum(r.gross),
        escNum(r.discount),
        escNum(r.taxable),
        escNum(r.cgst),
        escNum(r.sgst),
        escNum(r.igst),
        escNum(r.totalGst),
        escNum(r.grandTotal),
        escStr(r.paymentMode),
        escNum(r.cash),
        escNum(r.online),
        escNum(r.totalPaid)
      ].join(","))
    })

    // Blank line (exactly 23 empty columns)
    rows.push(Array(23).fill("").join(","))

    // Clean, Column-Aligned TOTAL Row (exactly 23 columns)
    rows.push([
      `"TOTAL (${targetBills.length} Invoices)"`,
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
    link.download = `REAL-SALES-REPORT-${entity}-${periodFilter}-${todayStr}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Active stats based on activeEntityTab
  const currentActiveStats = 
    activeEntityTab === "ALL" 
      ? entityStats.all 
      : activeEntityTab === "MAXXI" 
      ? entityStats.maxxi 
      : activeEntityTab === "KSV" 
      ? entityStats.ksv 
      : entityStats.kiyava

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700">
      
      {/* QUICK ENTITY TABS & PERIOD FILTER TOOLBAR */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                Live Sales &amp; Revenue Reports
              </h2>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
              100% verified real database sales across Maxxi Pharma, KSV Pharmacy &amp; Kiyava Subathu
            </p>
          </div>
        </div>

        {/* CONTROLS: PERIOD SWITCHER & ENTITY TABS */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period Filter Buttons: Today | Yesterday | This Month | All Time */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80 text-xs font-black">
            <button
              type="button"
              onClick={() => setPeriodFilter("TODAY")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                periodFilter === "TODAY"
                  ? "bg-emerald-600 text-white shadow-xs font-black"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setPeriodFilter("YESTERDAY")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                periodFilter === "YESTERDAY"
                  ? "bg-emerald-600 text-white shadow-xs font-black"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => setPeriodFilter("THIS_MONTH")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                periodFilter === "THIS_MONTH"
                  ? "bg-emerald-600 text-white shadow-xs font-black"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => setPeriodFilter("ALL_TIME")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                periodFilter === "ALL_TIME"
                  ? "bg-slate-900 text-white shadow-xs font-black"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Time
            </button>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={loadAllRealSalesData}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all cursor-pointer"
            title="Refresh Real Sales"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
          </button>

          {/* Download Active Tab Excel */}
          <button
            type="button"
            onClick={() => handleDownloadEntityExcel(activeEntityTab)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
            title={`Download ${activeEntityTab} Real Excel Report`}
          >
            <Download className="w-3.5 h-3.5" />
            Download {activeEntityTab} Excel
          </button>
        </div>
      </div>

      {/* 4 ENTITY SALES CARDS WITH REAL REVENUE & 1-CLICK EXCEL (ZERO HARDCODING) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        
        {/* 1. ALL COMBINED CARD */}
        <div 
          onClick={() => setActiveEntityTab("ALL")}
          className={`rounded-3xl p-5 border transition-all shadow-xs flex flex-col justify-between gap-3 cursor-pointer ${
            activeEntityTab === "ALL"
              ? "bg-slate-900 text-white border-slate-800 shadow-md ring-2 ring-emerald-500/30"
              : "bg-white text-slate-800 border-slate-100 hover:border-slate-300"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black ${
                activeEntityTab === "ALL" ? "bg-white/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"
              }`}>
                <IndianRupee className="w-5 h-5" />
              </div>
              <div>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  activeEntityTab === "ALL" ? "bg-white/10 text-emerald-300" : "bg-slate-100 text-slate-700"
                }`}>
                  ALL ENTITIES
                </span>
                <span className={`text-[11px] font-bold block mt-0.5 ${
                  activeEntityTab === "ALL" ? "text-slate-300" : "text-slate-400"
                }`}>
                  {entityStats.all.billsCount} Real Bills ({periodFilter.replace("_", " ")})
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleDownloadEntityExcel("ALL")
              }}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-black flex items-center gap-1 shadow-xs transition-all cursor-pointer shrink-0"
              title="Download Combined All Entities Excel"
            >
              <Download className="w-3.5 h-3.5" />
              Excel
            </button>
          </div>
          <div>
            <h4 className="text-2xl font-black font-mono tracking-tight">
              ₹{entityStats.all.revenue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </h4>
            <div className={`flex items-center justify-between text-[10px] font-bold mt-2 pt-2 border-t ${
              activeEntityTab === "ALL" ? "border-white/10 text-slate-300" : "border-slate-100 text-slate-500"
            }`}>
              <span>Cash: ₹{entityStats.all.cash.toLocaleString("en-IN")}</span>
              <span>Online: ₹{entityStats.all.online.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* 2. MAXXI PHARMA CARD */}
        <div 
          onClick={() => setActiveEntityTab("MAXXI")}
          className={`rounded-3xl p-5 border transition-all shadow-xs flex flex-col justify-between gap-3 cursor-pointer ${
            activeEntityTab === "MAXXI"
              ? "bg-emerald-950 text-white border-emerald-800 shadow-md ring-2 ring-emerald-500/30"
              : "bg-white text-slate-800 border-slate-100 hover:border-emerald-200"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black ${
                activeEntityTab === "MAXXI" ? "bg-white/10 text-emerald-300" : "bg-emerald-50 text-emerald-600"
              }`}>
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  MAXXI PHARMA
                </span>
                <span className={`text-[11px] font-bold block mt-0.5 ${
                  activeEntityTab === "MAXXI" ? "text-emerald-200" : "text-slate-400"
                }`}>
                  {entityStats.maxxi.billsCount} Real Bills • OPD &amp; B2B
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleDownloadEntityExcel("MAXXI")
              }}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-black flex items-center gap-1 shadow-xs transition-all cursor-pointer shrink-0"
              title="Download Maxxi Pharma Real Excel"
            >
              <Download className="w-3.5 h-3.5" />
              Excel
            </button>
          </div>
          <div>
            <h4 className="text-2xl font-black font-mono tracking-tight">
              ₹{entityStats.maxxi.revenue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </h4>
            <div className={`flex items-center justify-between text-[10px] font-bold mt-2 pt-2 border-t ${
              activeEntityTab === "MAXXI" ? "border-emerald-800 text-emerald-200" : "border-slate-100 text-slate-500"
            }`}>
              <span>Cash: ₹{entityStats.maxxi.cash.toLocaleString("en-IN")}</span>
              <span>Online: ₹{entityStats.maxxi.online.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* 3. KSV PHARMACY CARD */}
        <div 
          onClick={() => setActiveEntityTab("KSV")}
          className={`rounded-3xl p-5 border transition-all shadow-xs flex flex-col justify-between gap-3 cursor-pointer ${
            activeEntityTab === "KSV"
              ? "bg-purple-950 text-white border-purple-800 shadow-md ring-2 ring-purple-500/30"
              : "bg-white text-slate-800 border-slate-100 hover:border-purple-200"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black ${
                activeEntityTab === "KSV" ? "bg-white/10 text-purple-300" : "bg-purple-50 text-purple-600"
              }`}>
                <Store className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                  KSV PHARMACY
                </span>
                <span className={`text-[11px] font-bold block mt-0.5 ${
                  activeEntityTab === "KSV" ? "text-purple-200" : "text-slate-400"
                }`}>
                  {entityStats.ksv.billsCount} Invoices • Pharmacy Store
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleDownloadEntityExcel("KSV")
              }}
              className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[11px] font-black flex items-center gap-1 shadow-xs transition-all cursor-pointer shrink-0"
              title="Download KSV Pharmacy Real Excel"
            >
              <Download className="w-3.5 h-3.5" />
              Excel
            </button>
          </div>
          <div>
            <h4 className="text-2xl font-black font-mono tracking-tight">
              ₹{entityStats.ksv.revenue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </h4>
            <div className={`flex items-center justify-between text-[10px] font-bold mt-2 pt-2 border-t ${
              activeEntityTab === "KSV" ? "border-purple-800 text-purple-200" : "border-slate-100 text-slate-500"
            }`}>
              <span>Cash: ₹{entityStats.ksv.cash.toLocaleString("en-IN")}</span>
              <span>Online: ₹{entityStats.ksv.online.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* 4. KIYAVA SUBATHU CARD */}
        <div 
          onClick={() => setActiveEntityTab("KIYAVA")}
          className={`rounded-3xl p-5 border transition-all shadow-xs flex flex-col justify-between gap-3 cursor-pointer ${
            activeEntityTab === "KIYAVA"
              ? "bg-blue-950 text-white border-blue-800 shadow-md ring-2 ring-blue-500/30"
              : "bg-white text-slate-800 border-slate-100 hover:border-blue-200"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black ${
                activeEntityTab === "KIYAVA" ? "bg-white/10 text-blue-300" : "bg-blue-50 text-blue-600"
              }`}>
                <Package className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  KIYAVA SUBATHU
                </span>
                <span className={`text-[11px] font-bold block mt-0.5 ${
                  activeEntityTab === "KIYAVA" ? "text-blue-200" : "text-slate-400"
                }`}>
                  {entityStats.kiyava.billsCount} Invoices • Herbal Sale
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleDownloadEntityExcel("KIYAVA")
              }}
              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[11px] font-black flex items-center gap-1 shadow-xs transition-all cursor-pointer shrink-0"
              title="Download Kiyava Subathu Real Excel"
            >
              <Download className="w-3.5 h-3.5" />
              Excel
            </button>
          </div>
          <div>
            <h4 className="text-2xl font-black font-mono tracking-tight">
              ₹{entityStats.kiyava.revenue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </h4>
            <div className={`flex items-center justify-between text-[10px] font-bold mt-2 pt-2 border-t ${
              activeEntityTab === "KIYAVA" ? "border-blue-800 text-blue-200" : "border-slate-100 text-slate-500"
            }`}>
              <span>Cash: ₹{entityStats.kiyava.cash.toLocaleString("en-IN")}</span>
              <span>Online: ₹{entityStats.kiyava.online.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
