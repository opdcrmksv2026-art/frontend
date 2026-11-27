"use client"

import React, { useState, useMemo, useEffect } from 'react'
import {
  CatalogItem,
  CompanyProfile
} from '@/types/kiyavaBilling'
import {
  Warehouse,
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Calendar,
  MapPin,
  Truck,
  ArrowRight,
  Clock,
  X,
  Save,
  Tag,
  Store,
  Globe,
  Layers,
  Trash2
} from 'lucide-react'
import { API_URL } from '@/lib/apiConfig'

export interface GodownMovementLog {
  id: string
  date: string
  itemId: string
  itemName: string
  hsnCode?: string
  type: 'INWARD' | 'OUTWARD'
  quantity: number
  unit: string
  section?: string
  sourceOrDestination: string
  referenceNo?: string
  remarks?: string
  timestamp: string
}

export const GODOWN_SECTIONS = [
  { id: 'ALL', label: 'All Sections', icon: '🏢', badgeColor: 'bg-slate-900 text-white' },
  { id: 'SOLAN OPD SALE', label: 'Solan OPD Sale', icon: '🏥', badgeColor: 'bg-blue-600 text-white' },
  { id: 'SABATHU OPD SALE', label: 'Sabathu OPD Sale', icon: '🌿', badgeColor: 'bg-emerald-600 text-white' },
  { id: 'COD SALE', label: 'COD Sale', icon: '📦', badgeColor: 'bg-purple-600 text-white' },
  { id: 'ONLINE SALE', label: 'Online Sale', icon: '🌐', badgeColor: 'bg-cyan-600 text-white' },
  { id: 'CENTRAL GODOWN', label: 'Central Godown', icon: '🏬', badgeColor: 'bg-amber-600 text-white' }
]

interface MaxxiGodownTabProps {
  catalog: CatalogItem[]
  companies: CompanyProfile[]
  onUpdateCatalogItem: (updatedItem: CatalogItem) => void
  onDeleteCatalogItem?: (id: string) => void
  onClearAllCatalog?: () => void
}

