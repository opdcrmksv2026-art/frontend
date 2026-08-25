"use client"

import React, { useState, useEffect } from 'react'
import { CatalogItem, OpeningStockEntry } from '@/types/kiybaBilling'
import { X, Archive, Save } from 'lucide-react'

interface OpeningStockModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (entry: OpeningStockEntry) => void
  initialData?: OpeningStockEntry | null
  catalog: CatalogItem[]
}

export default function OpeningStockModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  catalog
}: OpeningStockModalProps) {
  const [formData, setFormData] = useState<OpeningStockEntry>({
    id: '',
    itemId: '',
    itemName: '',
    date: new Date().toISOString().split('T')[0],
    unit: 'kg',
    quantity: 0
  })

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    } else {
      setFormData({
        id: `os_${Date.now()}`,
        itemId: '',
        itemName: '',
        date: new Date().toISOString().split('T')[0],
        unit: 'kg',
        quantity: 0
      })
    }
  }, [initialData, isOpen])

  if (!isOpen) return null

  const handleItemSelect = (itemId: string) => {
    const item = catalog.find((c) => c.id === itemId)
    if (item) {
      setFormData({
        ...formData,
        itemId: item.id,
        itemName: item.name,
        unit: item.defaultUnit
      })
    } else {
      setFormData({
        ...formData,
        itemId: '',
        itemName: '',
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.itemId || !formData.itemName.trim()) return
    onSave({
      ...formData,
      id: formData.id || `os_${Date.now()}`
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">
                {initialData ? 'Edit Opening Stock' : 'Add Opening Stock'}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Set initial inventory stock levels
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
              Product Name *
            </label>
            <select
              required
              value={formData.itemId}
              onChange={(e) => handleItemSelect(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-500"
            >
              <option value="">Select a Product</option>
              {catalog.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Date *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Unit *
              </label>
              <input
                type="text"
                required
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="e.g. kg, PCS"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 uppercase"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
              Quantity *
            </label>
            <input
              type="number"
              step="any"
              required
              min="0"
              value={formData.quantity === 0 && !formData.id.startsWith('os_') ? '' : formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-slate-500 font-extrabold text-sm hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Save Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
