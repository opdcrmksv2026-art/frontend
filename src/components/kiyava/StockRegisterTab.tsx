"use client"

import React, { useState, useMemo } from 'react'
import {
  CatalogItem,
  OpeningStockEntry,
  KiyavaInvoice,
  ManufacturingLog
} from '@/types/kiyavaBilling'
import { Search, Filter, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, PackageSearch, RefreshCw } from 'lucide-react'

interface StockRegisterTabProps {
  catalog: CatalogItem[]
  openingStock: OpeningStockEntry[]
  invoices: KiyavaInvoice[]
  manufacturingLogs: ManufacturingLog[]
  onOpenOpeningStock: () => void
}

export default function StockRegisterTab({
  catalog,
  openingStock,
  invoices,
  manufacturingLogs,
  onOpenOpeningStock
}: StockRegisterTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')

  // Calculate live stock
  const stockData = useMemo(() => {
    return catalog.map(item => {
      // 1. Opening
      const openingEntry = openingStock.find(s => s.itemId === item.id || s.itemName === item.name)
      const openingQty = openingEntry ? openingEntry.quantity : 0

      // 2. Purchases (IN)
      let purchasedQty = 0
      invoices.filter(inv => (inv.type || 'SALE') === 'PURCHASE').forEach(inv => {
        inv.items.forEach(row => {
          if (row.description === item.name) {
            purchasedQty += row.quantity
          }
        })
      })

      // 3. Sales (OUT)
      let soldQty = 0
      invoices.filter(inv => (inv.type || 'SALE') === 'SALE').forEach(inv => {
        inv.items.forEach(row => {
          if (row.description === item.name) {
            soldQty += row.quantity
          }
        })
      })

      // 4. Manufacturing IN (Produced)
      let mfgProducedQty = 0
      manufacturingLogs.forEach(log => {
        if (log.finishedGoodName === item.name || log.finishedGoodItemId === item.id) {
          mfgProducedQty += log.producedQuantity
        }
      })

      // 5. Manufacturing OUT (Consumed)
      let mfgConsumedQty = 0
      manufacturingLogs.forEach(log => {
        log.rawMaterialsConsumed.forEach(raw => {
          if (raw.itemName === item.name || raw.itemId === item.id) {
            mfgConsumedQty += raw.quantity
          }
        })
      })

      // Final Closing Stock
      const totalIn = openingQty + purchasedQty + mfgProducedQty
      const totalOut = soldQty + mfgConsumedQty
      const closingQty = totalIn - totalOut

      return {
        ...item,
        openingQty,
        purchasedQty,
        soldQty,
        mfgProducedQty,
        mfgConsumedQty,
        closingQty
      }
    })
  }, [catalog, openingStock, invoices, manufacturingLogs])

  // Filter
  const filteredStock = stockData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.hsnCode && item.hsnCode.includes(searchQuery))
    const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  // Summary Metrics
  const totalItemsWithStock = filteredStock.filter(s => s.closingQty > 0).length
  const lowStockItems = filteredStock.filter(s => s.closingQty <= 5 && s.closingQty > 0).length
  const zeroStockItems = filteredStock.filter(s => s.closingQty <= 0).length

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-sm font-black text-slate-800">Live Stock Register</h2>
          <p className="text-[11px] text-slate-400">
            Real-time inventory levels calculated from Opening Stock, Purchases, Sales, and Manufacturing.
          </p>
        </div>
        <button
          onClick={onOpenOpeningStock}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Manage Opening Stock
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600 mb-1">In Stock</p>
          <h3 className="text-xl font-black text-emerald-700">{totalItemsWithStock} <span className="text-xs font-semibold text-emerald-600/70">items</span></h3>
        </div>
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-amber-600 mb-1">Low Stock (≤ 5)</p>
          <h3 className="text-xl font-black text-amber-700">{lowStockItems} <span className="text-xs font-semibold text-amber-600/70">items</span></h3>
        </div>
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-rose-600 mb-1">Out of Stock</p>
          <h3 className="text-xl font-black text-rose-700">{zeroStockItems} <span className="text-xs font-semibold text-rose-600/70">items</span></h3>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search items, raw materials, HSN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Categories</option>
            <option value="raw_material">Raw Materials</option>
            <option value="herb">Herbs</option>
            <option value="packaging">Packaging</option>
            <option value="medicine">Medicines / Finished Goods</option>
            <option value="general">General</option>
          </select>
        </div>
      </div>

      {/* Register Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="p-3">Item Details</th>
                <th className="p-3 text-right">Opening</th>
                <th className="p-3 text-right text-emerald-600 bg-emerald-50/30">In (Purchased)</th>
                <th className="p-3 text-right text-rose-600 bg-rose-50/30">Out (Sold)</th>
                <th className="p-3 text-right text-purple-600 bg-purple-50/30">Mfg (In/Out)</th>
                <th className="p-3 text-right font-black text-slate-800 border-l border-slate-200">Closing Stock</th>
              </tr>
            </thead>
            <tbody>
              {filteredStock.map(item => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{item.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">HSN: {item.hsnCode || 'N/A'} • {item.category?.replace('_', ' ').toUpperCase() || 'GENERAL'}</div>
                  </td>
                  <td className="p-3 text-right font-medium text-slate-600">
                    {item.openingQty} {item.defaultUnit}
                  </td>
                  <td className="p-3 text-right font-bold text-emerald-600 bg-emerald-50/10">
                    {item.purchasedQty > 0 ? `+${item.purchasedQty}` : '-'} <span className="text-[10px] font-normal">{item.purchasedQty > 0 ? item.defaultUnit : ''}</span>
                  </td>
                  <td className="p-3 text-right font-bold text-rose-600 bg-rose-50/10">
                    {item.soldQty > 0 ? `-${item.soldQty}` : '-'} <span className="text-[10px] font-normal">{item.soldQty > 0 ? item.defaultUnit : ''}</span>
                  </td>
                  <td className="p-3 text-right font-bold text-purple-600 bg-purple-50/10">
                    <div className="flex flex-col items-end">
                      {item.mfgProducedQty > 0 && <span className="text-emerald-600">+ {item.mfgProducedQty} {item.defaultUnit} (Prod)</span>}
                      {item.mfgConsumedQty > 0 && <span className="text-rose-600">- {item.mfgConsumedQty} {item.defaultUnit} (Cons)</span>}
                      {item.mfgProducedQty === 0 && item.mfgConsumedQty === 0 && <span className="text-slate-400">-</span>}
                    </div>
                  </td>
                  <td className="p-3 text-right border-l border-slate-200">
                    <div className="flex items-center justify-end gap-2">
                      {item.closingQty <= 0 && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
                      <span className={`text-sm font-black ${item.closingQty <= 0 ? 'text-rose-600' : item.closingQty <= 5 ? 'text-amber-600' : 'text-slate-900'}`}>
                        {item.closingQty} <span className="text-[10px] font-bold text-slate-500 uppercase">{item.defaultUnit}</span>
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStock.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    <PackageSearch className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-sm">No items found</p>
                    <p className="text-[11px] mt-1">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
