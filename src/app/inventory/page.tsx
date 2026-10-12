"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Package,
  Layers,
  Factory,
  Building2,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  SlidersHorizontal,
  GitCommit,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  Truck,
  Sparkles,
  RefreshCw,
  Search,
  ExternalLink
} from 'lucide-react'
import StockAdjustmentModal from '@/components/inventory/StockAdjustmentModal'
import InvoiceTraceabilityModal from '@/components/inventory/InvoiceTraceabilityModal'

export default function InventoryHubPage() {
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
  const [isTraceModalOpen, setIsTraceModalOpen] = useState(false)
  const [selectedTraceBatch, setSelectedTraceBatch] = useState('KYV-GDK-901')

  // Live stock counts calculated from localStorage
  const [stats, setStats] = useState({
    kiyavaItems: 7,
    ksvItems: 7,
    maxxiItems: 4,
    opdReadyUnits: 850,
    plantReservePct: 88,
  })

  useEffect(() => {
    try {
      const kiyavaCat = JSON.parse(localStorage.getItem('ksv_kiyava_catalog') || '[]')
      const ksvCat = JSON.parse(localStorage.getItem('ksv_app_catalog') || '[]')
      const maxxiCat = JSON.parse(localStorage.getItem('maxxi_app_catalog') || '[]')
      
      setStats({
        kiyavaItems: Array.isArray(kiyavaCat) ? kiyavaCat.length : 0,
        ksvItems: Array.isArray(ksvCat) ? ksvCat.length : 0,
        maxxiItems: Array.isArray(maxxiCat) ? maxxiCat.length : 0,
        opdReadyUnits: 850,
        plantReservePct: 88,
      })
    } catch (e) {
      console.warn('Could not read inventory catalogs:', e)
    }
  }, [])

  const openTraceability = (batch: string) => {
    setSelectedTraceBatch(batch)
    setIsTraceModalOpen(true)
  }

  return (
    <div className="w-full pb-16 animate-in fade-in duration-500 text-slate-700">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200/70">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" /> 3-Tier Integrated Inventory Network
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Package className="w-8 h-8 text-emerald-600" />
            Supply Chain &amp; Central Inventory Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            End-to-end traceability: Raw botanical sourcing &rarr; KSV Pharmacy formulation &rarr; Maxxi Pharma distribution
          </p>
        </div>

        {/* Global Hub Quick Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAdjustModalOpen(true)}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl text-xs font-black flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <SlidersHorizontal className="w-4 h-4 text-purple-600" /> Stock Adjustment
          </button>
          <button
            onClick={() => openTraceability('KYV-GDK-901')}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black flex items-center gap-2 shadow-md shadow-slate-900/10 transition-all cursor-pointer active:scale-95"
          >
            <GitCommit className="w-4 h-4 text-emerald-400" /> Traceability Ledger
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tier 1: Kiyava</p>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">{stats.kiyavaItems} Botanical Herbs</h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Raw Material Sourcing</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Factory className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tier 2: KSV Pharmacy</p>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">{stats.ksvItems} Formulations</h3>
            <p className="text-[11px] text-blue-600 font-semibold mt-0.5">Ayurvedic Manufacturing</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tier 3: Maxxi Pharma</p>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">{stats.maxxiItems} Medicine SKUs</h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Packed &amp; Distributed</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">OPD Live Stock</p>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">{stats.opdReadyUnits} Kits Ready</h3>
            <p className="text-[11px] text-purple-600 font-semibold mt-0.5">Clinic Counter Dispensing</p>
          </div>
        </div>
      </div>

      {/* 3-Tier Supply Chain Architecture Cards */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            Supply Chain Entities &amp; Operations
          </h2>
          <span className="text-xs text-slate-400 font-semibold">Select an entity to manage stock records</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Kiyava */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-amber-300 transition-all group flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-wider rounded-xl border border-amber-200">
                  Tier 1 &bull; Raw Botanical Sourcing
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              </div>

              <div className="w-12 h-12 rounded-2xl bg-amber-100/60 text-amber-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-black text-slate-900 group-hover:text-amber-700 transition-colors">
                Kiyava Subathu
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Upper Thari, Subathu Main Road, Solan (H.P.)
              </p>

              <div className="mt-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1.5 font-medium text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Primary Function:</span>
                  <span className="font-bold text-slate-800">Raw Herbs &amp; Extracts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">GSTIN / UIN:</span>
                  <span className="font-mono font-bold text-slate-800">02DFBPS6121B1Z3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Catalog Items:</span>
                  <span className="font-bold text-amber-700">{stats.kiyavaItems} Items</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <Link
                href="/inventory/kiyava"
                className="inline-flex items-center gap-2 text-xs font-black text-amber-700 hover:text-amber-800 group-hover:translate-x-1 transition-all"
              >
                Open Kiyava Inventory <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 2: Karan Singh Vaidh (KSV) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all group flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider rounded-xl border border-blue-200">
                  Tier 2 &bull; Pharmacy &amp; Formulations
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              </div>

              <div className="w-12 h-12 rounded-2xl bg-blue-100/60 text-blue-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Factory className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-700 transition-colors">
                Karan Singh Vaidh (KSV)
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Vill- Radiyana, PO Subathu, Teh &amp; Distt Solan
              </p>

              <div className="mt-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1.5 font-medium text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Primary Function:</span>
                  <span className="font-bold text-slate-800">Ayurvedic Formulations</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">GSTIN / UIN:</span>
                  <span className="font-mono font-bold text-slate-800">02DFBPS6121B2Z2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Formulation SKUs:</span>
                  <span className="font-bold text-blue-700">{stats.ksvItems} Items</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <Link
                href="/inventory/ksv"
                className="inline-flex items-center gap-2 text-xs font-black text-blue-700 hover:text-blue-800 group-hover:translate-x-1 transition-all"
              >
                Open KSV Pharmacy <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 3: Maxxi Pharma */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all group flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider rounded-xl border border-emerald-200">
                  Tier 3 &bull; Distribution &amp; Finished Goods
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <div className="w-12 h-12 rounded-2xl bg-emerald-100/60 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Boxes className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                Maxxi Pharma Pvt. Ltd.
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Industrial Area Phase 1, Solan (H.P.)
              </p>

              <div className="mt-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1.5 font-medium text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Primary Function:</span>
                  <span className="font-bold text-slate-800">Commercial Distribution</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">GSTIN / UIN:</span>
                  <span className="font-mono font-bold text-slate-800">02AAACM8821F1Z9</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Active Formulations:</span>
                  <span className="font-bold text-emerald-700">{stats.maxxiItems} Items</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <Link
                href="/inventory/maxxi-pharma"
                className="inline-flex items-center gap-2 text-xs font-black text-emerald-700 hover:text-emerald-800 group-hover:translate-x-1 transition-all"
              >
                Open Maxxi Pharma <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* Connected Clinic & Plant Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* OPD Counter Stock */}
        <div className="bg-gradient-to-br from-indigo-50/50 to-white rounded-3xl p-6 border border-indigo-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">OPD Clinic Counter Dispensing</h3>
                <p className="text-xs text-slate-400 font-medium">Real-time stock for direct patient checkups</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mt-2">
              Patients billed through the Billing module automatically decrement inventory from this counter stock. Currently 850 units active.
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-indigo-100/60 flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Live Sync Active
            </span>
            <Link
              href="/opd-inventory"
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              View OPD Counter <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Manufacturing Plant Operations */}
        <div className="bg-gradient-to-br from-emerald-50/50 to-white rounded-3xl p-6 border border-emerald-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Factory className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Manufacturing Plant Operations</h3>
                <p className="text-xs text-slate-400 font-medium">Bulk batches, reserves &amp; transit logs</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mt-2">
              Oversee high-volume extraction, bulk reserves at 88% capacity, and transit shipments into OPD dispensing.
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-emerald-100/60 flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Facility Operational
            </span>
            <Link
              href="/plant"
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              View Plant Status <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        onSuccess={() => {
          alert('Stock adjustment applied successfully!')
        }}
      />

      {/* Supply Chain Traceability Modal */}
      <InvoiceTraceabilityModal
        isOpen={isTraceModalOpen}
        onClose={() => setIsTraceModalOpen(false)}
        batchNumber={selectedTraceBatch}
      />

    </div>
  )
}
