"use client"

import React, { useState, useMemo } from 'react'
import {
  CatalogItem,
  OpeningStockEntry,
  KiyavaInvoice,
  ManufacturingLog,
  StockTransferLog
} from '@/types/kiyavaBilling'
import { Search, Filter, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, PackageSearch, RefreshCw, ArrowLeftRight } from 'lucide-react'

interface StockRegisterTabProps {
  catalog: CatalogItem[]
  openingStock: OpeningStockEntry[]
  invoices: KiyavaInvoice[]
  manufacturingLogs: ManufacturingLog[]
  stockTransfers?: StockTransferLog[]
  showLocationSplit?: boolean
  onOpenOpeningStock: () => void
  onOpenTransferModal?: (item?: CatalogItem) => void
}

export default function StockRegisterTab({
  catalog,
  openingStock,
  invoices,
  manufacturingLogs,
  stockTransfers = [],
  showLocationSplit = false,
  onOpenOpeningStock,
  onOpenTransferModal
}: StockRegisterTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')

  // Helper for flexible product name matching
  const isItemMatch = (desc?: string, catName?: string, catId?: string, rowId?: string) => {
    if (rowId && catId && rowId === catId) return true
    if (!desc || !catName) return false
    const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim()
    const d = clean(desc)
    const c = clean(catName)
    if (!d || !c) return false
    return d === c || d.includes(c) || c.includes(d)
  }

  // Calculate live stock
  const stockData = useMemo(() => {
    return catalog.map(item => {
      // 1. Opening
      const openingEntry = openingStock.find(s => s.itemId === item.id || isItemMatch(s.itemName, item.name, item.id, s.itemId))
      const openingQty = openingEntry ? openingEntry.quantity : 0

      // 2. Purchases (IN)
      let purchasedQty = 0
      invoices.filter(inv => (inv.type || 'SALE') === 'PURCHASE').forEach(inv => {
        inv.items.forEach(row => {
          if (isItemMatch(row.description, item.name, item.id, row.id)) {
            purchasedQty += row.quantity
          }
        })
      })

      // 3. Sales (OUT) - split by KSV Store vs KSV Factory
      let soldQty = 0
      let soldFromStoreQty = 0
      let soldFromFactoryQty = 0
      invoices.filter(inv => (inv.type || 'SALE') === 'SALE').forEach(inv => {
        const isFactorySale = inv.matCenter === 'KSV Factory'
        inv.items.forEach(row => {
          if (isItemMatch(row.description, item.name, item.id, row.id)) {
            soldQty += row.quantity
            if (isFactorySale) {
              soldFromFactoryQty += row.quantity
            } else {
              soldFromStoreQty += row.quantity
            }
          }
        })
      })

      // 4. Manufacturing IN (Produced in KSV Store)
      let mfgProducedQty = 0
      manufacturingLogs.forEach(log => {
        if (log.finishedGoodItemId === item.id || isItemMatch(log.finishedGoodName, item.name, item.id, log.finishedGoodItemId)) {
          mfgProducedQty += log.producedQuantity
        }
      })

      // 5. Manufacturing OUT (Consumed from KSV Store)
      let mfgConsumedQty = 0
      manufacturingLogs.forEach(log => {
        log.rawMaterialsConsumed.forEach(raw => {
          if (raw.itemId === item.id || isItemMatch(raw.itemName, item.name, item.id, raw.itemId)) {
            mfgConsumedQty += raw.quantity
          }
        })
      })

      // 6. Stock Transfers (KSV Factory <-> KSV Store)
      let netTransferredToStoreQty = 0
      stockTransfers.forEach(tr => {
        if (tr.itemId === item.id || isItemMatch(tr.itemName, item.name, item.id, tr.itemId)) {
          if (tr.direction === 'FACTORY_TO_STORE') {
            netTransferredToStoreQty += tr.quantity
          } else if (tr.direction === 'STORE_TO_FACTORY') {
            netTransferredToStoreQty -= tr.quantity
          }
        }
      })

      // Location Balances (Production goods enter KSV Factory; Store stock increases on transfer from Factory)
      const factoryClosingQty = mfgProducedQty - netTransferredToStoreQty - soldFromFactoryQty
      const storeClosingQty = openingQty + purchasedQty + netTransferredToStoreQty - mfgConsumedQty - soldFromStoreQty

      // Final Closing Stock
      const totalIn = openingQty + purchasedQty + mfgProducedQty
      const totalOut = soldQty + mfgConsumedQty
      const closingQty = totalIn - totalOut

      return {
        ...item,
        openingQty,
        purchasedQty,
        soldQty,
        soldFromStoreQty,
        soldFromFactoryQty,
        mfgProducedQty,
        mfgConsumedQty,
        transferredToFactoryQty: -netTransferredToStoreQty,
        transferredToStoreQty: netTransferredToStoreQty,
        storeClosingQty,
        factoryClosingQty,
        closingQty
      }
    })
  }, [catalog, openingStock, invoices, manufacturingLogs, stockTransfers])

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
  const totalStoreStockUnits = filteredStock.reduce((sum, s) => sum + Math.max(0, s.storeClosingQty), 0)
  const totalFactoryStockUnits = filteredStock.reduce((sum, s) => sum + Math.max(0, s.factoryClosingQty), 0)

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-sm font-black text-slate-800">Live Stock Register</h2>
          <p className="text-[11px] text-slate-400">
            Real-time inventory levels calculated from Opening Stock, Purchases, Sales, Manufacturing{showLocationSplit ? ' & KSV Store / Factory Transfers' : ''}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {showLocationSplit && onOpenTransferModal && (
            <button
              onClick={() => onOpenTransferModal()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" /> Transfer Store ↔ Factory
            </button>
          )}
          <button
            onClick={onOpenOpeningStock}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Manage Opening Stock
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={`grid grid-cols-2 ${showLocationSplit ? 'lg:grid-cols-5' : 'lg:grid-cols-3'} gap-3`}>
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600 mb-1">In Stock</p>
          <h3 className="text-xl font-black text-emerald-700">{totalItemsWithStock} <span className="text-xs font-semibold text-emerald-600/70">items</span></h3>
        </div>
        {showLocationSplit && (
          <>
            <div className="bg-teal-50 border border-teal-100 p-4 rounded-2xl shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-wider text-teal-600 mb-1">🏪 KSV Store Stock</p>
              <h3 className="text-xl font-black text-teal-700 font-mono">{totalStoreStockUnits.toLocaleString('en-IN', { maximumFractionDigits: 2 })} <span className="text-xs font-sans font-semibold text-teal-600/70">qty</span></h3>
            </div>
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600 mb-1">🏭 KSV Factory Stock</p>
              <h3 className="text-xl font-black text-indigo-700 font-mono">{totalFactoryStockUnits.toLocaleString('en-IN', { maximumFractionDigits: 2 })} <span className="text-xs font-sans font-semibold text-indigo-600/70">qty</span></h3>
            </div>
          </>
        )}
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
                {showLocationSplit && (
                  <>
                    <th className="p-3 text-right text-teal-700 bg-teal-50/50 border-l border-slate-200">🏪 KSV Store</th>
                    <th className="p-3 text-right text-indigo-700 bg-indigo-50/50">🏭 KSV Factory</th>
                  </>
                )}
                <th className="p-3 text-right font-black text-slate-800 border-l border-slate-200">Total Closing</th>
                {showLocationSplit && onOpenTransferModal && (
                  <th className="p-3 text-center">Transfer</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredStock.map(item => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{item.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      HSN: {item.hsnCode || 'N/A'}
                      {item.packing ? ` • Pack: ${item.packing}` : ''} • {item.category?.replace('_', ' ').toUpperCase() || 'GENERAL'}
                    </div>
                  </td>
                  <td className="p-3 text-right font-medium text-slate-600">
                    {item.openingQty} {item.defaultUnit}
                  </td>
                  <td className="p-3 text-right font-bold text-emerald-600 bg-emerald-50/10">
                    {item.purchasedQty > 0 ? `+${item.purchasedQty}` : '-'} <span className="text-[10px] font-normal">{item.purchasedQty > 0 ? item.defaultUnit : ''}</span>
                  </td>
                  <td className="p-3 text-right font-bold text-rose-600 bg-rose-50/10">
                    <div className="flex flex-col items-end">
                      <span>{item.soldQty > 0 ? `-${item.soldQty}` : '-'} <span className="text-[10px] font-normal">{item.soldQty > 0 ? item.defaultUnit : ''}</span></span>
                      {showLocationSplit && item.soldQty > 0 && (
                        <span className="text-[9px] text-slate-400 font-medium">
                          {item.soldFromStoreQty > 0 ? `Store: -${item.soldFromStoreQty}` : ''}
                          {item.soldFromStoreQty > 0 && item.soldFromFactoryQty > 0 ? ' · ' : ''}
                          {item.soldFromFactoryQty > 0 ? `Factory: -${item.soldFromFactoryQty}` : ''}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-right font-bold text-purple-600 bg-purple-50/10">
                    <div className="flex flex-col items-end">
                      {item.mfgProducedQty > 0 && <span className="text-emerald-600">+ {item.mfgProducedQty} {item.defaultUnit} (Prod)</span>}
                      {item.mfgConsumedQty > 0 && <span className="text-rose-600">- {item.mfgConsumedQty} {item.defaultUnit} (Cons)</span>}
                      {item.mfgProducedQty === 0 && item.mfgConsumedQty === 0 && <span className="text-slate-400">-</span>}
                    </div>
                  </td>
                  {showLocationSplit && (
                    <>
                      <td className="p-3 text-right bg-teal-50/20 border-l border-slate-200 font-mono">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg font-black text-xs ${
                          item.storeClosingQty > 0 ? 'bg-teal-100 text-teal-800' : item.storeClosingQty < 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {item.storeClosingQty} <span className="text-[9px] font-bold ml-1 uppercase">{item.defaultUnit}</span>
                        </span>
                      </td>
                      <td className="p-3 text-right bg-indigo-50/20 font-mono">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg font-black text-xs ${
                          item.factoryClosingQty > 0 ? 'bg-indigo-100 text-indigo-800' : item.factoryClosingQty < 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {item.factoryClosingQty} <span className="text-[9px] font-bold ml-1 uppercase">{item.defaultUnit}</span>
                        </span>
                      </td>
                    </>
                  )}
                  <td className="p-3 text-right border-l border-slate-200">
                    <div className="flex items-center justify-end gap-2">
                      {item.closingQty <= 0 && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
                      <span className={`text-sm font-black ${item.closingQty <= 0 ? 'text-rose-600' : item.closingQty <= 5 ? 'text-amber-600' : 'text-slate-900'}`}>
                        {item.closingQty} <span className="text-[10px] font-bold text-slate-500 uppercase">{item.defaultUnit}</span>
                      </span>
                    </div>
                  </td>
                  {showLocationSplit && onOpenTransferModal && (
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => onOpenTransferModal(item)}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold text-[10px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                        title="Transfer stock between KSV Store and KSV Factory"
                      >
                        <ArrowLeftRight className="w-3 h-3" /> Transfer
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {filteredStock.length === 0 && (
                <tr>
                  <td colSpan={showLocationSplit ? 9 : 6} className="p-8 text-center text-slate-500">
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
