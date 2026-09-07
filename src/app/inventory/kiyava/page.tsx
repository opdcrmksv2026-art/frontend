"use client"

import React, { useState, useEffect } from 'react'
import {
  CompanyProfile,
  PartyProfile,
  CatalogItem,
  KiyavaInvoice,
  OpeningStockEntry,
  ManufacturingLog
} from '@/types/kiyavaBilling'
import {
  DEFAULT_COMPANIES,
  DEFAULT_PARTIES,
  DEFAULT_CATALOG,
  SEEDED_INVOICES
} from '@/lib/kiyavaDefaults'
import KiyavaInvoiceForm from '@/components/kiyava/KiyavaInvoiceForm'
import TallyInvoicePrint from '@/components/kiyava/TallyInvoicePrint'
import CompanyModal from '@/components/kiyava/CompanyModal'
import PartyModal from '@/components/kiyava/PartyModal'
import CatalogModal from '@/components/kiyava/CatalogModal'
import OpeningStockModal from '@/components/kiyava/OpeningStockModal'
import ManufacturingModal from '@/components/kiyava/ManufacturingModal'
import {
  FileText,
  Plus,
  Building2,
  Users,
  Package,
  Printer,
  Search,
  Filter,
  Eye,
  Trash2,
  Copy,
  Edit,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  RotateCcw,
  FlaskConical
} from 'lucide-react'

