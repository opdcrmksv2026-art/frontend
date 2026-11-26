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
  Tag
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
  sourceOrDestination: string
  referenceNo?: string
  remarks?: string
  timestamp: string
}

interface MaxxiGodownTabProps {
  catalog: CatalogItem[]
  companies: CompanyProfile[]
  onUpdateCatalogItem: (updatedItem: CatalogItem) => void
}

export default function MaxxiGodownTab({
  catalog,
  companies,
  onUpdateCatalogItem
}: MaxxiGodownTabProps) {
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

  // Deduplicate catalog items
  const uniqueCatalog = useMemo(() => {
    const seen = new Set<string>()
    const result: CatalogItem[] = []
    for (const it of catalog) {
      const key = (it.name || '').trim().toLowerCase()
      if (!key || seen.has(key)) continue
      seen.add(key)
      result.push({ ...it, name: it.name.trim() })
    }
    return result
  }, [catalog])

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>()
    uniqueCatalog.forEach((c) => {
      if (c.category && c.category.trim()) set.add(c.category.trim())
    })
    return ['ALL', ...Array.from(set)]
  }, [uniqueCatalog])

  // Filtered catalog for display
  const filteredCatalog = useMemo(() => {
    return uniqueCatalog.filter((item) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.hsnCode && item.hsnCode.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q))

      const matchesCat = categoryFilter === 'ALL' || item.category === categoryFilter

      const qty = Number(item.quantity || 0)
      let matchesStatus = true
      if (statusFilter === 'IN_STOCK') matchesStatus = qty > 10
      if (statusFilter === 'LOW_STOCK') matchesStatus = qty > 0 && qty <= 10
      if (statusFilter === 'OUT_OF_STOCK') matchesStatus = qty <= 0

      return matchesSearch && matchesCat && matchesStatus
    })
  }, [uniqueCatalog, searchQuery, categoryFilter, statusFilter])

  // Filtered movement logs
  const filteredLogs = useMemo(() => {
    return movementLogs.filter((log) => {
      const q = searchQuery.toLowerCase().trim()
      if (!q) return true
      return (
        log.itemName.toLowerCase().includes(q) ||
        (log.referenceNo && log.referenceNo.toLowerCase().includes(q)) ||
        log.sourceOrDestination.toLowerCase().includes(q) ||
        (log.remarks && log.remarks.toLowerCase().includes(q))
      )
    })
  }, [movementLogs, searchQuery])

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalSkus = uniqueCatalog.length
    const totalUnits = uniqueCatalog.reduce((sum, item) => sum + Math.max(0, Number(item.quantity || 0)), 0)
    const totalValuation = uniqueCatalog.reduce((sum, item) => {
      const qty = Math.max(0, Number(item.quantity || 0))
      const rate = Number(item.defaultRate || 0)
      return sum + qty * rate
    }, 0)
    const lowStockCount = uniqueCatalog.filter((item) => {
      const qty = Number(item.quantity || 0)
      return qty > 0 && qty <= 10
    }).length
    const outOfStockCount = uniqueCatalog.filter((item) => Number(item.quantity || 0) <= 0).length

    return { totalSkus, totalUnits, totalValuation, lowStockCount, outOfStockCount }
  }, [uniqueCatalog])

  // Open Modal Helper
  const openActionModal = (type: 'INWARD' | 'OUTWARD', item?: CatalogItem) => {
    setModalType(type)
    setFormDate(new Date().toISOString().split('T')[0])
    setFormQuantity('')
    setFormRefNo('')
    setFormRemarks('')
    if (type === 'INWARD') {
      setFormSourceDest('Maxxi Manufacturing Factory')
    } else {
      setFormSourceDest('Solan OPD Clinic / Store Dispatch')
    }

    if (item) {
      setSelectedItemForAction(item)
      setFormItemId(item.id)
    } else if (uniqueCatalog.length > 0) {
      setSelectedItemForAction(uniqueCatalog[0])
      setFormItemId(uniqueCatalog[0].id)
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

    const targetItem = uniqueCatalog.find((c) => c.id === formItemId)
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
      quantity: newQty
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
          quantity: newQty
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
    if (uniqueCatalog.length === 0) {
      alert('No godown items to export!')
      return
    }

    const headers = [
      'S.No',
      'Product Name',
      'HSN Code',
      'Category',
      'Godown Location',
      'Available Stock',
      'Unit',
      'Unit Rate (Rs.)',
      'Stock Valuation (Rs.)',
      'Stock Status'
    ]

    const rows = uniqueCatalog.map((item, idx) => {
      const qty = Number(item.quantity || 0)
      const rate = Number(item.defaultRate || 0)
      const val = qty * rate
      const status = qty <= 0 ? 'Out of Stock' : qty <= 10 ? 'Low Stock' : 'In Stock'
      return [
        idx + 1,
        `"${item.name.replace(/"/g, '""')}"`,
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
    link.setAttribute('download', `Maxxi_Godown_Stock_Report_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* 1. Header Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/15 shadow-inner">
            <Warehouse className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight text-white">Maxxi Central Godown</h2>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                Live Inventory
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Real-time Godown warehouse storage, batch inward records & dispatch movements
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => openActionModal('INWARD')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <ArrowDownToLine className="w-4 h-4" />
            + Inward Stock (Maal Aaya)
          </button>
          <button
            onClick={() => openActionModal('OUTWARD')}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <ArrowUpFromLine className="w-4 h-4" />
            ⇄ Outward / Dispatch (Maal Nikla)
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Export Excel
          </button>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Godown Products</span>
            <Boxes className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">{metrics.totalSkus}</p>
          <p className="text-[10px] text-slate-400 font-medium">Distinct medicine SKUs</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Units Stored</span>
            <Warehouse className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">
            {metrics.totalUnits.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
          </p>
          <p className="text-[10px] text-slate-400 font-medium">Total available units in Godown</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Godown Valuation</span>
            <span className="text-xs font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">Estimated</span>
          </div>
          <p className="text-2xl font-black text-teal-600 font-mono mt-1">
            ₹{metrics.totalValuation.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[10px] text-slate-400 font-medium">At default catalog rate</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Low Stock Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-black text-amber-600 font-mono">{metrics.lowStockCount}</p>
            {metrics.outOfStockCount > 0 && (
              <span className="text-[11px] font-bold text-rose-600 font-mono">
                ({metrics.outOfStockCount} zero stock)
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Requires re-order from factory</p>
        </div>
      </div>

      {/* 3. Sub-Tab Toggle & Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('REGISTER')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'REGISTER'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Boxes className="w-3.5 h-3.5 text-emerald-600" />
            Godown Stock Register ({filteredCatalog.length})
          </button>
          <button
            onClick={() => setViewMode('LOGS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'LOGS'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            Inward / Outward Movement Logs ({filteredLogs.length})
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={viewMode === 'REGISTER' ? 'Search medicine / HSN...' : 'Search logs / remarks...'}
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

      {/* 4. MAIN CONTENT AREA */}
      {viewMode === 'REGISTER' ? (
        /* REGISTER TABLE */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3.5 text-center w-12">#</th>
                  <th className="py-3 px-3.5">Medicine / Product Name</th>
                  <th className="py-3 px-3.5">Category</th>
                  <th className="py-3 px-3.5">HSN Code</th>
                  <th className="py-3 px-3.5">Godown Location</th>
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
                      <p className="font-bold text-sm text-slate-600">No products match your search or filter</p>
                      <p className="text-xs text-slate-400 mt-1">Try clearing filters or search query</p>
                    </td>
                  </tr>
                ) : (
                  filteredCatalog.map((item, idx) => {
                    const qty = Number(item.quantity || 0)
                    const rate = Number(item.defaultRate || 0)
                    const val = qty * rate
                    const isOut = qty <= 0
                    const isLow = qty > 0 && qty <= 10

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
                        <td className="py-3 px-3.5 text-slate-600">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">
                            {item.category || 'Pharma'}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 font-mono text-slate-500">{item.hsnCode || '-'}</td>
                        <td className="py-3 px-3.5 text-slate-600">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                            <MapPin className="w-3 h-3 text-emerald-600" />
                            Main Godown
                          </span>
                        </td>
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
                              title="Add incoming stock to Godown"
                            >
                              <Plus className="w-3 h-3" /> Inward
                            </button>
                            <button
                              type="button"
                              onClick={() => openActionModal('OUTWARD', item)}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-0.5"
                              title="Dispatch or transfer out of Godown"
                            >
                              <ArrowUpFromLine className="w-3 h-3" /> Dispatch
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
                    <td colSpan={8} className="text-center py-12 text-slate-400">
                      <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-bold text-sm text-slate-600">No Godown movement logs recorded yet</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Use the '+ Inward Stock' or '⇄ Outward' button above to record stock movements
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

      {/* 5. INWARD / OUTWARD MODAL */}
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
                    {modalType === 'INWARD' ? 'Godown Stock Inward (+)' : 'Godown Stock Outward / Dispatch (-)'}
                  </h3>
                  <p className="text-[11px] text-white/80">
                    {modalType === 'INWARD'
                      ? 'Add stock received from manufacturing factory or supplier'
                      : 'Dispatch stock to OPD clinic, store counter, or buyer'}
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
                  }}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
                  required
                >
                  <option value="" disabled>
                    -- Choose Product --
                  </option>
                  {uniqueCatalog.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Current Stock: {c.quantity || 0} {c.defaultUnit || 'NOS'})
                    </option>
                  ))}
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
                      : 'e.g. Solan OPD Clinic / Wholesale Buyer'
                  }
                  value={formSourceDest}
                  onChange={(e) => setFormSourceDest(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {/* Challan No & Godown Location */}
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
                    Godown Shelf / Rack
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Remarks / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Batch verified by quality team"
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-500"
                />
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
