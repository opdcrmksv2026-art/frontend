"use client"

import React, { useState, useEffect } from 'react'
import {
  CompanyProfile,
  PartyProfile,
  CatalogItem,
  KiyavaInvoice,
  OpeningStockEntry
} from '@/types/kiyavaBilling'
import {
  DEFAULT_MAXXI_COMPANIES,
  DEFAULT_MAXXI_PARTIES,
  DEFAULT_MAXXI_CATALOG,
  SEEDED_MAXXI_INVOICES
} from '@/lib/maxxiDefaults'
import KiyavaInvoiceForm from '@/components/kiyava/KiyavaInvoiceForm'
import TallyInvoicePrint from '@/components/kiyava/TallyInvoicePrint'
import CompanyModal from '@/components/kiyava/CompanyModal'
import PartyModal from '@/components/kiyava/PartyModal'
import CatalogModal from '@/components/kiyava/CatalogModal'
import OpeningStockModal from '@/components/kiyava/OpeningStockModal'
import {
  FileText,
  Plus,
  Building2,
  Users,
  Package,
  Printer,
  Search,
  Filter,
  Trash2,
  Copy,
  Edit,
  Receipt,
  ShoppingCart,
  ArrowDownLeft,
  CheckCircle2,
  Activity,
  FileSpreadsheet
} from 'lucide-react'

