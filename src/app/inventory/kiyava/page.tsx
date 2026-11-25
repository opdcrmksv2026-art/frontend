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
  DEFAULT_COMPANIES,
  DEFAULT_PARTIES,
  DEFAULT_CATALOG,
  DUMMY_CATALOG_NAMES,
  SEEDED_INVOICES
} from '@/lib/kiyavaDefaults'
import { DEFAULT_KSV_CATALOG } from '@/lib/ksvDefaults'
import KiyavaInvoiceForm from '@/components/kiyava/KiyavaInvoiceForm'
import TallyInvoicePrint from '@/components/kiyava/TallyInvoicePrint'
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
  Eye,
  Trash2,
  Copy,
  Edit,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  Download,
  RotateCcw,
  FlaskConical,
  ArrowLeftRight,
  Factory,
  Save,
  X
} from 'lucide-react'

import { API_URL } from '@/lib/apiConfig'

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

  // Stock Transfer Modal (Kiyava Store <-> Kiyava Factory)
  const [stockTransfers, setStockTransfers] = useState<StockTransferLog[]>([])
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [editingTransferId, setEditingTransferId] = useState<string | null>(null)
  const [selectedTransfersForPrint, setSelectedTransfersForPrint] = useState<StockTransferLog[] | null>(null)
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
    direction: 'FACTORY_TO_STORE',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  })

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('')
  const [partySearchQuery, setPartySearchQuery] = useState('')
  const [factorySearchQuery, setFactorySearchQuery] = useState('')
  const [filterCompany, setFilterCompany] = useState<string>('ALL')
  const [invoiceSummaryType, setInvoiceSummaryType] = useState<'SALE' | 'PURCHASE' | 'ALL'>('ALL')

  // Load Initial Data from localStorage or clean defaults
  useEffect(() => {
    try {
      const deletedParties = new Set(
        (JSON.parse(localStorage.getItem('kiyava_deleted_parties') || '[]') as string[]).map(s => s.toLowerCase().trim())
      )
      const deletedCompanies = new Set(
        (JSON.parse(localStorage.getItem('kiyava_deleted_companies') || '[]') as string[]).map(s => s.toLowerCase().trim())
      )
      const deletedCatalog = new Set(
        (JSON.parse(localStorage.getItem('kiyava_deleted_catalog') || '[]') as string[]).map(s => s.toLowerCase().trim())
      )
      const deletedInvoices = new Set(
        (JSON.parse(localStorage.getItem('kiyava_deleted_invoices') || '[]') as string[]).map(s => s.toLowerCase().trim())
      )

      const storedCompanies = localStorage.getItem('ksv_kiyava_companies')
      const storedParties = localStorage.getItem('ksv_kiyava_parties')
      const storedCatalog = localStorage.getItem('ksv_kiyava_catalog')
      const storedInvoices = localStorage.getItem('ksv_kiyava_invoices')
      const storedOpeningStock = localStorage.getItem('ksv_kiyava_opening_stock')
      const storedMfgLogs = localStorage.getItem('ksv_kiyava_manufacturing')
      const storedTransfers = localStorage.getItem('ksv_kiyava_stock_transfers')

      let parsedCompanies: CompanyProfile[] = storedCompanies ? JSON.parse(storedCompanies) : DEFAULT_COMPANIES
      parsedCompanies = (parsedCompanies || []).filter((c) => {
        const cId = (c.id || '').toLowerCase().trim()
        const cName = (c.name || '').toLowerCase().trim()
        return c.name?.toUpperCase().includes('KIYAVA') && !deletedCompanies.has(cId) && !deletedCompanies.has(cName)
      })
      if (parsedCompanies.length === 0) parsedCompanies = DEFAULT_COMPANIES

      setCompanies(parsedCompanies)

      let initialParties: PartyProfile[] = storedParties ? JSON.parse(storedParties) : DEFAULT_PARTIES
      initialParties = (initialParties || []).filter((p: any) => {
        const pId = (p.id || '').toLowerCase().trim()
        const pName = (p.name || '').toLowerCase().trim()
        return !deletedParties.has(pId) && !deletedParties.has(pName)
      })
      setParties(initialParties)
      
      // Only show user-added catalog items (clean by default)
      let parsedCatalog: CatalogItem[] = storedCatalog ? JSON.parse(storedCatalog) : []
      parsedCatalog = parsedCatalog.filter(
        (c: any) => c.name && !deletedCatalog.has((c.id || '').toLowerCase().trim())
      )

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
          localStorage.setItem('ksv_kiyava_catalog', JSON.stringify(parsedCatalog))
        }
      }
      setCatalog(parsedCatalog)
      localStorage.setItem('ksv_kiyava_catalog', JSON.stringify(parsedCatalog))

      let initialInvoices: KiyavaInvoice[] = storedInvoices ? JSON.parse(storedInvoices) : SEEDED_INVOICES
      initialInvoices = (initialInvoices || []).filter((inv: any) => {
        const id = (inv.id || '').toLowerCase().trim()
        return !deletedInvoices.has(id)
      })
      setInvoices(initialInvoices)
      setOpeningStock(storedOpeningStock ? JSON.parse(storedOpeningStock) : [])
      setManufacturingLogs(storedMfgLogs ? JSON.parse(storedMfgLogs) : [])
      setStockTransfers(storedTransfers ? JSON.parse(storedTransfers) : [])

      // --- FETCH LIVE DATA FROM BACKEND DATABASE (MongoDB) IN PARALLEL ---
      const fetchDatabaseData = async () => {
        try {
          const applyData = (
            dbCatalog: CatalogItem[] | null,
            dbInvoices: KiyavaInvoice[] | null,
            dbParties: any[] | null,
            dbCompanies: any[] | null,
            dbMfg: any[] | null
          ) => {
            if (Array.isArray(dbCatalog)) {
              const seenDb = new Set<string>()
              const cleanDbCatalog: CatalogItem[] = []
              for (const c of dbCatalog) {
                const key = (c.name || '').trim().toLowerCase()
                const id = (c.id || '').toLowerCase().trim()
                if (!key || seenDb.has(key) || deletedCatalog.has(id) || deletedCatalog.has(key)) continue
                seenDb.add(key)
                cleanDbCatalog.push({ ...c, name: c.name.trim() })
              }
              // Preserve locally added products so they are never lost on page refresh
              const currentLocal: CatalogItem[] = JSON.parse(localStorage.getItem('ksv_kiyava_catalog') || '[]')
              const unsyncedItems: CatalogItem[] = []
              for (const loc of currentLocal) {
                const locKey = (loc.name || '').trim().toLowerCase()
                const locId = (loc.id || '').toLowerCase().trim()
                if (locKey && !seenDb.has(locKey) && !deletedCatalog.has(locId) && !deletedCatalog.has(locKey)) {
                  seenDb.add(locKey)
                  cleanDbCatalog.push(loc)
                  unsyncedItems.push(loc)
                }
              }
              setCatalog(cleanDbCatalog)
              localStorage.setItem('ksv_kiyava_catalog', JSON.stringify(cleanDbCatalog))

              // Auto-sync unsynced local items to MongoDB in background
              if (unsyncedItems.length > 0) {
                unsyncedItems.forEach(it => {
                  fetch(`${API_URL}/api/kiyava/catalog`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: it.name,
                      hsnCode: it.hsnCode || '',
                      defaultUnit: it.defaultUnit || 'kg',
                      defaultRate: Number(it.defaultRate) || 0,
                      defaultTaxRate: Number(it.defaultTaxRate) || 0,
                      description: it.description || '',
                      category: it.category || 'herb',
                      quantity: Number(it.quantity) || 0,
                      packing: it.packing || ''
                    })
                  }).catch(() => {})
                })
              }
            }
            if (Array.isArray(dbInvoices) && dbInvoices.length > 0) {
              const cleanDbInvoices = dbInvoices.filter((inv: any) => {
                const id = (inv.id || '').toLowerCase().trim()
                return !deletedInvoices.has(id)
              })
              setInvoices(cleanDbInvoices)
              localStorage.setItem('ksv_kiyava_invoices', JSON.stringify(cleanDbInvoices))
            }
            if (Array.isArray(dbParties) && dbParties.length > 0) {
              const cleanParties = dbParties.filter(p => {
                const pId = (p.id || '').toLowerCase().trim()
                const pName = (p.name || '').toLowerCase().trim()
                return !deletedParties.has(pId) && !deletedParties.has(pName)
              })
              setParties(cleanParties)
              localStorage.setItem('ksv_kiyava_parties', JSON.stringify(cleanParties))
            }
            if (Array.isArray(dbCompanies) && dbCompanies.length > 0) {
              const cleanCompanies = dbCompanies.filter(c => {
                const cId = (c.id || '').toLowerCase().trim()
                const cName = (c.name || '').toLowerCase().trim()
                return c.name?.toUpperCase().includes('KIYAVA') && !deletedCompanies.has(cId) && !deletedCompanies.has(cName)
              })
              if (cleanCompanies.length > 0) {
                setCompanies(cleanCompanies)
                localStorage.setItem('ksv_kiyava_companies', JSON.stringify(cleanCompanies))
              }
            }
            if (Array.isArray(dbMfg) && dbMfg.length > 0) {
              setManufacturingLogs(dbMfg)
              localStorage.setItem('ksv_kiyava_manufacturing', JSON.stringify(dbMfg))
            }
          }

          // Try fast single-request bootstrap first, fallback to parallel Promise.all
          const bootRes = await fetch(`${API_URL}/api/kiyava/bootstrap`)
          if (bootRes.ok) {
            const { catalog: dbCatalog, invoices: dbInvoices, parties: dbParties, companies: dbCompanies, manufacturing: dbMfg } = await bootRes.json()
            applyData(dbCatalog, dbInvoices, dbParties, dbCompanies, dbMfg)
            return
          }

          const [catRes, invRes, partiesRes, compRes, mfgRes] = await Promise.all([
            fetch(`${API_URL}/api/kiyava/catalog`),
            fetch(`${API_URL}/api/kiyava/invoices`),
            fetch(`${API_URL}/api/kiyava/parties`),
            fetch(`${API_URL}/api/kiyava/companies`),
            fetch(`${API_URL}/api/kiyava/manufacturing`)
          ])
          const [dbCatalog, dbInvoices, dbParties, dbCompanies, dbMfg] = await Promise.all([
            catRes.ok ? catRes.json() : null,
            invRes.ok ? invRes.json() : null,
            partiesRes.ok ? partiesRes.json() : null,
            compRes.ok ? compRes.json() : null,
            mfgRes.ok ? mfgRes.json() : null
          ])
          applyData(dbCatalog, dbInvoices, dbParties, dbCompanies, dbMfg)
        } catch (dbErr) {
          console.warn('Backend database fetch offline or network error, continuing with local storage:', dbErr)
        }
      }
      fetchDatabaseData()
    } catch (e) {
      console.error('Failed to load Kiyava storage data:', e)
      setCompanies(DEFAULT_COMPANIES)
      setParties(DEFAULT_PARTIES)
      setCatalog([])
      setInvoices(SEEDED_INVOICES)
      setOpeningStock([])
      setManufacturingLogs([])
      setStockTransfers([])
    }
  }, [])

  // Persist helpers
  const saveStockTransfers = (newTransfers: StockTransferLog[]) => {
    setStockTransfers(newTransfers)
    localStorage.setItem('ksv_kiyava_stock_transfers', JSON.stringify(newTransfers))
  }
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

  // Helper to compute Kiyava Store vs Kiyava Factory stock for any item
  const getItemStockBreakdown = (itemId: string, itemName: string, defaultUnit: string = 'PCS', defaultQty: number = 0) => {
    const nameLower = (itemName || '').toLowerCase()
    const openingEntry = openingStock.find(
      (s) => s.itemId === itemId || (s.itemName && s.itemName.toLowerCase() === nameLower)
    )
    const openingQty = openingEntry?.quantity || Number(defaultQty) || 0
    const unit = openingEntry?.unit ?? defaultUnit

    // Purchased Qty (goes into Kiyava Store)
    const purchasedQty = invoices
      .filter((inv) => inv.type === 'PURCHASE')
      .reduce((sum, inv) => {
        const rows = inv.items.filter((it) => it.description.toLowerCase() === nameLower)
        return sum + rows.reduce((s, r) => s + (r.quantity || 0), 0)
      }, 0)

    // Sold Qty (split by Kiyava Store vs Kiyava Factory)
    let soldFromStoreQty = 0
    let soldFromFactoryQty = 0
    invoices
      .filter((inv) => (inv.type || 'SALE') === 'SALE')
      .forEach((inv) => {
        const rows = inv.items.filter((it) => it.description.toLowerCase() === nameLower)
        const qty = rows.reduce((s, r) => s + (r.quantity || 0), 0)
        if (inv.matCenter === 'Kiyava Factory' || inv.matCenter === 'KSV Factory') {
          soldFromFactoryQty += qty
        } else {
          soldFromStoreQty += qty
        }
      })
    const soldQty = soldFromStoreQty + soldFromFactoryQty

    // Manufactured Qty (Produced in Kiyava Factory)
    const manufacturedQty = manufacturingLogs
      .filter((log) => log.finishedGoodItemId === itemId || log.finishedGoodName.toLowerCase() === nameLower)
      .reduce((sum, log) => sum + (log.producedQuantity || 0), 0)

    // Consumed Qty in Manufacturing (Raw Materials consumed from Kiyava Store)
    const consumedQty = manufacturingLogs.reduce((sum, log) => {
      const consumed = log.rawMaterialsConsumed.filter(
        (rm) => rm.itemId === itemId || rm.itemName.toLowerCase() === nameLower
      )
      return sum + consumed.reduce((s, rm) => s + (rm.quantity || 0), 0)
    }, 0)

    // Net Transferred from Kiyava Factory to Kiyava Store
    const netTransferredToStoreQty = stockTransfers
      .filter((tr) => tr.itemId === itemId || tr.itemName.toLowerCase() === nameLower)
      .reduce((sum, tr) => {
        return sum + (tr.direction === 'FACTORY_TO_STORE' ? tr.quantity : (tr.direction === 'STORE_TO_FACTORY' ? -tr.quantity : 0))
      }, 0)

    // Store Closing: Opening + Purchased + Received from Factory - Raw Materials Consumed - Sold from Store
    const storeClosingQty = openingQty + purchasedQty + netTransferredToStoreQty - consumedQty - soldFromStoreQty

    // Factory Closing: Produced in Factory - Transferred to Store - Sold from Factory
    const factoryClosingQty = manufacturedQty - netTransferredToStoreQty - soldFromFactoryQty

    const closingQty = storeClosingQty + factoryClosingQty

    return {
      openingQty,
      purchasedQty,
      soldQty,
      soldFromStoreQty,
      soldFromFactoryQty,
      manufacturedQty,
      consumedQty,
      transferredToFactoryQty: -netTransferredToStoreQty,
      transferredToStoreQty: netTransferredToStoreQty,
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
    setIsManufacturingModalOpen(false)

    // Sync transfer from Factory to Kiyava Store inside the Manufacturing Modal
    const transferredToStore = log.transferredToStoreQty ?? log.transferredToFactoryQty
    if (!exists && transferredToStore && transferredToStore > 0) {
      const newTransfer: StockTransferLog = {
        id: `tr_${Date.now()}`,
        date: log.date,
        batchId: log.id,
        batchNo: log.batchNo || '',
        itemId: log.finishedGoodItemId,
        itemName: log.finishedGoodName,
        quantity: Number(transferredToStore),
        unit: log.unit || 'PCS',
        direction: 'FACTORY_TO_STORE',
        notes: `Transferred to Kiyava Store from Batch ${log.batchNo || 'N/A'}`,
        createdAt: new Date().toISOString()
      }
      saveStockTransfers([newTransfer, ...stockTransfers])
    } else if (exists && transferredToStore !== undefined) {
      const batchTransfers = stockTransfers.filter((tr) => tr.batchId === log.id)
      const targetQty = Number(transferredToStore) || 0
      if (batchTransfers.length === 1) {
        if (targetQty > 0) {
          const updatedTransfers = stockTransfers.map((tr) =>
            tr.id === batchTransfers[0].id
              ? {
                  ...tr,
                  date: log.date,
                  batchNo: log.batchNo || '',
                  itemId: log.finishedGoodItemId,
                  itemName: log.finishedGoodName,
                  quantity: targetQty,
                  unit: log.unit || 'PCS',
                  direction: 'FACTORY_TO_STORE' as const
                }
              : tr
          )
          saveStockTransfers(updatedTransfers)
        } else {
          saveStockTransfers(stockTransfers.filter((tr) => tr.id !== batchTransfers[0].id))
        }
      } else if (batchTransfers.length === 0 && targetQty > 0) {
        const newTransfer: StockTransferLog = {
          id: `tr_${Date.now()}`,
          date: log.date,
          batchId: log.id,
          batchNo: log.batchNo || '',
          itemId: log.finishedGoodItemId,
          itemName: log.finishedGoodName,
          quantity: targetQty,
          unit: log.unit || 'PCS',
          direction: 'FACTORY_TO_STORE',
          notes: `Transferred to Kiyava Store from Batch ${log.batchNo || 'N/A'}`,
          createdAt: new Date().toISOString()
        }
        saveStockTransfers([newTransfer, ...stockTransfers])
      }
    }

    // Ensure the finished product is added to the Catalog so it appears in the Sales Dropdown
    if (log.finishedGoodName) {
      const alreadyInCatalog = catalog.some(c => c.name.toLowerCase() === log.finishedGoodName.toLowerCase())
      if (!alreadyInCatalog) {
        const newCatalogItem: CatalogItem = {
          id: log.finishedGoodItemId || `cat_mfg_${Date.now()}`,
          name: log.finishedGoodName,
          hsnCode: '', // Can be edited later
          defaultUnit: 'PCS',
          defaultRate: log.effectiveRatePerUnit || 0,
          defaultTaxRate: 12,
          category: 'medicine',
          description: 'Auto-added from Manufacturing'
        }
        saveCatalog([...catalog, newCatalogItem])
      }
    }
  }

  const handleDeleteManufacturingLog = async (id: string) => {
    if (confirm('Delete this manufacturing entry? Stock will be updated accordingly.')) {
      const updated = manufacturingLogs.filter((l) => l.id !== id)
      saveManufacturingLogs(updated)
      // Also clean up any stock transfers linked to this batch
      const updatedTransfers = stockTransfers.filter((tr) => tr.batchId !== id)
      if (updatedTransfers.length !== stockTransfers.length) {
        saveStockTransfers(updatedTransfers)
      }
      try {
        await fetch(`${API_URL}/api/kiyava/manufacturing/${id}`, { method: 'DELETE' })
      } catch (err) {
        console.warn('Could not delete manufacturing log from database:', err)
      }
    }
  }

  // Open Stock Transfer Modal to Edit an existing Transfer
  const openEditTransferModal = (tr: StockTransferLog) => {
    setEditingTransferId(tr.id)
    setTransferForm({
      batchId: tr.batchId || '',
      batchNo: tr.batchNo || '',
      itemId: tr.itemId || '',
      itemName: tr.itemName,
      quantity: tr.quantity,
      unit: tr.unit || 'PCS',
      direction: tr.direction,
      date: tr.date || new Date().toISOString().split('T')[0],
      notes: tr.notes || ''
    })
    setIsTransferModalOpen(true)
  }

  // Open Stock Transfer Modal for a Catalog Item (or blank)
  const openTransferModalForItem = (item?: CatalogItem) => {
    setEditingTransferId(null)
    if (item) {
      const breakdown = getItemStockBreakdown(item.id, item.name, item.defaultUnit, item.quantity)
      const hasFactory = breakdown.factoryClosingQty > 0
      setTransferForm({
        batchId: '',
        batchNo: '',
        itemId: item.id,
        itemName: item.name,
        quantity: hasFactory ? breakdown.factoryClosingQty : (breakdown.storeClosingQty > 0 ? breakdown.storeClosingQty : 1),
        unit: item.defaultUnit || 'PCS',
        direction: hasFactory ? 'FACTORY_TO_STORE' : (breakdown.storeClosingQty > 0 ? 'STORE_TO_FACTORY' : 'FACTORY_TO_STORE'),
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
        direction: 'FACTORY_TO_STORE',
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

    if (editingTransferId) {
      const updatedTransfers = stockTransfers.map((tr) =>
        tr.id === editingTransferId
          ? {
              ...tr,
              date: transferForm.date || new Date().toISOString().split('T')[0],
              batchId: transferForm.batchId || undefined,
              batchNo: transferForm.batchNo || undefined,
              itemId: transferForm.itemId || tr.itemId || `item_${Date.now()}`,
              itemName: transferForm.itemName.trim(),
              quantity: Number(transferForm.quantity) || 0,
              unit: transferForm.unit || 'PCS',
              direction: transferForm.direction,
              notes: transferForm.notes
            }
          : tr
      )
      saveStockTransfers(updatedTransfers)
    } else {
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
    }

    setEditingTransferId(null)
    setIsTransferModalOpen(false)
  }

  const handleDeleteStockTransfer = (id: string) => {
    if (confirm('Reverse / delete this stock transfer entry?')) {
      saveStockTransfers(stockTransfers.filter((tr) => tr.id !== id))
    }
  }

  // Invoice Handlers
  const handleSaveInvoice = async (invoice: KiyavaInvoice, shouldPrint: boolean = false) => {
    const isEditing = invoices.some((inv) => inv.id === invoice.id && !inv.id.startsWith('inv_'))
    setEditingInvoice(null)

    // 1. INSTANT LOCAL UPDATE (0ms delay for user!)
    const initialSaved: KiyavaInvoice = { ...invoice }
    const updatedInvoices = [initialSaved, ...invoices.filter((inv) => inv.id !== invoice.id && inv.invoiceNo !== invoice.invoiceNo)]
    saveInvoices(updatedInvoices)

    // Instantly switch view or open print modal
    if (shouldPrint) {
      setSelectedInvoiceForPrint(initialSaved)
    } else {
      setActiveTab('invoices')
    }

    // 2. Auto-sync to KSV local storage so it shows immediately if opened without refresh
    const buyerNameStr = (invoice.buyer?.name || '').toLowerCase()
    if ((invoice.type || 'SALE') === 'SALE' && (buyerNameStr.includes('ksv') || buyerNameStr.includes('karan singh vaidh') || buyerNameStr.includes('karan'))) {
      try {
        const ksvPurchaseInvoice = {
          ...JSON.parse(JSON.stringify(invoice)),
          type: 'PURCHASE',
          // Company (KSV receiving entity)
          company: {
            id: 'comp_ksv',
            name: 'KARAN SINGH VAIDH (KSV)',
            tagline: 'Ayurvedic Treatment & Clinical Center',
            addressLine1: 'VILL- RADIYANA, PO SUBATHU',
            addressLine2: 'TEH & DISTT - SOLAN',
            city: 'Solan',
            state: 'Himachal Pradesh',
            stateCode: '02',
            pincode: '173206',
            gstin: '02DFBPS6121B2Z2',
            pan: 'DFBPS6121B',
            email: 'karansinghvaidh@gmail.com',
            phone: '98160 12345',
            bankName: 'HDFC Bank',
            branch: 'Solan Branch',
            accountNo: '50200049281729',
            ifscCode: 'HDFC0001423',
            isDefault: true,
          },
          // Supplier (Kiyava)
          buyer: {
            id: 'party_kiyava',
            name: 'KIYAVA',
            contactPerson: 'Karan Vaidh / Store Manager',
            addressLine1: 'Upper Thari, Near M.G. Steel Hardware',
            addressLine2: 'Subathu Main Road, Subathu Chowk',
            city: 'Sabathu, Solan',
            state: 'Himachal Pradesh',
            stateCode: '02',
            pincode: '173206',
            gstin: '02DFBPS6121B1Z3',
            phone: '78076 22577',
            email: 'karansinghvaidh@gmail.com',
            transport: invoice.transport || 'Chandra Mangal Tpt Co.',
            station: 'Sabathu (SOLAN)'
          }
        }

        const ksvStored = localStorage.getItem('ksv_app_invoices')
        const ksvInvoices = ksvStored ? JSON.parse(ksvStored) : []
        const updatedKsv = [ksvPurchaseInvoice, ...ksvInvoices.filter((inv: any) => String(inv.invoiceNo) !== String(invoice.invoiceNo) || inv.type !== 'PURCHASE')]
        localStorage.setItem('ksv_app_invoices', JSON.stringify(updatedKsv))
      } catch (e) {
        console.error('Failed to auto-sync purchase to KSV', e)
      }
    }

    // 3. Asynchronously persist to MongoDB Atlas database in the background
    try {
      const endpoint = isEditing ? `${API_URL}/api/kiyava/invoices/${invoice.id}` : `${API_URL}/api/kiyava/invoices`
      const method = isEditing ? 'PUT' : 'POST'
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoice)
      })
      if (res.ok) {
        const data = await res.json()
        if (data && data.id) {
          setInvoices((prev) => [data, ...prev.filter((inv) => inv.id !== invoice.id && inv.id !== data.id && inv.invoiceNo !== data.invoiceNo)])
        }
      }
    } catch (e) {
      console.warn('Could not save invoice to Kiyava database in background:', e)
    }
  }

  const handleDeleteInvoice = (id: string) => {
    if (confirm('Are you sure you want to delete this invoice from Kiyava ledger?')) {
      const invToDelete = invoices.find((inv) => inv.id === id || inv.invoiceNo === id)
      const updated = invoices.filter((inv) => inv.id !== id && inv.invoiceNo !== id)
      saveInvoices(updated)

      try {
        const deleted = JSON.parse(localStorage.getItem('kiyava_deleted_invoices') || '[]')
        if (id && !deleted.includes(id)) deleted.push(id)
        if (invToDelete?.invoiceNo && !deleted.includes(invToDelete.invoiceNo)) deleted.push(invToDelete.invoiceNo)
        localStorage.setItem('kiyava_deleted_invoices', JSON.stringify(deleted))

        fetch(`${API_URL}/api/kiyava/invoices/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {})
        if (invToDelete?.invoiceNo) {
          fetch(`${API_URL}/api/kiyava/invoices/${encodeURIComponent(invToDelete.invoiceNo)}`, { method: 'DELETE' }).catch(() => {})
        }
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
    setSelectedInvoiceForPrint(duplicated)
  }

  // Company Master Handlers
  const handleSaveCompany = (company: CompanyProfile) => {
    const exists = companies.some((c) => c.id === company.id)
    const updated = exists
      ? companies.map((c) => (c.id === company.id ? company : c))
      : [...companies, company]
    saveCompanies(updated)

    try {
      const deleted = JSON.parse(localStorage.getItem('kiyava_deleted_companies') || '[]')
      const filtered = deleted.filter((d: string) => d !== company.id && d !== company.name)
      localStorage.setItem('kiyava_deleted_companies', JSON.stringify(filtered))
    } catch (e) {}

    try {
      if (exists) {
        fetch(`${API_URL}/api/kiyava/companies/${company.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(company)
        }).catch(() => {})
      } else {
        fetch(`${API_URL}/api/kiyava/companies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(company)
        }).catch(() => {})
      }
    } catch (e) {}
  }

  const handleDeleteCompany = (id: string) => {
    if (companies.length <= 1) {
      alert('At least one company must remain in the system.')
      return
    }
    if (confirm('Delete this company profile?')) {
      const compToDelete = companies.find((c) => c.id === id)
      const updated = companies.filter((c) => c.id !== id)
      saveCompanies(updated)

      try {
        const deleted = JSON.parse(localStorage.getItem('kiyava_deleted_companies') || '[]')
        if (id && !deleted.includes(id)) deleted.push(id)
        if (compToDelete?.name && !deleted.includes(compToDelete.name)) deleted.push(compToDelete.name)
        localStorage.setItem('kiyava_deleted_companies', JSON.stringify(deleted))

        fetch(`${API_URL}/api/kiyava/companies/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {})
        if (compToDelete?.name) {
          fetch(`${API_URL}/api/kiyava/companies/${encodeURIComponent(compToDelete.name)}`, { method: 'DELETE' }).catch(() => {})
        }
      } catch (e) {}
    }
  }

  // Party Master Handlers
  const handleSaveParty = (party: PartyProfile) => {
    const exists = parties.some((p) => p.id === party.id)
    const updated = exists
      ? parties.map((p) => (p.id === party.id ? party : p))
      : [...parties, party]
    saveParties(updated)

    try {
      const deleted = JSON.parse(localStorage.getItem('kiyava_deleted_parties') || '[]')
      const filtered = deleted.filter((d: string) => d !== party.id && d !== party.name)
      localStorage.setItem('kiyava_deleted_parties', JSON.stringify(filtered))
    } catch (e) {}

    try {
      if (exists) {
        fetch(`${API_URL}/api/kiyava/parties/${party.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(party)
        }).catch(() => {})
      } else {
        fetch(`${API_URL}/api/kiyava/parties`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(party)
        }).catch(() => {})
      }
    } catch (e) {}
  }

  const handleDeleteParty = (id: string) => {
    if (confirm('Delete this buyer / party?')) {
      const partyToDelete = parties.find((p) => p.id === id)
      const updated = parties.filter((p) => p.id !== id)
      saveParties(updated)

      try {
        const deleted = JSON.parse(localStorage.getItem('kiyava_deleted_parties') || '[]')
        if (id && !deleted.includes(id)) deleted.push(id)
        if (partyToDelete?.name && !deleted.includes(partyToDelete.name)) deleted.push(partyToDelete.name)
        localStorage.setItem('kiyava_deleted_parties', JSON.stringify(deleted))

        fetch(`${API_URL}/api/kiyava/parties/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {})
        if (partyToDelete?.name) {
          fetch(`${API_URL}/api/kiyava/parties/${encodeURIComponent(partyToDelete.name)}`, { method: 'DELETE' }).catch(() => {})
        }
      } catch (e) {}
    }
  }

  // Catalog Item Handlers - Integrated with MongoDB Database
  const handleSaveCatalogItem = async (item: CatalogItem) => {
    const exists = catalog.some((c) => c.id === item.id)
    const originalId = item.id

    // 1. Optimistic Update in State & LocalStorage
    const updated = exists
      ? catalog.map((c) => (c.id === item.id ? item : c))
      : [...catalog, item]
    saveCatalog(updated)

    try {
      const deleted = JSON.parse(localStorage.getItem('kiyava_deleted_catalog') || '[]')
      const filtered = deleted.filter((d: string) => d !== item.id && d !== item.name && d !== (item.name || '').toLowerCase().trim())
      localStorage.setItem('kiyava_deleted_catalog', JSON.stringify(filtered))
    } catch (e) {}

    setIsCatalogModalOpen(false)
    setEditingCatalogItem(null)

    // 2. Persist to MongoDB database via Prisma backend
    try {
      const payload = {
        name: item.name.trim(),
        hsnCode: item.hsnCode || '',
        defaultUnit: item.defaultUnit || 'kg',
        defaultRate: Number(item.defaultRate) || 0,
        defaultTaxRate: Number(item.defaultTaxRate) || 0,
        description: item.description || '',
        category: item.category || 'herb',
        quantity: Number(item.quantity) || 0,
        packing: item.packing || ''
      }

      if (exists && originalId && !originalId.startsWith('cat_')) {
        const res = await fetch(`${API_URL}/api/kiyava/catalog/${originalId}`, {
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
        const res = await fetch(`${API_URL}/api/kiyava/catalog`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (res.ok) {
          const savedData = await res.json()
          if (savedData && savedData.id) {
            const finalList = updated.map((c) =>
              c.name.trim().toLowerCase() === item.name.trim().toLowerCase() && (!c.id || c.id.startsWith('cat_')) ? { ...item, id: savedData.id } : c
            )
            saveCatalog(finalList)
          }
        }
      }
    } catch (err) {
      console.warn('Backend database sync offline, product saved locally:', err)
    }

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

  const handleDeleteCatalogItem = async (id: string, name?: string) => {
    if (confirm(`Delete "${name || 'this item'}" from catalog?`)) {
      const updated = catalog.filter((c) => c.id !== id && (!name || c.name !== name))
      saveCatalog(updated)

      try {
        const deleted = JSON.parse(localStorage.getItem('kiyava_deleted_catalog') || '[]')
        if (id && !deleted.includes(id)) deleted.push(id)
        if (name && !deleted.includes(name)) deleted.push(name)
        localStorage.setItem('kiyava_deleted_catalog', JSON.stringify(deleted))

        await fetch(`${API_URL}/api/kiyava/catalog/${encodeURIComponent(id)}`, { method: 'DELETE' })
        if (name) {
          await fetch(`${API_URL}/api/kiyava/catalog/${encodeURIComponent(name)}`, { method: 'DELETE' }).catch(() => {})
        }
      } catch (err) {
        console.warn('Could not delete catalog item from database:', err)
      }
    }
  }

  const handleClearCatalog = async () => {
    if (confirm('Are you sure you want to delete all products from the catalog? Only products you add will appear.')) {
      saveCatalog([])
      try {
        await fetch(`${API_URL}/api/kiyava/catalog/all`, { method: 'DELETE' })
      } catch (err) {
        console.warn('Could not clear catalog in database:', err)
      }
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
      localStorage.removeItem('ksv_kiyava_stock_transfers')
      
      setCompanies(DEFAULT_COMPANIES)
      setParties(DEFAULT_PARTIES)
      setCatalog([])
      setInvoices(SEEDED_INVOICES)
      setOpeningStock([])
      setManufacturingLogs([])
      setStockTransfers([])
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
    const matchesType = invoiceSummaryType === 'ALL' || (inv.type || 'SALE') === invoiceSummaryType
    return matchesSearch && matchesCompany && matchesType
  })

  const saleCount = invoices.filter((inv) => (inv.type || 'SALE') === 'SALE').length
  const purchaseCount = invoices.filter((inv) => inv.type === 'PURCHASE').length
  const saleTotalRevenue = invoices.filter((inv) => (inv.type || 'SALE') === 'SALE').reduce((sum, inv) => sum + (inv.grandTotal || 0), 0)
  const purchaseTotalSpend = invoices.filter((inv) => inv.type === 'PURCHASE').reduce((sum, inv) => sum + (inv.grandTotal || 0), 0)

  // Download Clean Excel (.csv) for Kiyava Sales or Purchases
  const handleDownloadExcel = (type: 'SALE' | 'PURCHASE' | 'ALL' = invoiceSummaryType) => {
    const listToExport = invoices.filter(inv => {
      if (type === 'ALL') return true
      return (inv.type || 'SALE') === type
    })

    if (listToExport.length === 0) {
      alert(`No ${type === 'ALL' ? 'invoice' : type.toLowerCase()} records found to export.`)
      return
    }

    const escStr = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`
    const escNum = (val: any) => {
      const num = Number(val)
      return isNaN(num) ? '0.00' : num.toFixed(2)
    }

    const headers = [
      'Sr No',
      'Invoice Date',
      'Invoice No',
      'Invoice Type',
      type === 'PURCHASE' ? 'Supplier / Seller Company' : 'Buyer / Party Name',
      'Party GSTIN',
      'City',
      'State',
      'Items & Quantities',
      'Total Units',
      'Taxable Subtotal (Rs.)',
      'CGST (Rs.)',
      'SGST (Rs.)',
      'IGST (Rs.)',
      'Total GST (Rs.)',
      'Discount (Rs.)',
      'Grand Total (Rs.)'
    ]

    const rows: string[] = []
    rows.push(headers.map(h => `"${h}"`).join(','))

    let sumQty = 0
    let sumTaxable = 0
    let sumCgst = 0
    let sumSgst = 0
    let sumIgst = 0
    let sumTotalGst = 0
    let sumDisc = 0
    let sumGrand = 0

    listToExport.forEach((inv, idx) => {
      const party = type === 'PURCHASE' ? (inv.company?.name || inv.buyer?.name || '-') : (inv.buyer?.name || '-')
      const gstin = type === 'PURCHASE' ? (inv.company?.gstin || inv.buyer?.gstin || '-') : (inv.buyer?.gstin || '-')
      const city = type === 'PURCHASE' ? (inv.company?.city || inv.buyer?.city || '-') : (inv.buyer?.city || '-')
      const state = type === 'PURCHASE' ? (inv.company?.state || inv.buyer?.state || '-') : (inv.buyer?.state || '-')
      const itemsStr = (inv.items || []).map(it => `${it.description || ''} (${it.quantity || 1} ${it.unit || ''})`).join('; ')
      const totalUnits = (inv.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0)

      const taxable = Number(inv.subtotal || 0)
      const cgst = Number(inv.cgstAmount || 0)
      const sgst = Number(inv.sgstAmount || 0)
      const igst = Number(inv.igstAmount || 0)
      const totalGst = Number(inv.totalTaxAmount || (cgst + sgst + igst))
      const discount = Number(inv.extraDiscount || 0)
      const grandTotal = Number(inv.grandTotal || 0)

      sumQty += totalUnits
      sumTaxable += taxable
      sumCgst += cgst
      sumSgst += sgst
      sumIgst += igst
      sumTotalGst += totalGst
      sumDisc += discount
      sumGrand += grandTotal

      rows.push([
        idx + 1,
        escStr(inv.invoiceDate || ''),
        escStr(inv.invoiceNo || ''),
        escStr(inv.type || 'SALE'),
        escStr(party),
        escStr(gstin),
        escStr(city),
        escStr(state),
        escStr(itemsStr),
        escNum(totalUnits),
        escNum(taxable),
        escNum(cgst),
        escNum(sgst),
        escNum(igst),
        escNum(totalGst),
        escNum(discount),
        escNum(grandTotal)
      ].join(','))
    })

    // Summary Total Row
    rows.push([
      'TOTAL',
      '',
      '',
      '',
      escStr(`Total Records: ${listToExport.length}`),
      '',
      '',
      '',
      '',
      escNum(sumQty),
      escNum(sumTaxable),
      escNum(sumCgst),
      escNum(sumSgst),
      escNum(sumIgst),
      escNum(sumTotalGst),
      escNum(sumDisc),
      escNum(sumGrand)
    ].join(','))

    const csvContent = '\uFEFF' + rows.join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `KIYAVA-${type}-INVOICES-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const isAnyPrintModalOpen = Boolean(
    selectedInvoiceForPrint ||
    (selectedTransfersForPrint && selectedTransfersForPrint.length > 0)
  )

  return (
    <div className="w-full space-y-3.5 pt-0">
      <div className={`space-y-3.5 animate-in fade-in duration-300 ${isAnyPrintModalOpen ? 'print:hidden' : ''}`}>

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
        {/* SALE INVOICES TAB */}
        <button
          onClick={() => {
            setActiveTab('invoices')
            setInvoiceSummaryType('SALE')
          }}
          className={`px-4 py-2 rounded-xl font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'invoices' && invoiceSummaryType === 'SALE'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Sale Invoices ({saleCount})
        </button>

        {/* PURCHASE INVOICES TAB */}
        <button
          onClick={() => {
            setActiveTab('invoices')
            setInvoiceSummaryType('PURCHASE')
          }}
          className={`px-4 py-2 rounded-xl font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'invoices' && invoiceSummaryType === 'PURCHASE'
              ? 'bg-orange-500 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          Purchase Invoices ({purchaseCount})
        </button>

        {/* ALL INVOICES TAB */}
        <button
          onClick={() => {
            setActiveTab('invoices')
            setInvoiceSummaryType('ALL')
          }}
          className={`px-3 py-2 rounded-xl font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'invoices' && invoiceSummaryType === 'ALL'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          All Invoices ({invoices.length})
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
          onClick={() => setActiveTab('kiyava-factory')}
          className={`px-4 py-2 rounded-xl font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'kiyava-factory'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
        >
          <Factory className="w-3.5 h-3.5" />
          Kiyava Factory ({stockTransfers.length})
        </button>

        <div className="flex-1" /> {/* Spacer */}
      </div>

      {/* 4. TAB CONTENT: 1. INVOICES */}
      {activeTab === 'invoices' && (
        <div className="space-y-4 animate-in fade-in duration-300">

          {/* Sub-Tab Toggle: All Invoices | Sale Summary | Purchase Summary + Quick Excel Downloads */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <button
                onClick={() => setInvoiceSummaryType('ALL')}
                className={`min-w-[130px] py-2.5 px-4 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${invoiceSummaryType === 'ALL'
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-300'
                    : 'text-slate-500 hover:bg-slate-50'
                  }`}
              >
                📋 All Invoices
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${invoiceSummaryType === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {invoices.length}
                </span>
              </button>
              <button
                onClick={() => setInvoiceSummaryType('SALE')}
                className={`min-w-[130px] py-2.5 px-4 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${invoiceSummaryType === 'SALE'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'text-slate-500 hover:bg-slate-50'
                  }`}
              >
                📤 Sale Invoices
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${invoiceSummaryType === 'SALE' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {saleCount}
                </span>
              </button>
              <button
                onClick={() => setInvoiceSummaryType('PURCHASE')}
                className={`min-w-[130px] py-2.5 px-4 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${invoiceSummaryType === 'PURCHASE'
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-200'
                    : 'text-slate-500 hover:bg-slate-50'
                  }`}
              >
                📥 Purchase Invoices
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${invoiceSummaryType === 'PURCHASE' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {purchaseCount}
                </span>
              </button>
            </div>

            {/* Quick 1-Click Excel Download Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownloadExcel('SALE')}
                className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-blue-200 shadow-2xs"
                title="Download Kiyava Sales Report in Excel (.csv)"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                Sale Excel
              </button>
              <button
                type="button"
                onClick={() => handleDownloadExcel('PURCHASE')}
                className="px-3 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-orange-200 shadow-2xs"
                title="Download Kiyava Purchase Report in Excel (.csv)"
              >
                <Download className="w-3.5 h-3.5 text-orange-600" />
                Purchase Excel
              </button>
            </div>
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

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
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

              <button
                type="button"
                onClick={() => handleDownloadExcel(invoiceSummaryType)}
                className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer whitespace-nowrap text-white ${
                  invoiceSummaryType === 'SALE'
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                    : invoiceSummaryType === 'PURCHASE'
                    ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'
                    : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20'
                }`}
                title={`Download ${invoiceSummaryType === 'SALE' ? 'Sales' : invoiceSummaryType === 'PURCHASE' ? 'Purchases' : 'All Invoices'} in Excel (.csv)`}
              >
                <Download className="w-3.5 h-3.5" />
                {invoiceSummaryType === 'SALE'
                  ? 'Download Sale Excel'
                  : invoiceSummaryType === 'PURCHASE'
                  ? 'Download Purchase Excel'
                  : 'Download Invoices Excel'}
              </button>
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
          onSaveParty={handleSaveParty}
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
      {activeTab === 'parties' && (() => {
        const filteredParties = parties.filter((party) => {
          if (!partySearchQuery.trim()) return true
          const q = partySearchQuery.toLowerCase()
          return (
            party.name?.toLowerCase().includes(q) ||
            party.contactPerson?.toLowerCase().includes(q) ||
            party.gstin?.toLowerCase().includes(q) ||
            party.phone?.toLowerCase().includes(q) ||
            party.city?.toLowerCase().includes(q) ||
            party.state?.toLowerCase().includes(q) ||
            party.station?.toLowerCase().includes(q) ||
            party.transport?.toLowerCase().includes(q)
          )
        })

        return (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h2 className="text-sm font-black text-slate-800">Parties / Buyers Directory</h2>
                <p className="text-xs text-slate-400 font-medium">Manage Customer profiles, GSTIN &amp; Transport stations</p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={partySearchQuery}
                  onChange={(e) => setPartySearchQuery(e.target.value)}
                  placeholder="Search party, GSTIN, city, phone..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <button
                onClick={() => {
                  setEditingParty(null)
                  setIsPartyModalOpen(true)
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> + New Party
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredParties.map((p) => (
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

            {filteredParties.length === 0 && (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
                <p className="text-xs text-slate-400 font-medium">
                  No parties found matching &quot;{partySearchQuery}&quot;
                </p>
              </div>
            )}
          </div>
        )
      })()}

      {/* 4. TAB CONTENT: 5. CATALOG MASTER */}
      {activeTab === 'catalog' && (() => {
        const filteredCatalog = catalog.filter((item) => {
          if (!catalogSearchQuery.trim()) return true
          const q = catalogSearchQuery.toLowerCase()
          return (
            item.name?.toLowerCase().includes(q) ||
            item.description?.toLowerCase().includes(q) ||
            item.hsnCode?.toLowerCase().includes(q) ||
            item.defaultUnit?.toLowerCase().includes(q) ||
            item.packing?.toLowerCase().includes(q)
          )
        })

        return (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h2 className="text-sm font-black text-slate-800">Catalog Master (Herbs &amp; Materials)</h2>
                <p className="text-xs text-slate-400 font-medium">Manage HSN codes, default rates &amp; GST tax percentages</p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={catalogSearchQuery}
                  onChange={(e) => setCatalogSearchQuery(e.target.value)}
                  placeholder="Search item name, HSN, packing..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => openTransferModalForItem()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-indigo-600/20"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" /> Transfer Store ↔ Factory
                </button>
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
                      <th className="p-3 text-center">Packing</th>
                      <th className="p-3 text-right">Quantity</th>
                      <th className="p-3 text-right">Default Rate (₹)</th>
                      <th className="p-3 text-center">GST Rate</th>
                      <th className="p-3 text-right pr-5">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {filteredCatalog.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-12 text-center text-slate-400">
                          <Package className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                          <p className="font-bold text-sm text-slate-700">
                            {catalogSearchQuery.trim() ? 'No matching items found' : 'No products in catalog'}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {catalogSearchQuery.trim()
                              ? 'Try searching with a different keyword.'
                              : 'Click "+ Add Item" above to add your products.'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredCatalog.map((item) => {
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
                        <td className="p-3 text-center font-medium text-slate-600">
                          {item.packing ? (
                            <span className="inline-block px-2 py-0.5 bg-slate-100 rounded-md font-medium text-[11px] text-slate-700 border border-slate-200">
                              {item.packing}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
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
                              onClick={() => handleDeleteCatalogItem(item.id, item.name)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              title="Delete item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      })()}

      {/* 4. TAB CONTENT: 6. OPENING STOCK */}
      {activeTab === 'opening-stock' && (() => {
        // Build stock register: per product aggregate
        const seenStockItems = new Set<string>()
        const uniqueStockCatalog: CatalogItem[] = []
        for (const it of catalog) {
          const key = (it.name || '').trim().toLowerCase()
          if (!key || seenStockItems.has(key)) continue
          seenStockItems.add(key)
          uniqueStockCatalog.push({ ...it, name: it.name.trim() })
        }

        const stockRegister = uniqueStockCatalog.map((item) => {
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openTransferModalForItem()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-indigo-600/20"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" /> Transfer Store ↔ Factory
                </button>
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

      {/* 4. TAB CONTENT: STOCK REGISTER */}
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

      {/* 4. TAB CONTENT: KIYAVA FACTORY & STOCK TRANSFERS */}
      {activeTab === 'kiyava-factory' && (() => {
        const allCandidateNames = Array.from(
          new Set([
            ...manufacturingLogs.map((m) => m.finishedGoodName),
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
              isFinishedOrTransferred,
              ...breakdown
            }
          })
          .filter((row) => {
            const matchesQuery =
              !factorySearchQuery.trim() ||
              row.name.toLowerCase().includes(factorySearchQuery.toLowerCase()) ||
              row.hsnCode.toLowerCase().includes(factorySearchQuery.toLowerCase())
            const hasActivity =
              row.isFinishedOrTransferred ||
              row.factoryClosingQty !== 0 ||
              row.manufacturedQty > 0 ||
              Boolean(factorySearchQuery.trim())
            return matchesQuery && hasActivity
          })

        const totalFactoryAvailable = factoryProductRows.reduce((s, r) => s + r.factoryClosingQty, 0)
        const totalStoreRemaining = factoryProductRows.reduce((s, r) => s + r.storeClosingQty, 0)
        const totalNetTransferredToStore = factoryProductRows.reduce((s, r) => s + (r.transferredToStoreQty || 0), 0)
        const totalSoldFromFactory = factoryProductRows.reduce((s, r) => s + r.soldFromFactoryQty, 0)

        return (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Top Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <Factory className="w-4 h-4 text-indigo-600" />
                  Kiyava Factory Stock &amp; Store Comparison
                </h2>
                <p className="text-[11px] text-slate-400">
                  Check live finished goods quantity available in <strong>Kiyava Factory</strong> vs remaining in <strong>Kiyava Store</strong>.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={factorySearchQuery}
                  onChange={(e) => setFactorySearchQuery(e.target.value)}
                  placeholder="Search item in Kiyava Factory..."
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
                <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600 mb-1">🏭 Kiyava Factory Stock</p>
                <h3 className="text-2xl font-black text-indigo-800 font-mono">
                  {totalFactoryAvailable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </h3>
                <p className="text-[10px] text-indigo-600/80 font-medium mt-0.5">Available now in Kiyava Factory</p>
              </div>

              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-teal-600 mb-1">🏪 Kiyava Store Stock</p>
                <h3 className="text-2xl font-black text-teal-800 font-mono">
                  {totalStoreRemaining.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </h3>
                <p className="text-[10px] text-teal-600/80 font-medium mt-0.5">Remaining in Kiyava Store</p>
              </div>

              <div className="bg-cyan-50 border border-cyan-100 rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-cyan-600 mb-1">🔄 Net Transferred to Store</p>
                <h3 className="text-2xl font-black text-cyan-800 font-mono">
                  +{totalNetTransferredToStore.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </h3>
                <p className="text-[10px] text-cyan-600/80 font-medium mt-0.5">Moved from Factory → Store</p>
              </div>

              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-rose-600 mb-1">📤 Sold from Factory</p>
                <h3 className="text-2xl font-black text-rose-700 font-mono">
                  −{totalSoldFromFactory.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </h3>
                <p className="text-[10px] text-rose-500 font-medium mt-0.5">Dispatched via Factory Sale Invoices</p>
              </div>
            </div>

            {/* Transfer History Table inside Kiyava Factory Tab */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600" />
                    Kiyava Factory Transfer History (Store ↔ Factory)
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Complete log of all stock transfers between Kiyava Store and Kiyava Factory</p>
                </div>
                <div className="flex items-center gap-2">
                  {stockTransfers.length > 0 && (
                    <button
                      onClick={() => setSelectedTransfersForPrint(stockTransfers)}
                      className="px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors border border-cyan-200 cursor-pointer"
                      title="Print Full Stock Transfer Ledger"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print Ledger
                    </button>
                  )}
                  <span className="text-[10px] font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                    {stockTransfers.length} Transfer(s)
                  </span>
                </div>
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
                                🏪 Kiyava Store → 🏭 Kiyava Factory
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 font-extrabold text-[10px]">
                                🏭 Kiyava Factory → 🏪 Kiyava Store
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right font-mono font-black text-indigo-700">
                            {tr.quantity} <span className="text-[10px] uppercase">{tr.unit}</span>
                          </td>
                          <td className="p-3 text-slate-500 text-[11px]">{tr.notes || '—'}</td>
                          <td className="p-3 text-right pr-5">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedTransfersForPrint([tr])}
                                className="px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors border border-cyan-200 cursor-pointer"
                                title="Print Transfer Voucher / Challan"
                              >
                                <Printer className="w-3.5 h-3.5" /> Print
                              </button>
                              <button
                                onClick={() => openEditTransferModal(tr)}
                                className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer"
                                title="Edit Transfer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteStockTransfer(tr.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Undo / Delete Transfer"
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
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 font-medium">
                  No transfers recorded yet. Click &quot;+ Transfer Stock (Store ↔ Factory)&quot; above to move finished goods to Kiyava Factory.
                </div>
              )}
            </div>
          </div>
        )
      })()}
      </div>

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

      <ManufacturingModal
        isOpen={isManufacturingModalOpen}
        onClose={() => setIsManufacturingModalOpen(false)}
        onSave={handleSaveManufacturingLog}
        catalog={catalog}
      />

      {/* STOCK TRANSFER MODAL (STORE <-> FACTORY) */}
      {isTransferModalOpen && (() => {
        const selectedStock = transferForm.itemName
          ? getItemStockBreakdown(transferForm.itemId, transferForm.itemName, transferForm.unit)
          : null
        const maxAvailable =
          transferForm.direction === 'FACTORY_TO_STORE'
            ? Math.max(0, selectedStock?.factoryClosingQty || 0)
            : Math.max(0, selectedStock?.storeClosingQty || 0)

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
                      {editingTransferId
                        ? 'Edit Stock Transfer'
                        : transferForm.direction === 'FACTORY_TO_STORE'
                        ? 'Transfer Stock (Factory ➔ Store)'
                        : 'Transfer Stock (Store ➔ Factory)'}
                    </h2>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {transferForm.direction === 'FACTORY_TO_STORE'
                        ? 'Move finished goods from Kiyava Factory to Kiyava Store'
                        : 'Move goods from Kiyava Store to Kiyava Factory'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTransferId(null)
                    setIsTransferModalOpen(false)
                  }}
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
                      onClick={() => setTransferForm({ ...transferForm, direction: 'FACTORY_TO_STORE' })}
                      className={`py-2.5 px-3 rounded-xl font-extrabold text-xs border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        transferForm.direction === 'FACTORY_TO_STORE'
                          ? 'bg-teal-600 text-white border-teal-600 shadow-md'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      🏭 Factory → 🏪 Store
                    </button>
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
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-2.5 flex justify-between items-center">
                      <span className="text-[10px] font-extrabold text-indigo-700 uppercase">🏭 Kiyava Factory:</span>
                      <span className="font-mono font-black text-sm text-indigo-800">
                        {selectedStock.factoryClosingQty} {selectedStock.unit}
                      </span>
                    </div>
                    <div className="bg-teal-50 border border-teal-200 rounded-xl p-2.5 flex justify-between items-center">
                      <span className="text-[10px] font-extrabold text-teal-700 uppercase">🏪 Kiyava Store:</span>
                      <span className="font-mono font-black text-sm text-teal-800">
                        {selectedStock.storeClosingQty} {selectedStock.unit}
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
                      placeholder="e.g. 104"
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
                      placeholder="e.g. Dispatched to Kiyava Store"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTransferId(null)
                      setIsTransferModalOpen(false)
                    }}
                    className="px-4 py-2 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" /> {editingTransferId ? 'Update Transfer' : 'Save Transfer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      })()}

      {/* PRINTABLE STOCK TRANSFER VOUCHER / CHALLAN MODAL */}
      {selectedTransfersForPrint && selectedTransfersForPrint.length > 0 && (() => {
        const isSingle = selectedTransfersForPrint.length === 1
        const singleTr = selectedTransfersForPrint[0]
        const primaryCompany = companies[0]
        const totalTransferredQty = selectedTransfersForPrint.reduce((sum, t) => sum + (Number(t.quantity) || 0), 0)

        return (
          <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:static print:inset-auto print:p-0 print:m-0 print:bg-white print:overflow-visible print:block print:w-full print:backdrop-blur-none">
            {/* Floating Action Bar (Hidden during print) */}
            <div className="fixed top-4 right-4 z-50 flex items-center gap-2 print:hidden">
              <button
                onClick={() => {
                  window.scrollTo(0, 0)
                  window.print()
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4" /> Print {isSingle ? 'Transfer Voucher' : 'Transfer Ledger'}
              </button>
              <button
                onClick={() => setSelectedTransfersForPrint(null)}
                className="p-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl shadow-lg border border-slate-200 cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Voucher Paper */}
            <div
              id="tally-printable-transfer"
              className="bg-white w-full max-w-4xl p-8 border border-slate-300 shadow-2xl rounded-xl print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:max-w-none text-black font-sans text-xs"
            >
              {/* Title Header */}
              <div className="flex justify-between items-start border-b-2 border-black pb-3 print:pb-2 mb-4 print:mb-2">
                <div>
                  <h1 className="text-lg font-black uppercase tracking-wide text-slate-900 print:text-base">
                    {primaryCompany?.name || 'KIYAVA HEALTHCARE'}
                  </h1>
                  <p className="text-[11px] font-semibold text-slate-600 print:text-[10px]">
                    {primaryCompany ? `${primaryCompany.addressLine1}${primaryCompany.city ? `, ${primaryCompany.city}` : ''}` : 'Solan, Himachal Pradesh'}
                  </p>
                  {primaryCompany?.gstin && (
                    <p className="text-[10px] font-mono font-bold text-slate-500 print:text-[9px]">
                      GSTIN: {primaryCompany.gstin} | State: {primaryCompany.state} ({primaryCompany.stateCode})
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-black uppercase text-sm tracking-wide text-indigo-900 print:text-xs">
                    {isSingle ? 'Stock Transfer Challan / Voucher' : 'Stock Transfer Ledger (Store ↔ Factory)'}
                  </div>
                  <div className="text-[11px] font-mono font-bold text-slate-600 mt-1 print:text-[10px]">
                    Date: {isSingle ? singleTr.date : new Date().toISOString().split('T')[0]}
                  </div>
                  {isSingle && singleTr.batchNo && (
                    <div className="text-[11px] font-mono font-bold text-slate-700 print:text-[10px]">
                      Batch No: {singleTr.batchNo}
                    </div>
                  )}
                </div>
              </div>

              {/* Source & Destination Summary for Single Voucher */}
              {isSingle && (
                <div className="grid grid-cols-2 gap-4 mb-4 print:mb-2 p-3 print:p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-slate-500 block print:text-[9px]">Source Location (From)</span>
                    <strong className="text-sm font-black text-slate-900 print:text-xs">
                      {singleTr.direction === 'STORE_TO_FACTORY' ? '🏪 Kiyava Store' : '🏭 Kiyava Factory'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-slate-500 block print:text-[9px]">Destination Location (To)</span>
                    <strong className="text-sm font-black text-indigo-800 print:text-xs">
                      {singleTr.direction === 'STORE_TO_FACTORY' ? '🏭 Kiyava Factory' : '🏪 Kiyava Store'}
                    </strong>
                  </div>
                </div>
              )}

              {/* Main Table */}
              <table className="w-full border-collapse border border-slate-400 text-xs mb-6 print:mb-3 print:text-[11px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-400 text-[10px] uppercase font-extrabold text-slate-800">
                    <th className="border-r border-slate-400 p-2 text-center w-10">#</th>
                    <th className="border-r border-slate-400 p-2 text-left">Date</th>
                    <th className="border-r border-slate-400 p-2 text-left">Batch #</th>
                    <th className="border-r border-slate-400 p-2 text-left">Product / Finished Good Name</th>
                    <th className="border-r border-slate-400 p-2 text-left">Transfer Direction</th>
                    <th className="border-r border-slate-400 p-2 text-right">Qty Transferred</th>
                    <th className="p-2 text-left">Remarks / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {selectedTransfersForPrint.map((tr, idx) => (
                    <tr key={tr.id}>
                      <td className="p-2 border-r border-slate-300 text-center font-mono font-bold">{idx + 1}</td>
                      <td className="p-2 border-r border-slate-300 font-mono">{tr.date}</td>
                      <td className="p-2 border-r border-slate-300 font-mono font-bold uppercase">{tr.batchNo || '—'}</td>
                      <td className="p-2 border-r border-slate-300 font-black uppercase text-slate-900">{tr.itemName}</td>
                      <td className="p-2 border-r border-slate-300 font-bold">
                        {tr.direction === 'STORE_TO_FACTORY'
                          ? 'Kiyava Store → Kiyava Factory'
                          : 'Kiyava Factory → Kiyava Store'}
                      </td>
                      <td className="p-2 border-r border-slate-300 text-right font-mono font-black text-slate-900">
                        {tr.quantity} <span className="text-[10px] uppercase">{tr.unit}</span>
                      </td>
                      <td className="p-2 text-slate-700">{tr.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 border-t-2 border-slate-400 font-extrabold text-xs print:text-[11px]">
                    <td className="p-2 border-r border-slate-400 text-right uppercase" colSpan={5}>
                      Total Quantity Transferred:
                    </td>
                    <td className="p-2 border-r border-slate-400 text-right font-mono text-sm font-black text-slate-900 print:text-xs">
                      {totalTransferredQty.toLocaleString('en-IN', { maximumFractionDigits: 2 })}{' '}
                      {isSingle ? singleTr.unit : ''}
                    </td>
                    <td className="p-2"></td>
                  </tr>
                </tfoot>
              </table>

              {/* Signatures */}
              <div className="mt-8 print:mt-4 flex justify-between items-end pt-6 print:pt-3 border-t border-slate-300 text-[11px] font-bold text-slate-700">
                <div>Dispatched By (Kiyava Store): _______________</div>
                <div>Received By (Kiyava Factory): _______________</div>
                <div>Authorized Signatory</div>
              </div>
            </div>
          </div>
        )
      })()}


    </div>
  )
}
