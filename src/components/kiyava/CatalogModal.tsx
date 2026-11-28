"use client"

import React, { useState, useEffect } from 'react'
import { CatalogItem } from '@/types/kiyavaBilling'
import { X, Package, Save, Plus, Trash2 } from 'lucide-react'

interface CatalogModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (item: CatalogItem) => void
  initialData?: CatalogItem | null
  catalog?: CatalogItem[]
  isMaxxi?: boolean
}

export default function CatalogModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  catalog,
  isMaxxi = false
}: CatalogModalProps) {
  const [formData, setFormData] = useState<CatalogItem>({
    id: '',
    name: '',
    hsnCode: '',
    defaultUnit: 'NOS',
    defaultRate: 0,
    defaultTaxRate: 5,
    category: 'medicine',
    description: '',
    quantity: 0,
    packing: '',
    opdSection: 'SOLAN OPD SALE'
  })

  const [sections, setSections] = useState<{ section: string; quantity: number }[]>([
    { section: 'SOLAN OPD SALE', quantity: 0 }
  ])

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        opdSection: initialData.opdSection || 'SOLAN OPD SALE'
      })

      const cleanTarget = (initialData.name || '').trim().toLowerCase()
      const matchingInCatalog = (catalog || []).filter(
        c => (c.name || '').trim().toLowerCase() === cleanTarget && Number(c.quantity || 0) > 0
      )

      let existingAllocs: { section: string; quantity: number }[] = []
      if (matchingInCatalog.length > 1) {
        existingAllocs = matchingInCatalog.map(c => ({
          section: c.opdSection || 'SOLAN OPD SALE',
          quantity: Number(c.quantity) || 0
        }))
      } else if (initialData.sectionAllocations && initialData.sectionAllocations.length > 0) {
        existingAllocs = initialData.sectionAllocations
      } else {
        try {
          const logs = JSON.parse(localStorage.getItem('maxxi_godown_movement_logs') || '[]')
          const itemLogs = logs.filter((l: any) => l.itemName?.toLowerCase().trim() === cleanTarget && l.refNo === 'CATALOG_INIT')
          if (itemLogs.length > 0) {
            existingAllocs = itemLogs.map((l: any) => ({
              section: l.section || 'SOLAN OPD SALE',
              quantity: Number(l.quantity) || 0
            }))
          }
        } catch (_) {}
      }

      if (existingAllocs.length > 0) {
        setSections(existingAllocs)
      } else {
        setSections([
          { section: initialData.opdSection || 'SOLAN OPD SALE', quantity: Number(initialData.quantity) || 0 }
        ])
      }
    } else {
      setFormData({
        id: `cat_${Date.now()}`,
        name: '',
        hsnCode: '12119011',
        defaultUnit: 'NOS',
        defaultRate: 0,
        defaultTaxRate: 5,
        category: 'medicine',
        description: '',
        quantity: 0,
        packing: '',
        opdSection: 'SOLAN OPD SALE'
      })
      setSections([
        { section: 'SOLAN OPD SALE', quantity: 0 }
      ])
    }
  }, [initialData, isOpen])

  if (!isOpen) return null

  const handleAddSection = () => {
    const usedSections = sections.map(s => s.section)
    const allOptions = ['SOLAN OPD SALE', 'SABATHU OPD SALE', 'COD SALE', 'ONLINE SALE', 'CENTRAL GODOWN']
    const nextUnused = allOptions.find(o => !usedSections.includes(o)) || 'SABATHU OPD SALE'
    setSections(prev => [...prev, { section: nextUnused, quantity: 0 }])
  }

  const handleRemoveSection = (index: number) => {
    if (sections.length <= 1) return
    setSections(prev => prev.filter((_, i) => i !== index))
  }

  const handleSectionChange = (index: number, field: 'section' | 'quantity', val: any) => {
    setSections(prev => {
      const copy = [...prev]
      if (copy[index]) {
        copy[index] = { ...copy[index], [field]: val }
      }
      return copy
    })
  }

  const totalAllocatedQty = sections.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    if (isMaxxi) {
      const primarySection = sections[0]?.section || formData.opdSection || 'SOLAN OPD SALE'
      onSave({
        ...formData,
        id: formData.id || `cat_${Date.now()}`,
        opdSection: primarySection,
        quantity: totalAllocatedQty,
        sectionAllocations: sections
      })
    } else {
      onSave({
        ...formData,
        id: formData.id || `cat_${Date.now()}`,
        quantity: Number(formData.quantity) || 0
      })
    }
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
              Item *
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

          {/* Multi-Section Stock Allocation (Only in Maxxi Pharma) */}
          {isMaxxi && (
            <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Section / Godown Allocation *</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddSection}
                  className="text-[11px] font-bold text-amber-800 hover:text-amber-900 bg-amber-100 hover:bg-amber-200/80 px-2.5 py-1 rounded-lg border border-amber-300 flex items-center gap-1 transition-all cursor-pointer active:scale-95 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Section
                </button>
              </div>

              <div className="space-y-2">
                {sections.map((alloc, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={alloc.section}
                      onChange={(e) => handleSectionChange(idx, 'section', e.target.value)}
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-amber-500 cursor-pointer shadow-xs"
                    >
                      <option value="SOLAN OPD SALE">SOLAN OPD SALE</option>
                      <option value="SABATHU OPD SALE">SABATHU OPD SALE</option>
                      <option value="COD SALE">COD SALE</option>
                      <option value="ONLINE SALE">ONLINE SALE</option>
                      <option value="CENTRAL GODOWN">CENTRAL GODOWN (Warehouse)</option>
                    </select>

                    <div className="relative w-28 shrink-0">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={alloc.quantity === 0 ? '' : alloc.quantity}
                        onChange={(e) => handleSectionChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                        placeholder="Qty"
                        className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:border-amber-500 text-center shadow-xs"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400 uppercase pointer-events-none">
                        {formData.defaultUnit || 'NOS'}
                      </span>
                    </div>

                    {sections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSection(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove section"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Total Quantity Indicator */}
              <div className="flex items-center justify-between pt-2 border-t border-amber-200/70 text-xs">
                <span className="font-bold text-slate-600">Total Stock (All Sections):</span>
                <span className="font-mono font-black text-amber-900 bg-amber-100/90 border border-amber-300/80 px-2.5 py-0.5 rounded-md text-sm">
                  {totalAllocatedQty} {formData.defaultUnit || 'NOS'}
                </span>
              </div>
            </div>
          )}

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Unit (per) *
              </label>
              <input
                list="catalog-unit-options"
                value={formData.defaultUnit}
                onChange={(e) => setFormData({ ...formData, defaultUnit: e.target.value })}
                placeholder="Type or select..."
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-amber-500"
              />
              <datalist id="catalog-unit-options">
                <option value="kg">kg (Kilogram)</option>
                <option value="PCS">PCS (Pieces)</option>
                <option value="NOS">NOS (Numbers)</option>
                <option value="Bags">Bags / Bales</option>
                <option value="Box">Box</option>
                <option value="Ltr">Ltr (Liter)</option>
                <option value="gm">gm (Grams)</option>
                <option value="Units">Units</option>
              </datalist>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Packing
              </label>
              <input
                type="text"
                value={formData.packing || ''}
                onChange={(e) => setFormData({ ...formData, packing: e.target.value })}
                placeholder="e.g. 50 kg Bag, 100 pcs Box"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {isMaxxi ? (
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
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Quantity
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 outline-none focus:border-amber-500 text-right"
                />
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
            </div>
          )}

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