export default function MaxxiPharmaPage() {
  // State for data
  const [companies, setCompanies] = useState<CompanyProfile[]>([])
  const [parties, setParties] = useState<PartyProfile[]>([])
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [invoices, setInvoices] = useState<KiyavaInvoice[]>([])
  const [openingStock, setOpeningStock] = useState<OpeningStockEntry[]>([])

  // Active Tab: 'invoices' | 'create-purchase' | 'create-sell' | 'companies' | 'parties' | 'catalog' | 'opening-stock'
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

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCompany, setFilterCompany] = useState<string>('ALL')
  const [invoiceSummaryType, setInvoiceSummaryType] = useState<'SALE' | 'PURCHASE'>('SALE')

  // Load Initial Data from localStorage or clean defaults
  useEffect(() => {
    try {
      const storedCompanies = localStorage.getItem('maxxi_app_companies')
      const storedParties = localStorage.getItem('maxxi_app_parties')
      const storedCatalog = localStorage.getItem('maxxi_app_catalog')
      const storedInvoices = localStorage.getItem('maxxi_app_invoices')
      const storedOpeningStock = localStorage.getItem('maxxi_app_opening_stock')

      setCompanies(storedCompanies ? JSON.parse(storedCompanies) : DEFAULT_MAXXI_COMPANIES)
      setParties(storedParties ? JSON.parse(storedParties) : DEFAULT_MAXXI_PARTIES)
      setCatalog(storedCatalog ? JSON.parse(storedCatalog) : DEFAULT_MAXXI_CATALOG)
      setInvoices(storedInvoices ? JSON.parse(storedInvoices) : SEEDED_MAXXI_INVOICES)
      setOpeningStock(storedOpeningStock ? JSON.parse(storedOpeningStock) : [])
    } catch (e) {
      console.error('Failed to load Maxxi Pharma storage data:', e)
      setCompanies(DEFAULT_MAXXI_COMPANIES)
      setParties(DEFAULT_MAXXI_PARTIES)
      setCatalog(DEFAULT_MAXXI_CATALOG)
      setInvoices(SEEDED_MAXXI_INVOICES)
      setOpeningStock([])
    }
  }, [])

  // Persist helpers
  const saveCompanies = (newCompanies: CompanyProfile[]) => {
    setCompanies(newCompanies)
    localStorage.setItem('maxxi_app_companies', JSON.stringify(newCompanies))
  }

  const saveParties = (newParties: PartyProfile[]) => {
    setParties(newParties)
    localStorage.setItem('maxxi_app_parties', JSON.stringify(newParties))
  }

  const saveCatalog = (newCatalog: CatalogItem[]) => {
    setCatalog(newCatalog)
    localStorage.setItem('maxxi_app_catalog', JSON.stringify(newCatalog))
  }

  const saveOpeningStock = (newStock: OpeningStockEntry[]) => {
    setOpeningStock(newStock)
    localStorage.setItem('maxxi_app_opening_stock', JSON.stringify(newStock))
  }

  const saveInvoices = (newInvoices: KiyavaInvoice[]) => {
    setInvoices(newInvoices)
    localStorage.setItem('maxxi_app_invoices', JSON.stringify(newInvoices))
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
    if (confirm('Are you sure you want to delete this invoice from Maxxi Pharma ledger?')) {
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

  // Company Handlers
  const handleSaveCompany = (company: CompanyProfile) => {
    let updated: CompanyProfile[]
    if (editingCompany) {
      updated = companies.map((c) => (c.id === company.id ? company : c))
    } else {
      updated = [...companies, { ...company, id: company.id || `comp_${Date.now()}` }]
    }
    saveCompanies(updated)
    setIsCompanyModalOpen(false)
    setEditingCompany(null)
  }

  const handleDeleteCompany = (id: string) => {
    if (companies.length <= 1) {
      alert('At least one company profile must be maintained.')
      return
    }
    if (confirm('Delete this company profile?')) {
      saveCompanies(companies.filter((c) => c.id !== id))
    }
  }

  // Party Handlers
  const handleSaveParty = (party: PartyProfile) => {
    let updated: PartyProfile[]
    if (editingParty) {
      updated = parties.map((p) => (p.id === party.id ? party : p))
    } else {
      updated = [...parties, { ...party, id: party.id || `party_${Date.now()}` }]
    }
    saveParties(updated)
    setIsPartyModalOpen(false)
    setEditingParty(null)
  }

  const handleDeleteParty = (id: string) => {
    if (confirm('Delete this party / buyer profile?')) {
      saveParties(parties.filter((p) => p.id !== id))
    }
  }

  // Catalog Handlers
  const handleSaveCatalogItem = (item: CatalogItem) => {
    let updated: CatalogItem[]
    if (editingCatalogItem) {
      updated = catalog.map((cat) => (cat.id === item.id ? item : cat))
    } else {
      updated = [...catalog, { ...item, id: item.id || `cat_${Date.now()}` }]
    }
    saveCatalog(updated)
    setIsCatalogModalOpen(false)
    setEditingCatalogItem(null)

    // Sync with Opening Stock
    const existingStock = openingStock.find((s) => s.itemId === item.id)
    if (existingStock) {
      const updatedStock = openingStock.map((s) =>
        s.itemId === item.id
          ? { ...s, quantity: Number(item.quantity) || 0, itemName: item.name, unit: item.defaultUnit }
          : s
      )
      saveOpeningStock(updatedStock)
    } else if (item.quantity) {
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
    if (confirm('Delete this catalog product item?')) {
      saveCatalog(catalog.filter((cat) => cat.id !== id))
    }
  }

  // Opening Stock Handlers
  const handleSaveOpeningStockEntry = (entry: OpeningStockEntry) => {
    let updated: OpeningStockEntry[]
    if (editingOpeningStockEntry) {
      updated = openingStock.map((s) => (s.id === entry.id ? entry : s))
    } else {
      updated = [...openingStock, { ...entry, id: entry.id || `stk_${Date.now()}` }]
    }
    saveOpeningStock(updated)
    setIsOpeningStockModalOpen(false)
    setEditingOpeningStockEntry(null)
  }

  const handleDeleteOpeningStockEntry = (id: string) => {
    if (confirm('Delete this opening stock entry?')) {
      saveOpeningStock(openingStock.filter((s) => s.id !== id))
    }
  }

  // Financial Stats
  const totalInvoicesCount = invoices.length
  const totalBilledRevenue = invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0)
  const totalGstCollected = invoices.reduce((sum, inv) => sum + (inv.totalTaxAmount || 0), 0)
  const totalMaterialWeight = invoices.reduce((sum, inv) => sum + (inv.totalQuantity || 0), 0)

  const saleInvoices = invoices.filter((inv) => (inv.type || 'SALE') === 'SALE')
  const purchaseInvoices = invoices.filter((inv) => inv.type === 'PURCHASE')

  const saleTotalRevenue = saleInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0)
  const purchaseTotalSpend = purchaseInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0)

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

  return (
    <div className="w-full space-y-4 pt-0 animate-in fade-in duration-300">


      {/* 2. Key Accounting & Inventory Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Invoices</span>
          <h3 className="text-lg font-black text-slate-900 mt-0.5">{totalInvoicesCount}</h3>
          <p className="text-[10px] text-slate-400 font-medium">Invoices in Maxxi Ledger</p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm bg-gradient-to-br from-cyan-50/50 to-white border-cyan-100">
          <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider block flex items-center gap-1">
            <Activity className="w-3 h-3 text-cyan-600" /> Total Billed Value
          </span>
          <h3 className="text-lg font-black text-cyan-700 font-mono mt-0.5">
            ₹{totalBilledRevenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-cyan-600/80 font-medium">Gross Billed Value</p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">GST Tax Value</span>
          <h3 className="text-lg font-black text-blue-600 font-mono mt-0.5">
            ₹{totalGstCollected.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">CGST / SGST / IGST Tax</p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Material Qty</span>
          <h3 className="text-lg font-black text-slate-900 font-mono mt-0.5">
            {totalMaterialWeight.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">Units / Strips / kg</p>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 rounded-xl font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'invoices'
            ? 'bg-slate-900 text-white shadow-md'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
        >
          <Receipt className="w-3.5 h-3.5" />
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
            ? 'bg-cyan-600 text-white shadow-md'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          Company Profile ({companies.length})
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
          Product Catalog ({catalog.length})
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
      </div>

      {/* 4. TAB CONTENT: 1. INVOICES & PURCHASES LEDGER */}
      {activeTab === 'invoices' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Sub-Tab Toggle: Sale Summary | Purchase Summary */}
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
                {saleInvoices.length}
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
                {purchaseInvoices.length}
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
                {invoiceSummaryType === 'SALE' ? saleInvoices.length : purchaseInvoices.length}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">Invoices</p>
            </div>
            <div className={`rounded-2xl p-4 border shadow-sm ${invoiceSummaryType === 'SALE' ? 'bg-cyan-50 border-cyan-100' : 'bg-rose-50 border-rose-100'}`}>
              <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${invoiceSummaryType === 'SALE' ? 'text-cyan-600' : 'text-rose-500'}`}>
                {invoiceSummaryType === 'SALE' ? 'Total Revenue' : 'Total Spend'}
              </p>
              <h3 className={`text-lg font-black ${invoiceSummaryType === 'SALE' ? 'text-cyan-700' : 'text-rose-700'}`}>
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
              <p className="text-[10px] text-slate-400 font-medium">Tax Value</p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search invoice #, party, product..."
                className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Company:
              </span>
              <select
                value={filterCompany}
                onChange={(e) => setFilterCompany(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl px-2.5 py-1.5 outline-none focus:border-cyan-500 cursor-pointer"
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

          {/* Invoices Table */}
          {filteredInvoices.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-3 pl-5">Invoice #</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Buyer / Supplier</th>
                      <th className="p-3">Company (Seller)</th>
                      <th className="p-3 text-right">Taxable (₹)</th>
                      <th className="p-3 text-right">GST (₹)</th>
                      <th className="p-3 text-right">Grand Total (₹)</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right pr-5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 pl-5 font-mono font-black text-slate-900">
                          #{inv.invoiceNo}
                        </td>
                        <td className="p-3 text-slate-600">{inv.invoiceDate}</td>
                        <td className="p-3 font-bold text-slate-800">{inv.buyer.name}</td>
                        <td className="p-3 text-slate-600">{inv.company.name}</td>
                        <td className="p-3 text-right font-mono font-semibold text-slate-700">
                          ₹{inv.subtotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-mono font-semibold text-cyan-700">
                          ₹{inv.totalTaxAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-slate-900 text-sm">
                          ₹{inv.grandTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${inv.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                              }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-3 text-right pr-5">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedInvoiceForPrint(inv)}
                              className="px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors"
                              title="Print Tally Tax Invoice"
                            >
                              <Printer className="w-3.5 h-3.5" /> Print
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
              <h3 className="text-sm font-bold text-slate-800">No Invoices Recorded Yet</h3>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Maxxi Pharma ledger is clean. Click below to create your first Sale or Purchase Tax Invoice.
              </p>
              <div className="pt-1 flex items-center justify-center gap-2">
                <button
                  onClick={() => setActiveTab('create-sell')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md transition-all inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Create Sale Invoice
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. TAB CONTENT: 2. CREATE INVOICE FORM (PURCHASE OR SALE) */}
      {(activeTab === 'create-sell' || activeTab === 'create-purchase') && (
        <KiyavaInvoiceForm
          key={activeTab}
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
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-sm font-black text-slate-800">Company Profiles (Issuing &amp; Seller Entities)</h2>
              <p className="text-[11px] text-slate-400">
                Manage company profiles, GSTIN details, bank accounts &amp; invoice declarations for Maxxi Pharma.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingCompany(null)
                setIsCompanyModalOpen(true)
              }}
              className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add New Company
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {companies.map((comp) => (
              <div
                key={comp.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 relative group"
              >
                {comp.isDefault && (
                  <span className="absolute top-3 right-3 bg-cyan-100 text-cyan-800 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-cyan-600" /> Default Entity
                  </span>
                )}
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">{comp.name}</h3>
                  {comp.tagline && <p className="text-[10px] text-slate-400 font-medium">{comp.tagline}</p>}
                </div>

                <div className="space-y-1 text-[11px] text-slate-600 border-t border-b border-slate-100 py-2">
                  <p className="font-mono text-slate-700">GSTIN: {comp.gstin}</p>
                  <p className="truncate">
                    {comp.addressLine1}, {comp.city}, {comp.state} - {comp.pincode}
                  </p>
                  <p className="text-slate-500">Phone: {comp.phone}</p>
                  <p className="text-slate-500">Bank: {comp.bankName} ({comp.accountNo})</p>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => {
                      setEditingCompany(comp)
                      setIsCompanyModalOpen(true)
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={() => handleDeleteCompany(comp.id)}
                    className="px-2.5 py-1 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TAB CONTENT: 4. PARTIES MASTER */}
      {activeTab === 'parties' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-sm font-black text-slate-800">Parties &amp; Buyers Directory</h2>
              <p className="text-[11px] text-slate-400">
                Directory of customer accounts, distributors, suppliers (Kiyava, KSV), and packaging vendors.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingParty(null)
                setIsPartyModalOpen(true)
              }}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add New Party
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {parties.map((party) => (
              <div key={party.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">{party.name}</h3>
                    {party.contactPerson && (
                      <p className="text-[10px] text-slate-400 font-medium">Contact: {party.contactPerson}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1 text-[11px] text-slate-600 border-t border-b border-slate-100 py-2">
                  <p className="font-mono text-slate-700">GSTIN: {party.gstin || 'URP'}</p>
                  <p className="truncate">
                    {party.addressLine1}, {party.city}, {party.state} - {party.pincode}
                  </p>
                  <p className="text-slate-500">Phone: {party.phone}</p>
                  {party.transport && <p className="text-slate-500">Transport: {party.transport}</p>}
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => {
                      setEditingParty(party)
                      setIsPartyModalOpen(true)
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Edit Party
                  </button>
                  <button
                    onClick={() => handleDeleteParty(party.id)}
                    className="px-2.5 py-1 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TAB CONTENT: 5. PRODUCT CATALOG */}
      {activeTab === 'catalog' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-sm font-black text-slate-800">Maxxi Pharma Product Catalog</h2>
              <p className="text-[11px] text-slate-400">
                Pharma formulations, tablets, softgel capsules, syrups, ointments &amp; API ingredients.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingCatalogItem(null)
                setIsCatalogModalOpen(true)
              }}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Catalog Product
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">HSN Code</th>
                    <th className="p-3 text-right">Default Unit</th>
                    <th className="p-3 text-right">Default Rate (₹)</th>
                    <th className="p-3 text-right">Tax Rate (%)</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {catalog.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        {item.description && <div className="text-[10px] text-slate-400">{item.description}</div>}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-cyan-50 text-cyan-700 text-[10px] font-bold rounded-md uppercase border border-cyan-200/60">
                          {item.category || 'Pharma'}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-600">{item.hsnCode}</td>
                      <td className="p-3 text-right font-semibold uppercase">{item.defaultUnit}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        ₹{item.defaultRate?.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-600">{item.defaultTaxRate}%</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditingCatalogItem(item)
                              setIsCatalogModalOpen(true)
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCatalogItem(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
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
        </div>
      )}

      {/* 4. TAB CONTENT: 6. OPENING STOCK */}
      {activeTab === 'opening-stock' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-sm font-black text-slate-800">Maxxi Pharma Stock Register</h2>
              <p className="text-[11px] text-slate-400">
                Record starting inventory balances for raw materials, finished strips, bottles and packaging stock.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingOpeningStockEntry(null)
                setIsOpeningStockModalOpen(true)
              }}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Opening Stock
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                    <th className="p-3">Date</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3 text-right">Quantity</th>
                    <th className="p-3 text-right">Unit</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {openingStock.length > 0 ? (
                    openingStock.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3 text-slate-500">{entry.date}</td>
                        <td className="p-3 font-bold text-slate-900">{entry.itemName}</td>
                        <td className="p-3 text-right font-mono font-bold text-purple-700">{entry.quantity}</td>
                        <td className="p-3 text-right font-semibold uppercase text-slate-600">{entry.unit}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setEditingOpeningStockEntry(entry)
                                setIsOpeningStockModalOpen(true)
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteOpeningStockEntry(entry.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                        No opening stock entries recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {selectedInvoiceForPrint && (
        <TallyInvoicePrint
          invoice={selectedInvoiceForPrint}
          onClose={() => setSelectedInvoiceForPrint(null)}
        />
      )}

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
        onSave={handleSaveOpeningStockEntry}
        initialData={editingOpeningStockEntry}
        catalog={catalog}
      />
    </div>
  )
}
