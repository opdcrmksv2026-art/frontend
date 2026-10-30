"use client"

import React, { useState, useEffect } from 'react'
import {
  CompanyProfile,
  PartyProfile,
  CatalogItem,
  KiyavaInvoice,
  OpeningStockEntry,
  ManufacturingLog,
  StockTransferLog
} from '@/types/kiyavaBilling'
import {
  DEFAULT_KSV_COMPANIES,
  DEFAULT_KSV_PARTIES,
  DEFAULT_KSV_CATALOG,
  SEEDED_KSV_INVOICES
} from '@/lib/ksvDefaults'
import { DEFAULT_MAXXI_CATALOG } from '@/lib/maxxiDefaults'
import KiyavaInvoiceForm from '@/components/kiyava/KiyavaInvoiceForm'
import TallyInvoicePrint from '@/components/kiyava/TallyInvoicePrint'
import TallyManufacturingPrint from '@/components/kiyava/TallyManufacturingPrint'
import CompanyModal from '@/components/kiyava/CompanyModal'
import PartyModal from '@/components/kiyava/PartyModal'
import CatalogModal from '@/components/kiyava/CatalogModal'
import OpeningStockModal from '@/components/kiyava/OpeningStockModal'
import ManufacturingModal from '@/components/kiyava/ManufacturingModal'
import StockRegisterTab from '@/components/kiyava/StockRegisterTab'
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
  TrendingUp,
  Receipt,
  RotateCcw,
  ShoppingCart,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  CheckCircle2,
  FlaskConical,
  Factory,
  X,
  Save
} from 'lucide-react'

import { API_URL } from '@/lib/apiConfig'

