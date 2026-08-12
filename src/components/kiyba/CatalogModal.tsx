"use client"

import React, { useState, useEffect } from 'react'
import { CatalogItem } from '@/types/kiybaBilling'
import { X, Package, Save } from 'lucide-react'

interface CatalogModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (item: CatalogItem) => void
  initialData?: CatalogItem | null
}

export default function CatalogModal({
  isOpen,
  onClose,
  onSave,
  initialData
}: CatalogModalProps) {
  const [formData, setFormData] = useState<CatalogItem>({
    id: '',
    name: '',
    hsnCode: '',
    defaultUnit: 'kg',
    defaultRate: 0,
    defaultTaxRate: 5,
    category: 'herb',
    description: ''
  })

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    } else {
      setFormData({
        id: `cat_${Date.now()}`,
        name: '',
        hsnCode: '12119011',
        defaultUnit: 'kg',
        defaultRate: 0,
        defaultTaxRate: 5,
        category: 'herb',
        description: ''
      })
    }
  }, [initialData, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    onSave({
      ...formData,
      id: formData.id || `cat_${Date.now()}`
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">
                {initialData ? 'Edit Inventory Item' : 'Add Item to Catalog'}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Herbs, Raw Material, Bottles, Vials &amp; Packaging
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
              Item / Herb / Material Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. JADI BUTTI BAIL GIRI or 460 CC HDPE JAR"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                HSN / SAC Code *
              </label>
              <input
                type="text"
                required
                value={formData.hsnCode}
                onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                placeholder="12119011"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="herb">Herb / Jadi Butti</option>
                <option value="raw_material">Raw Material</option>
                <option value="packaging">Packaging &amp; Bottles</option>
                <option value="medicine">Finished Medicine</option>
                <option value="general">General Supply</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Unit (per) *
              </label>
              <select
                value={formData.defaultUnit}
                onChange={(e) => setFormData({ ...formData, defaultUnit: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="kg">kg (Kilogram)</option>
                <option value="PCS">PCS (Pieces)</option>
                <option value="Bags">Bags / Bales</option>
                <option value="Box">Box</option>
                <option value="Ltr">Ltr (Liter)</option>
                <option value="gm">gm (Grams)</option>
                <option value="Units">Units</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Default Rate (₹) *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={formData.defaultRate}
                onChange={(e) => setFormData({ ...formData, defaultRate: parseFloat(e.target.value) || 0 })}
                placeholder="180.00"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 outline-none focus:border-amber-500 text-right"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                GST Rate (%)
              </label>
              <select
                value={formData.defaultTaxRate}
                onChange={(e) => setFormData({ ...formData, defaultTaxRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value={0}>0% (Exempt)</option>
                <option value={5}>5% (Herbs / Ayurveda)</option>
                <option value={12}>12% (Medicines / Pack)</option>
                <option value={18}>18% (Bottles / Standard)</option>
                <option value={28}>28% (Luxury)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
              Description / Notes
            </label>
            <input
              type="text"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Dry Bael Giri Herb A-grade"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-amber-600/20 active:scale-95 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Save Item
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
