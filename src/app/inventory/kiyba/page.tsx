"use client"

import React, { useState, useEffect } from 'react'
import {
  CompanyProfile,
  PartyProfile,
  CatalogItem,
  KiybaInvoice
} from '@/types/kiybaBilling'
import {
  DEFAULT_COMPANIES,
  DEFAULT_PARTIES,
  DEFAULT_CATALOG,
  SEEDED_INVOICES
} from '@/lib/kiybaDefaults'
import KiybaInvoiceForm from '@/components/kiyba/KiybaInvoiceForm'
import TallyInvoicePrint from '@/components/kiyba/TallyInvoicePrint'
import CompanyModal from '@/components/kiyba/CompanyModal'
import PartyModal from '@/components/kiyba/PartyModal'
import CatalogModal from '@/components/kiyba/CatalogModal'
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
  RotateCcw
} from 'lucide-react'

export default function KiybaPage() {
  // State for data
  const [companies, setCompanies] = useState<CompanyProfile[]>([])
  const [parties, setParties] = useState<PartyProfile[]>([])
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [invoices, setInvoices] = useState<KiybaInvoice[]>([])

  // Active Tab: 'invoices' | 'create' | 'companies' | 'parties' | 'catalog'
  const [activeTab, setActiveTab] = useState<string>('invoices')

  // Modals & Print Previews
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<KiybaInvoice | null>(null)
  const [editingInvoice, setEditingInvoice] = useState<KiybaInvoice | null>(null)

  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<CompanyProfile | null>(null)

  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false)
  const [editingParty, setEditingParty] = useState<PartyProfile | null>(null)

  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false)
  const [editingCatalogItem, setEditingCatalogItem] = useState<CatalogItem | null>(null)

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCompany, setFilterCompany] = useState<string>('ALL')

  // Load Initial Data from localStorage or clean defaults
  useEffect(() => {
    try {
      const storedCompanies = localStorage.getItem('ksv_kiyba_companies')
      const storedParties = localStorage.getItem('ksv_kiyba_parties')
      const storedCatalog = localStorage.getItem('ksv_kiyba_catalog')
      const storedInvoices = localStorage.getItem('ksv_kiyba_invoices')

      setCompanies(storedCompanies ? JSON.parse(storedCompanies) : DEFAULT_COMPANIES)
      setParties(storedParties ? JSON.parse(storedParties) : DEFAULT_PARTIES)
      setCatalog(storedCatalog ? JSON.parse(storedCatalog) : DEFAULT_CATALOG)
      setInvoices(storedInvoices ? JSON.parse(storedInvoices) : SEEDED_INVOICES)
    } catch (e) {
      console.error('Failed to load Kiyba storage data:', e)
      setCompanies(DEFAULT_COMPANIES)
      setParties(DEFAULT_PARTIES)
      setCatalog(DEFAULT_CATALOG)
      setInvoices(SEEDED_INVOICES)
    }
  }, [])

  // Persist helpers
  const saveCompanies = (newCompanies: CompanyProfile[]) => {
    setCompanies(newCompanies)
    localStorage.setItem('ksv_kiyba_companies', JSON.stringify(newCompanies))
  }

  const saveParties = (newParties: PartyProfile[]) => {
    setParties(newParties)
    localStorage.setItem('ksv_kiyba_parties', JSON.stringify(newParties))
  }

  const saveCatalog = (newCatalog: CatalogItem[]) => {
    setCatalog(newCatalog)
    localStorage.setItem('ksv_kiyba_catalog', JSON.stringify(newCatalog))
  }

  const saveInvoices = (newInvoices: KiybaInvoice[]) => {
    setInvoices(newInvoices)
    localStorage.setItem('ksv_kiyba_invoices', JSON.stringify(newInvoices))
  }

  // Invoice Handlers
  const handleSaveInvoice = (invoice: KiybaInvoice, shouldPrint: boolean = false) => {
    const exists = invoices.some((inv) => inv.id === invoice.id)
    let updated: KiybaInvoice[]
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
    if (confirm('Are you sure you want to delete this invoice from Kiyba ledger?')) {
      const updated = invoices.filter((inv) => inv.id !== id)
      saveInvoices(updated)
    }
  }

  const handleDuplicateInvoice = (invoice: KiybaInvoice) => {
    const duplicated: KiybaInvoice = {
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
  }

  const handleDeleteCatalogItem = (id: string) => {
    if (confirm('Delete this item from catalog?')) {
      const updated = catalog.filter((c) => c.id !== id)
      saveCatalog(updated)
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
    return matchesSearch && matchesCompany
  })

  return (
    <div className="w-full space-y-3.5 pt-0 animate-in fade-in duration-300">
      {/* 1. Header Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm w-full">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 font-mono">
              Gateway of Tally • Kiyba
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Tax Invoicing &amp; Billing Ledger
          </h1>
          <p className="text-[11px] text-slate-500 font-medium">
            Fast GST Tax Invoicing with HSN summary, Company master &amp; instant A4 print
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              setEditingInvoice(null)
              setActiveTab('create')
            }}
            className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/25 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Create Tax Invoice
          </button>
        </div>
      </div>

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
          className={`px-4 py-2 rounded-xl font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'invoices'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Tax Invoices ({invoices.length})
        </button>

        <button
          onClick={() => {
            setEditingInvoice(null)
            setActiveTab('create')
          }}
          className={`px-4 py-2 rounded-xl font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'create'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          {editingInvoice ? 'Edit Tax Invoice' : '+ Create Tax Invoice'}
        </button>

        <button
          onClick={() => setActiveTab('companies')}
          className={`px-4 py-2 rounded-xl font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'companies'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          Company Master ({companies.length})
        </button>

        <button
          onClick={() => setActiveTab('parties')}
          className={`px-4 py-2 rounded-xl font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'parties'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Parties / Buyers ({parties.length})
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 rounded-xl font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'catalog'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          Catalog Master ({catalog.length})
        </button>
      </div>

      {/* 4. TAB CONTENT: 1. INVOICES */}
      {activeTab === 'invoices' && (
        <div className="space-y-4 animate-in fade-in duration-300">
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
                                setActiveTab('create')
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
                  onClick={() => setActiveTab('create')}
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
      {activeTab === 'create' && (
        <KiybaInvoiceForm
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
              <h2 className="text-sm font-black text-slate-800">Company Master (Issuing Entities)</h2>
              <p className="text-xs text-slate-400 font-medium">Manage Seller Companies, GSTIN &amp; Bank Details</p>
            </div>
            <button
              onClick={() => {
                setEditingCompany(null)
                setIsCompanyModalOpen(true)
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> + New Company
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
            <button
              onClick={() => {
                setEditingCatalogItem(null)
                setIsCatalogModalOpen(true)
              }}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> + Add Item
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3 pl-5">Item / Herb Name</th>
                    <th className="p-3 text-center">HSN/SAC</th>
                    <th className="p-3 text-center">Unit</th>
                    <th className="p-3 text-right">Default Rate (₹)</th>
                    <th className="p-3 text-center">GST Rate</th>
                    <th className="p-3 text-right pr-5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {catalog.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-3 pl-5 font-bold text-slate-900">{item.name}</td>
                      <td className="p-3 text-center font-mono font-bold text-slate-700">{item.hsnCode}</td>
                      <td className="p-3 text-center font-medium text-slate-700">{item.defaultUnit}</td>
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

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
    </div>
  )
}