export default function MaxxiGodownTab({
  catalog,
  companies,
  onUpdateCatalogItem,
  onDeleteCatalogItem,
  onClearAllCatalog
}: MaxxiGodownTabProps) {
  // Navigation & Filter States
  const [activeSection, setActiveSection] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL')
  const [viewMode, setViewMode] = useState<'REGISTER' | 'LOGS'>('REGISTER')

  // Movement logs state
  const [movementLogs, setMovementLogs] = useState<GodownMovementLog[]>([])

  // Modal states for Inward & Outward
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'INWARD' | 'OUTWARD'>('INWARD')
  const [selectedItemForAction, setSelectedItemForAction] = useState<CatalogItem | null>(null)

  // Form state
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0])
  const [formItemId, setFormItemId] = useState('')
  const [formQuantity, setFormQuantity] = useState<number | ''>('')
  const [formSection, setFormSection] = useState('SOLAN OPD SALE')
  const [formSourceDest, setFormSourceDest] = useState('')
  const [formRefNo, setFormRefNo] = useState('')
  const [formRemarks, setFormRemarks] = useState('')
  const [formLocation, setFormLocation] = useState('Main Godown (Rack A)')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load movement logs from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('maxxi_godown_movement_logs')
      if (stored) {
        setMovementLogs(JSON.parse(stored))
      }
    } catch (e) {
      console.warn('Could not load godown movement logs:', e)
    }
  }, [])

  const saveMovementLogs = (newLogs: GodownMovementLog[]) => {
    setMovementLogs(newLogs)
    try {
      localStorage.setItem('maxxi_godown_movement_logs', JSON.stringify(newLogs))
    } catch (e) {}
  }

  // Section-specific inventory derived from Catalog and Movement Logs
  const uniqueCatalog = useMemo(() => {
    // 1. Calculate net stock per item per section from movement logs
    const logStockMap = new Map<string, { qty: number; hsn?: string; unit?: string }>()
    movementLogs.forEach((log) => {
      const nameKey = (log.itemName || '').trim().toLowerCase()
      const secKey = log.section || 'SOLAN OPD SALE'
      if (!nameKey) return
      const compositeKey = `${nameKey}:::${secKey}`
      const existing = logStockMap.get(compositeKey) || { qty: 0, hsn: log.hsnCode, unit: log.unit }
      const change = log.type === 'INWARD' ? Number(log.quantity) || 0 : -(Number(log.quantity) || 0)
      logStockMap.set(compositeKey, {
        qty: existing.qty + change,
        hsn: log.hsnCode || existing.hsn,
        unit: log.unit || existing.unit
      })
    })

    const result: CatalogItem[] = []
    const processedComposite = new Set<string>()

    // 2. Add entries from Movement Logs with positive stock
    logStockMap.forEach((data, compositeKey) => {
      if (data.qty <= 0) return
      const [nameKey, secKey] = compositeKey.split(':::')
      processedComposite.add(compositeKey)

      const master = catalog.find((c) => (c.name || '').trim().toLowerCase() === nameKey)
      result.push({
        id: master?.id ? `${master.id}_${secKey}` : `sec_${Date.now()}_${nameKey}`,
        name: master?.name || nameKey.toUpperCase(),
        hsnCode: master?.hsnCode || data.hsn || '',
        defaultUnit: master?.defaultUnit || data.unit || 'NOS',
        defaultRate: master?.defaultRate || 0,
        defaultTaxRate: master?.defaultTaxRate || 5,
        category: master?.category || 'medicine',
        description: master?.description || '',
        quantity: Math.max(0, data.qty),
        opdSection: secKey,
        packing: master?.packing
      })
    })

    // 3. Also include items from Catalog that have an explicit opdSection and stock > 0
    for (const it of catalog) {
      const nameKey = (it.name || '').trim().toLowerCase()
      const secKey = it.opdSection
      if (!nameKey || !secKey) continue
      const compositeKey = `${nameKey}:::${secKey}`
      if (processedComposite.has(compositeKey)) continue

      const qty = Number(it.quantity || 0)
      if (qty <= 0) continue

      processedComposite.add(compositeKey)
      result.push({
        ...it,
        name: it.name.trim(),
        opdSection: secKey
      })
    }

    return result
  }, [catalog, movementLogs])

  // Section Counts
  const sectionCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: uniqueCatalog.length }
    GODOWN_SECTIONS.forEach((sec) => {
      counts[sec.id] = 0
    })
    counts['ALL'] = uniqueCatalog.length
    uniqueCatalog.forEach((item) => {
      const sec = item.opdSection || 'CENTRAL GODOWN'
      counts[sec] = (counts[sec] || 0) + 1
    })
    return counts
  }, [uniqueCatalog])

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>()
    uniqueCatalog.forEach((c) => {
      if (c.category && c.category.trim()) set.add(c.category.trim())
    })
    return ['ALL', ...Array.from(set)]
  }, [uniqueCatalog])

  // Filtered catalog for display based on activeSection + search + category + status
  const filteredCatalog = useMemo(() => {
    return uniqueCatalog.filter((item) => {
      const itemSec = item.opdSection || 'SOLAN OPD SALE'
      const matchesSection = activeSection === 'ALL' || itemSec === activeSection

      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.hsnCode && item.hsnCode.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        itemSec.toLowerCase().includes(q)

      const matchesCat = categoryFilter === 'ALL' || item.category === categoryFilter

      const qty = Number(item.quantity || 0)
      let matchesStatus = true
      if (statusFilter === 'IN_STOCK') matchesStatus = qty > 10
      if (statusFilter === 'LOW_STOCK') matchesStatus = qty > 0 && qty <= 10
      if (statusFilter === 'OUT_OF_STOCK') matchesStatus = qty <= 0

      return matchesSection && matchesSearch && matchesCat && matchesStatus
    })
  }, [uniqueCatalog, activeSection, searchQuery, categoryFilter, statusFilter])

  // Filtered movement logs
  const filteredLogs = useMemo(() => {
    return movementLogs.filter((log) => {
      const matchesSection =
        activeSection === 'ALL' || !log.section || log.section === activeSection

      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        log.itemName.toLowerCase().includes(q) ||
        (log.referenceNo && log.referenceNo.toLowerCase().includes(q)) ||
        log.sourceOrDestination.toLowerCase().includes(q) ||
        (log.remarks && log.remarks.toLowerCase().includes(q)) ||
        (log.section && log.section.toLowerCase().includes(q))

      return matchesSection && matchesSearch
    })
  }, [movementLogs, activeSection, searchQuery])

  // Summary Metrics calculated dynamically for the active section
  const metrics = useMemo(() => {
    const list =
      activeSection === 'ALL'
        ? uniqueCatalog
        : uniqueCatalog.filter((item) => (item.opdSection || 'SOLAN OPD SALE') === activeSection)

    const totalSkus = list.length
    const totalUnits = list.reduce(
      (sum, item) => sum + Math.max(0, Number(item.quantity || 0)),
      0
    )
    const totalValuation = list.reduce((sum, item) => {
      const qty = Math.max(0, Number(item.quantity || 0))
      const rate = Number(item.defaultRate || 0)
      return sum + qty * rate
    }, 0)
    const lowStockCount = list.filter((item) => {
      const qty = Number(item.quantity || 0)
      return qty > 0 && qty <= 10
    }).length
    const outOfStockCount = list.filter((item) => Number(item.quantity || 0) <= 0).length

    return { totalSkus, totalUnits, totalValuation, lowStockCount, outOfStockCount }
  }, [uniqueCatalog, activeSection])

  // Open Modal Helper
  const openActionModal = (type: 'INWARD' | 'OUTWARD', item?: CatalogItem) => {
    setModalType(type)
    setFormDate(new Date().toISOString().split('T')[0])
    setFormQuantity('')
    setFormRefNo('')
    setFormRemarks('')
    const targetSection = activeSection !== 'ALL' ? activeSection : 'SOLAN OPD SALE'
    setFormSection(targetSection)

    if (type === 'INWARD') {
      setFormSourceDest('Maxxi Manufacturing Factory')
    } else {
      setFormSourceDest(targetSection === 'COD SALE' ? 'COD Courier Dispatch' : `${targetSection} Patient Billing`)
    }

    if (item) {
      setSelectedItemForAction(item)
      setFormItemId(item.id)
      setFormSection(item.opdSection || targetSection)
    } else if (filteredCatalog.length > 0) {
      setSelectedItemForAction(filteredCatalog[0])
      setFormItemId(filteredCatalog[0].id)
      setFormSection(filteredCatalog[0].opdSection || targetSection)
    } else if (catalog.length > 0) {
      setSelectedItemForAction(catalog[0])
      setFormItemId(catalog[0].id)
      setFormSection(catalog[0].opdSection || targetSection)
    }
    setIsModalOpen(true)
  }

  // Handle Form Submission for Stock Inward / Outward
  const handleSubmitMovement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formItemId) return
    const numQty = parseFloat(String(formQuantity))
    if (isNaN(numQty) || numQty <= 0) {
      alert('Please enter a valid positive quantity!')
      return
    }

    const targetItem = catalog.find((c) => c.id === formItemId) || uniqueCatalog.find((c) => c.id === formItemId)
    if (!targetItem) return

    const currentQty = Number(targetItem.quantity || 0)
    let newQty = currentQty

    if (modalType === 'INWARD') {
      newQty = currentQty + numQty
    } else {
      if (numQty > currentQty) {
        const proceed = confirm(
          `Warning: You are dispatching ${numQty} ${targetItem.defaultUnit || 'units'}, but current stock is only ${currentQty}. Negative stock will be recorded. Do you want to continue?`
        )
        if (!proceed) return
      }
      newQty = currentQty - numQty
    }

    setIsSubmitting(true)
    const updatedItem: CatalogItem = {
      ...targetItem,
      quantity: newQty,
      opdSection: formSection || targetItem.opdSection || 'SOLAN OPD SALE'
    }

    // 1. Update parent state immediately (Optimistic UI)
    onUpdateCatalogItem(updatedItem)

    // 2. Create Movement Log
    const newLog: GodownMovementLog = {
      id: `glog_${Date.now()}`,
      date: formDate,
      itemId: targetItem.id,
      itemName: targetItem.name,
      hsnCode: targetItem.hsnCode,
      type: modalType,
      quantity: numQty,
      unit: targetItem.defaultUnit || 'NOS',
      section: formSection,
      sourceOrDestination: formSourceDest.trim() || (modalType === 'INWARD' ? 'Factory' : 'Dispatch'),
      referenceNo: formRefNo.trim() || undefined,
      remarks: formRemarks.trim() || undefined,
      timestamp: new Date().toISOString()
    }
    saveMovementLogs([newLog, ...movementLogs])

    // 3. Save to MongoDB Cloud Database
    try {
      await fetch(`${API_URL}/api/maxxi/catalog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: targetItem.name,
          hsnCode: targetItem.hsnCode,
          defaultUnit: targetItem.defaultUnit,
          defaultRate: targetItem.defaultRate,
          defaultTaxRate: targetItem.defaultTaxRate,
          description: targetItem.description,
          category: targetItem.category,
          quantity: newQty,
          packing: targetItem.packing,
          opdSection: formSection
        })
      })
    } catch (err) {
      console.warn('Background sync to MongoDB failed (saved locally):', err)
    } finally {
      setIsSubmitting(false)
      setIsModalOpen(false)
    }
  }

  // Export Godown Stock to CSV
  const handleExportCSV = () => {
    const listToExport = filteredCatalog
    if (listToExport.length === 0) {
      alert('No godown items to export in this section!')
      return
    }

    const headers = [
      'S.No',
      'Product Name',
      'Section / Allocation',
      'HSN Code',
      'Category',
      'Godown Location',
      'Available Stock',
      'Unit',
      'Unit Rate (Rs.)',
      'Stock Valuation (Rs.)',
      'Stock Status'
    ]

    const rows = listToExport.map((item, idx) => {
      const qty = Number(item.quantity || 0)
      const rate = Number(item.defaultRate || 0)
      const val = qty * rate
      const status = qty <= 0 ? 'Out of Stock' : qty <= 10 ? 'Low Stock' : 'In Stock'
      return [
        idx + 1,
        `"${item.name.replace(/"/g, '""')}"`,
        `"${item.opdSection || 'SOLAN OPD SALE'}"`,
        `"${item.hsnCode || '-'}"`,
        `"${item.category || 'General'}"`,
        `"Main Godown (Rack A)"`,
        qty,
        `"${item.defaultUnit || 'NOS'}"`,
        rate,
        val.toFixed(2),
        `"${status}"`
      ].join(',')
    })

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `Maxxi_Godown_${activeSection.replace(/\s+/g, '_')}_Stock_${new Date().toISOString().split('T')[0]}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Section badge style helper
  const getSectionBadge = (sec?: string) => {
    const s = sec || 'SOLAN OPD SALE'
    switch (s) {
      case 'SOLAN OPD SALE':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'SABATHU OPD SALE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'COD SALE':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'ONLINE SALE':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200'
      case 'CENTRAL GODOWN':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* SECTION TABS & ACTION BUTTONS TOOLBAR */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          {GODOWN_SECTIONS.map((sec) => {
            const count = sectionCounts[sec.id] || 0
            const isActive = activeSection === sec.id
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span className="text-sm">{sec.icon}</span>
                <span>{sec.label}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => openActionModal('INWARD')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
            + Inward Stock
          </button>
          <button
            type="button"
            onClick={() => openActionModal('OUTWARD')}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <ArrowUpFromLine className="w-3.5 h-3.5" />
            ⇄ Dispatch
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Export Excel
          </button>
        </div>
      </div>

      {/* 3. KPI Summary Cards (Reflects active section) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {activeSection === 'ALL' ? 'Total Products' : `${activeSection} Items`}
            </span>
            <Boxes className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">{metrics.totalSkus}</p>
          <p className="text-[10px] text-slate-400 font-medium">Distinct catalog medicines</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Available Stock</span>
            <Warehouse className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">
            {metrics.totalUnits.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
          </p>
          <p className="text-[10px] text-slate-400 font-medium">Units stored in this section</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stock Valuation</span>
            <span className="text-xs font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">Valued</span>
          </div>
          <p className="text-2xl font-black text-teal-600 font-mono mt-1">
            ₹{metrics.totalValuation.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[10px] text-slate-400 font-medium">At default catalog rate</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Low Stock</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-black text-amber-600 font-mono">{metrics.lowStockCount}</p>
            {metrics.outOfStockCount > 0 && (
              <span className="text-[11px] font-bold text-rose-600 font-mono">
                ({metrics.outOfStockCount} zero)
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Re-order required</p>
        </div>
      </div>

      {/* 4. Sub-Tab Toggle & Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('REGISTER')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'REGISTER'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Boxes className="w-3.5 h-3.5 text-emerald-600" />
            Stock Register ({filteredCatalog.length})
          </button>
          <button
            onClick={() => setViewMode('LOGS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'LOGS'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            Movement History Logs ({filteredLogs.length})
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={viewMode === 'REGISTER' ? 'Search medicine / HSN...' : 'Search logs / ref...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 w-48 sm:w-64"
            />
          </div>

          {viewMode === 'REGISTER' && (
            <>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-indigo-500 cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === 'ALL' ? 'All Categories' : c}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="ALL">All Stock Status</option>
                <option value="IN_STOCK">In Stock (&gt; 10)</option>
                <option value="LOW_STOCK">Low Stock (1 - 10)</option>
                <option value="OUT_OF_STOCK">Out of Stock (0)</option>
              </select>
            </>
          )}
        </div>
      </div>

      {/* 5. MAIN CONTENT AREA */}
      {viewMode === 'REGISTER' ? (
        /* REGISTER TABLE */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3.5 text-center w-12">#</th>
                  <th className="py-3 px-3.5">Medicine / Product Name</th>
                  <th className="py-3 px-3.5">Section / Allocation</th>
                  <th className="py-3 px-3.5">Category</th>
                  <th className="py-3 px-3.5">HSN Code</th>
                  <th className="py-3 px-3.5 text-right">Available Stock</th>
                  <th className="py-3 px-3.5 text-right">Unit Rate (Rs.)</th>
                  <th className="py-3 px-3.5 text-right">Stock Valuation</th>
                  <th className="py-3 px-3.5 text-center">Status</th>
                  <th className="py-3 px-3.5 text-center">Quick Move</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCatalog.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-slate-400">
                      <Warehouse className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-bold text-sm text-slate-600">
                        No products found in {activeSection === 'ALL' ? 'Godown' : activeSection}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Click &quot;+ Inward Stock&quot; to add stock to this section, or choose &quot;All Sections&quot;.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredCatalog.map((item, idx) => {
                    const qty = Number(item.quantity || 0)
                    const rate = Number(item.defaultRate || 0)
                    const val = qty * rate
                    const isOut = qty <= 0
                    const isLow = qty > 0 && qty <= 10
                    const itemSec = item.opdSection || 'SOLAN OPD SALE'

                    return (
                      <tr key={item.id || idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3.5 font-bold text-slate-900">
                          {item.name}
                          {item.description && (
                            <span className="block text-[10px] font-normal text-slate-400 truncate max-w-xs">
                              {item.description}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 border rounded-lg text-[10px] font-extrabold ${getSectionBadge(
                              itemSec
                            )}`}
                          >
                            <Tag className="w-3 h-3" />
                            {itemSec}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-slate-600">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">
                            {item.category || 'Pharma'}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 font-mono text-slate-500">{item.hsnCode || '-'}</td>
                        <td className="py-3 px-3.5 text-right font-mono font-black text-sm">
                          <span
                            className={
                              isOut
                                ? 'text-rose-600'
                                : isLow
                                ? 'text-amber-600'
                                : 'text-emerald-700'
                            }
                          >
                            {qty.toLocaleString('en-IN', { maximumFractionDigits: 1 })}{' '}
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              {item.defaultUnit || 'NOS'}
                            </span>
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono text-slate-600">
                          ₹{rate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900">
                          ₹{val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          {isOut ? (
                            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold rounded-full">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded-full">
                              Low Stock
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full">
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => openActionModal('INWARD', item)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-0.5"
                              title="Add incoming stock"
                            >
                              <Plus className="w-3 h-3" /> Inward
                            </button>
                            <button
                              type="button"
                              onClick={() => openActionModal('OUTWARD', item)}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-0.5"
                              title="Dispatch stock"
                            >
                              <ArrowUpFromLine className="w-3 h-3" /> Dispatch
                            </button>
                            {onDeleteCatalogItem && (
                              <button
                                type="button"
                                onClick={() => onDeleteCatalogItem(item.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                title="Delete product from Godown"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
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
      ) : (
        /* MOVEMENT LOGS TABLE */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3.5 text-center w-12">#</th>
                  <th className="py-3 px-3.5">Date</th>
                  <th className="py-3 px-3.5">Movement Type</th>
                  <th className="py-3 px-3.5">Section</th>
                  <th className="py-3 px-3.5">Product Name</th>
                  <th className="py-3 px-3.5 text-right">Quantity</th>
                  <th className="py-3 px-3.5">Source / Destination</th>
                  <th className="py-3 px-3.5">Challan / Ref No</th>
                  <th className="py-3 px-3.5">Remarks / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-slate-400">
                      <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-bold text-sm text-slate-600">No movement logs recorded yet in this section</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Use the '+ Inward Stock' or '⇄ Outward' button above to record stock movements.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, idx) => (
                    <tr key={log.id || idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-slate-700 whitespace-nowrap">{log.date}</td>
                      <td className="py-3 px-3.5">
                        {log.type === 'INWARD' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold rounded-full">
                            <ArrowDownToLine className="w-3 h-3 text-emerald-600" />
                            STOCK INWARD
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-extrabold rounded-full">
                            <ArrowUpFromLine className="w-3 h-3 text-rose-600" />
                            STOCK DISPATCH
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSectionBadge(log.section)}`}>
                          {log.section || 'General'}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 font-bold text-slate-900">{log.itemName}</td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-sm">
                        <span className={log.type === 'INWARD' ? 'text-emerald-700' : 'text-rose-700'}>
                          {log.type === 'INWARD' ? '+' : '-'}
                          {log.quantity}{' '}
                          <span className="text-[10px] font-normal text-slate-400 uppercase">{log.unit}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-slate-700 font-medium">{log.sourceOrDestination || '-'}</td>
                      <td className="py-3 px-3.5 font-mono text-slate-600">{log.referenceNo || '-'}</td>
                      <td className="py-3 px-3.5 text-slate-500 max-w-xs truncate">{log.remarks || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. INWARD / OUTWARD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div
              className={`p-5 text-white flex items-center justify-between ${
                modalType === 'INWARD'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700'
                  : 'bg-gradient-to-r from-rose-600 to-pink-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  {modalType === 'INWARD' ? (
                    <ArrowDownToLine className="w-5 h-5 text-white" />
                  ) : (
                    <ArrowUpFromLine className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">
                    {modalType === 'INWARD' ? 'Stock Inward (+)' : 'Stock Outward / Dispatch (-)'}
                  </h3>
                  <p className="text-[11px] text-white/80">
                    {modalType === 'INWARD'
                      ? 'Add stock received for a specific section (Solan OPD, COD, Sabathu, etc.)'
                      : 'Dispatch stock from a section (OPD Clinic, COD orders, etc.)'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-xl transition-colors cursor-pointer text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitMovement} className="p-6 space-y-4 text-xs font-bold text-slate-700">
              {/* Product Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Select Product / Medicine *
                </label>
                <select
                  value={formItemId}
                  onChange={(e) => {
                    setFormItemId(e.target.value)
                    const found = uniqueCatalog.find((c) => c.id === e.target.value)
                    setSelectedItemForAction(found || null)
                    if (found?.opdSection) setFormSection(found.opdSection)
                  }}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
                  required
                >
                  <option value="" disabled>
                    -- Choose Product --
                  </option>
                  {(catalog.length > 0 ? catalog : uniqueCatalog).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.opdSection ? `(${c.opdSection})` : ''} - Stock: {c.quantity || 0} {c.defaultUnit || 'NOS'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Section Selector (User Request: Solan OPD, Sabathu OPD, COD, Online, Central Godown) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Section / Stock Allocation *
                </label>
                <select
                  value={formSection}
                  onChange={(e) => setFormSection(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
                  required
                >
                  <option value="SOLAN OPD SALE">SOLAN OPD SALE</option>
                  <option value="SABATHU OPD SALE">SABATHU OPD SALE</option>
                  <option value="COD SALE">COD SALE</option>
                  <option value="ONLINE SALE">ONLINE SALE</option>
                  <option value="CENTRAL GODOWN">CENTRAL GODOWN (Warehouse)</option>
                </select>
              </div>

              {/* Date & Quantity Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Quantity ({selectedItemForAction?.defaultUnit || 'Units'}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 50"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Source / Destination */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {modalType === 'INWARD' ? 'Received From (Source) *' : 'Dispatched To (Destination) *'}
                </label>
                <input
                  type="text"
                  placeholder={
                    modalType === 'INWARD'
                      ? 'e.g. Maxxi Production Unit 1 / Supplier'
                      : 'e.g. Solan OPD Clinic / COD Courier Dispatch'
                  }
                  value={formSourceDest}
                  onChange={(e) => setFormSourceDest(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {/* Challan No & Remarks */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Challan / Invoice / Ref No
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CH-2026/041"
                    value={formRefNo}
                    onChange={(e) => setFormRefNo(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Remarks / Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Quality checked"
                    value={formRemarks}
                    onChange={(e) => setFormRemarks(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Stock Preview info box */}
              {selectedItemForAction && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Current Stock:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedItemForAction.quantity || 0} {selectedItemForAction.defaultUnit || 'NOS'}
                  </span>
                  <span className="text-slate-400">➔</span>
                  <span className="text-slate-500">New Expected Stock:</span>
                  <span
                    className={`font-mono font-bold ${
                      modalType === 'INWARD' ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {modalType === 'INWARD'
                      ? Number(selectedItemForAction.quantity || 0) + (parseFloat(String(formQuantity)) || 0)
                      : Number(selectedItemForAction.quantity || 0) - (parseFloat(String(formQuantity)) || 0)}{' '}
                    {selectedItemForAction.defaultUnit || 'NOS'}
                  </span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-5 py-2 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer text-white ${
                    modalType === 'INWARD'
                      ? 'bg-emerald-600 hover:bg-emerald-500 active:scale-95'
                      : 'bg-rose-600 hover:bg-rose-500 active:scale-95'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting
                    ? 'Saving...'
                    : modalType === 'INWARD'
                    ? 'Save Inward (+)'
                    : 'Save Dispatch (-)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