export default function KiyavaPage() {
  // State for data
  const [companies, setCompanies] = useState<CompanyProfile[]>([])
  const [parties, setParties] = useState<PartyProfile[]>([])
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [invoices, setInvoices] = useState<KiyavaInvoice[]>([])
  const [openingStock, setOpeningStock] = useState<OpeningStockEntry[]>([])
  const [manufacturingLogs, setManufacturingLogs] = useState<ManufacturingLog[]>([])

  // Active Tab: 'invoices' | 'create' | 'companies' | 'parties' | 'catalog' | 'opening-stock' | 'manufacturing'
  const [activeTab, setActiveTab] = useState<string>('invoices')

  // Modals & Print Previews
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<KiyavaInvoice | null>(null)
  const [editingInvoice, setEditingInvoice] = useState<KiyavaInvoice | null>(null)

  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<CompanyProfile | null>(null)

  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false)
  const [editingParty, setEditingParty] = useState<PartyProfile | null>(null)

  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false)
  const [editingCatalogItem, setEditingCatalogItem] = useState<CatalogItem | null>(null)

  const [isOpeningStockModalOpen, setIsOpeningStockModalOpen] = useState(false)
  const [editingOpeningStockEntry, setEditingOpeningStockEntry] = useState<OpeningStockEntry | null>(null)

  const [isManufacturingModalOpen, setIsManufacturingModalOpen] = useState(false)

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCompany, setFilterCompany] = useState<string>('ALL')
  const [invoiceSummaryType, setInvoiceSummaryType] = useState<'SALE' | 'PURCHASE'>('SALE')

  // Load Initial Data from localStorage or clean defaults
  useEffect(() => {
    try {
      const storedCompanies = localStorage.getItem('ksv_kiyava_companies')
      const storedParties = localStorage.getItem('ksv_kiyava_parties')
      const storedCatalog = localStorage.getItem('ksv_kiyava_catalog')
      const storedInvoices = localStorage.getItem('ksv_kiyava_invoices')
      const storedOpeningStock = localStorage.getItem('ksv_kiyava_opening_stock')
      const storedMfgLogs = localStorage.getItem('ksv_kiyava_manufacturing')

      let parsedCompanies: CompanyProfile[] = storedCompanies ? JSON.parse(storedCompanies) : DEFAULT_COMPANIES
      parsedCompanies = parsedCompanies.filter((c) => c.name.toUpperCase().includes('KIYAVA') || c.isDefault)
      if (parsedCompanies.length === 0) parsedCompanies = DEFAULT_COMPANIES

      setCompanies(parsedCompanies)
      setParties(storedParties ? JSON.parse(storedParties) : DEFAULT_PARTIES)
      setCatalog(storedCatalog ? JSON.parse(storedCatalog) : DEFAULT_CATALOG)
      setInvoices(storedInvoices ? JSON.parse(storedInvoices) : SEEDED_INVOICES)
      setOpeningStock(storedOpeningStock ? JSON.parse(storedOpeningStock) : [])
      setManufacturingLogs(storedMfgLogs ? JSON.parse(storedMfgLogs) : [])
    } catch (e) {
      console.error('Failed to load Kiyava storage data:', e)
      setCompanies(DEFAULT_COMPANIES)
      setParties(DEFAULT_PARTIES)
      setCatalog(DEFAULT_CATALOG)
      setInvoices(SEEDED_INVOICES)
      setOpeningStock([])
      setManufacturingLogs([])
    }
  }, [])

  // Persist helpers
  const saveCompanies = (newCompanies: CompanyProfile[]) => {
    setCompanies(newCompanies)
    localStorage.setItem('ksv_kiyava_companies', JSON.stringify(newCompanies))
  }

  const saveParties = (newParties: PartyProfile[]) => {
    setParties(newParties)
    localStorage.setItem('ksv_kiyava_parties', JSON.stringify(newParties))
  }

  const saveCatalog = (newCatalog: CatalogItem[]) => {
    setCatalog(newCatalog)
    localStorage.setItem('ksv_kiyava_catalog', JSON.stringify(newCatalog))
  }

  const saveOpeningStock = (newStock: OpeningStockEntry[]) => {
    setOpeningStock(newStock)
    localStorage.setItem('ksv_kiyava_opening_stock', JSON.stringify(newStock))
  }

  const saveInvoices = (newInvoices: KiyavaInvoice[]) => {
    setInvoices(newInvoices)
    localStorage.setItem('ksv_kiyava_invoices', JSON.stringify(newInvoices))
  }

  const saveManufacturingLogs = (newLogs: ManufacturingLog[]) => {
    setManufacturingLogs(newLogs)
    localStorage.setItem('ksv_kiyava_manufacturing', JSON.stringify(newLogs))
  }

  // Manufacturing Handlers
  const handleSaveManufacturingLog = (log: ManufacturingLog) => {
    const exists = manufacturingLogs.some((l) => l.id === log.id)
    const updated = exists
      ? manufacturingLogs.map((l) => (l.id === log.id ? log : l))
      : [...manufacturingLogs, log]
    saveManufacturingLogs(updated)
  }

  const handleDeleteManufacturingLog = (id: string) => {
    if (confirm('Delete this manufacturing entry? Stock will be updated accordingly.')) {
      const updated = manufacturingLogs.filter((l) => l.id !== id)
      saveManufacturingLogs(updated)
    }
  }

  // Invoice Handlers
  const handleSaveInvoice = (invoice: KiyavaInvoice, shouldPrint: boolean = false) => {
    const exists = invoices.some((inv) => inv.id === invoice.id)
    let updated: KiyavaInvoice[]
    if (exists) {
      updated = invoices.map((inv) => (inv.id === invoice.id ? invoice : inv))
    } else {
      updated = [invoice, ...invoices]
    }
    saveInvoices(updated)
    setEditingInvoice(null)

    if (shouldPrint) {
      setSelectedInvoiceForPrint(invoice)
    } else {
      setActiveTab('invoices')
    }
  }

  const handleDeleteInvoice = (id: string) => {
    if (confirm('Are you sure you want to delete this invoice from Kiyava ledger?')) {
      const updated = invoices.filter((inv) => inv.id !== id)
      saveInvoices(updated)
    }
  }

  const handleDuplicateInvoice = (invoice: KiyavaInvoice) => {
    const duplicated: KiyavaInvoice = {
      ...invoice,
      id: `inv_${Date.now()}`,
      invoiceNo: `${parseInt(invoice.invoiceNo) ? parseInt(invoice.invoiceNo) + 1 : invoice.invoiceNo + '-COPY'}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    const updated = [duplicated, ...invoices]
    saveInvoices(updated)
    setSelectedInvoiceForPrint(duplicated)
  }

  // Company Master Handlers
  const handleSaveCompany = (company: CompanyProfile) => {
    const exists = companies.some((c) => c.id === company.id)
    const updated = exists
      ? companies.map((c) => (c.id === company.id ? company : c))
      : [...companies, company]
    saveCompanies(updated)
  }

  const handleDeleteCompany = (id: string) => {
    if (companies.length <= 1) {
      alert('At least one company must remain in the system.')
      return
    }
    if (confirm('Delete this company profile?')) {
      const updated = companies.filter((c) => c.id !== id)
      saveCompanies(updated)
    }
  }

  // Party Master Handlers
  const handleSaveParty = (party: PartyProfile) => {
    const exists = parties.some((p) => p.id === party.id)
    const updated = exists
      ? parties.map((p) => (p.id === party.id ? party : p))
      : [...parties, party]
    saveParties(updated)
  }

  const handleDeleteParty = (id: string) => {
    if (confirm('Delete this buyer / party?')) {
      const updated = parties.filter((p) => p.id !== id)
      saveParties(updated)
    }
  }

  // Catalog Item Handlers
  const handleSaveCatalogItem = (item: CatalogItem) => {
    const exists = catalog.some((c) => c.id === item.id)
    const updated = exists
      ? catalog.map((c) => (c.id === item.id ? item : c))
      : [...catalog, item]
    saveCatalog(updated)

    // Automatically sync with Opening Stock
    const existingStock = openingStock.find((s) => s.itemId === item.id)
    if (existingStock) {
      const updatedStock = openingStock.map((s) =>
        s.itemId === item.id
          ? { ...s, quantity: Number(item.quantity) || 0, itemName: item.name, unit: item.defaultUnit }
          : s
      )
      saveOpeningStock(updatedStock)
    } else {
      const newStockEntry: OpeningStockEntry = {
        id: `os_${Date.now()}`,
        itemId: item.id,
        itemName: item.name,
        date: new Date().toISOString().split('T')[0],
        unit: item.defaultUnit,
        quantity: Number(item.quantity) || 0
      }
      saveOpeningStock([...openingStock, newStockEntry])
    }
  }

  const handleDeleteCatalogItem = (id: string) => {
    if (confirm('Delete this item from catalog?')) {
      const updated = catalog.filter((c) => c.id !== id)
      saveCatalog(updated)
    }
  }

  // Opening Stock Handlers
  const handleSaveOpeningStock = (entry: OpeningStockEntry) => {
    const exists = openingStock.some((s) => s.id === entry.id)
    const updated = exists
      ? openingStock.map((s) => (s.id === entry.id ? entry : s))
      : [...openingStock, entry]
    saveOpeningStock(updated)
  }

  const handleDeleteOpeningStock = (id: string) => {
    if (confirm('Delete this opening stock entry?')) {
      const updated = openingStock.filter((s) => s.id !== id)
      saveOpeningStock(updated)
    }
  }

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all data? This will clear all invoices and stock.')) {
      localStorage.removeItem('ksv_kiyava_companies')
      localStorage.removeItem('ksv_kiyava_parties')
      localStorage.removeItem('ksv_kiyava_catalog')
      localStorage.removeItem('ksv_kiyava_invoices')
      localStorage.removeItem('ksv_kiyava_opening_stock')
      localStorage.removeItem('ksv_kiyava_manufacturing')
      
      setCompanies(DEFAULT_COMPANIES)
      setParties(DEFAULT_PARTIES)
      setCatalog(DEFAULT_CATALOG)
      setInvoices(SEEDED_INVOICES)
      setOpeningStock([])
      setManufacturingLogs([])
    }
  }

  // Financial Stats
  const totalInvoicesCount = invoices.length
  const totalBilledRevenue = invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0)
  const totalGstCollected = invoices.reduce((sum, inv) => sum + (inv.totalTaxAmount || 0), 0)
  const totalMaterialWeight = invoices.reduce((sum, inv) => sum + (inv.totalQuantity || 0), 0)

  // Filtered Invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.buyer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.items.some((it) => it.description.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCompany = filterCompany === 'ALL' || inv.company.id === filterCompany
    const matchesType = (inv.type || 'SALE') === invoiceSummaryType
    return matchesSearch && matchesCompany && matchesType
  })

  const saleCount = invoices.filter((inv) => (inv.type || 'SALE') === 'SALE').length
  const purchaseCount = invoices.filter((inv) => inv.type === 'PURCHASE').length
  const saleTotalRevenue = invoices.filter((inv) => (inv.type || 'SALE') === 'SALE').reduce((sum, inv) => sum + (inv.grandTotal || 0), 0)
  const purchaseTotalSpend = invoices.filter((inv) => inv.type === 'PURCHASE').reduce((sum, inv) => sum + (inv.grandTotal || 0), 0)

  return (
    <div className="w-full space-y-3.5 pt-0 animate-in fade-in duration-300">

      {/* 2. Key Accounting Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Invoices</span>
          <h3 className="text-lg font-black text-slate-900 mt-0.5">{totalInvoicesCount}</h3>
          <p className="text-[10px] text-slate-400 font-medium">Tax Invoices in ledger</p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Billed (₹)</span>
          <h3 className="text-lg font-black text-emerald-600 font-mono mt-0.5">
            ₹{totalBilledRevenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">Gross Billed Value</p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">GST Tax Value</span>
          <h3 className="text-lg font-black text-blue-600 font-mono mt-0.5">
            ₹{totalGstCollected.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">CGST / SGST / IGST</p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Material Qty</span>
          <h3 className="text-lg font-black text-slate-900 font-mono mt-0.5">
            {totalMaterialWeight.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">kg / PCS Dispatched</p>
        </div>
      </div>

      {/* 3. Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 border-b border-slate-200 text-xs w-full">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 rounded-xl font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'invoices'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Invoice Summary ({invoices.length})
        </button>

        <button
          onClick={() => {
            setEditingInvoice(null)
            setActiveTab('create-sell')
          }}
          className={`px-4 py-2 rounded-xl font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'create-sell'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
        >
          <Plus className="w-3.5 h-3.5" />
          {editingInvoice && activeTab === 'create-sell' ? 'Edit Sale Invoice' : 'Create Sale Invoice'}
        </button>

        <button
          onClick={() => {
            setEditingInvoice(null)
            setActiveTab('create-purchase')
          }}
          className={`px-4 py-2 rounded-xl font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'create-purchase'
              ? 'bg-orange-500 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
        >
          <Plus className="w-3.5 h-3.5" />
          {editingInvoice && activeTab === 'create-purchase' ? 'Edit Purchase Invoice' : 'Create Purchase Invoice'}
        </button>

        <button
          onClick={() => setActiveTab('companies')}
          className={`px-4 py-2 rounded-xl font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'companies'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          Add New Company ({companies.length})
        </button>

        <button
          onClick={() => setActiveTab('parties')}
          className={`px-4 py-2 rounded-xl font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'parties'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
        >
          <Users className="w-3.5 h-3.5" />
          Parties / Buyers ({parties.length})
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 rounded-xl font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'catalog'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
        >
          <Package className="w-3.5 h-3.5" />
          Product Name ({catalog.length})
        </button>

        <button
          onClick={() => setActiveTab('opening-stock')}
          className={`px-4 py-2 rounded-xl font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'opening-stock'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          Stock Register
        </button>


        <div className="flex-1" /> {/* Spacer */}

        <button
          onClick={handleResetData}
          className="px-4 py-2 rounded-xl font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap bg-rose-50 text-rose-600 hover:bg-rose-100 shadow-sm border border-rose-200"
          title="Reset All Data"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Data
        </button>
      </div>

      {/* 4. TAB CONTENT: 1. INVOICES */}
      {activeTab === 'invoices' && (
        <div className="space-y-4 animate-in fade-in duration-300">

          {/* Sub-Tab Toggle: Sell Summary | Purchase Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 flex items-center gap-2">
            <button
              onClick={() => setInvoiceSummaryType('SALE')}
              className={`flex-1 py-2.5 px-4 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${invoiceSummaryType === 'SALE'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                  : 'text-slate-500 hover:bg-slate-50'
                }`}
            >
              📤 Sale Summary
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${invoiceSummaryType === 'SALE' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {saleCount}
              </span>
            </button>
            <button
              onClick={() => setInvoiceSummaryType('PURCHASE')}
              className={`flex-1 py-2.5 px-4 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${invoiceSummaryType === 'PURCHASE'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-200'
                  : 'text-slate-500 hover:bg-slate-50'
                }`}
            >
              📥 Purchase Summary
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${invoiceSummaryType === 'PURCHASE' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {purchaseCount}
              </span>
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className={`rounded-2xl p-4 border shadow-sm ${invoiceSummaryType === 'SALE' ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
              <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${invoiceSummaryType === 'SALE' ? 'text-blue-500' : 'text-orange-500'}`}>
                {invoiceSummaryType === 'SALE' ? 'Total Sales' : 'Total Purchases'}
              </p>
              <h3 className={`text-lg font-black ${invoiceSummaryType === 'SALE' ? 'text-blue-700' : 'text-orange-700'}`}>
                {invoiceSummaryType === 'SALE' ? saleCount : purchaseCount}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">Invoices</p>
            </div>
            <div className={`rounded-2xl p-4 border shadow-sm ${invoiceSummaryType === 'SALE' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
              <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${invoiceSummaryType === 'SALE' ? 'text-emerald-500' : 'text-rose-500'}`}>
                {invoiceSummaryType === 'SALE' ? 'Total Revenue' : 'Total Spend'}
              </p>
              <h3 className={`text-lg font-black ${invoiceSummaryType === 'SALE' ? 'text-emerald-700' : 'text-rose-700'}`}>
                ₹{(invoiceSummaryType === 'SALE' ? saleTotalRevenue : purchaseTotalSpend).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">Grand Total (incl. GST)</p>
            </div>
            <div className="rounded-2xl p-4 bg-slate-50 border border-slate-100 shadow-sm col-span-2 sm:col-span-1">
              <p className="text-[10px] font-black uppercase tracking-wider mb-1 text-slate-400">
                Total GST
              </p>
              <h3 className="text-lg font-black text-slate-700">
                ₹{filteredInvoices.reduce((sum, inv) => sum + (inv.totalTaxAmount || 0), 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">Tax Collected</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search invoice #, party, item..."
                className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Company:
              </span>
              <select
                value={filterCompany}
                onChange={(e) => setFilterCompany(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl px-2.5 py-1.5 outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="ALL">All Companies</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clean Invoices Table / Cards */}
          {filteredInvoices.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-3 pl-5">Invoice #</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Buyer (Party)</th>
                      <th className="p-3">Company (Seller)</th>
                      <th className="p-3 text-right">Taxable (₹)</th>
                      <th className="p-3 text-right">GST (₹)</th>
                      <th className="p-3 text-right">Grand Total (₹)</th>
                      <th className="p-3 text-right pr-5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 pl-5 font-mono font-black text-slate-900">
                          #{inv.invoiceNo}
                        </td>
                        <td className="p-3 font-medium text-slate-600">{inv.invoiceDate}</td>
                        <td className="p-3 font-bold text-slate-800">{inv.buyer.name}</td>
                        <td className="p-3 font-medium text-slate-600">{inv.company.name}</td>
                        <td className="p-3 text-right font-mono font-semibold text-slate-700">
                          ₹{inv.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-mono font-semibold text-indigo-600">
                          ₹{inv.totalTaxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-slate-900 text-sm">
                          ₹{inv.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right pr-5">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedInvoiceForPrint(inv)}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors"
                              title="Print A4 Tax Invoice"
                            >
                              <Eye className="w-3.5 h-3.5" /> Print
                            </button>
                            <button
                              onClick={() => {
                                setEditingInvoice(inv)
                                setActiveTab((inv.type || 'SALE') === 'SALE' ? 'create-sell' : 'create-purchase')
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDuplicateInvoice(inv)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors"
                              title="Duplicate"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteInvoice(inv.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                              title="Delete"
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
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-sm space-y-2.5 w-full">
              <FileText className="w-9 h-9 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No Invoices in Ledger Yet</h3>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Ledger is clean. Click below to create your first authentic Tally Tax Invoice.
              </p>
              <div className="pt-1">
                <button
                  onClick={() => setActiveTab('create-sell')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md transition-all inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Create Tax Invoice
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. TAB CONTENT: 2. CREATE INVOICE FORM */}
      {(activeTab === 'create-sell' || activeTab === 'create-purchase') && (
        <KiyavaInvoiceForm
          key={activeTab} // Force re-render when switching between sell and purchase
          defaultInvoiceType={activeTab === 'create-purchase' ? 'PURCHASE' : 'SALE'}
          companies={companies}
          parties={parties}
          catalog={catalog}
          onSaveInvoice={handleSaveInvoice}
          onOpenCompanyModal={() => {
            setEditingCompany(null)
            setIsCompanyModalOpen(true)
          }}
          onOpenPartyModal={() => {
            setEditingParty(null)
            setIsPartyModalOpen(true)
          }}
          onOpenCatalogModal={() => {
            setEditingCatalogItem(null)
            setIsCatalogModalOpen(true)
          }}
          initialInvoice={editingInvoice}
          onCancel={() => setActiveTab('invoices')}
        />
      )}

      {/* 4. TAB CONTENT: 3. COMPANY MASTER */}
      {activeTab === 'companies' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-sm font-black text-slate-800">Companies (Issuing Entities)</h2>
              <p className="text-xs text-slate-400 font-medium">Manage Seller Companies, GSTIN &amp; Bank Details</p>
            </div>
            <button
              onClick={() => {
                setEditingCompany(null)
                setIsCompanyModalOpen(true)
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add New Company
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {companies.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3"
              >
                <div className="flex justify-between items-start pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">{c.name}</h3>
                    <p className="text-[11px] text-slate-400 font-medium">{c.tagline || 'Ayurvedic Enterprise'}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingCompany(c)
                        setIsCompanyModalOpen(true)
                      }}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCompany(c.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  <p>{c.addressLine1}, {c.city}, {c.state} - {c.pincode}</p>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                    <div>
                      <span className="text-slate-400">GSTIN:</span>{' '}
                      <strong className="font-mono text-slate-800">{c.gstin}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Bank:</span> {c.bankName}
                    </div>
                    <div>
                      <span className="text-slate-400">A/c No:</span>{' '}
                      <strong className="font-mono text-slate-800">{c.accountNo}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">IFSC:</span>{' '}
                      <strong className="font-mono text-slate-800">{c.ifscCode}</strong>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TAB CONTENT: 4. PARTIES MASTER */}
      {activeTab === 'parties' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-sm font-black text-slate-800">Parties / Buyers Directory</h2>
              <p className="text-xs text-slate-400 font-medium">Manage Customer profiles, GSTIN &amp; Transport stations</p>
            </div>
            <button
              onClick={() => {
                setEditingParty(null)
                setIsPartyModalOpen(true)
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> + New Party
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {parties.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start pb-2 border-b border-slate-100">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">{p.name}</h3>
                      <p className="text-[11px] text-slate-400">{p.city}, {p.state}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingParty(p)
                          setIsPartyModalOpen(true)
                        }}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteParty(p.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 mt-2">
                    <p>{p.addressLine1}</p>
                    <div className="pt-2 border-t border-slate-100 space-y-0.5 text-[11px]">
                      <div>
                        <span className="text-slate-400">GSTIN:</span>{' '}
                        <strong className="font-mono text-slate-800">{p.gstin || 'URP'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Mobile:</span>{' '}
                        <strong className="font-mono text-slate-800">{p.phone}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TAB CONTENT: 5. CATALOG MASTER */}
      {activeTab === 'catalog' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-sm font-black text-slate-800">Catalog Master (Herbs &amp; Materials)</h2>
              <p className="text-xs text-slate-400 font-medium">Manage HSN codes, default rates &amp; GST tax percentages</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('opening-stock')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-purple-600/20"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Opening Stock
              </button>
              <button
                onClick={() => {
                  setEditingCatalogItem(null)
                  setIsCatalogModalOpen(true)
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-amber-600/20"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3 pl-5">Item / Herb Name</th>
                    <th className="p-3 text-center">HSN/SAC</th>
                    <th className="p-3 text-center">Unit</th>
                    <th className="p-3 text-right">Quantity</th>
                    <th className="p-3 text-right">Default Rate (₹)</th>
                    <th className="p-3 text-center">GST Rate</th>
                    <th className="p-3 text-right pr-5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {catalog.map((item) => {
                    const openingEntry = openingStock.find((s) => s.itemId === item.id)
                    const openingQty = openingEntry?.quantity || Number(item.quantity) || 0
                    
                    const purchasedQty = invoices
                      .filter((inv) => inv.type === 'PURCHASE')
                      .reduce((sum, inv) => {
                        const rows = inv.items.filter((it) => it.description.toLowerCase() === item.name.toLowerCase())
                        return sum + rows.reduce((s, r) => s + (r.quantity || 0), 0)
                      }, 0)
                      
                    const soldQty = invoices
                      .filter((inv) => (inv.type || 'SALE') === 'SALE')
                      .reduce((sum, inv) => {
                        const rows = inv.items.filter((it) => it.description.toLowerCase() === item.name.toLowerCase())
                        return sum + rows.reduce((s, r) => s + (r.quantity || 0), 0)
                      }, 0)
                      
                    const manufacturedQty = manufacturingLogs
                      .filter(log => log.finishedGoodItemId === item.id)
                      .reduce((sum, log) => sum + log.producedQuantity, 0)
                      
                    const consumedQty = manufacturingLogs
                      .reduce((sum, log) => {
                        const consumed = log.rawMaterialsConsumed.filter(rm => rm.itemId === item.id)
                        return sum + consumed.reduce((s, rm) => s + rm.quantity, 0)
                      }, 0)
                      
                    const currentStock = openingQty + purchasedQty + manufacturedQty - soldQty - consumedQty

                    return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-3 pl-5 font-bold text-slate-900">{item.name}</td>
                      <td className="p-3 text-center font-mono font-bold text-slate-700">{item.hsnCode}</td>
                      <td className="p-3 text-center font-medium text-slate-700">{item.defaultUnit}</td>
                      <td className="p-3 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded font-black font-mono text-xs ${currentStock <= 0 ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
                          {currentStock}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        ₹{item.defaultRate.toFixed(2)}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-emerald-600">
                        {item.defaultTaxRate}%
                      </td>
                      <td className="p-3 text-right pr-5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingCatalogItem(item)
                              setIsCatalogModalOpen(true)
                            }}
                            className="p-1 text-slate-400 hover:text-amber-600 rounded"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCatalogItem(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB CONTENT: 6. OPENING STOCK */}
      {activeTab === 'opening-stock' && (() => {
        // Build stock register: per product aggregate
        const stockRegister = catalog.map((item) => {
          const openingEntry = openingStock.find((s) => s.itemId === item.id)
          const openingQty = openingEntry?.quantity || Number(item.quantity) || 0
          const unit = openingEntry?.unit ?? item.defaultUnit

          // Sum purchased qty from PURCHASE invoices
          const purchasedQty = invoices
            .filter((inv) => inv.type === 'PURCHASE')
            .reduce((sum, inv) => {
              const rows = inv.items.filter(
                (it) => it.description.toLowerCase() === item.name.toLowerCase()
              )
              return sum + rows.reduce((s, r) => s + (r.quantity || 0), 0)
            }, 0)

          // Sum sold qty from SALE invoices
          const soldQty = invoices
            .filter((inv) => (inv.type || 'SALE') === 'SALE')
            .reduce((sum, inv) => {
              const rows = inv.items.filter(
                (it) => it.description.toLowerCase() === item.name.toLowerCase()
              )
              return sum + rows.reduce((s, r) => s + (r.quantity || 0), 0)
            }, 0)

          const manufacturedQty = manufacturingLogs
            .filter(log => log.finishedGoodItemId === item.id)
            .reduce((sum, log) => sum + log.producedQuantity, 0)

          const consumedQty = manufacturingLogs
            .reduce((sum, log) => {
              const consumed = log.rawMaterialsConsumed.filter(rm => rm.itemId === item.id)
              return sum + consumed.reduce((s, rm) => s + rm.quantity, 0)
            }, 0)

          const closingQty = openingQty + purchasedQty + manufacturedQty - soldQty - consumedQty

          return { item, openingQty, purchasedQty, soldQty, manufacturedQty, consumedQty, closingQty, unit }
        }).filter((row) => row.openingQty > 0 || row.purchasedQty > 0 || row.soldQty > 0 || row.manufacturedQty > 0 || row.consumedQty > 0)

        const totalOpeningQty = stockRegister.reduce((s, r) => s + r.openingQty, 0)
        const totalPurchasedQty = stockRegister.reduce((s, r) => s + r.purchasedQty, 0)
        const totalSoldQty = stockRegister.reduce((s, r) => s + r.soldQty, 0)
        const totalClosingQty = stockRegister.reduce((s, r) => s + r.closingQty, 0)

        return (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-sm gap-3">
              <div>
                <h2 className="text-sm font-black text-slate-800">📦 Stock Register</h2>
                <p className="text-xs text-slate-400 font-medium">Opening Stock + Purchases − Sales = Closing Balance</p>
              </div>
              <button
                onClick={() => {
                  setEditingOpeningStockEntry(null)
                  setIsOpeningStockModalOpen(true)
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-purple-600/20"
              >
                <Plus className="w-3.5 h-3.5" /> Set Opening Stock
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-purple-400 mb-1">Opening Stock</p>
                <h3 className="text-xl font-black text-purple-700 font-mono">{totalOpeningQty.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h3>
                <p className="text-[10px] text-purple-300 font-medium mt-0.5">Initial balance</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400 mb-1">Purchased In</p>
                <h3 className="text-xl font-black text-emerald-700 font-mono">+{totalPurchasedQty.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h3>
                <p className="text-[10px] text-emerald-300 font-medium mt-0.5">From purchase invoices</p>
              </div>
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-rose-400 mb-1">Sold / Dispatched</p>
                <h3 className="text-xl font-black text-rose-700 font-mono">−{totalSoldQty.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h3>
                <p className="text-[10px] text-rose-300 font-medium mt-0.5">From sale invoices</p>
              </div>
              <div className={`border rounded-2xl p-4 shadow-sm ${totalClosingQty > 0 ? 'bg-blue-50 border-blue-100' : 'bg-amber-50 border-amber-100'}`}>
                <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${totalClosingQty > 0 ? 'text-blue-400' : 'text-amber-400'}`}>Closing Stock</p>
                <h3 className={`text-xl font-black font-mono ${totalClosingQty > 0 ? 'text-blue-700' : 'text-amber-700'}`}>{totalClosingQty.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h3>
                <p className={`text-[10px] font-medium mt-0.5 ${totalClosingQty > 0 ? 'text-blue-300' : 'text-amber-300'}`}>Remaining balance</p>
              </div>
            </div>

            {/* Stock Register Table */}
            {stockRegister.length > 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-900 text-white font-extrabold uppercase text-[10px]">
                      <tr>
                        <th className="p-3 pl-5">#</th>
                        <th className="p-3">Product Name</th>
                        <th className="p-3 text-center">Unit</th>
                        <th className="p-3 text-right text-purple-300">Opening Stock</th>
                        <th className="p-3 text-right text-emerald-300">Purchased In (+)</th>
                        <th className="p-3 text-right text-cyan-300">Produced In Mfg (+)</th>
                        <th className="p-3 text-right text-rose-300">Sold Out (−)</th>
                        <th className="p-3 text-right text-amber-300">Consumed In Mfg (−)</th>
                        <th className="p-3 text-right text-blue-300 pr-5">Closing Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {stockRegister.map(({ item, openingQty, purchasedQty, soldQty, manufacturedQty, consumedQty, closingQty, unit }, idx) => (
                        <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${closingQty <= 0 ? 'bg-rose-50/40' : ''}`}>
                          <td className="p-3 pl-5 font-mono text-slate-400 text-[10px]">{idx + 1}</td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{item.name}</div>
                            <div className="text-[10px] text-slate-400 font-medium">{item.hsnCode && `HSN: ${item.hsnCode}`}</div>
                          </td>
                          <td className="p-3 text-center font-bold text-slate-600 uppercase">{unit}</td>
                          <td className="p-3 text-right font-mono font-bold text-purple-700">
                            {openingQty.toLocaleString('en-IN', { maximumFractionDigits: 3 })}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-600">
                            {purchasedQty > 0 ? `+${purchasedQty.toLocaleString('en-IN', { maximumFractionDigits: 3 })}` : '—'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-cyan-600">
                            {manufacturedQty > 0 ? `+${manufacturedQty.toLocaleString('en-IN', { maximumFractionDigits: 3 })}` : '—'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-rose-600">
                            {soldQty > 0 ? `−${soldQty.toLocaleString('en-IN', { maximumFractionDigits: 3 })}` : '—'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-amber-600">
                            {consumedQty > 0 ? `−${consumedQty.toLocaleString('en-IN', { maximumFractionDigits: 3 })}` : '—'}
                          </td>
                          <td className="p-3 text-right pr-5">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full font-black font-mono text-xs ${closingQty <= 0
                                ? 'bg-rose-100 text-rose-700'
                                : closingQty < (openingQty * 0.2)
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                              {closingQty.toLocaleString('en-IN', { maximumFractionDigits: 3 })}
                              {closingQty <= 0 && <span className="ml-1 text-[9px]">OUT</span>}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {/* Totals Footer */}
                    <tfoot className="bg-slate-100 border-t-2 border-slate-200 font-black text-xs">
                      <tr>
                        <td className="p-3 pl-5" colSpan={3}>
                          <span className="text-slate-700 font-extrabold uppercase text-[10px] tracking-wider">TOTAL</span>
                        </td>
                        <td className="p-3 text-right font-mono text-purple-700">
                          {totalOpeningQty.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-mono text-emerald-600">
                          {totalPurchasedQty > 0 ? `+${totalPurchasedQty.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—'}
                        </td>
                        <td className="p-3 text-right font-mono text-cyan-600">
                          {/* Manufactured Total could be calculated here, skipping for simple UI */}
                          —
                        </td>
                        <td className="p-3 text-right font-mono text-rose-600">
                          {totalSoldQty > 0 ? `−${totalSoldQty.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—'}
                        </td>
                        <td className="p-3 text-right font-mono text-amber-600">
                          {/* Consumed Total could be calculated here, skipping for simple UI */}
                          —
                        </td>
                        <td className="p-3 text-right pr-5 font-mono text-blue-700">
                          {totalClosingQty.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-sm space-y-3">
                <div className="text-4xl">📦</div>
                <h3 className="text-sm font-black text-slate-800">No Stock Data Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Set opening stock for your catalog items first. Once you create invoices, the stock register will auto-calculate purchases and sales.
                </p>
                <button
                  onClick={() => {
                    setEditingOpeningStockEntry(null)
                    setIsOpeningStockModalOpen(true)
                  }}
                  className="mt-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs rounded-xl inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" /> Set Opening Stock
                </button>
              </div>
            )}

            {/* All Raw Opening Stock Entries (editable list) */}
            {openingStock.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Opening Stock Entries</h3>
                  <span className="text-[10px] text-slate-400 font-medium">{openingStock.length} entries</span>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[10px] border-b border-slate-100">
                      <tr>
                        <th className="p-3 pl-5">Product Name</th>
                        <th className="p-3 text-center">Date</th>
                        <th className="p-3 text-center">Unit</th>
                        <th className="p-3 text-right">Opening Qty</th>
                        <th className="p-3 text-right pr-5">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {openingStock.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-50">
                          <td className="p-3 pl-5 font-bold text-slate-900">{entry.itemName}</td>
                          <td className="p-3 text-center font-mono font-medium text-slate-600">{entry.date}</td>
                          <td className="p-3 text-center font-bold text-slate-600 uppercase">{entry.unit}</td>
                          <td className="p-3 text-right font-mono font-black text-purple-700">{entry.quantity}</td>
                          <td className="p-3 text-right pr-5">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setEditingOpeningStockEntry(entry)
                                  setIsOpeningStockModalOpen(true)
                                }}
                                className="p-1 text-slate-400 hover:text-purple-600 rounded"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteOpeningStock(entry.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
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
              </div>
            )}
          </div>
        )
      })()}



      {/* 5. TALLY INVOICE PRINT / PREVIEW MODAL */}
      {selectedInvoiceForPrint && (
        <TallyInvoicePrint
          invoice={selectedInvoiceForPrint}
          onClose={() => setSelectedInvoiceForPrint(null)}
        />
      )}

      {/* 6. MODALS FOR COMPANY, PARTY & CATALOG */}
      <CompanyModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        onSave={handleSaveCompany}
        initialData={editingCompany}
      />

      <PartyModal
        isOpen={isPartyModalOpen}
        onClose={() => setIsPartyModalOpen(false)}
        onSave={handleSaveParty}
        initialData={editingParty}
      />

      <CatalogModal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        onSave={handleSaveCatalogItem}
        initialData={editingCatalogItem}
      />

      <OpeningStockModal
        isOpen={isOpeningStockModalOpen}
        onClose={() => setIsOpeningStockModalOpen(false)}
        onSave={handleSaveOpeningStock}
        initialData={editingOpeningStockEntry}
        catalog={catalog}
      />


    </div>
  )
}
