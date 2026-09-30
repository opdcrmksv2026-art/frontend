"use client"

import React, { useState, useEffect, useRef } from 'react'
import {
  CompanyProfile,
  PartyProfile,
  CatalogItem,
  InvoiceItemRow,
  HsnSummaryRow,
  KiyavaInvoice
} from '@/types/kiyavaBilling'
import { numberToIndianWords } from '@/lib/tallyNumberToWords'
import {
  Plus,
  Trash2,
  Building2,
  Users,
  Printer,
  Save,
  RotateCcw,
  Package,
  Calendar,
  Truck,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react'

interface KiyavaInvoiceFormProps {
  companies: CompanyProfile[]
  parties: PartyProfile[]
  catalog: CatalogItem[]
  onSaveInvoice: (invoice: KiyavaInvoice, shouldPrint?: boolean) => void
  onOpenCompanyModal: () => void
  onOpenPartyModal: () => void
  onOpenCatalogModal: () => void
  onSaveParty?: (party: PartyProfile) => void
  initialInvoice?: KiyavaInvoice | null
  onCancel?: () => void
  defaultInvoiceType?: 'SALE' | 'PURCHASE'
}

export default function KiyavaInvoiceForm({
  companies,
  parties,
  catalog,
  onSaveInvoice,
  onOpenCompanyModal,
  onOpenPartyModal,
  onOpenCatalogModal,
  onSaveParty,
  initialInvoice,
  onCancel,
  defaultInvoiceType
}: KiyavaInvoiceFormProps) {
  // 1. Company / Seller
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    initialInvoice?.company.id || companies.find((c) => c.isDefault)?.id || companies[0]?.id || ''
  )

  // 2. Buyer / Party
  const [selectedPartyId, setSelectedPartyId] = useState<string>(
    initialInvoice?.buyer.id || parties[0]?.id || ''
  )
  const [partySearchQuery, setPartySearchQuery] = useState('')
  const [isPartySearchOpen, setIsPartySearchOpen] = useState(false)
  const [patientResults, setPatientResults] = useState<any[]>([])
  const partySearchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchPatients = async () => {
      if (!partySearchQuery || partySearchQuery.length < 2) {
        setPatientResults([])
        return
      }
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
        const res = await fetch(`${API_URL}/api/patients`)
        if (res.ok) {
          const data = await res.json()
          const matched = data.filter((p: any) => 
            p.name.toLowerCase().includes(partySearchQuery.toLowerCase()) || 
            (p.whatsappNumber && p.whatsappNumber.includes(partySearchQuery)) ||
            (p.uniqueId && p.uniqueId.includes(partySearchQuery))
          )
          setPatientResults(matched)
        }
      } catch (err) {
        console.error("Failed to fetch patients", err)
      }
    }
    const delay = setTimeout(fetchPatients, 300)
    return () => clearTimeout(delay)
  }, [partySearchQuery])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (partySearchRef.current && !partySearchRef.current.contains(event.target as Node)) {
        setIsPartySearchOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // 3. Invoice Header
  const [invoiceNo, setInvoiceNo] = useState<string>(
    initialInvoice?.invoiceNo || `${Math.floor(10 + Math.random() * 90)}`
  )
  const [refNo, setRefNo] = useState<string>(initialInvoice?.refNo || '')
  const [invoiceDate, setInvoiceDate] = useState<string>(
    initialInvoice?.invoiceDate || new Date().toISOString().split('T')[0]
  )
  const [eWayBillNo, setEWayBillNo] = useState<string>(initialInvoice?.eWayBillNo || '')
  const [transport, setTransport] = useState<string>(initialInvoice?.transport || 'Direct')
  const [vehicleNo, setVehicleNo] = useState<string>(initialInvoice?.vehicleNo || '')
  const [station, setStation] = useState<string>(initialInvoice?.station || '')
  const [paymentTerms, setPaymentTerms] = useState<string>(initialInvoice?.paymentTerms || 'Bank Transfer / Cash')
  const [totalBags, setTotalBags] = useState<string>(initialInvoice?.totalBags || '')
  const [reverseCharge, setReverseCharge] = useState<'N' | 'Y'>(initialInvoice?.reverseCharge || 'N')
  const [invoiceType, setInvoiceType] = useState<'SALE' | 'PURCHASE'>(initialInvoice?.type || defaultInvoiceType || 'SALE')

  // 4. Line Items Grid (Starts clean with 1 clean item row, no dummy data!)
  const [items, setItems] = useState<InvoiceItemRow[]>(
    initialInvoice?.items && initialInvoice.items.length > 0
      ? initialInvoice.items
      : [
          {
            id: '1',
            description: '',
            hsnSac: '12119011',
            quantity: 1,
            unit: 'kg',
            rate: 0,
            taxRate: 5,
            discountPercent: 0,
            amount: 0
          }
        ]
  )

  // 5. Adjustments
  const [freightCharges, setFreightCharges] = useState<number>(initialInvoice?.freightCharges || 0)
  const [extraDiscount, setExtraDiscount] = useState<number>(initialInvoice?.extraDiscount || 0)
  const [notes, setNotes] = useState<string>(initialInvoice?.notes || '')
  const [disease, setDisease] = useState<string>(initialInvoice?.disease || '')
  const [taxMode, setTaxMode] = useState<'AUTO' | 'INTRA' | 'INTER'>('AUTO')

  // Active Company & Party
  const currentCompany = companies.find((c) => c.id === selectedCompanyId) || companies[0]
  const currentBuyer = parties.find((p) => p.id === selectedPartyId) || parties[0]

  // Inter-state detection
  const isInterState =
    taxMode === 'INTER'
      ? true
      : taxMode === 'INTRA'
      ? false
      : currentCompany && currentBuyer
      ? currentCompany.stateCode !== currentBuyer.stateCode
      : false

  // Handle Item Row Changes
  const handleItemChange = (id: string, field: keyof InvoiceItemRow, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const updated = { ...item, [field]: value }

        if (field === 'quantity' || field === 'rate' || field === 'discountPercent') {
          const qty = field === 'quantity' ? parseFloat(value) || 0 : item.quantity
          const rate = field === 'rate' ? parseFloat(value) || 0 : item.rate
          const disc = field === 'discountPercent' ? parseFloat(value) || 0 : item.discountPercent
          const gross = qty * rate
          const net = gross - (gross * disc) / 100
          updated.amount = Math.round(net * 100) / 100
          updated.rateInclTax = Math.round(rate * (1 + (item.taxRate || 0) / 100) * 100) / 100
        }

        if (field === 'taxRate') {
          const tax = parseFloat(value) || 0
          updated.rateInclTax = Math.round(item.rate * (1 + tax / 100) * 100) / 100
        }

        return updated
      })
    )
  }

  // Quick Catalog Picker in Row
  const handleSelectCatalogItem = (rowId: string, catalogItemId: string) => {
    const found = catalog.find((c) => c.id === catalogItemId)
    if (!found) return

    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== rowId) return item
        const qty = item.quantity > 0 ? item.quantity : 1
        const rate = found.defaultRate
        const disc = item.discountPercent || 0
        const gross = qty * rate
        const net = gross - (gross * disc) / 100

        return {
          ...item,
          description: found.name,
          hsnSac: found.hsnCode,
          quantity: qty,
          unit: found.defaultUnit,
          rate: rate,
          taxRate: found.defaultTaxRate,
          rateInclTax: Math.round(rate * (1 + found.defaultTaxRate / 100) * 100) / 100,
          amount: Math.round(net * 100) / 100
        }
      })
    )
  }

  // Add Row
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `it_${Date.now()}`,
        description: '',
        hsnSac: '12119011',
        quantity: 1,
        unit: 'kg',
        rate: 0,
        taxRate: 5,
        discountPercent: 0,
        amount: 0
      }
    ])
  }

  // Remove Row
  const handleRemoveItem = (id: string) => {
    if (items.length === 1) {
      setItems([
        {
          id: '1',
          description: '',
          hsnSac: '12119011',
          quantity: 1,
          unit: 'kg',
          rate: 0,
          taxRate: 5,
          discountPercent: 0,
          amount: 0
        }
      ])
      return
    }
    setItems((prev) => prev.filter((it) => it.id !== id))
  }

  // Clear Form
  const handleClear = () => {
    if (confirm('Clear form fields and start new voucher?')) {
      setInvoiceNo(`${Math.floor(10 + Math.random() * 90)}`)
      setRefNo('')
      setFreightCharges(0)
      setExtraDiscount(0)
      setNotes('')
      setItems([
        {
          id: '1',
          description: '',
          hsnSac: '12119011',
          quantity: 1,
          unit: 'kg',
          rate: 0,
          taxRate: 5,
          discountPercent: 0,
          amount: 0
        }
      ])
    }
  }

  // Calculations
  const subtotal = items.reduce((sum, it) => sum + (it.amount || 0), 0)
  const totalQuantity = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0)

  // HSN Tax Breakdown
  const hsnMap: { [key: string]: { taxable: number; taxRate: number } } = {}
  items.forEach((it) => {
    const key = it.hsnSac || '12119011'
    if (!hsnMap[key]) {
      hsnMap[key] = { taxable: 0, taxRate: it.taxRate || 5 }
    }
    hsnMap[key].taxable += it.amount || 0
  })

  const hsnSummary: HsnSummaryRow[] = Object.keys(hsnMap).map((hsn) => {
    const entry = hsnMap[hsn]
    const taxableValue = entry.taxable
    const taxRate = entry.taxRate

    if (isInterState) {
      const igstAmt = Math.round(((taxableValue * taxRate) / 100) * 100) / 100
      return {
        hsnSac: hsn,
        taxableValue,
        cgstRate: 0,
        cgstAmount: 0,
        sgstRate: 0,
        sgstAmount: 0,
        igstRate: taxRate,
        igstAmount: igstAmt,
        totalTaxAmount: igstAmt
      }
    } else {
      const halfRate = taxRate / 2
      const halfAmt = Math.round(((taxableValue * halfRate) / 100) * 100) / 100
      return {
        hsnSac: hsn,
        taxableValue,
        cgstRate: halfRate,
        cgstAmount: halfAmt,
        sgstRate: halfRate,
        sgstAmount: halfAmt,
        igstRate: 0,
        igstAmount: 0,
        totalTaxAmount: halfAmt * 2
      }
    }
  })

  const cgstTotal = hsnSummary.reduce((sum, r) => sum + r.cgstAmount, 0)
  const sgstTotal = hsnSummary.reduce((sum, r) => sum + r.sgstAmount, 0)
  const igstTotal = hsnSummary.reduce((sum, r) => sum + r.igstAmount, 0)
  const totalTaxAmount = isInterState ? igstTotal : cgstTotal + sgstTotal

  const rawGrandTotal = subtotal + totalTaxAmount + freightCharges - extraDiscount
  const roundedGrandTotal = Math.round(rawGrandTotal)
  const roundOff = Math.round((roundedGrandTotal - rawGrandTotal) * 100) / 100

  const amountInWords = numberToIndianWords(roundedGrandTotal, 'INR', 'Only')
  const taxInWords = numberToIndianWords(totalTaxAmount, 'INR', 'Only')

  // Submit Invoice
  const handleFormSubmit = (e: React.FormEvent, shouldPrint: boolean = false) => {
    e.preventDefault()
    if (!currentCompany || !currentBuyer) return

    // Filter out completely empty items if any
    const validItems = items.filter((it) => it.description.trim() || it.amount > 0)
    const itemsToSave = (validItems.length > 0 ? validItems : items).map((it) => ({
      ...it,
      quantity: Number(it.quantity) || 0,
      rate: Number(it.rate) || 0,
      discountPercent: Number(it.discountPercent) || 0,
    }))

    const invoice: KiyavaInvoice = {
      id: initialInvoice?.id || `inv_${Date.now()}`,
      type: invoiceType,
      invoiceNo: invoiceNo || '1',
      refNo,
      invoiceDate,
      placeOfSupply: `${currentBuyer.state} (${currentBuyer.stateCode})`,
      placeOfSupplyCode: currentBuyer.stateCode,
      reverseCharge,
      transport,
      vehicleNo,
      station: station || currentBuyer.city,
      eWayBillNo,
      paymentTerms,
      totalBags,
      company: currentCompany,
      buyer: currentBuyer,
      shippedToSameAsBilled: true,
      items: itemsToSave,
      subtotal,
      totalQuantity,
      isInterState,
      cgstAmount: cgstTotal,
      sgstAmount: sgstTotal,
      igstAmount: igstTotal,
      totalTaxAmount,
      freightCharges,
      otherCharges: 0,
      extraDiscount,
      roundOff,
      grandTotal: roundedGrandTotal,
      amountInWords,
      taxInWords,
      hsnSummary,
      status: 'PAID',
      paymentMode: paymentTerms,
      notes,
      disease,
      createdAt: initialInvoice?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    onSaveInvoice(invoice, shouldPrint)
  }

  return (
    <form onSubmit={(e) => handleFormSubmit(e, false)} className="space-y-5 animate-in fade-in duration-300">
      {/* Tally Voucher Top Header Bar */}
      <div className="bg-[#0f172a] text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          {/* Empty left side */}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Clear
          </button>
          <button
            type="button"
            onClick={(e) => handleFormSubmit(e, false)}
            className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/30 active:scale-95 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" /> Save Invoice
          </button>
        </div>
      </div>

      {/* 1. Header Information (Company, Party, Date, Invoice No) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Company / Seller */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">
                {invoiceType === 'PURCHASE' ? 'Our Firm (Buyer) *' : 'Company (Seller) *'}
              </label>
              <button
                type="button"
                onClick={onOpenCompanyModal}
                className="text-[10px] text-blue-600 font-bold hover:underline"
              >
                + New
              </button>
            </div>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-blue-600 cursor-pointer"
            >
              {(companies.filter((c) => c.name.toUpperCase().includes('KIYAVA') || c.isDefault).length > 0
                ? companies.filter((c) => c.name.toUpperCase().includes('KIYAVA') || c.isDefault)
                : companies
              ).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (GST: {c.gstin})
                </option>
              ))}
            </select>
          </div>

          {/* Party / Buyer */}
          <div ref={partySearchRef} className="relative">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">
                {invoiceType === 'PURCHASE' ? 'Supplier (Seller) *' : 'Party A/c Name (Buyer) *'}
              </label>
              <button
                type="button"
                onClick={onOpenPartyModal}
                className="text-[10px] text-blue-600 font-bold hover:underline"
              >
                + New
              </button>
            </div>
            <div
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 cursor-pointer flex justify-between items-center"
              onClick={() => setIsPartySearchOpen(true)}
            >
              <span className="truncate">
                {currentBuyer ? `${currentBuyer.name} (${currentBuyer.city || currentBuyer.state})` : 'Select Buyer...'}
              </span>
            </div>

            {isPartySearchOpen && (
              <div className="absolute z-50 left-0 top-full mt-1 w-full sm:w-96 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
                <div className="p-2 border-b border-slate-100 bg-slate-50">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search Parties or Patients..."
                    value={partySearchQuery}
                    onChange={(e) => setPartySearchQuery(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto custom-scrollbar p-1">
                  {/* Local Parties */}
                  <div className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/50">
                    Local Parties
                  </div>
                  {parties
                    .filter(p => !p.name.toUpperCase().includes('KIYAVA'))
                    .filter(p => p.name.toLowerCase().includes(partySearchQuery.toLowerCase()) || p.phone?.includes(partySearchQuery))
                    .map(p => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedPartyId(p.id)
                          setIsPartySearchOpen(false)
                          setPartySearchQuery('')
                        }}
                        className="px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer rounded-lg mb-0.5"
                      >
                        {p.name} <span className="text-slate-400 font-medium ml-1">({p.city || p.state})</span>
                      </div>
                  ))}

                  {/* API Patients */}
                  {patientResults.length > 0 && (
                    <>
                      <div className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/50 mt-1 border-t border-slate-100">
                        Patients Database
                      </div>
                      {patientResults.map(p => (
                        <div
                          key={p.uniqueId}
                          onClick={() => {
                            const newParty: PartyProfile = {
                              id: `party_patient_${p.uniqueId}`,
                              name: p.name,
                              contactPerson: p.name,
                              addressLine1: `${p.houseNumber || ''} ${p.galiNumber || ''} ${p.address || ''}`.trim() || 'Address not provided',
                              city: p.state ? '' : 'Solan',
                              state: p.state || 'Himachal Pradesh',
                              stateCode: '02',
                              pincode: p.pincode || '',
                              gstin: 'URP',
                              phone: p.whatsappNumber || p.callingNumber || '',
                              email: ''
                            }
                            if (onSaveParty) {
                              onSaveParty(newParty)
                            }
                            setSelectedPartyId(newParty.id)
                            setIsPartySearchOpen(false)
                            setPartySearchQuery('')
                          }}
                          className="px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-700 cursor-pointer rounded-lg mb-0.5 border border-transparent hover:border-teal-100 transition-colors flex justify-between items-center"
                        >
                          <div>
                            {p.name} <span className="text-slate-400 font-medium ml-1">({p.uniqueId})</span>
                          </div>
                          <span className="text-[9px] px-1.5 py-0.5 bg-teal-100 text-teal-800 rounded">Patient</span>
                        </div>
                      ))}
                    </>
                  )}
                  {partySearchQuery && patientResults.length === 0 && (
                    <div className="px-3 py-4 text-xs text-center text-slate-500 font-medium">
                      No patients matched "{partySearchQuery}"
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Invoice No */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">Invoice No. *</label>
            <input
              type="text"
              required
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              placeholder="e.g. 23"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:border-blue-600"
            />
          </div>

          {/* Invoice Date */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">Date of Invoice *</label>
            <input
              type="date"
              required
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-blue-600"
            />
          </div>
        </div>

        {/* Transportation & Meta Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Ref. No. / PO</label>
            <input
              type="text"
              value={refNo}
              onChange={(e) => setRefNo(e.target.value)}
              placeholder="VPSF-101"
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Transport / Courier</label>
            <input
              type="text"
              value={transport}
              onChange={(e) => setTransport(e.target.value)}
              placeholder="Chandra Mangal Tpt"
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Vehicle No.</label>
            <input
              type="text"
              value={vehicleNo}
              onChange={(e) => setVehicleNo(e.target.value)}
              placeholder="HP-14-1234"
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Destination Station</label>
            <input
              type="text"
              value={station}
              onChange={(e) => setStation(e.target.value)}
              placeholder="Sabathu (SOLAN)"
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">E-Way Bill No.</label>
            <input
              type="text"
              value={eWayBillNo}
              onChange={(e) => setEWayBillNo(e.target.value)}
              placeholder="751657878439"
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 outline-none focus:border-blue-600"
            />
          </div>
        </div>
      </div>

      {/* 2. Tally Item Ledger Grid */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Particulars (Name of Item / Goods)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenCatalogModal}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-800"
            >
              + Product Name
            </button>
            <button
              type="button"
              onClick={handleAddItem}
              className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-extrabold text-xs rounded-lg border border-blue-200 transition-all cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> + Add Row (Enter)
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="border border-slate-200 rounded-xl">
          <table className="w-full text-xs text-left border-collapse min-w-[760px]">
            <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-2.5 text-center w-8 rounded-tl-xl">#</th>
                <th className="p-2.5 text-left">Description of Goods</th>
                <th className="p-2.5 text-center w-24">HSN/SAC</th>
                <th className="p-2.5 text-right w-24">Quantity</th>
                <th className="p-2.5 text-center w-16">Unit</th>
                <th className="p-2.5 text-right w-24">Rate (₹)</th>
                <th className="p-2.5 text-center w-16">Tax %</th>
                <th className="p-2.5 text-right w-16">Disc %</th>
                <th className="p-2.5 text-right w-28">Amount (₹)</th>
                <th className="p-2.5 text-center w-10 rounded-tr-xl"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {items.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="p-2 text-center font-bold text-slate-400">{idx + 1}</td>

                  {/* Description / Autocomplete */}
                  <td className="p-2">
                      <div className="relative">
                        <input
                          type="text"
                          required
                          autoComplete="off"
                          value={item.description}
                          onChange={(e) => {
                            const val = e.target.value
                            handleItemChange(item.id, 'description', val)
                            const matched = catalog.find(c => c.name.toLowerCase() === val.toLowerCase())
                            if (matched) {
                              handleSelectCatalogItem(item.id, matched.id)
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleAddItem()
                            }
                          }}
                          placeholder="Item / Raw Material / Herb Name"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 focus:border-blue-600 rounded-lg text-xs font-bold text-slate-900 outline-none relative z-10"
                        />
                        {item.description.length > 0 && !catalog.some(c => c.name.toLowerCase() === item.description.toLowerCase()) && catalog.filter(c => c.name.toLowerCase().includes(item.description.toLowerCase())).length > 0 && (
                          <div className="absolute z-50 left-0 top-full mt-1 w-72 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                            {catalog.filter(c => c.name.toLowerCase().includes(item.description.toLowerCase())).map(c => (
                              <div
                                key={c.id}
                                onMouseDown={(e) => {
                                  e.preventDefault()
                                  handleItemChange(item.id, 'description', c.name)
                                  handleSelectCatalogItem(item.id, c.id)
                                }}
                                className="px-3 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer border-b border-slate-100 last:border-0 transition-colors"
                              >
                                {c.name} {c.hsnCode && <span className="text-[10px] font-medium text-slate-400 ml-1">({c.hsnCode})</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                  </td>

                  {/* HSN */}
                  <td className="p-2">
                    <input
                      type="text"
                      value={item.hsnSac}
                      onChange={(e) => handleItemChange(item.id, 'hsnSac', e.target.value)}
                      placeholder="12119011"
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-center text-slate-800 outline-none focus:border-blue-600"
                    />
                  </td>

                  {/* Quantity */}
                  <td className="p-2">
                    <input
                      type="number"
                      step="any"
                      min="0.001"
                      required
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                      placeholder="1.000"
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-right text-slate-900 outline-none focus:border-blue-600"
                    />
                  </td>

                  {/* Unit */}
                  <td className="p-2">
                    <select
                      value={item.unit}
                      onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                      className="w-full px-1 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 outline-none cursor-pointer"
                    >
                      <option value="kg">kg</option>
                      <option value="PCS">PCS</option>
                      <option value="Bags">Bags</option>
                      <option value="Box">Box</option>
                      <option value="Ltr">Ltr</option>
                      <option value="gm">gm</option>
                      <option value="Units">Units</option>
                    </select>
                  </td>

                  {/* Rate */}
                  <td className="p-2">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={item.rate}
                      onChange={(e) => handleItemChange(item.id, 'rate', e.target.value)}
                      placeholder="0.00"
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-right text-slate-900 outline-none focus:border-blue-600"
                    />
                  </td>

                  {/* Tax Rate % */}
                  <td className="p-2">
                    <select
                      value={item.taxRate}
                      onChange={(e) => handleItemChange(item.id, 'taxRate', parseFloat(e.target.value) || 0)}
                      className="w-full px-1 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-center text-slate-800 outline-none cursor-pointer"
                    >
                      <option value={0}>0%</option>
                      <option value={5}>5%</option>
                      <option value={12}>12%</option>
                      <option value={18}>18%</option>
                      <option value={28}>28%</option>
                    </select>
                  </td>

                  {/* Disc % */}
                  <td className="p-2">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max="100"
                      value={item.discountPercent}
                      onChange={(e) => handleItemChange(item.id, 'discountPercent', e.target.value)}
                      placeholder="0"
                      className="w-full px-1.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-right text-slate-800 outline-none focus:border-blue-600"
                    />
                  </td>

                  {/* Amount */}
                  <td className="p-2 text-right font-mono font-bold text-slate-900">
                    ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  {/* Delete */}
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="Remove row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Tally Ledger Totals & GST Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left: Extra Charges & Notes */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3 text-xs">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            Additional Charges &amp; Split
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">
                Freight / Transport (₹)
              </label>
              <input
                type="number"
                min="0"
                value={freightCharges}
                onChange={(e) => setFreightCharges(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-right text-slate-900 outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">
                Special Discount (₹)
              </label>
              <input
                type="number"
                min="0"
                value={extraDiscount}
                onChange={(e) => setExtraDiscount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-right text-slate-900 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">
                Consignment Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Raw Material Verified"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">
                Disease / Diagnosis
              </label>
              <input
                type="text"
                value={disease}
                onChange={(e) => setDisease(e.target.value)}
                placeholder="e.g. Sugar / BP"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right: Tally Final Computation Box */}
        <div className="bg-[#0f172a] text-white rounded-2xl p-5 shadow-lg space-y-3 flex flex-col justify-between">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Subtotal (Taxable Value):</span>
              <span className="font-mono font-bold text-white">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>

            {isInterState ? (
              <div className="flex justify-between text-blue-300">
                <span>Add : IGST Tax:</span>
                <span className="font-mono font-bold">₹{igstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-emerald-300">
                  <span>Add : CGST Tax:</span>
                  <span className="font-mono font-bold">₹{cgstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-emerald-300">
                  <span>Add : SGST Tax:</span>
                  <span className="font-mono font-bold">₹{sgstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </>
            )}

            {freightCharges > 0 && (
              <div className="flex justify-between text-amber-300">
                <span>Add : Freight Charges:</span>
                <span className="font-mono font-bold">+₹{freightCharges.toFixed(2)}</span>
              </div>
            )}

            {extraDiscount > 0 && (
              <div className="flex justify-between text-rose-300">
                <span>Less : Discount:</span>
                <span className="font-mono font-bold">-₹{extraDiscount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Round Off:</span>
              <span className="font-mono">{roundOff < 0 ? `(-) ₹${Math.abs(roundOff).toFixed(2)}` : `(+) ₹${roundOff.toFixed(2)}`}</span>
            </div>

            <div className="pt-2 border-t border-slate-700 flex justify-between items-baseline">
              <span className="font-black uppercase tracking-wider text-xs">Grand Total:</span>
              <span className="text-2xl font-black font-mono text-emerald-400">
                ₹ {roundedGrandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-[10px] text-slate-300 italic font-serif leading-tight">
              {amountInWords}
            </p>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all cursor-pointer"
            >
              <Save className="w-5 h-5" /> Save Invoice
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}
