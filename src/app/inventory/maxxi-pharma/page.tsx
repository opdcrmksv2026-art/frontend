"use client"

import React, { useState, useEffect, useMemo } from 'react'
import {
  CompanyProfile,
  PartyProfile,
  CatalogItem,
  KiyavaInvoice,
  OpeningStockEntry,
  InvoiceItemRow
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
import StockRegisterTab from '@/components/kiyava/StockRegisterTab'
import MaxxiGodownTab from '@/components/kiyava/MaxxiGodownTab'
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
  FileSpreadsheet,
  TrendingUp,
  Warehouse
} from 'lucide-react'

import { API_URL } from '@/lib/apiConfig'

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
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('')
  const [partySearchQuery, setPartySearchQuery] = useState('')
  const [catalogSectionFilter, setCatalogSectionFilter] = useState<string>('ALL')
  const [filterCompany, setFilterCompany] = useState<string>('ALL')
  const [invoiceSummaryType, setInvoiceSummaryType] = useState<'SALE' | 'PURCHASE' | 'ALL'>('ALL')

  // Real-time synchronization of Maxxi B2B invoices and all Clinic OPD patient bills
  const allInvoices = useMemo(() => {
    let combined = [...invoices];
    if (typeof window === 'undefined') return combined;
    try {
      const offlineBills = JSON.parse(localStorage.getItem('ksv_offline_bills') || '[]');
      offlineBills.forEach((bill: any) => {
        const invNo = bill.invoiceNo;
        if (!invNo) return;
        const alreadyExists = combined.some(inv => inv.invoiceNo === invNo || inv.id === `bill_${invNo}`);
        if (!alreadyExists) {
          const items: InvoiceItemRow[] = (bill.treatments || []).flatMap((t: any) =>
            (t.products || []).map((p: any, idx: number) => ({
              id: `${invNo}_item_${idx}`,
              description: p.name,
              hsnSac: p.hsnSac || p.hsnCode || '',
              hsnCode: p.hsnCode || p.hsnSac || '',
              quantity: parseFloat(p.quantity || '1') || 1,
              unit: 'NOS',
              rate: Number(p.rate) || 0,
              discountPercent: 0,
              taxRate: Number(p.taxRate) || 0,
              amount: (parseFloat(p.quantity || '1') || 1) * (Number(p.rate) || 0)
            }))
          );
          if (items.length > 0) {
            combined.push({
              id: `bill_${invNo}`,
              type: 'SALE',
              invoiceNo: invNo,
              invoiceDate: bill.date || new Date().toISOString().split('T')[0],
              placeOfSupply: bill.state || 'Himachal Pradesh',
              placeOfSupplyCode: bill.stateCode || '02',
              company: DEFAULT_MAXXI_COMPANIES[0] || { name: 'Maxxi Pharma Private Limited' },
              buyer: {
                id: bill.patientId || 'patient',
                name: bill.patientName || 'Clinic Patient',
                address: bill.address || '',
                city: bill.city || '',
                state: bill.state || 'Himachal Pradesh',
                stateCode: bill.stateCode || '02'
              },
              items,
              totalQuantity: items.reduce((sum, it) => sum + it.quantity, 0),
              subtotal: bill.totalDueVal || 0,
              isInterState: Boolean(bill.calcResult?.isInterState),
              cgstAmount: bill.calcResult?.totalCgst || 0,
              sgstAmount: bill.calcResult?.totalSgst || 0,
              igstAmount: bill.calcResult?.totalIgst || 0,
              grandTotal: bill.totalDueVal || 0
            } as any);
          }
        }
      });
    } catch (e) {
      console.warn('Could not parse clinic bills for live stock register:', e);
    }
    return combined;
  }, [invoices]);

  // Load Initial Data from localStorage or clean defaults
  useEffect(() => {
    try {
      const deletedParties = new Set(
        (JSON.parse(localStorage.getItem('maxxi_deleted_parties') || '[]') as string[]).map(s => s.toLowerCase().trim())
      )
      const deletedCompanies = new Set(
        (JSON.parse(localStorage.getItem('maxxi_deleted_companies') || '[]') as string[]).map(s => s.toLowerCase().trim())
      )
      // Clear old deletion marks and refresh local cache so fresh DB values (zero old stock) load cleanly
      if (typeof window !== 'undefined' && !localStorage.getItem('maxxi_godown_fresh_stock_v3')) {
        localStorage.setItem('maxxi_godown_fresh_stock_v3', 'true')
        localStorage.removeItem('maxxi_godown_fresh_v2')
        localStorage.removeItem('maxxi_deleted_catalog')
        localStorage.removeItem('maxxi_godown_movement_logs')
        localStorage.removeItem('maxxi_app_catalog')
      }

      const deletedCatalog = new Set(
        (JSON.parse(localStorage.getItem('maxxi_deleted_catalog') || '[]') as string[]).map(s => s.toLowerCase().trim())
      )
      const deletedInvoices = new Set(
        (JSON.parse(localStorage.getItem('maxxi_deleted_invoices') || '[]') as string[]).map(s => s.toLowerCase().trim())
      )

      const storedCompanies = localStorage.getItem('maxxi_app_companies')
      const storedParties = localStorage.getItem('maxxi_app_parties')
      let storedCatalog = localStorage.getItem('maxxi_app_catalog')
      const storedInvoices = localStorage.getItem('maxxi_app_invoices')
      const storedOpeningStock = localStorage.getItem('maxxi_app_opening_stock')

      let initialCompanies = storedCompanies !== null ? JSON.parse(storedCompanies) : DEFAULT_MAXXI_COMPANIES
      initialCompanies = (initialCompanies || []).filter((c: any) => {
        const cId = (c.id || '').toLowerCase().trim()
        const cName = (c.name || '').toLowerCase().trim()
        return !deletedCompanies.has(cId) && !deletedCompanies.has(cName)
      })
      setCompanies(initialCompanies)

      let initialParties = storedParties !== null ? JSON.parse(storedParties) : DEFAULT_MAXXI_PARTIES
      initialParties = (initialParties || []).filter((p: any) => {
        const pId = (p.id || '').toLowerCase().trim()
        const pName = (p.name || '').toLowerCase().trim()
        return !deletedParties.has(pId) && !deletedParties.has(pName)
      })
      setParties(initialParties)

      // Automatic dummy catalog purge - Strip out all seeded/dummy items
      let parsedCatalog: CatalogItem[] = []
      if (storedCatalog !== null) {
        try {
          parsedCatalog = JSON.parse(storedCatalog)
        } catch {
          parsedCatalog = []
        }
      }
      parsedCatalog = (parsedCatalog || []).filter((item: any) => {
        const id = (item.id || '').toLowerCase().trim()
        return !deletedCatalog.has(id)
      })

      // Self-heal multi-section items recorded in movement logs (e.g. Stonvaidha KSG-80 with 3 in Solan, 3 in Sabathu, 3 in COD)
      try {
        const storedLogs = JSON.parse(localStorage.getItem('maxxi_godown_movement_logs') || '[]')
        const initLogs = storedLogs.filter((l: any) => l.refNo === 'CATALOG_INIT')
        if (initLogs.length > 0) {
          const groupByName = new Map<string, any[]>()
          initLogs.forEach((l: any) => {
            const k = (l.itemName || '').trim().toLowerCase()
            if (!k) return
            const arr = groupByName.get(k) || []
            arr.push(l)
            groupByName.set(k, arr)
          })

          groupByName.forEach((logs, nameKey) => {
            if (logs.length > 1) {
              const base = parsedCatalog.find(c => (c.name || '').trim().toLowerCase() === nameKey)
              if (base) {
                parsedCatalog = parsedCatalog.filter(c => (c.name || '').trim().toLowerCase() !== nameKey)
                logs.forEach((l, i) => {
                  parsedCatalog.push({
                    ...base,
                    id: `${base.id}_${l.section || i}`,
                    opdSection: l.section || 'SOLAN OPD SALE',
                    quantity: Number(l.quantity) || 0
                  })
                })
              }
            }
          })
        }
      } catch (_) {}

      setCatalog(parsedCatalog)

      // Automatic dummy invoices purge - Strip out any test/seeded invoices
      let parsedInvoices: KiyavaInvoice[] = []
      if (storedInvoices !== null) {
        try {
          parsedInvoices = JSON.parse(storedInvoices)
        } catch {
          parsedInvoices = []
        }
      }
      parsedInvoices = (parsedInvoices || []).filter((inv: any) => {
        const id = (inv.id || '').toLowerCase().trim()
        const invNo = (inv.invoiceNo || '').toLowerCase().trim()
        const isDummy = invNo === 'mxp/2026/012'
        return !isDummy && !deletedInvoices.has(id)
      })
      setInvoices(parsedInvoices)
      localStorage.setItem('maxxi_app_invoices', JSON.stringify(parsedInvoices))

      // Load opening stock
      let parsedStock: OpeningStockEntry[] = []
      if (storedOpeningStock) {
        try {
          parsedStock = JSON.parse(storedOpeningStock)
        } catch {
          parsedStock = []
        }
      }
      setOpeningStock(parsedStock)
      localStorage.setItem('maxxi_app_opening_stock', JSON.stringify(parsedStock))

      // --- FETCH LIVE DATA FROM BACKEND DATABASE (MongoDB) IN PARALLEL ---
      const fetchDatabaseData = async () => {
        try {
          const applyData = async (
            dbCatalog: CatalogItem[] | null,
            dbInvoices: KiyavaInvoice[] | null,
            dbParties: any[] | null,
            dbCompanies: any[] | null
          ) => {
            if (Array.isArray(dbCatalog)) {
              const seenDb = new Set<string>()
              const cleanCatalog: CatalogItem[] = []
              for (const item of dbCatalog) {
                const nameKey = (item.name || '').trim().toLowerCase()
                const secKey = (item.opdSection || 'SOLAN OPD SALE').trim().toUpperCase()
                const compositeKey = `${nameKey}:::${secKey}`
                const id = (item.id || '').toLowerCase().trim()
                if (!nameKey || seenDb.has(compositeKey) || deletedCatalog.has(id) || deletedCatalog.has(nameKey)) continue
                seenDb.add(compositeKey)
                cleanCatalog.push({ ...item, name: item.name.trim(), opdSection: secKey })
              }
              // Preserve locally added products so they are never lost on page refresh
              const currentLocal: CatalogItem[] = JSON.parse(localStorage.getItem('maxxi_app_catalog') || '[]')
              const unsyncedItems: CatalogItem[] = []
              for (const loc of currentLocal) {
                const locName = (loc.name || '').trim().toLowerCase()
                const locSec = (loc.opdSection || 'SOLAN OPD SALE').trim().toUpperCase()
                const locComposite = `${locName}:::${locSec}`
                const locId = (loc.id || '').toLowerCase().trim()
                if (locName && !seenDb.has(locComposite) && !deletedCatalog.has(locId) && !deletedCatalog.has(locName)) {
                  seenDb.add(locComposite)
                  cleanCatalog.push(loc)
                  unsyncedItems.push(loc)
                }
              }
              setCatalog(cleanCatalog)
              localStorage.setItem('maxxi_app_catalog', JSON.stringify(cleanCatalog))

              // Auto-sync unsynced local items to MongoDB in background
              if (unsyncedItems.length > 0) {
                unsyncedItems.forEach(it => {
                  fetch(`${API_URL}/api/maxxi/catalog`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: it.name,
                      hsnCode: it.hsnCode || '',
                      defaultUnit: it.defaultUnit || 'NOS',
                      defaultRate: Number(it.defaultRate) || 0,
                      defaultTaxRate: Number(it.defaultTaxRate) || 0,
                      description: it.description || '',
                      category: it.category || 'medicine',
                      quantity: Number(it.quantity) || 0
                    })
                  }).catch(() => {})
                })
              }
            }

            if (Array.isArray(dbInvoices) && dbInvoices.length > 0) {
              const cleanInvoices = dbInvoices.filter((inv) => {
                const invNo = (inv.invoiceNo || '').toLowerCase().trim()
                const id = (inv.id || '').toLowerCase().trim()
                return inv.invoiceNo !== 'MXP/2026/012' && !deletedInvoices.has(id) && !deletedInvoices.has(invNo)
              })
              setInvoices(cleanInvoices)
              localStorage.setItem('maxxi_app_invoices', JSON.stringify(cleanInvoices))
            } else if (Array.isArray(dbInvoices) && dbInvoices.length === 0 && parsedInvoices.length > 0) {
              Promise.allSettled(
                parsedInvoices.map((inv) =>
                  fetch(`${API_URL}/api/maxxi/invoices`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(inv)
                  })
                )
              )
            }

            if (Array.isArray(dbParties) && dbParties.length > 0) {
              const cleanParties = dbParties.filter(p => {
                const pId = (p.id || '').toLowerCase().trim()
                const pName = (p.name || '').toLowerCase().trim()
                return !deletedParties.has(pId) && !deletedParties.has(pName)
              })
              setParties(cleanParties)
              localStorage.setItem('maxxi_app_parties', JSON.stringify(cleanParties))
            }

            if (Array.isArray(dbCompanies) && dbCompanies.length > 0) {
              const cleanCompanies = dbCompanies.filter(c => {
                const cId = (c.id || '').toLowerCase().trim()
                const cName = (c.name || '').toLowerCase().trim()
                return !deletedCompanies.has(cId) && !deletedCompanies.has(cName)
              })
              setCompanies(cleanCompanies)
              localStorage.setItem('maxxi_app_companies', JSON.stringify(cleanCompanies))
            }
          }

          // Try fast single-request bootstrap first, fallback to parallel Promise.all
          const bootRes = await fetch(`${API_URL}/api/maxxi/bootstrap`)
          if (bootRes.ok) {
            const { catalog: dbCatalog, invoices: dbInvoices, parties: dbParties, companies: dbCompanies } = await bootRes.json()
            await applyData(dbCatalog, dbInvoices, dbParties, dbCompanies)
            return
          }

          const [catRes, invRes, partiesRes, compRes] = await Promise.all([
            fetch(`${API_URL}/api/maxxi/catalog`),
            fetch(`${API_URL}/api/maxxi/invoices`),
            fetch(`${API_URL}/api/maxxi/parties`),
            fetch(`${API_URL}/api/maxxi/companies`)
          ])
          const [dbCatalog, dbInvoices, dbParties, dbCompanies] = await Promise.all([
            catRes.ok ? catRes.json() : null,
            invRes.ok ? invRes.json() : null,
            partiesRes.ok ? partiesRes.json() : null,
            compRes.ok ? compRes.json() : null
          ])
          await applyData(dbCatalog, dbInvoices, dbParties, dbCompanies)
        } catch (dbErr) {
          console.warn('Backend database fetch offline or network error, continuing with local storage:', dbErr)
        }
      }
      fetchDatabaseData()

    } catch (e) {
      console.error('Failed to load Maxxi Pharma storage data:', e)
      setCompanies(DEFAULT_MAXXI_COMPANIES)
      setParties(DEFAULT_MAXXI_PARTIES)
      setCatalog([])
      setInvoices([])
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
  const handleSaveInvoice = async (invoice: KiyavaInvoice, shouldPrint: boolean = false) => {
    const isEditing = invoices.some((inv) => inv.id === invoice.id && !inv.id.startsWith('inv_'))

    // Adjust inventory dynamically
    if (!isEditing) {
      let updatedCatalog = [...catalog];
      let movementLogs: any[] = [];
      try {
        movementLogs = JSON.parse(localStorage.getItem('maxxi_godown_movement_logs') || '[]');
      } catch (e) {
        movementLogs = [];
      }

      invoice.items.forEach(item => {
        const itemSec = item.godownSection || invoice.targetGodown || 'SOLAN OPD SALE';
        const itemQty = Number(item.quantity) || 0;
        if (!item.description || itemQty <= 0) return;

        const cleanStr = (s?: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
        const targetClean = cleanStr(item.description);

        const catalogItemIndex = updatedCatalog.findIndex(c => cleanStr(c.name) === targetClean);
        if (catalogItemIndex !== -1) {
          const currentQty = Number(updatedCatalog[catalogItemIndex].quantity) || 0;
          const newQty = invoice.type === 'PURCHASE' ? currentQty + itemQty : Math.max(0, currentQty - itemQty);
          updatedCatalog[catalogItemIndex] = {
            ...updatedCatalog[catalogItemIndex],
            quantity: newQty,
            opdSection: itemSec
          };

          // Sync to MongoDB in background
          fetch(`${API_URL}/api/maxxi/catalog`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: updatedCatalog[catalogItemIndex].name,
              hsnCode: updatedCatalog[catalogItemIndex].hsnCode,
              defaultUnit: updatedCatalog[catalogItemIndex].defaultUnit,
              defaultRate: updatedCatalog[catalogItemIndex].defaultRate,
              defaultTaxRate: updatedCatalog[catalogItemIndex].defaultTaxRate,
              description: updatedCatalog[catalogItemIndex].description,
              category: updatedCatalog[catalogItemIndex].category,
              quantity: newQty,
              packing: updatedCatalog[catalogItemIndex].packing,
              opdSection: itemSec
            })
          }).catch(() => {});
        }

        // Record Godown Movement Log (INWARD for purchase, OUTWARD for sale)
        movementLogs.unshift({
          id: `glog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          date: invoice.invoiceDate || new Date().toISOString().split('T')[0],
          itemId: catalogItemIndex !== -1 ? updatedCatalog[catalogItemIndex].id : `item_${Date.now()}`,
          itemName: item.description,
          hsnCode: item.hsnSac || item.hsnCode || '',
          type: invoice.type === 'PURCHASE' ? 'INWARD' : 'OUTWARD',
          quantity: itemQty,
          unit: item.unit || 'NOS',
          section: itemSec,
          sourceOrDestination: invoice.buyer?.name || (invoice.type === 'PURCHASE' ? 'Supplier Purchase' : 'Patient/Buyer'),
          referenceNo: invoice.invoiceNo,
          remarks: `Auto-recorded from ${invoice.type === 'PURCHASE' ? 'Purchase' : 'Sale'} Invoice #${invoice.invoiceNo}`,
          timestamp: new Date().toISOString()
        });
      });

      try {
        localStorage.setItem('maxxi_godown_movement_logs', JSON.stringify(movementLogs));
      } catch (e) {}
      saveCatalog(updatedCatalog);
    }

    let savedInvoice: KiyavaInvoice = { ...invoice }
    // Sync to backend MongoDB database
    try {
      if (isEditing) {
        const res = await fetch(`${API_URL}/api/maxxi/invoices/${invoice.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invoice)
        })
        if (res.ok) {
          const data = await res.json()
          if (data && data.id) savedInvoice = { ...savedInvoice, ...data }
        }
      } else {
        const res = await fetch(`${API_URL}/api/maxxi/invoices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invoice)
        })
        if (res.ok) {
          const data = await res.json()
          if (data && data.id) savedInvoice = { ...savedInvoice, ...data }
        }
      }
    } catch (e) {}

    const updated = [savedInvoice, ...invoices.filter((inv) => inv.id !== invoice.id && inv.id !== savedInvoice.id)]
    saveInvoices(updated)
    setEditingInvoice(null)

    if (shouldPrint) {
      setSelectedInvoiceForPrint(savedInvoice)
    } else {
      setActiveTab('invoices')
    }
  }

  const handleDeleteInvoice = (id: string) => {
    if (confirm('Are you sure you want to delete this invoice from Maxxi Pharma ledger?')) {
      const invoiceToDelete = invoices.find(inv => inv.id === id || inv.invoiceNo === id);
      if (invoiceToDelete) {
        let updatedCatalog = [...catalog];
        invoiceToDelete.items.forEach(item => {
          const catalogItemIndex = updatedCatalog.findIndex(c => c.name === item.description);
          if (catalogItemIndex !== -1) {
            const currentQty = updatedCatalog[catalogItemIndex].quantity || 0;
            // Reverse the operation
            updatedCatalog[catalogItemIndex] = {
              ...updatedCatalog[catalogItemIndex],
              quantity: invoiceToDelete.type === 'PURCHASE' ? currentQty - item.quantity : currentQty + item.quantity
            };
          }
        });
        saveCatalog(updatedCatalog);
      }

      // If it is a synced clinic bill
      if (id.startsWith('bill_')) {
        const billInvNo = id.replace('bill_', '')
        try {
          const offlineBills = JSON.parse(localStorage.getItem('ksv_offline_bills') || '[]')
          const filtered = offlineBills.filter((b: any) => b.invoiceNo !== billInvNo && b.id !== billInvNo)
          localStorage.setItem('ksv_offline_bills', JSON.stringify(filtered))
        } catch (e) {}
      }

      const updated = invoices.filter((inv) => inv.id !== id && inv.invoiceNo !== id)
      saveInvoices(updated)

      try {
        const deleted = JSON.parse(localStorage.getItem('maxxi_deleted_invoices') || '[]')
        if (id && !deleted.includes(id)) deleted.push(id)
        if (invoiceToDelete?.invoiceNo && !deleted.includes(invoiceToDelete.invoiceNo)) deleted.push(invoiceToDelete.invoiceNo)
        localStorage.setItem('maxxi_deleted_invoices', JSON.stringify(deleted))

        fetch(`${API_URL}/api/maxxi/invoices/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {})
        if (invoiceToDelete?.invoiceNo) {
          fetch(`${API_URL}/api/maxxi/invoices/${encodeURIComponent(invoiceToDelete.invoiceNo)}`, { method: 'DELETE' }).catch(() => {})
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

  // Company Handlers
  const handleSaveCompany = (company: CompanyProfile) => {
    let updated: CompanyProfile[]
    if (editingCompany) {
      updated = companies.map((c) => (c.id === company.id ? company : c))
    } else {
      updated = [...companies, { ...company, id: company.id || `comp_${Date.now()}` }]
    }
    saveCompanies(updated)

    try {
      const deleted = JSON.parse(localStorage.getItem('maxxi_deleted_companies') || '[]')
      const filtered = deleted.filter((d: string) => d !== company.id && d !== company.name)
      localStorage.setItem('maxxi_deleted_companies', JSON.stringify(filtered))
    } catch (e) {}

    setIsCompanyModalOpen(false)
    setEditingCompany(null)
  }

  const handleDeleteCompany = (id: string) => {
    if (companies.length <= 1) {
      alert('At least one company profile must be maintained.')
      return
    }
    if (confirm('Delete this company profile?')) {
      const compToDelete = companies.find((c) => c.id === id)
      const updated = companies.filter((c) => c.id !== id)
      saveCompanies(updated)

      try {
        const deleted = JSON.parse(localStorage.getItem('maxxi_deleted_companies') || '[]')
        if (id && !deleted.includes(id)) deleted.push(id)
        if (compToDelete?.name && !deleted.includes(compToDelete.name)) deleted.push(compToDelete.name)
        localStorage.setItem('maxxi_deleted_companies', JSON.stringify(deleted))

        fetch(`${API_URL}/api/maxxi/companies/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {})
        if (compToDelete?.name) {
          fetch(`${API_URL}/api/maxxi/companies/${encodeURIComponent(compToDelete.name)}`, { method: 'DELETE' }).catch(() => {})
        }
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

    try {
      const deleted = JSON.parse(localStorage.getItem('maxxi_deleted_parties') || '[]')
      const filtered = deleted.filter((d: string) => d !== party.id && d !== party.name)
      localStorage.setItem('maxxi_deleted_parties', JSON.stringify(filtered))
    } catch (e) {}

    setIsPartyModalOpen(false)
    setEditingParty(null)
  }

  const handleDeleteParty = (id: string) => {
    if (confirm('Delete this party / buyer profile?')) {
      const partyToDelete = parties.find((p) => p.id === id)
      const updated = parties.filter((p) => p.id !== id)
      saveParties(updated)

      try {
        const deleted = JSON.parse(localStorage.getItem('maxxi_deleted_parties') || '[]')
        if (id && !deleted.includes(id)) deleted.push(id)
        if (partyToDelete?.name && !deleted.includes(partyToDelete.name)) deleted.push(partyToDelete.name)
        localStorage.setItem('maxxi_deleted_parties', JSON.stringify(deleted))

        fetch(`${API_URL}/api/maxxi/parties/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {})
        if (partyToDelete?.name) {
          fetch(`${API_URL}/api/maxxi/parties/${encodeURIComponent(partyToDelete.name)}`, { method: 'DELETE' }).catch(() => {})
        }
      } catch (e) {}
    }
  }

  // Catalog Handlers - Integrated with Database (MongoDB) and LocalStorage
  const handleSaveCatalogItem = async (item: CatalogItem) => {
    const isEditing = Boolean(editingCatalogItem && editingCatalogItem.id)
    const cleanTarget = (item.name || '').trim().toLowerCase()

    const allocs = (item.sectionAllocations && item.sectionAllocations.length > 0)
      ? item.sectionAllocations
      : [{ section: item.opdSection || 'SOLAN OPD SALE', quantity: Number(item.quantity) || 0 }]

    // 1. Remove all old section entries for this item name so new allocations take over cleanly
    const otherItems = catalog.filter((c) => (c.name || '').trim().toLowerCase() !== cleanTarget)

    const sectionItems: CatalogItem[] = allocs.map((alloc, idx) => ({
      ...item,
      id: isEditing && idx === 0 && editingCatalogItem?.id ? editingCatalogItem.id : `cat_${Date.now()}_${idx}`,
      name: item.name.trim(),
      opdSection: alloc.section || 'SOLAN OPD SALE',
      quantity: Number(alloc.quantity) || 0,
      sectionAllocations: allocs
    }))

    const updatedCatalog = [...otherItems, ...sectionItems]
    saveCatalog(updatedCatalog)

    try {
      const deleted = JSON.parse(localStorage.getItem('maxxi_deleted_catalog') || '[]')
      const filtered = deleted.filter((d: string) => d !== item.id && d !== item.name && d !== cleanTarget)
      localStorage.setItem('maxxi_deleted_catalog', JSON.stringify(filtered))
    } catch (e) {}

    setIsCatalogModalOpen(false)
    setEditingCatalogItem(null)

    // 2. Persist to Backend Database (MongoDB via Prisma) for each section
    try {
      for (const secItem of sectionItems) {
        const payload = {
          name: secItem.name.trim(),
          hsnCode: secItem.hsnCode || '',
          defaultUnit: secItem.defaultUnit || 'NOS',
          defaultRate: Number(secItem.defaultRate) || 0,
          defaultTaxRate: Number(secItem.defaultTaxRate) || 0,
          description: secItem.description || '',
          category: secItem.category || 'medicine',
          quantity: Number(secItem.quantity) || 0,
          opdSection: secItem.opdSection || 'SOLAN OPD SALE',
          packing: secItem.packing || ''
        }

        fetch(`${API_URL}/api/maxxi/catalog`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(() => {})
      }
    } catch (err) {
      console.warn('Backend database sync offline, product saved locally:', err)
    }

    // 3. Sync with Opening Stock
    try {
      let stockList = [...openingStock].filter(s => (s.itemName || '').trim().toLowerCase() !== cleanTarget)
      sectionItems.forEach((secItem) => {
        if (Number(secItem.quantity) > 0) {
          stockList.push({
            id: `os_${Date.now()}_${secItem.opdSection}`,
            itemId: secItem.id,
            itemName: `${secItem.name} (${secItem.opdSection})`,
            date: new Date().toISOString().split('T')[0],
            unit: secItem.defaultUnit,
            quantity: Number(secItem.quantity) || 0
          })
        }
      })
      saveOpeningStock(stockList)
    } catch (_) {}

    // 4. Sync with Godown Section inventory logs so it is immediately reflected in each section
    try {
      const storedLogs = JSON.parse(localStorage.getItem('maxxi_godown_movement_logs') || '[]')
      let updatedLogs = storedLogs.filter((l: any) =>
        !(l.refNo === 'CATALOG_INIT' && (l.itemName || '').trim().toLowerCase() === cleanTarget)
      )

      allocs.forEach((alloc, i) => {
        if (Number(alloc.quantity) > 0) {
          updatedLogs.unshift({
            id: `log_init_${item.id || Date.now()}_${i}`,
            date: new Date().toISOString().split('T')[0],
            type: 'INWARD',
            itemName: item.name.trim(),
            hsnCode: item.hsnCode || '',
            quantity: Number(alloc.quantity) || 0,
            unit: item.defaultUnit || 'NOS',
            rate: Number(item.defaultRate) || 0,
            section: alloc.section || 'SOLAN OPD SALE',
            sourceDestination: 'Catalog Stock Allocation',
            refNo: 'CATALOG_INIT',
            remarks: `Stock allocated to ${alloc.section || 'SOLAN OPD SALE'}`
          })
        }
      })
      localStorage.setItem('maxxi_godown_movement_logs', JSON.stringify(updatedLogs))
    } catch (_) {}
  }

  const handleDeleteCatalogItem = async (id: string) => {
    if (confirm('Delete this catalog product item?')) {
      const itemToDelete = catalog.find((cat) => cat.id === id)
      saveCatalog(catalog.filter((cat) => cat.id !== id))

      try {
        const deleted = JSON.parse(localStorage.getItem('maxxi_deleted_catalog') || '[]')
        if (id && !deleted.includes(id)) deleted.push(id)
        if (itemToDelete?.name && !deleted.includes(itemToDelete.name)) deleted.push(itemToDelete.name)
        localStorage.setItem('maxxi_deleted_catalog', JSON.stringify(deleted))

        await fetch(`${API_URL}/api/maxxi/catalog/${encodeURIComponent(id)}`, { method: 'DELETE' })
        if (itemToDelete?.name) {
          await fetch(`${API_URL}/api/maxxi/catalog/${encodeURIComponent(itemToDelete.name)}`, { method: 'DELETE' }).catch(() => {})
        }
      } catch (err) {
        console.warn('Could not delete catalog product from database:', err)
      }
    }
  }

  const handleClearAllCatalog = async () => {
    if (confirm('Are you sure you want to delete ALL products from Godown & Catalog? This cannot be undone.')) {
      setCatalog([])
      saveCatalog([])
      try {
        localStorage.removeItem('maxxi_app_catalog')
        localStorage.removeItem('maxxi_godown_movement_logs')
        await fetch(`${API_URL}/api/maxxi/catalog`, { method: 'DELETE' })
      } catch (err) {
        console.warn('Could not clear catalog on backend:', err)
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
    const matchesType = invoiceSummaryType === 'ALL' || (inv.type || 'SALE') === invoiceSummaryType
    return matchesSearch && matchesCompany && matchesType
  })

  return (
    <div className="w-full space-y-4 pt-0">
      <div className={`space-y-4 animate-in fade-in duration-300 ${selectedInvoiceForPrint ? 'print:hidden' : ''}`}>


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
          onClick={() => setActiveTab('godown')}
          className={`px-4 py-2 rounded-xl font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'godown'
            ? 'bg-emerald-600 text-white shadow-md'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
        >
          <Warehouse className="w-3.5 h-3.5" />
          Godown ({catalog.length})
        </button>
      </div>

      {/* 4. TAB CONTENT: 1. INVOICES & PURCHASES LEDGER */}
      {activeTab === 'invoices' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Sub-Tab Toggle: All Invoices | Sale Summary | Purchase Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setInvoiceSummaryType('ALL')}
              className={`flex-1 min-w-[130px] py-2.5 px-4 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${invoiceSummaryType === 'ALL'
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
              className={`flex-1 min-w-[130px] py-2.5 px-4 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${invoiceSummaryType === 'SALE'
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
              className={`flex-1 min-w-[130px] py-2.5 px-4 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${invoiceSummaryType === 'PURCHASE'
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
          isMaxxi={true}
          defaultInvoiceType={activeTab === 'create-purchase' ? 'PURCHASE' : 'SALE'}
          companies={companies}
          parties={parties}
          catalog={catalog}
          invoices={invoices}
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h2 className="text-sm font-black text-slate-800">Parties &amp; Buyers Directory</h2>
                <p className="text-[11px] text-slate-400">
                  Directory of customer accounts, distributors, suppliers (Kiyava, KSV), and packaging vendors.
                </p>
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
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Add New Party
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredParties.map((party) => (
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

      {/* 4. TAB CONTENT: 5. PRODUCT CATALOG */}
      {activeTab === 'catalog' && (() => {
        const filteredCatalog = catalog.filter((item) => {
          if (catalogSectionFilter !== 'ALL') {
            const itemSec = item.opdSection || 'SOLAN OPD SALE'
            if (itemSec !== catalogSectionFilter) return false
          }
          if (!catalogSearchQuery.trim()) return true
          const q = catalogSearchQuery.toLowerCase()
          return (
            item.name?.toLowerCase().includes(q) ||
            item.description?.toLowerCase().includes(q) ||
            item.category?.toLowerCase().includes(q) ||
            item.hsnCode?.toLowerCase().includes(q) ||
            item.defaultUnit?.toLowerCase().includes(q) ||
            (item.opdSection && item.opdSection.toLowerCase().includes(q))
          )
        })

        const SECTION_TABS = [
          { id: 'ALL', label: 'All Sections' },
          { id: 'SOLAN OPD SALE', label: 'Solan OPD' },
          { id: 'SABATHU OPD SALE', label: 'Sabathu OPD' },
          { id: 'COD SALE', label: 'COD Sale' },
          { id: 'ONLINE SALE', label: 'Online Sale' },
          { id: 'CENTRAL GODOWN', label: 'Central Godown' }
        ]

        return (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h2 className="text-sm font-black text-slate-800">Maxxi Pharma Product Catalog</h2>
                <p className="text-[11px] text-slate-400">
                  Pharma formulations, tablets, softgel capsules, syrups, ointments &amp; API ingredients.
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
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setActiveTab('opening-stock')}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Opening Stock
                </button>
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
            </div>

            {/* Section Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {SECTION_TABS.map((tab) => {
                const count = tab.id === 'ALL'
                  ? catalog.length
                  : catalog.filter((c) => (c.opdSection || 'SOLAN OPD SALE') === tab.id).length
                const isActive = catalogSectionFilter === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setCatalogSectionFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-amber-500 text-white shadow-sm shadow-amber-200'
                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                      <th className="p-3">Product Name</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Section / OPD</th>
                      <th className="p-3">HSN Code</th>
                      <th className="p-3 text-right">Stock Qty</th>
                      <th className="p-3 text-right">Default Unit</th>
                      <th className="p-3 text-right">Default Rate (₹)</th>
                      <th className="p-3 text-right">Tax Rate (%)</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredCatalog.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400">
                          {catalogSearchQuery.trim()
                            ? 'No matching items found.'
                            : 'No catalog products found. Click "Add Catalog Product" to add your own product.'}
                        </td>
                      </tr>
                    ) : (
                      filteredCatalog.map((item) => {
                        const sec = item.opdSection || 'SOLAN OPD SALE'
                        const secBadgeStyle =
                          sec === 'SOLAN OPD SALE'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : sec === 'SABATHU OPD SALE'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : sec === 'COD SALE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : sec === 'ONLINE SALE'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'

                        return (
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
                            <td className="p-3">
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${secBadgeStyle}`}>
                                {sec}
                              </span>
                              {item.packing && (
                                <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                                  {item.packing}
                                </div>
                              )}
                            </td>
                            <td className="p-3 font-mono text-slate-600">{item.hsnCode}</td>
                            <td className="p-3 text-right font-extrabold text-blue-600">
                              {item.quantity || 0}
                            </td>
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
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      })()}

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

      {/* 4. TAB CONTENT: 7. LIVE STOCK REGISTER */}
      {activeTab === 'stock-register' && (
        <StockRegisterTab
          catalog={catalog}
          openingStock={openingStock}
          invoices={allInvoices}
          manufacturingLogs={[]} // Maxxi Pharma doesn't have manufacturing logs right now
          onOpenOpeningStock={() => setActiveTab('opening-stock')}
        />
      )}

      {/* 4. TAB CONTENT: 8. GODOWN WAREHOUSE REGISTER & MOVEMENTS */}
      {activeTab === 'godown' && (
        <MaxxiGodownTab
          catalog={catalog}
          companies={companies}
          invoices={invoices}
          onUpdateCatalogItem={(updatedItem) => {
            const cleanStr = (s?: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim()
            const targetClean = cleanStr(updatedItem.name)
            setCatalog(prev => {
              const updated = prev.map(c => {
                if (c.id === updatedItem.id || cleanStr(c.name) === targetClean) {
                  return { ...c, ...updatedItem }
                }
                return c
              })
              saveCatalog(updated)
              return updated
            })
          }}
          onDeleteCatalogItem={handleDeleteCatalogItem}
          onClearAllCatalog={handleClearAllCatalog}
        />
      )}
      </div>

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
        catalog={catalog}
        isMaxxi={true}
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