export default function KsvPage() {
  // State for data
  const [companies, setCompanies] = useState<CompanyProfile[]>([])
  const [parties, setParties] = useState<PartyProfile[]>([])
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [invoices, setInvoices] = useState<KiyavaInvoice[]>([])
  const [openingStock, setOpeningStock] = useState<OpeningStockEntry[]>([])
  const [manufacturingLogs, setManufacturingLogs] = useState<ManufacturingLog[]>([])
  const [stockTransfers, setStockTransfers] = useState<StockTransferLog[]>([])

  // Active Tab: 'invoices' | 'create-purchase' | 'create-sell' | 'companies' | 'parties' | 'catalog' | 'opening-stock' | 'manufacturing'
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
  const [selectedMfgLogForPrint, setSelectedMfgLogForPrint] = useState<ManufacturingLog | null>(null)

  // Stock Transfer Modal (KSV Store <-> KSV Factory)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [transferForm, setTransferForm] = useState<{
    batchId: string
    batchNo: string
    itemId: string
    itemName: string
    quantity: number
    unit: string
    direction: 'STORE_TO_FACTORY' | 'FACTORY_TO_STORE'
    date: string
    notes: string
  }>({
    batchId: '',
    batchNo: '',
    itemId: '',
    itemName: '',
    quantity: 1,
    unit: 'PCS',
    direction: 'STORE_TO_FACTORY',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  })
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('')
  const [factorySearchQuery, setFactorySearchQuery] = useState('')
  const [filterCompany, setFilterCompany] = useState<string>('ALL')
  const [invoiceSummaryType, setInvoiceSummaryType] = useState<'SALE' | 'PURCHASE' | 'ALL'>('SALE')

  // Load Initial Data from localStorage or clean defaults
  useEffect(() => {
    try {
      const storedCompanies = localStorage.getItem('ksv_app_companies_v2')
      const storedParties = localStorage.getItem('ksv_app_parties')
      const storedCatalog = localStorage.getItem('ksv_app_catalog')
      const storedInvoices = localStorage.getItem('ksv_app_invoices')
      const storedOpeningStock = localStorage.getItem('ksv_app_opening_stock')
      const storedMfgLogs = localStorage.getItem('ksv_app_manufacturing')
      const storedTransfers = localStorage.getItem('ksv_app_stock_transfers')

      setCompanies(storedCompanies ? JSON.parse(storedCompanies) : DEFAULT_KSV_COMPANIES)

      // Migration: Ensure MAXXI PHARMA exists in parties if it was missed in older localStorage
      let parsedParties = storedParties ? JSON.parse(storedParties) : DEFAULT_KSV_PARTIES
      if (!parsedParties.some((p: any) => p.id === 'party_maxxi')) {
        const maxxi = DEFAULT_KSV_PARTIES.find(p => p.id === 'party_maxxi')
        if (maxxi) {
          parsedParties.push(maxxi)
          localStorage.setItem('ksv_app_parties', JSON.stringify(parsedParties))
        }
      }
      setParties(parsedParties)

      // Migration: Ensure all finished goods from manufacturing logs are in the catalog
      let parsedCatalog = storedCatalog ? JSON.parse(storedCatalog) : []
      parsedCatalog = parsedCatalog.filter((c: any) => !c.id.startsWith('cat_ksv_'))
      if (storedMfgLogs) {
        const parsedLogs = JSON.parse(storedMfgLogs)
        let catalogChanged = false
        parsedLogs.forEach((log: any) => {
          if (log.finishedGoodName && !parsedCatalog.some((c: any) => c.name.toLowerCase() === log.finishedGoodName.toLowerCase())) {
            parsedCatalog.push({
              id: log.finishedGoodItemId || `cat_mfg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
              name: log.finishedGoodName,
              hsnCode: '',
              defaultUnit: 'PCS',
              defaultRate: log.effectiveRatePerUnit || 0,
              defaultTaxRate: 12,
              category: 'medicine',
              description: 'Auto-added from Manufacturing'
            })
            catalogChanged = true
          }
        })
        if (catalogChanged) {
          localStorage.setItem('ksv_app_catalog', JSON.stringify(parsedCatalog))
        }
      }
      setCatalog(parsedCatalog)

      if (storedInvoices) {
        try {
          const parsed = JSON.parse(storedInvoices)
          const clean = (parsed || []).filter((inv: any) => !inv.id?.startsWith('inv_ksv_pur_') && inv.invoiceNo !== 'KYV/2026/089')
          setInvoices(clean)
          localStorage.setItem('ksv_app_invoices', JSON.stringify(clean))
        } catch {
          setInvoices([])
        }
      } else {
        setInvoices([])
      }

      setOpeningStock(storedOpeningStock ? JSON.parse(storedOpeningStock) : [])
      setManufacturingLogs(storedMfgLogs ? JSON.parse(storedMfgLogs) : [])
      setStockTransfers(storedTransfers ? JSON.parse(storedTransfers) : [])

      // --- FETCH LIVE DATA FROM BACKEND DATABASE (MongoDB) ---
      const fetchDatabaseData = async () => {
        try {
          // 1. Fetch live product catalog from database
          const catRes = await fetch(`${API_URL}/api/ksv/catalog`)
          if (catRes.ok) {
            const dbCatalog: CatalogItem[] = await catRes.json()
            if (Array.isArray(dbCatalog) && dbCatalog.length > 0) {
              setCatalog(dbCatalog)
              localStorage.setItem('ksv_app_catalog', JSON.stringify(dbCatalog))
            } else if (Array.isArray(dbCatalog) && dbCatalog.length === 0 && parsedCatalog.length > 0) {
              // Initial database sync: Seed current catalog into MongoDB
              for (const it of parsedCatalog) {
                try {
                  await fetch(`${API_URL}/api/ksv/catalog`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: it.name,
                      hsnCode: it.hsnCode || '',
                      defaultUnit: it.defaultUnit || 'PCS',
                      defaultRate: Number(it.defaultRate) || 0,
                      defaultTaxRate: Number(it.defaultTaxRate) || 0,
                      description: it.description || '',
                      category: it.category || 'medicine',
                      quantity: Number(it.quantity) || 0
                    })
                  })
                } catch (_) {}
              }
            }
          }

          // 2. Fetch live invoices from database
          const invRes = await fetch(`${API_URL}/api/ksv/invoices`)
          if (invRes.ok) {
            const dbInvoices: KiyavaInvoice[] = await invRes.json()
            if (Array.isArray(dbInvoices) && dbInvoices.length > 0) {
              setInvoices(dbInvoices)
              localStorage.setItem('ksv_app_invoices', JSON.stringify(dbInvoices))
            }
          }

          // 3. Fetch live parties from database
          const partiesRes = await fetch(`${API_URL}/api/ksv/parties`)
          if (partiesRes.ok) {
            const dbParties = await partiesRes.json()
            if (Array.isArray(dbParties) && dbParties.length > 0) {
              setParties(dbParties)
              localStorage.setItem('ksv_app_parties', JSON.stringify(dbParties))
            }
          }

          // 4. Fetch live companies from database
          const compRes = await fetch(`${API_URL}/api/ksv/companies`)
          if (compRes.ok) {
            const dbCompanies = await compRes.json()
            if (Array.isArray(dbCompanies) && dbCompanies.length > 0) {
              setCompanies(dbCompanies)
              localStorage.setItem('ksv_app_companies_v2', JSON.stringify(dbCompanies))
            }
          }
        } catch (dbErr) {
          console.warn('Backend database fetch offline or network error, continuing with local storage:', dbErr)
        }
      }
      fetchDatabaseData()
    } catch (e) {
      console.error('Failed to load KSV storage data:', e)
      setCompanies(DEFAULT_KSV_COMPANIES)
      setParties(DEFAULT_KSV_PARTIES)
      setCatalog([])
      setInvoices([])
      setOpeningStock([])
      setManufacturingLogs([])
    }
  }, [])

  // Persist helpers
  const saveCompanies = (newCompanies: CompanyProfile[]) => {
    setCompanies(newCompanies)
    localStorage.setItem('ksv_app_companies_v2', JSON.stringify(newCompanies))
  }

  const saveParties = (newParties: PartyProfile[]) => {
    setParties(newParties)
    localStorage.setItem('ksv_app_parties', JSON.stringify(newParties))
  }

  const saveCatalog = (newCatalog: CatalogItem[]) => {
    setCatalog(newCatalog)
    localStorage.setItem('ksv_app_catalog', JSON.stringify(newCatalog))
  }

  const saveOpeningStock = (newStock: OpeningStockEntry[]) => {
    setOpeningStock(newStock)
    localStorage.setItem('ksv_app_opening_stock', JSON.stringify(newStock))
  }

  const saveInvoices = (newInvoices: KiyavaInvoice[]) => {
    setInvoices(newInvoices)
    localStorage.setItem('ksv_app_invoices', JSON.stringify(newInvoices))
  }

  const saveStockTransfers = (newTransfers: StockTransferLog[]) => {
    setStockTransfers(newTransfers)
    localStorage.setItem('ksv_app_stock_transfers', JSON.stringify(newTransfers))
  }

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all data for KSV? This will restore initial seeded records.')) {
      localStorage.removeItem('ksv_app_companies_v2')
      localStorage.removeItem('ksv_app_parties')
      localStorage.removeItem('ksv_app_catalog')
      localStorage.removeItem('ksv_app_invoices')
      localStorage.removeItem('ksv_app_opening_stock')
      localStorage.removeItem('ksv_app_manufacturing')
      localStorage.removeItem('ksv_app_stock_transfers')

      setCompanies(DEFAULT_KSV_COMPANIES)
      setParties(DEFAULT_KSV_PARTIES)
      setCatalog(DEFAULT_KSV_CATALOG)
      setInvoices(SEEDED_KSV_INVOICES)
      setOpeningStock([])
      setManufacturingLogs([])
      setStockTransfers([])
      setInvoiceSummaryType('SALE')
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

    // Auto-sync to Maxxi Pharma as PURCHASE if KSV is selling to Maxxi
    const buyerNameStr = invoice.buyer.name.toLowerCase()
    if ((invoice.type || 'SALE') === 'SALE' && (buyerNameStr.includes('maxxi') || buyerNameStr.includes('maxi'))) {
      try {
        const maxxiStored = localStorage.getItem('maxxi_app_invoices')
        const maxxiInvoices = maxxiStored ? JSON.parse(maxxiStored) : []

        const maxxiPurchaseInvoice = JSON.parse(JSON.stringify(invoice))
        maxxiPurchaseInvoice.type = 'PURCHASE'

        const existingIndex = maxxiInvoices.findIndex((inv: any) => inv.id === invoice.id)
        if (existingIndex >= 0) {
          maxxiInvoices[existingIndex] = maxxiPurchaseInvoice
        } else {
          maxxiInvoices.unshift(maxxiPurchaseInvoice)
        }

        localStorage.setItem('maxxi_app_invoices', JSON.stringify(maxxiInvoices))

        // Also sync products to Maxxi catalog so they appear in Live Stock
        const maxxiCatalogStored = localStorage.getItem('maxxi_app_catalog')
        const maxxiCatalog = maxxiCatalogStored ? JSON.parse(maxxiCatalogStored) : []

        let catalogChanged = false
        invoice.items.forEach(item => {
          if (!maxxiCatalog.some((c: any) => c.name.toLowerCase() === item.description.toLowerCase())) {
            maxxiCatalog.push({
              id: `cat_sync_${Date.now()}_${Math.random().toString(36).substring(7)}`,
              name: item.description,
              hsnCode: item.hsnSac || '',
              defaultUnit: item.unit || 'PCS',
              defaultRate: item.rate || 0,
              defaultTaxRate: item.taxRate || 0,
              category: 'medicine',
              description: 'Auto-added from KSV purchase'
            })
            catalogChanged = true
          }
        })

        if (catalogChanged) {
          localStorage.setItem('maxxi_app_catalog', JSON.stringify(maxxiCatalog))
        }
      } catch (e) {
        console.error('Failed to sync invoice to Maxxi Pharma:', e)
      }
    }

    // Persist to MongoDB database
    try {
      if (exists) {
        fetch(`${API_URL}/api/ksv/invoices/${invoice.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invoice)
        }).catch(() => {})
      } else {
        fetch(`${API_URL}/api/ksv/invoices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invoice)
        }).catch(() => {})
      }
    } catch (e) {}

    if (shouldPrint) {
      setSelectedInvoiceForPrint(invoice)
    } else {
      setActiveTab('invoices')
      setInvoiceSummaryType((invoice.type || 'SALE') as any)
    }
  }

  const handleDeleteInvoice = (id: string) => {
    if (confirm('Are you sure you want to delete this invoice from KSV ledger?')) {
      const updated = invoices.filter((inv) => inv.id !== id)
      saveInvoices(updated)
      try {
        fetch(`${API_URL}/api/ksv/invoices/${id}`, { method: 'DELETE' }).catch(() => {})
      } catch (e) {}
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
    try {
      if (editingCompany) {
        fetch(`${API_URL}/api/ksv/companies/${company.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(company)
        }).catch(() => {})
      } else {
        fetch(`${API_URL}/api/ksv/companies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(company)
        }).catch(() => {})
      }
    } catch (e) {}
  }

  const handleDeleteCompany = (id: string) => {
    if (confirm('Delete this company profile?')) {
      saveCompanies(companies.filter((c) => c.id !== id))
      try {
        fetch(`${API_URL}/api/ksv/companies/${id}`, { method: 'DELETE' }).catch(() => {})
      } catch (e) {}
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
    try {
      if (editingParty) {
        fetch(`${API_URL}/api/ksv/parties/${party.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(party)
        }).catch(() => {})
      } else {
        fetch(`${API_URL}/api/ksv/parties`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(party)
        }).catch(() => {})
      }
    } catch (e) {}
  }

  const handleDeleteParty = (id: string) => {
    if (confirm('Delete this party / buyer profile?')) {
      saveParties(parties.filter((p) => p.id !== id))
      try {
        fetch(`${API_URL}/api/ksv/parties/${id}`, { method: 'DELETE' }).catch(() => {})
      } catch (e) {}
    }
  }

  // Catalog Handlers - Integrated with MongoDB Database
  const handleSaveCatalogItem = async (item: CatalogItem) => {
    const isEditing = Boolean(editingCatalogItem && editingCatalogItem.id)
    const originalId = editingCatalogItem?.id || item.id

    // 1. Optimistic Update in State & LocalStorage
    let updated: CatalogItem[]
    if (isEditing) {
      updated = catalog.map((cat) => (cat.id === originalId ? item : cat))
    } else {
      updated = [...catalog, { ...item, id: item.id || `cat_${Date.now()}` }]
    }
    saveCatalog(updated)
    setIsCatalogModalOpen(false)
    setEditingCatalogItem(null)

    // 2. Persist to MongoDB database via Prisma backend
    try {
      const payload = {
        name: item.name,
        hsnCode: item.hsnCode || '',
        defaultUnit: item.defaultUnit || 'PCS',
        defaultRate: Number(item.defaultRate) || 0,
        defaultTaxRate: Number(item.defaultTaxRate) || 0,
        description: item.description || '',
        category: item.category || 'medicine',
        quantity: Number(item.quantity) || 0
      }

      if (isEditing && originalId && !originalId.startsWith('cat_')) {
        const res = await fetch(`${API_URL}/api/ksv/catalog/${originalId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (res.ok) {
          const savedData = await res.json()
          setCatalog((prev) =>
            prev.map((c) => (c.id === originalId ? { ...c, ...savedData, id: savedData.id || originalId } : c))
          )
        }
      } else {
        const res = await fetch(`${API_URL}/api/ksv/catalog`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (res.ok) {
          const savedData = await res.json()
          if (savedData && savedData.id) {
            const finalList = updated.map((c) =>
              c.name === item.name && (!c.id || c.id.startsWith('cat_')) ? { ...item, id: savedData.id } : c
            )
            saveCatalog(finalList)
          }
        }
      }
    } catch (err) {
      console.warn('Backend database sync offline, product saved locally:', err)
    }
  }

  const handleDeleteCatalogItem = async (id: string) => {
    if (confirm('Delete this catalog product item?')) {
      saveCatalog(catalog.filter((cat) => cat.id !== id))
      try {
        await fetch(`${API_URL}/api/ksv/catalog/${id}`, { method: 'DELETE' })
      } catch (err) {
        console.warn('Could not delete catalog product from database:', err)
      }
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

  const saveManufacturingLogs = (newLogs: ManufacturingLog[]) => {
    setManufacturingLogs(newLogs)
    localStorage.setItem('ksv_app_manufacturing', JSON.stringify(newLogs))
  }

  // Helper to compute KSV Store vs KSV Factory stock for any item
  const getItemStockBreakdown = (itemId: string, itemName: string, defaultUnit: string = 'PCS', defaultQty: number = 0) => {
    const nameLower = (itemName || '').toLowerCase()
    const openingEntry = openingStock.find(
      (s) => s.itemId === itemId || (s.itemName && s.itemName.toLowerCase() === nameLower)
    )
    const openingQty = openingEntry?.quantity || Number(defaultQty) || 0
    const unit = openingEntry?.unit ?? defaultUnit

    // Purchased Qty (goes into KSV Store)
    const purchasedQty = invoices
      .filter((inv) => inv.type === 'PURCHASE')
      .reduce((sum, inv) => {
        const rows = inv.items.filter((it) => it.description.toLowerCase() === nameLower)
        return sum + rows.reduce((s, r) => s + (r.quantity || 0), 0)
      }, 0)

    // Sold Qty (split by KSV Store vs KSV Factory)
    let soldFromStoreQty = 0
    let soldFromFactoryQty = 0
    invoices
      .filter((inv) => (inv.type || 'SALE') === 'SALE')
      .forEach((inv) => {
        const rows = inv.items.filter((it) => it.description.toLowerCase() === nameLower)
        const qty = rows.reduce((s, r) => s + (r.quantity || 0), 0)
        if (inv.matCenter === 'KSV Factory') {
          soldFromFactoryQty += qty
        } else {
          soldFromStoreQty += qty
        }
      })
    const soldQty = soldFromStoreQty + soldFromFactoryQty

    // Manufactured Qty (Produced in KSV Store)
    const manufacturedQty = manufacturingLogs
      .filter((log) => log.finishedGoodItemId === itemId || log.finishedGoodName.toLowerCase() === nameLower)
      .reduce((sum, log) => sum + (log.producedQuantity || 0), 0)

    // Consumed Qty in Manufacturing (Raw Materials from KSV Store)
    const consumedQty = manufacturingLogs.reduce((sum, log) => {
      const consumed = log.rawMaterialsConsumed.filter(
        (rm) => rm.itemId === itemId || rm.itemName.toLowerCase() === nameLower
      )
      return sum + consumed.reduce((s, rm) => s + (rm.quantity || 0), 0)
    }, 0)

    // Net Transferred from KSV Store to KSV Factory
    const transferredToFactoryQty = stockTransfers
      .filter((tr) => tr.itemId === itemId || tr.itemName.toLowerCase() === nameLower)
      .reduce((sum, tr) => {
        return sum + (tr.direction === 'STORE_TO_FACTORY' ? tr.quantity : -tr.quantity)
      }, 0)

    const storeClosingQty = openingQty + purchasedQty + manufacturedQty - consumedQty - transferredToFactoryQty - soldFromStoreQty
    const factoryClosingQty = transferredToFactoryQty - soldFromFactoryQty
    const closingQty = storeClosingQty + factoryClosingQty

    return {
      openingQty,
      purchasedQty,
      soldQty,
      soldFromStoreQty,
      soldFromFactoryQty,
      manufacturedQty,
      consumedQty,
      transferredToFactoryQty,
      storeClosingQty,
      factoryClosingQty,
      closingQty,
      unit
    }
  }

  // Manufacturing Handlers
  const handleSaveManufacturingLog = (log: ManufacturingLog) => {
    const exists = manufacturingLogs.some((l) => l.id === log.id)
    const updated = exists
      ? manufacturingLogs.map((l) => (l.id === log.id ? log : l))
      : [...manufacturingLogs, log]
    saveManufacturingLogs(updated)

    // If user specified an initial transfer to KSV Factory inside the Manufacturing Modal, record it
    if (!exists && log.transferredToFactoryQty && log.transferredToFactoryQty > 0) {
      const newTransfer: StockTransferLog = {
        id: `tr_${Date.now()}`,
        date: log.date,
        batchId: log.id,
        batchNo: log.batchNo || '',
        itemId: log.finishedGoodItemId,
        itemName: log.finishedGoodName,
        quantity: Number(log.transferredToFactoryQty),
        unit: log.unit || 'PCS',
        direction: 'STORE_TO_FACTORY',
        notes: `Transferred from Batch ${log.batchNo || 'N/A'} during production`,
        createdAt: new Date().toISOString()
      }
      saveStockTransfers([newTransfer, ...stockTransfers])
    }

    // Ensure the finished product is added to the Catalog so it appears in the Sales Dropdown
    if (log.finishedGoodName) {
      const alreadyInCatalog = catalog.some(c => c.name.toLowerCase() === log.finishedGoodName.toLowerCase())
      if (!alreadyInCatalog) {
        const newCatalogItem: CatalogItem = {
          id: log.finishedGoodItemId || `cat_mfg_${Date.now()}`,
          name: log.finishedGoodName,
          hsnCode: '', // Can be edited later
          defaultUnit: log.unit || 'PCS',
          defaultRate: log.effectiveRatePerUnit || 0,
          defaultTaxRate: 12,
          category: 'medicine',
          description: 'Auto-added from Manufacturing'
        }
        saveCatalog([...catalog, newCatalogItem])
      }
    }
  }

  const handleDeleteManufacturingLog = (id: string) => {
    if (confirm('Delete this manufacturing entry? Stock will be updated accordingly.')) {
      const updated = manufacturingLogs.filter((l) => l.id !== id)
      saveManufacturingLogs(updated)
      // Also clean up any stock transfers linked to this batch
      const updatedTransfers = stockTransfers.filter((tr) => tr.batchId !== id)
      if (updatedTransfers.length !== stockTransfers.length) {
        saveStockTransfers(updatedTransfers)
      }
    }
  }

  // Open Stock Transfer Modal for a specific Production Batch
  const openTransferModalForBatch = (log: ManufacturingLog) => {
    const batchTransferred = stockTransfers
      .filter((tr) => tr.batchId === log.id)
      .reduce((sum, tr) => sum + (tr.direction === 'STORE_TO_FACTORY' ? tr.quantity : -tr.quantity), 0)
    const remainingInBatchStore = Math.max(0, (log.producedQuantity || 0) - batchTransferred)

    setTransferForm({
      batchId: log.id,
      batchNo: log.batchNo || '',
      itemId: log.finishedGoodItemId,
      itemName: log.finishedGoodName,
      quantity: remainingInBatchStore > 0 ? remainingInBatchStore : 1,
      unit: log.unit || 'PCS',
      direction: remainingInBatchStore > 0 ? 'STORE_TO_FACTORY' : 'FACTORY_TO_STORE',
      date: new Date().toISOString().split('T')[0],
      notes: log.batchNo ? `Batch ${log.batchNo} transfer` : ''
    })
    setIsTransferModalOpen(true)
  }

  // Open Stock Transfer Modal for a Catalog Item (or blank)
  const openTransferModalForItem = (item?: CatalogItem) => {
    if (item) {
      const breakdown = getItemStockBreakdown(item.id, item.name, item.defaultUnit, item.quantity)
      setTransferForm({
        batchId: '',
        batchNo: '',
        itemId: item.id,
        itemName: item.name,
        quantity: breakdown.storeClosingQty > 0 ? breakdown.storeClosingQty : 1,
        unit: item.defaultUnit || 'PCS',
        direction: 'STORE_TO_FACTORY',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      })
    } else {
      const firstMfg = manufacturingLogs[0]
      const firstItem = catalog[0]
      setTransferForm({
        batchId: firstMfg?.id || '',
        batchNo: firstMfg?.batchNo || '',
        itemId: firstMfg?.finishedGoodItemId || firstItem?.id || '',
        itemName: firstMfg?.finishedGoodName || firstItem?.name || '',
        quantity: 1,
        unit: firstMfg?.unit || firstItem?.defaultUnit || 'PCS',
        direction: 'STORE_TO_FACTORY',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      })
    }
    setIsTransferModalOpen(true)
  }

  const handleSaveStockTransfer = (e: React.FormEvent) => {
    e.preventDefault()
    if (!transferForm.itemName.trim() || transferForm.quantity <= 0) {
      alert('Please select a valid product and transfer quantity (> 0).')
      return
    }

    const newTransfer: StockTransferLog = {
      id: `tr_${Date.now()}`,
      date: transferForm.date || new Date().toISOString().split('T')[0],
      batchId: transferForm.batchId || undefined,
      batchNo: transferForm.batchNo || undefined,
      itemId: transferForm.itemId || `item_${Date.now()}`,
      itemName: transferForm.itemName.trim(),
      quantity: Number(transferForm.quantity) || 0,
      unit: transferForm.unit || 'PCS',
      direction: transferForm.direction,
      notes: transferForm.notes,
      createdAt: new Date().toISOString()
    }

    saveStockTransfers([newTransfer, ...stockTransfers])
    setIsTransferModalOpen(false)
  }

  const handleDeleteStockTransfer = (id: string) => {
    if (confirm('Reverse / delete this stock transfer entry?')) {
      saveStockTransfers(stockTransfers.filter((tr) => tr.id !== id))
    }
  }

  // Financial Stats
  const saleInvoices = invoices.filter((inv) => (inv.type || 'SALE') === 'SALE')
  const purchaseInvoices = invoices.filter((inv) => inv.type === 'PURCHASE')

  const totalInvoicesCount = invoices.length
  const totalPurchasedFromKiyava = purchaseInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0)
  const totalSalesRevenue = saleInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0)
  const totalGstCollected = invoices.reduce((sum, inv) => sum + (inv.totalTaxAmount || 0), 0)

  const saleGst = saleInvoices.reduce((sum, inv) => sum + (inv.totalTaxAmount || 0), 0)
  const purchaseGst = purchaseInvoices.reduce((sum, inv) => sum + (inv.totalTaxAmount || 0), 0)

  // Filtered Invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.buyer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.items.some((it) => it.description.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCompany = filterCompany === 'ALL' || inv.company.id === filterCompany
    const matchesType = invoiceSummaryType === 'ALL' || (inv.type || 'SALE') === invoiceSummaryType
    return matchesSearch && matchesCompany && matchesType
  })

  return (
    <div className="w-full space-y-4 pt-0 animate-in fade-in duration-300">

      {/* 2. Key Accounting & Procurement Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Invoices</span>
          <h3 className="text-lg font-black text-slate-900 mt-0.5">{totalInvoicesCount}</h3>
          <p className="text-[10px] text-slate-400 font-medium">{saleInvoices.length} Sales · {purchaseInvoices.length} Purchases</p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm bg-gradient-to-br from-blue-50/50 to-white border-blue-100">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3 text-blue-600" /> Total Sales Revenue
          </span>
          <h3 className="text-lg font-black text-blue-700 font-mono mt-0.5">
            ₹{totalSalesRevenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-blue-500/80 font-medium">Clinic & Patient Sales</p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm bg-gradient-to-br from-indigo-50/50 to-white border-indigo-100">
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block flex items-center gap-1">
            <ArrowDownLeft className="w-3 h-3 text-indigo-600" /> Total Purchased from Kiyava
          </span>
          <h3 className="text-lg font-black text-indigo-700 font-mono mt-0.5">
            ₹{totalPurchasedFromKiyava.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-indigo-500/80 font-medium">Herbal Material Procurement</p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">GST Tax Value</span>
          <h3 className="text-lg font-black text-emerald-600 font-mono mt-0.5">
            ₹{totalGstCollected.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">Output Tax & ITC</p>
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
          <FileText className="w-3.5 h-3.5" />
          Opening Stock
        </button>

        <button
          onClick={() => setActiveTab('stock-register')}
          className={`px-4 py-2 rounded-xl font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'stock-register'
            ? 'bg-teal-600 text-white shadow-md'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Live Stock
        </button>

        <button
          onClick={() => setActiveTab('manufacturing')}
          className={`px-4 py-2 rounded-xl font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'manufacturing'
            ? 'bg-cyan-600 text-white shadow-md'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
        >
          <FlaskConical className="w-3.5 h-3.5" />
          Production of Finished Goods ({manufacturingLogs.length})
        </button>

        <button
          onClick={() => setActiveTab('ksv-factory')}
          className={`px-4 py-2 rounded-xl font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'ksv-factory'
            ? 'bg-indigo-600 text-white shadow-md'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
        >
          <Factory className="w-3.5 h-3.5" />
          KSV Factory ({
            Array.from(
              new Set([
                ...manufacturingLogs.map((m) => m.finishedGoodName.toLowerCase()),
                ...stockTransfers.map((t) => t.itemName.toLowerCase())
              ])
            ).filter(Boolean).length
          })
        </button>

        <div className="flex-1" />
      </div>

      {/* 4. TAB CONTENT: 1. INVOICES & PURCHASES LEDGER */}
      {activeTab === 'invoices' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Sub-Tab Toggle: Sale Summary | Purchase Summary | All Invoices */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setInvoiceSummaryType('SALE')}
              className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${invoiceSummaryType === 'SALE'
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
              className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${invoiceSummaryType === 'PURCHASE'
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
            <div className={`rounded-2xl p-4 border shadow-sm ${invoiceSummaryType === 'SALE' ? 'bg-blue-50 border-blue-100' : invoiceSummaryType === 'PURCHASE' ? 'bg-orange-50 border-orange-100' : 'bg-slate-50 border-slate-200'}`}>
              <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${invoiceSummaryType === 'SALE' ? 'text-blue-500' : invoiceSummaryType === 'PURCHASE' ? 'text-orange-500' : 'text-slate-500'}`}>
                {invoiceSummaryType === 'SALE' ? 'Total Sales' : invoiceSummaryType === 'PURCHASE' ? 'Total Purchases' : 'Total Invoices'}
              </p>
              <h3 className={`text-lg font-black ${invoiceSummaryType === 'SALE' ? 'text-blue-700' : invoiceSummaryType === 'PURCHASE' ? 'text-orange-700' : 'text-slate-800'}`}>
                {invoiceSummaryType === 'SALE' ? saleInvoices.length : invoiceSummaryType === 'PURCHASE' ? purchaseInvoices.length : invoices.length}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">Invoices Recorded</p>
            </div>
            <div className={`rounded-2xl p-4 border shadow-sm ${invoiceSummaryType === 'SALE' ? 'bg-emerald-50 border-emerald-100' : invoiceSummaryType === 'PURCHASE' ? 'bg-rose-50 border-rose-100' : 'bg-indigo-50 border-indigo-100'}`}>
              <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${invoiceSummaryType === 'SALE' ? 'text-emerald-500' : invoiceSummaryType === 'PURCHASE' ? 'text-rose-500' : 'text-indigo-500'}`}>
                {invoiceSummaryType === 'SALE' ? 'Total Sales Revenue' : invoiceSummaryType === 'PURCHASE' ? 'Total Spend' : 'Net Total Amount'}
              </p>
              <h3 className={`text-lg font-black ${invoiceSummaryType === 'SALE' ? 'text-emerald-700' : invoiceSummaryType === 'PURCHASE' ? 'text-rose-700' : 'text-indigo-700'}`}>
                ₹{(invoiceSummaryType === 'SALE' ? totalSalesRevenue : invoiceSummaryType === 'PURCHASE' ? totalPurchasedFromKiyava : (totalSalesRevenue + totalPurchasedFromKiyava)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">Grand Total (incl. GST)</p>
            </div>
            <div className="rounded-2xl p-4 bg-slate-50 border border-slate-100 shadow-sm col-span-2 sm:col-span-1">
              <p className="text-[10px] font-black uppercase tracking-wider mb-1 text-slate-400">
                {invoiceSummaryType === 'SALE' ? 'Output GST Tax' : invoiceSummaryType === 'PURCHASE' ? 'Input Tax Credit (ITC)' : 'Total GST Value'}
              </p>
              <h3 className="text-lg font-black text-slate-700">
                ₹{(invoiceSummaryType === 'SALE' ? saleGst : invoiceSummaryType === 'PURCHASE' ? purchaseGst : totalGstCollected).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">Tax Collected / Claimed</p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-semibold">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search invoice no, party name, item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Company Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterCompany}
                onChange={(e) => setFilterCompany(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">All Companies</option>
                {companies.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Invoices Table */}
          {filteredInvoices.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                      <th className="p-3">Type / Date</th>
                      <th className="p-3">Invoice No.</th>
                      <th className="p-3">Supplier / Seller</th>
                      <th className="p-3">Buyer / Patient</th>
                      <th className="p-3 text-right">Items</th>
                      <th className="p-3 text-right">GST Tax</th>
                      <th className="p-3 text-right">Grand Total</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {inv.type === 'PURCHASE' ? (
                              <span className="px-2 py-0.5 bg-orange-50 text-orange-700 font-black text-[9px] uppercase tracking-wider rounded-md border border-orange-200/60">
                                Purchase
                              </span>
                            ) : (
                              <>
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-black text-[9px] uppercase tracking-wider rounded-md border border-blue-200/60">
                                  Sale
                                </span>
                                <span className={`px-1.5 py-0.5 font-extrabold text-[8px] uppercase tracking-wider rounded border ${
                                  inv.matCenter === 'KSV Factory'
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                    : 'bg-teal-50 text-teal-700 border-teal-200'
                                }`}>
                                  {inv.matCenter === 'KSV Factory' ? '🏭 Factory' : '🏪 Store'}
                                </span>
                              </>
                            )}
                            <span className="text-[11px] text-slate-500">{inv.invoiceDate}</span>
                          </div>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-800">{inv.invoiceNo}</td>
                        <td className="p-3 font-semibold text-slate-900">{inv.company.name}</td>
                        <td className="p-3 text-slate-700 font-semibold">{inv.buyer.name}</td>
                        <td className="p-3 text-right font-mono">{inv.items.length}</td>
                        <td className="p-3 text-right font-mono text-slate-600">
                          ₹{inv.totalTaxAmount?.toLocaleString('en-IN') || 0}
                        </td>
                        <td className="p-3 text-right font-mono font-extrabold text-slate-900">
                          ₹{inv.grandTotal?.toLocaleString('en-IN') || 0}
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
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setSelectedInvoiceForPrint(inv)}
                              className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg transition-colors"
                              title="Print Tally Tax Invoice"
                            >
                              <Printer className="w-3.5 h-3.5" />
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
              <h3 className="text-sm font-bold text-slate-800">
                {invoiceSummaryType === 'SALE'
                  ? 'No Sale Invoices in Ledger Yet'
                  : invoiceSummaryType === 'PURCHASE'
                    ? 'No Purchase Invoices in Ledger Yet'
                    : 'No Invoices in Ledger Yet'}
              </h3>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                {invoiceSummaryType === 'SALE'
                  ? 'Create your first Patient or Customer Sale Tax Invoice now.'
                  : invoiceSummaryType === 'PURCHASE'
                    ? 'Record raw herbal material or packaging purchases from Kiyava.'
                    : 'Ledger is clean. Click below to create a Sale or record a Purchase.'}
              </p>
              <div className="pt-1 flex items-center justify-center gap-2">
                {(invoiceSummaryType === 'SALE' || invoiceSummaryType === 'ALL') && (
                  <button
                    onClick={() => {
                      setEditingInvoice(null)
                      setActiveTab('create-sell')
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md transition-all inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Create Sale Invoice
                  </button>
                )}
                {(invoiceSummaryType === 'PURCHASE' || invoiceSummaryType === 'ALL') && (
                  <button
                    onClick={() => {
                      setEditingInvoice(null)
                      setActiveTab('create-purchase')
                    }}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md transition-all inline-flex items-center gap-1.5"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" /> Record Purchase
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. TAB CONTENT: 2. CREATE INVOICE FORM (PURCHASE OR SALE) */}
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
          onSaveParty={handleSaveParty}
          initialInvoice={editingInvoice}
          onCancel={() => setActiveTab('invoices')}
        />
      )}

      {/* 4. TAB CONTENT: 3. COMPANY MASTER */}
      {activeTab === 'companies' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-sm font-black text-slate-800">Companies (Issuing &amp; Supplier Profiles)</h2>
              <p className="text-[11px] text-slate-400">
                Manage profiles for Karan Singh Vaidh (KSV), Kiyava, National Bottle House, etc.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingCompany(null)
                setIsCompanyModalOpen(true)
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add New Company
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((comp) => (
              <div
                key={comp.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 relative group"
              >
                {comp.isDefault && (
                  <span className="absolute top-3 right-3 bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Default Entity
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
              <h2 className="text-sm font-black text-slate-800">Parties & Suppliers Master</h2>
              <p className="text-[11px] text-slate-400">
                Directory of raw material suppliers (Kiyava), packaging suppliers (NBH), and OPD clinic patients.
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
                  {party.id === 'party_kiyava' && (
                    <span className="bg-indigo-100 text-indigo-800 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                      Primary Supplier
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-[11px] text-slate-600 border-t border-b border-slate-100 py-2">
                  <p className="font-mono text-slate-700">GSTIN: {party.gstin}</p>
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
      {activeTab === 'catalog' && (() => {
        const filteredCatalog = catalog.filter((item) => {
          if (!catalogSearchQuery.trim()) return true
          const q = catalogSearchQuery.toLowerCase()
          return (
            item.name?.toLowerCase().includes(q) ||
            item.description?.toLowerCase().includes(q) ||
            item.category?.toLowerCase().includes(q) ||
            item.hsnCode?.toLowerCase().includes(q) ||
            item.defaultUnit?.toLowerCase().includes(q)
          )
        })

        return (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h2 className="text-sm font-black text-slate-800">KSV Medicine Catalog & Raw Herbs</h2>
                <p className="text-[11px] text-slate-400">
                  Ayurvedic kits, classical formulations, and raw herbs procured from Kiyava.
                </p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={catalogSearchQuery}
                  onChange={(e) => setCatalogSearchQuery(e.target.value)}
                  placeholder="Search item name, category, HSN..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <button
                onClick={() => {
                  setEditingCatalogItem(null)
                  setIsCatalogModalOpen(true)
                }}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
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
                    {filteredCatalog.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          No matching items found.
                        </td>
                      </tr>
                    ) : (
                      filteredCatalog.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{item.name}</div>
                            {item.description && <div className="text-[10px] text-slate-400">{item.description}</div>}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md uppercase">
                              {item.category || 'General'}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-slate-600">{item.hsnCode}</td>
                          <td className="p-3 text-right font-semibold uppercase">{item.defaultUnit}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">
                            ₹{item.defaultRate.toLocaleString('en-IN')}
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
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      })()}

      {/* 4. TAB CONTENT: 6. STOCK REGISTER & AUTOMATIC INVENTORY ADJUSTMENT */}
      {activeTab === 'opening-stock' && (() => {
        // Build full stock register with auto manufacturing and Store/Factory transfer adjustments
        const stockRegister = catalog.map((item) => {
          const breakdown = getItemStockBreakdown(item.id, item.name, item.defaultUnit, item.quantity)
          return { item, ...breakdown }
        }).filter((row) => row.openingQty > 0 || row.purchasedQty > 0 || row.soldQty > 0 || row.manufacturedQty > 0 || row.consumedQty > 0 || row.transferredToFactoryQty !== 0)

        const totalOpeningQty = stockRegister.reduce((s, r) => s + r.openingQty, 0)
        const totalPurchasedQty = stockRegister.reduce((s, r) => s + r.purchasedQty, 0)
        const totalSoldQty = stockRegister.reduce((s, r) => s + r.soldQty, 0)
        const totalStoreQty = stockRegister.reduce((s, r) => s + r.storeClosingQty, 0)
        const totalFactoryQty = stockRegister.reduce((s, r) => s + r.factoryClosingQty, 0)
        const totalClosingQty = stockRegister.reduce((s, r) => s + r.closingQty, 0)

        return (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-sm gap-3">
              <div>
                <h2 className="text-sm font-black text-slate-800">📦 KSV Stock Register &amp; Ledger (Store &amp; Factory)</h2>
                <p className="text-xs text-slate-400 font-medium">Opening Stock + Purchases + Manufactured In − Sales − Consumed In Mfg = Closing Balance (Split by KSV Store &amp; KSV Factory)</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openTransferModalForItem()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" /> Transfer Store ↔ Factory
                </button>
                <button
                  onClick={() => {
                    setEditingOpeningStockEntry(null)
                    setIsOpeningStockModalOpen(true)
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Opening Stock
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
              <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-purple-500 mb-1">Opening Stock</p>
                <h3 className="text-xl font-black text-purple-700 font-mono">{totalOpeningQty.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h3>
                <p className="text-[10px] text-purple-400 font-medium mt-0.5">Initial balance</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-500 mb-1">Purchased In</p>
                <h3 className="text-xl font-black text-emerald-700 font-mono">+{totalPurchasedQty.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h3>
                <p className="text-[10px] text-emerald-400 font-medium mt-0.5">From purchase invoices</p>
              </div>
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-rose-500 mb-1">Sold Out</p>
                <h3 className="text-xl font-black text-rose-700 font-mono">−{totalSoldQty.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h3>
                <p className="text-[10px] text-rose-400 font-medium mt-0.5">From sale invoices</p>
              </div>
              <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-teal-600 mb-1">🏪 KSV Store</p>
                <h3 className="text-xl font-black text-teal-700 font-mono">{totalStoreQty.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h3>
                <p className="text-[10px] text-teal-500 font-medium mt-0.5">Available in Store</p>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600 mb-1">🏭 KSV Factory</p>
                <h3 className="text-xl font-black text-indigo-700 font-mono">{totalFactoryQty.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h3>
                <p className="text-[10px] text-indigo-500 font-medium mt-0.5">Available in Factory</p>
              </div>
              <div className={`border rounded-2xl p-4 shadow-sm ${totalClosingQty > 0 ? 'bg-blue-50 border-blue-100' : 'bg-amber-50 border-amber-100'}`}>
                <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${totalClosingQty > 0 ? 'text-blue-500' : 'text-amber-500'}`}>Total Closing</p>
                <h3 className={`text-xl font-black font-mono ${totalClosingQty > 0 ? 'text-blue-700' : 'text-amber-700'}`}>{totalClosingQty.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h3>
                <p className={`text-[10px] font-medium mt-0.5 ${totalClosingQty > 0 ? 'text-blue-400' : 'text-amber-400'}`}>Store + Factory</p>
              </div>
            </div>

            {/* Stock Table */}
            {stockRegister.length > 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-900 text-white font-extrabold uppercase text-[10px]">
                      <tr>
                        <th className="p-3 pl-5">Product / Herb Name</th>
                        <th className="p-3 text-center">Unit</th>
                        <th className="p-3 text-right text-purple-300">Opening</th>
                        <th className="p-3 text-right text-emerald-300">Purchased (+)</th>
                        <th className="p-3 text-right text-cyan-300">Produced (+)</th>
                        <th className="p-3 text-right text-rose-300">Sold (−)</th>
                        <th className="p-3 text-right text-amber-300">Consumed (−)</th>
                        <th className="p-3 text-right text-teal-300">🏪 KSV Store</th>
                        <th className="p-3 text-right text-indigo-300">🏭 KSV Factory</th>
                        <th className="p-3 text-right text-blue-300 pr-5">Total Closing</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {stockRegister.map(({ item, openingQty, purchasedQty, soldQty, manufacturedQty, consumedQty, storeClosingQty, factoryClosingQty, closingQty, unit }) => (
                        <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${closingQty <= 0 ? 'bg-rose-50/30' : ''}`}>
                          <td className="p-3 pl-5">
                            <div className="font-bold text-slate-900">{item.name}</div>
                            {item.hsnCode && <div className="text-[10px] text-slate-400">HSN: {item.hsnCode}</div>}
                          </td>
                          <td className="p-3 text-center font-bold text-slate-600 uppercase">{unit}</td>
                          <td className="p-3 text-right font-mono font-bold text-purple-700">{openingQty.toLocaleString('en-IN', { maximumFractionDigits: 3 })}</td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-600">{purchasedQty > 0 ? `+${purchasedQty.toLocaleString('en-IN', { maximumFractionDigits: 3 })}` : '—'}</td>
                          <td className="p-3 text-right font-mono font-bold text-cyan-600">{manufacturedQty > 0 ? `+${manufacturedQty.toLocaleString('en-IN', { maximumFractionDigits: 3 })}` : '—'}</td>
                          <td className="p-3 text-right font-mono font-bold text-rose-600">{soldQty > 0 ? `−${soldQty.toLocaleString('en-IN', { maximumFractionDigits: 3 })}` : '—'}</td>
                          <td className="p-3 text-right font-mono font-bold text-amber-600">{consumedQty > 0 ? `−${consumedQty.toLocaleString('en-IN', { maximumFractionDigits: 3 })}` : '—'}</td>
                          <td className="p-3 text-right font-mono font-black text-teal-700 bg-teal-50/30">
                            {storeClosingQty.toLocaleString('en-IN', { maximumFractionDigits: 3 })}
                          </td>
                          <td className="p-3 text-right font-mono font-black text-indigo-700 bg-indigo-50/30">
                            {factoryClosingQty.toLocaleString('en-IN', { maximumFractionDigits: 3 })}
                          </td>
                          <td className="p-3 text-right pr-5">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full font-black font-mono text-xs ${closingQty <= 0
                              ? 'bg-rose-100 text-rose-700'
                              : closingQty < 10
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-blue-100 text-blue-700'
                              }`}>
                              {closingQty.toLocaleString('en-IN', { maximumFractionDigits: 3 })}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-sm space-y-3">
                <div className="text-4xl">📦</div>
                <h3 className="text-sm font-black text-slate-800">No Stock Records</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">Set opening stock or create manufacturing logs to track automatic stock adjustments.</p>
              </div>
            )}
          </div>
        )
      })()}

      {/* 4. TAB CONTENT: 7. MANUFACTURING (MANUFACTURE OF MATERIALS & STORE/FACTORY TRANSFER) */}
      {activeTab === 'manufacturing' && (() => {
        // Compute aggregate finished goods stats across all manufactured products
        const totalProducedQty = manufacturingLogs.reduce((sum, l) => sum + (l.producedQuantity || 0), 0)
        const uniqueFinishedGoods = Array.from(
          new Set(manufacturingLogs.map((l) => l.finishedGoodName.toLowerCase()))
        ).map((nameLower) => {
          const log = manufacturingLogs.find((l) => l.finishedGoodName.toLowerCase() === nameLower)!
          const catItem = catalog.find((c) => c.name.toLowerCase() === nameLower)
          return getItemStockBreakdown(
            catItem?.id || log.finishedGoodItemId,
            log.finishedGoodName,
            catItem?.defaultUnit || log.unit,
            catItem?.quantity || 0
          )
        })
        const totalFinishedInStore = uniqueFinishedGoods.reduce((s, b) => s + b.storeClosingQty, 0)
        const totalFinishedInFactory = uniqueFinishedGoods.reduce((s, b) => s + b.factoryClosingQty, 0)

        return (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Top Header Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h2 className="text-sm font-black text-slate-800">Production of Finished Goods &amp; KSV Factory Transfer</h2>
                <p className="text-[11px] text-slate-400">
                  Finished goods are manufactured in <strong>KSV Store</strong> and can be transferred to <strong>KSV Factory</strong>.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => openTransferModalForItem()}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" /> Transfer Store ↔ Factory
                </button>
                <button
                  onClick={() => setIsManufacturingModalOpen(true)}
                  className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> + New Production Batch
                </button>
              </div>
            </div>

            {/* Store vs Factory Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-cyan-50 border border-cyan-100 rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-cyan-600 mb-1">⚗️ Total Produced (All Batches)</p>
                <h3 className="text-xl font-black text-cyan-800 font-mono">
                  +{totalProducedQty.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </h3>
                <p className="text-[10px] text-cyan-600/80 font-medium mt-0.5">{manufacturingLogs.length} production batch(es)</p>
              </div>
              <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-teal-600 mb-1">🏪 Available in KSV Store</p>
                <h3 className="text-xl font-black text-teal-800 font-mono">
                  {totalFinishedInStore.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </h3>
                <p className="text-[10px] text-teal-600/80 font-medium mt-0.5">Remaining in KSV Store after transfers &amp; store sales</p>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600 mb-1">🏭 Available in KSV Factory</p>
                <h3 className="text-xl font-black text-indigo-800 font-mono">
                  {totalFinishedInFactory.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </h3>
                <p className="text-[10px] text-indigo-600/80 font-medium mt-0.5">Transferred to KSV Factory minus factory sales</p>
              </div>
            </div>

            {manufacturingLogs.length > 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-900 text-white font-extrabold uppercase text-[10px]">
                      <tr>
                        <th className="p-3 pl-5">Date</th>
                        <th className="p-3">Batch Name</th>
                        <th className="p-3">Manufactured Product (Output)</th>
                        <th className="p-3 text-right">Qty Produced</th>
                        <th className="p-3 text-right text-teal-300">🏪 KSV Store Qty</th>
                        <th className="p-3 text-right text-indigo-300">🏭 KSV Factory Qty</th>
                        <th className="p-3 text-right">Effective Rate (₹)</th>
                        <th className="p-3 text-right">Effective Cost (₹)</th>
                        <th className="p-3">Components Consumed (Input)</th>
                        <th className="p-3 text-right pr-5">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {manufacturingLogs.map((log) => {
                        const totalCost = log.effectiveCost ?? log.rawMaterialsConsumed.reduce((s, rm) => s + (rm.amount ?? (rm.quantity * (rm.rate || 0))), 0)
                        const effectiveRate = log.effectiveRatePerUnit ?? (log.producedQuantity > 0 ? totalCost / log.producedQuantity : 0)

                        // Live Store & Factory stock for this product
                        const catItem = catalog.find((c) => c.name.toLowerCase() === log.finishedGoodName.toLowerCase())
                        const itemStock = getItemStockBreakdown(
                          catItem?.id || log.finishedGoodItemId,
                          log.finishedGoodName,
                          catItem?.defaultUnit || log.unit,
                          catItem?.quantity || 0
                        )

                        return (
                          <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 pl-5 font-mono text-slate-600">{log.date}</td>
                            <td className="p-3 font-mono font-bold text-slate-800 uppercase">{log.batchNo || 'N/A'}</td>
                            <td className="p-3 font-black text-cyan-800 uppercase">{log.finishedGoodName}</td>
                            <td className="p-3 text-right font-mono font-black text-emerald-600">
                              +{log.producedQuantity} <span className="text-[10px] text-emerald-500 font-bold uppercase">{log.unit}</span>
                            </td>
                            <td className="p-3 text-right bg-teal-50/30">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg font-mono font-black text-xs ${
                                itemStock.storeClosingQty > 0 ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {itemStock.storeClosingQty} <span className="text-[9px] font-bold ml-1 uppercase">{log.unit}</span>
                              </span>
                            </td>
                            <td className="p-3 text-right bg-indigo-50/30">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg font-mono font-black text-xs ${
                                itemStock.factoryClosingQty > 0 ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {itemStock.factoryClosingQty} <span className="text-[9px] font-bold ml-1 uppercase">{log.unit}</span>
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-slate-700">
                              ₹{effectiveRate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-right font-mono font-black text-slate-900">
                              ₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-3">
                              <div className="space-y-1">
                                {log.rawMaterialsConsumed.map((rm, idx) => (
                                  <div key={idx} className="flex justify-between items-center text-[10px]">
                                    <span className="font-bold text-slate-700">{rm.itemName}</span>
                                    <span className="font-mono text-rose-600 font-bold ml-3">
                                      −{rm.quantity} {rm.unit} {rm.rate ? `(@ ₹${rm.rate})` : ''}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="p-3 text-right pr-5">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => openTransferModalForBatch(log)}
                                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors border border-indigo-200 cursor-pointer"
                                  title="Transfer between KSV Store and KSV Factory"
                                >
                                  <ArrowLeftRight className="w-3.5 h-3.5" /> Transfer
                                </button>
                                <button
                                  onClick={() => setSelectedMfgLogForPrint(log)}
                                  className="px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors border border-cyan-200 cursor-pointer"
                                  title="Print Tally Voucher"
                                >
                                  <Printer className="w-3.5 h-3.5" /> Voucher
                                </button>
                                <button
                                  onClick={() => handleDeleteManufacturingLog(log.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-sm space-y-3">
                <div className="text-4xl">⚗️</div>
                <h3 className="text-sm font-black text-slate-800">No Manufacturing Logs Recorded</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Log production batches with finished goods and consumed components to automatically adjust stock balances.
                </p>
                <button
                  onClick={() => setIsManufacturingModalOpen(true)}
                  className="mt-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs rounded-xl inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-md uppercase tracking-wider"
                >
                  <Plus className="w-3.5 h-3.5" /> Log First Batch
                </button>
              </div>
            )}

            {/* Stock Transfer History Log (KSV Store <-> KSV Factory) */}
            {stockTransfers.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                  <div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600" />
                      Stock Transfer Ledger (KSV Store ↔ KSV Factory)
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">History of finished goods transferred between KSV Store and KSV Factory</p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                    {stockTransfers.length} Transfer(s)
                  </span>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-600 font-extrabold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="p-3 pl-5">Date</th>
                        <th className="p-3">Batch #</th>
                        <th className="p-3">Product Name</th>
                        <th className="p-3">Transfer Direction</th>
                        <th className="p-3 text-right">Quantity Transferred</th>
                        <th className="p-3">Notes</th>
                        <th className="p-3 text-right pr-5">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {stockTransfers.map((tr) => (
                        <tr key={tr.id} className="hover:bg-slate-50">
                          <td className="p-3 pl-5 font-mono text-slate-600">{tr.date}</td>
                          <td className="p-3 font-mono font-bold text-slate-700 uppercase">{tr.batchNo || '—'}</td>
                          <td className="p-3 font-bold text-slate-900 uppercase">{tr.itemName}</td>
                          <td className="p-3">
                            {tr.direction === 'STORE_TO_FACTORY' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-extrabold text-[10px]">
                                🏪 KSV Store → 🏭 KSV Factory
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 font-extrabold text-[10px]">
                                🏭 KSV Factory → 🏪 KSV Store
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right font-mono font-black text-indigo-700">
                            {tr.quantity} <span className="text-[10px] uppercase">{tr.unit}</span>
                          </td>
                          <td className="p-3 text-slate-500 text-[11px]">{tr.notes || '—'}</td>
                          <td className="p-3 text-right pr-5">
                            <button
                              onClick={() => handleDeleteStockTransfer(tr.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Undo / Delete Transfer"
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
            )}
          </div>
        )
      })()}

      {/* TAB CONTENT: 8. KSV FACTORY STOCK & TRANSFER LEDGER */}
      {activeTab === 'ksv-factory' && (() => {
        // Build unified list of all products that have either been manufactured, transferred, or are in catalog
        const allCandidateNames = Array.from(
          new Set([
            ...manufacturingLogs.map((l) => l.finishedGoodName),
            ...stockTransfers.map((t) => t.itemName),
            ...catalog.map((c) => c.name)
          ])
        ).filter(Boolean)

        const factoryProductRows = allCandidateNames
          .map((prodName) => {
            const nameLower = prodName.toLowerCase()
            const catItem = catalog.find((c) => c.name.toLowerCase() === nameLower)
            const mfgLog = manufacturingLogs.find((l) => l.finishedGoodName.toLowerCase() === nameLower)
            const trLog = stockTransfers.find((t) => t.itemName.toLowerCase() === nameLower)

            const itemId = catItem?.id || mfgLog?.finishedGoodItemId || trLog?.itemId || `fg_${nameLower}`
            const unit = catItem?.defaultUnit || mfgLog?.unit || trLog?.unit || 'PCS'
            const hsnCode = catItem?.hsnCode || ''
            const breakdown = getItemStockBreakdown(itemId, prodName, unit, catItem?.quantity || 0)

            const isFinishedOrTransferred = Boolean(mfgLog || trLog || breakdown.transferredToFactoryQty !== 0 || breakdown.soldFromFactoryQty > 0)

            return {
              itemId,
              name: prodName,
              hsnCode,
              unit,
              isFinishedOrTransferred,
              ...breakdown
            }
          })
          .filter((row) => {
            const matchesQuery =
              !factorySearchQuery.trim() ||
              row.name.toLowerCase().includes(factorySearchQuery.toLowerCase()) ||
              row.hsnCode.toLowerCase().includes(factorySearchQuery.toLowerCase())
            // Show all manufactured / transferred items by default, or any catalog item when searching
            const hasActivity =
              row.isFinishedOrTransferred ||
              row.factoryClosingQty !== 0 ||
              row.manufacturedQty > 0 ||
              Boolean(factorySearchQuery.trim())
            return matchesQuery && hasActivity
          })

        const totalFactoryAvailable = factoryProductRows.reduce((s, r) => s + r.factoryClosingQty, 0)
        const totalStoreRemaining = factoryProductRows.reduce((s, r) => s + r.storeClosingQty, 0)
        const totalNetTransferred = factoryProductRows.reduce((s, r) => s + r.transferredToFactoryQty, 0)
        const totalSoldFromFactory = factoryProductRows.reduce((s, r) => s + r.soldFromFactoryQty, 0)

        return (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Top Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <Factory className="w-4 h-4 text-indigo-600" />
                  KSV Factory Stock &amp; Store Comparison
                </h2>
                <p className="text-[11px] text-slate-400">
                  Check live finished goods quantity available in <strong>KSV Factory</strong> vs remaining in <strong>KSV Store</strong>.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={factorySearchQuery}
                  onChange={(e) => setFactorySearchQuery(e.target.value)}
                  placeholder="Search item in KSV Factory..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <button
                onClick={() => openTransferModalForItem()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md shrink-0"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" /> + Transfer Stock (Store ↔ Factory)
              </button>
            </div>

            {/* 4 Summary Metrics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600 mb-1">🏭 KSV Factory Stock</p>
                <h3 className="text-2xl font-black text-indigo-800 font-mono">
                  {totalFactoryAvailable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </h3>
                <p className="text-[10px] text-indigo-600/80 font-medium mt-0.5">Available now in KSV Factory</p>
              </div>

              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-teal-600 mb-1">🏪 KSV Store Stock</p>
                <h3 className="text-2xl font-black text-teal-800 font-mono">
                  {totalStoreRemaining.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </h3>
                <p className="text-[10px] text-teal-600/80 font-medium mt-0.5">Remaining in KSV Store</p>
              </div>

              <div className="bg-cyan-50 border border-cyan-100 rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-cyan-600 mb-1">🔄 Net Transferred to Factory</p>
                <h3 className="text-2xl font-black text-cyan-800 font-mono">
                  +{totalNetTransferred.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </h3>
                <p className="text-[10px] text-cyan-600/80 font-medium mt-0.5">Moved from KSV Store → Factory</p>
              </div>

              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-rose-600 mb-1">📤 Sold from KSV Factory</p>
                <h3 className="text-2xl font-black text-rose-700 font-mono">
                  −{totalSoldFromFactory.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </h3>
                <p className="text-[10px] text-rose-500 font-medium mt-0.5">Dispatched via Factory Sale Invoices</p>
              </div>
            </div>

            {/* Transfer History Table inside KSV Factory Tab */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600" />
                    KSV Factory Transfer History (Store ↔ Factory)
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Complete log of all stock transfers between KSV Store and KSV Factory</p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                  {stockTransfers.length} Transfer(s)
                </span>
              </div>

              {stockTransfers.filter((tr) =>
                !factorySearchQuery.trim() ||
                tr.itemName.toLowerCase().includes(factorySearchQuery.toLowerCase()) ||
                (tr.batchNo && tr.batchNo.toLowerCase().includes(factorySearchQuery.toLowerCase()))
              ).length > 0 ? (
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-600 font-extrabold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="p-3 pl-5">Date</th>
                        <th className="p-3">Batch #</th>
                        <th className="p-3">Product Name</th>
                        <th className="p-3">Transfer Direction</th>
                        <th className="p-3 text-right">Quantity Transferred</th>
                        <th className="p-3">Notes</th>
                        <th className="p-3 text-right pr-5">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {stockTransfers
                        .filter((tr) =>
                          !factorySearchQuery.trim() ||
                          tr.itemName.toLowerCase().includes(factorySearchQuery.toLowerCase()) ||
                          (tr.batchNo && tr.batchNo.toLowerCase().includes(factorySearchQuery.toLowerCase()))
                        )
                        .map((tr) => (
                        <tr key={tr.id} className="hover:bg-slate-50">
                          <td className="p-3 pl-5 font-mono text-slate-600">{tr.date}</td>
                          <td className="p-3 font-mono font-bold text-slate-700 uppercase">{tr.batchNo || '—'}</td>
                          <td className="p-3 font-bold text-slate-900 uppercase">{tr.itemName}</td>
                          <td className="p-3">
                            {tr.direction === 'STORE_TO_FACTORY' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-extrabold text-[10px]">
                                🏪 KSV Store → 🏭 KSV Factory
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 font-extrabold text-[10px]">
                                🏭 KSV Factory → 🏪 KSV Store
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right font-mono font-black text-indigo-700">
                            {tr.quantity} <span className="text-[10px] uppercase">{tr.unit}</span>
                          </td>
                          <td className="p-3 text-slate-500 text-[11px]">{tr.notes || '—'}</td>
                          <td className="p-3 text-right pr-5">
                            <button
                              onClick={() => handleDeleteStockTransfer(tr.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Undo / Delete Transfer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 font-medium">
                  No transfers recorded yet. Click &quot;+ Transfer Stock (Store ↔ Factory)&quot; above to move finished goods to KSV Factory.
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* TAB CONTENT: STOCK REGISTER */}
      {activeTab === 'stock-register' && (
        <StockRegisterTab
          catalog={catalog}
          openingStock={openingStock}
          invoices={invoices}
          manufacturingLogs={manufacturingLogs}
          stockTransfers={stockTransfers}
          showLocationSplit={true}
          onOpenOpeningStock={() => setActiveTab('opening-stock')}
          onOpenTransferModal={openTransferModalForItem}
        />
      )}

      {/* STOCK TRANSFER MODAL (KSV STORE <-> KSV FACTORY) */}
      {isTransferModalOpen && (() => {
        const selectedStock = transferForm.itemName
          ? getItemStockBreakdown(transferForm.itemId, transferForm.itemName, transferForm.unit)
          : null
        const maxAvailable =
          transferForm.direction === 'STORE_TO_FACTORY'
            ? Math.max(0, selectedStock?.storeClosingQty || 0)
            : Math.max(0, selectedStock?.factoryClosingQty || 0)

        return (
          <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
                    <ArrowLeftRight className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-800 uppercase tracking-wide">
                      Transfer Stock (Store ↔ Factory)
                    </h2>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Move finished goods between KSV Store and KSV Factory
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveStockTransfer} className="space-y-4">
                {/* Direction Selector */}
                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">
                    Transfer Direction *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTransferForm({ ...transferForm, direction: 'STORE_TO_FACTORY' })}
                      className={`py-2.5 px-3 rounded-xl font-extrabold text-xs border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        transferForm.direction === 'STORE_TO_FACTORY'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      🏪 Store → 🏭 Factory
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransferForm({ ...transferForm, direction: 'FACTORY_TO_STORE' })}
                      className={`py-2.5 px-3 rounded-xl font-extrabold text-xs border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        transferForm.direction === 'FACTORY_TO_STORE'
                          ? 'bg-teal-600 text-white border-teal-600 shadow-md'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      🏭 Factory → 🏪 Store
                    </button>
                  </div>
                </div>

                {/* Product Selection */}
                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block">
                    Finished Good / Product *
                  </label>
                  <select
                    required
                    value={transferForm.itemName}
                    onChange={(e) => {
                      const val = e.target.value
                      const catMatch = catalog.find((c) => c.name.toLowerCase() === val.toLowerCase())
                      const mfgMatch = manufacturingLogs.find((m) => m.finishedGoodName.toLowerCase() === val.toLowerCase())
                      setTransferForm({
                        ...transferForm,
                        itemName: val,
                        itemId: catMatch?.id || mfgMatch?.finishedGoodItemId || '',
                        unit: catMatch?.defaultUnit || mfgMatch?.unit || 'PCS',
                        batchId: mfgMatch?.id || '',
                        batchNo: mfgMatch?.batchNo || ''
                      })
                    }}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Select Product --</option>
                    {Array.from(
                      new Set([
                        ...manufacturingLogs.map((m) => m.finishedGoodName),
                        ...catalog.map((c) => c.name)
                      ])
                    )
                      .filter(Boolean)
                      .map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Live Stock Balance Preview */}
                {selectedStock && (
                  <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div className="bg-teal-50 border border-teal-200 rounded-xl p-2.5 flex justify-between items-center">
                      <span className="text-[10px] font-extrabold text-teal-700 uppercase">🏪 KSV Store:</span>
                      <span className="font-mono font-black text-sm text-teal-800">
                        {selectedStock.storeClosingQty} {selectedStock.unit}
                      </span>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-2.5 flex justify-between items-center">
                      <span className="text-[10px] font-extrabold text-indigo-700 uppercase">🏭 KSV Factory:</span>
                      <span className="font-mono font-black text-sm text-indigo-800">
                        {selectedStock.factoryClosingQty} {selectedStock.unit}
                      </span>
                    </div>
                  </div>
                )}

                {/* Quantity & Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                        Transfer Qty ({transferForm.unit}) *
                      </label>
                      {maxAvailable > 0 && (
                        <button
                          type="button"
                          onClick={() => setTransferForm({ ...transferForm, quantity: maxAvailable })}
                          className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                        >
                          Max ({maxAvailable})
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      step="any"
                      min="0.001"
                      required
                      value={transferForm.quantity}
                      onChange={(e) => setTransferForm({ ...transferForm, quantity: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-black text-slate-900 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block">
                      Transfer Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={transferForm.date}
                      onChange={(e) => setTransferForm({ ...transferForm, date: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Batch No & Notes */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block">
                      Batch No.
                    </label>
                    <input
                      type="text"
                      value={transferForm.batchNo}
                      onChange={(e) => setTransferForm({ ...transferForm, batchNo: e.target.value })}
                      placeholder="e.g. D"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 uppercase outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block">
                      Notes / Remarks
                    </label>
                    <input
                      type="text"
                      value={transferForm.notes}
                      onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                      placeholder="e.g. Dispatched to KSV Factory"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsTransferModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Transfer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      })()}

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

      <ManufacturingModal
        isOpen={isManufacturingModalOpen}
        onClose={() => setIsManufacturingModalOpen(false)}
        onSave={handleSaveManufacturingLog}
        catalog={catalog}
      />

      {selectedMfgLogForPrint && (
        <TallyManufacturingPrint
          log={selectedMfgLogForPrint}
          onClose={() => setSelectedMfgLogForPrint(null)}
        />
      )}
    </div>
  )
}
