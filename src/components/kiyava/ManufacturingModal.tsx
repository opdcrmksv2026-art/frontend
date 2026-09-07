"use client"

import React, { useState, useEffect } from 'react'
import { ManufacturingLog, CatalogItem, RawMaterialConsumed } from '@/types/kiyavaBilling'
import { X, FlaskConical, Save, Plus, Trash2, Calculator } from 'lucide-react'

interface ManufacturingModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (log: ManufacturingLog) => void
  catalog: CatalogItem[]
}

export default function ManufacturingModal({
  isOpen,
  onClose,
  onSave,
  catalog
}: ManufacturingModalProps) {
  const [formData, setFormData] = useState<ManufacturingLog>({
    id: '',
    date: new Date().toISOString().split('T')[0],
    batchNo: '',
    finishedGoodItemId: '',
    finishedGoodName: '',
    producedQuantity: 0,
    unit: 'PCS',
    costAllocationPercent: 100,
    rawMaterialsConsumed: [],
    additionalCost: 0,
    totalComponentsCost: 0,
    effectiveCost: 0,
    effectiveRatePerUnit: 0,
    notes: ''
  })

  // Whenever modal opens, reset form
  useEffect(() => {
    if (isOpen) {
      setFormData({
        id: `mfg_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        batchNo: '',
        finishedGoodItemId: '',
        finishedGoodName: '',
        producedQuantity: 1,
        unit: 'PCS',
        costAllocationPercent: 100,
        rawMaterialsConsumed: [],
        additionalCost: 0,
        totalComponentsCost: 0,
        effectiveCost: 0,
        effectiveRatePerUnit: 0,
        notes: ''
      })
    }
  }, [isOpen])

  if (!isOpen) return null

  // Calculate live totals
  const totalComponentsCost = formData.rawMaterialsConsumed.reduce((sum, rm) => {
    const qty = Number(rm.quantity) || 0
    const rate = Number(rm.rate) || 0
    const amt = rm.amount !== undefined && !isNaN(rm.amount) ? Number(rm.amount) : (qty * rate)
    return sum + amt
  }, 0)

  const additionalCost = Number(formData.additionalCost) || 0
  const effectiveCost = totalComponentsCost + additionalCost
  const producedQty = Number(formData.producedQuantity) || 0
  const effectiveRatePerUnit = producedQty > 0 ? effectiveCost / producedQty : 0

  const handleAddRawMaterial = () => {
    setFormData({
      ...formData,
      rawMaterialsConsumed: [
        ...formData.rawMaterialsConsumed,
        { itemId: '', itemName: '', quantity: 1, unit: 'Kgs', rate: 0, amount: 0 }
      ]
    })
  }

  const handleRemoveRawMaterial = (index: number) => {
    const updated = [...formData.rawMaterialsConsumed]
    updated.splice(index, 1)
    setFormData({ ...formData, rawMaterialsConsumed: updated })
  }

  const handleRawMaterialChange = (index: number, field: keyof RawMaterialConsumed, value: any) => {
    const updated = [...formData.rawMaterialsConsumed]
    const current = { ...updated[index] }

    if (field === 'itemId') {
      const item = catalog.find((c) => c.id === value)
      if (item) {
        current.itemId = item.id
        current.itemName = item.name
        current.unit = item.defaultUnit || 'Kgs'
        current.rate = item.defaultRate || 0
        current.quantity = current.quantity > 0 ? current.quantity : 1
        current.amount = current.quantity * current.rate
      }
    } else if (field === 'quantity') {
      const qty = parseFloat(value) || 0
      current.quantity = qty
      current.amount = qty * (current.rate || 0)
    } else if (field === 'rate') {
      const rate = parseFloat(value) || 0
      current.rate = rate
      current.amount = (current.quantity || 0) * rate
    } else if (field === 'amount') {
      const amt = parseFloat(value) || 0
      current.amount = amt
      if (current.quantity > 0) {
        current.rate = amt / current.quantity
      }
    } else {
      (current as any)[field] = value
    }

    updated[index] = current
    setFormData({ ...formData, rawMaterialsConsumed: updated })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.finishedGoodName || producedQty <= 0) {
      alert('Please specify the manufactured product name and a valid quantity (>0).')
      return
    }
    if (formData.rawMaterialsConsumed.length === 0) {
      alert('Please add at least one consumed component/raw material item.')
      return
    }
    for (let rm of formData.rawMaterialsConsumed) {
      if (!rm.itemName || rm.quantity <= 0) {
        alert('Please complete all component rows with valid item name and quantity.')
        return
      }
    }

    const finalLog: ManufacturingLog = {
      ...formData,
      totalComponentsCost,
      additionalCost,
      effectiveCost,
      effectiveRatePerUnit
    }

    onSave(finalLog)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center lg:justify-end p-4 lg:pr-8 lg:pl-64 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-600 border border-cyan-100 flex items-center justify-center">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-wide">
                Manufacture of Materials (BOM Log)
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Record manufactured product details &amp; raw material consumption (Tally Voucher format)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Finished Good Info */}
          <div className="space-y-4 bg-cyan-50/50 p-4 rounded-2xl border border-cyan-100">
            <h3 className="text-xs font-black text-cyan-900 uppercase tracking-wider flex items-center gap-1.5">
              <FlaskConical className="w-4 h-4 text-cyan-600" />
              1. Manufactured Product Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block">
                  Manufacturing Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block">
                  Batch Name / No. *
                </label>
                <input
                  type="text"
                  required
                  value={formData.batchNo}
                  onChange={(e) => setFormData({ ...formData, batchNo: e.target.value })}
                  placeholder="e.g. ZXP-101"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 uppercase outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block">
                  % of Cost Allocation
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.costAllocationPercent || 100}
                  onChange={(e) => setFormData({ ...formData, costAllocationPercent: parseFloat(e.target.value) || 100 })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block">
                  Name of Product (Finished Good) *
                </label>
                <input
                  type="text"
                  required
                  list="catalog-products-list"
                  value={formData.finishedGoodName}
                  onChange={(e) => {
                    const nameVal = e.target.value
                    const matchedItem = catalog.find(c => c.name.toLowerCase() === nameVal.toLowerCase())
                    setFormData({
                      ...formData,
                      finishedGoodName: nameVal,
                      finishedGoodItemId: matchedItem?.id || formData.finishedGoodItemId || `fg_${Date.now()}`,
                      unit: matchedItem?.defaultUnit || formData.unit || 'PCS'
                    })
                  }}
                  placeholder="e.g. VIDHUVAIDHA ZXP 60 CAPSULE"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 uppercase outline-none focus:border-cyan-500"
                />
                <datalist id="catalog-products-list">
                  {catalog.map(item => (
                    <option key={item.id} value={item.name} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block">
                  Produced Qty &amp; Unit *
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    step="any"
                    min="0.001"
                    required
                    value={formData.producedQuantity}
                    onChange={(e) => setFormData({ ...formData, producedQuantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 text-right outline-none focus:border-cyan-500"
                  />
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-24 px-2 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-cyan-500 uppercase"
                  >
                    <option value="PCS">PCS</option>
                    <option value="Boxes">Boxes</option>
                    <option value="Bottles">Bottles</option>
                    <option value="Kgs">Kgs</option>
                    <option value="Gram">Gram</option>
                    <option value="Pkt">Pkt</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Components (Consumption) Table */}
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  2. Components (Consumption / Raw Materials)
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Add all ingredients/herbs consumed in this production batch</p>
              </div>
              <button
                type="button"
                onClick={handleAddRawMaterial}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Add Component Row
              </button>
            </div>

            {formData.rawMaterialsConsumed.length === 0 ? (
              <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs font-medium space-y-2">
                <p>No components added yet.</p>
                <button
                  type="button"
                  onClick={handleAddRawMaterial}
                  className="px-4 py-1.5 bg-white border border-cyan-300 text-cyan-700 font-bold text-xs rounded-xl shadow-sm hover:bg-cyan-50"
                >
                  + Add First Component (e.g. KASNI, KANTAKARI)
                </button>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="p-2.5 pl-4">Item Name</th>
                        <th className="p-2.5 text-right w-28">Qty</th>
                        <th className="p-2.5 text-center w-24">Unit</th>
                        <th className="p-2.5 text-right w-28">Rate (₹)</th>
                        <th className="p-2.5 text-right w-32">Amount (₹)</th>
                        <th className="p-2.5 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {formData.rawMaterialsConsumed.map((rm, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 pl-4">
                            <input
                              type="text"
                              required
                              list={`cat-list-${idx}`}
                              value={rm.itemName}
                              onChange={(e) => {
                                const val = e.target.value
                                const matched = catalog.find(c => c.name.toLowerCase() === val.toLowerCase())
                                if (matched) {
                                  handleRawMaterialChange(idx, 'itemId', matched.id)
                                } else {
                                  handleRawMaterialChange(idx, 'itemName', val)
                                }
                              }}
                              placeholder="e.g. KASNI / KANTAKARI"
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-cyan-500 uppercase"
                            />
                            <datalist id={`cat-list-${idx}`}>
                              {catalog.map(c => (
                                <option key={c.id} value={c.name} />
                              ))}
                            </datalist>
                          </td>

                          <td className="p-2 text-right">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              required
                              value={rm.quantity}
                              onChange={(e) => handleRawMaterialChange(idx, 'quantity', e.target.value)}
                              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 text-right outline-none focus:border-cyan-500"
                            />
                          </td>

                          <td className="p-2 text-center">
                            <select
                              value={rm.unit}
                              onChange={(e) => handleRawMaterialChange(idx, 'unit', e.target.value)}
                              className="w-full px-1.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-cyan-500 uppercase"
                            >
                              <option value="Kgs">Kgs</option>
                              <option value="Gram">Gram</option>
                              <option value="PCS">PCS</option>
                              <option value="Ltr">Ltr</option>
                              <option value="Boxes">Boxes</option>
                            </select>
                          </td>

                          <td className="p-2 text-right">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={rm.rate || 0}
                              onChange={(e) => handleRawMaterialChange(idx, 'rate', e.target.value)}
                              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 text-right outline-none focus:border-cyan-500"
                            />
                          </td>

                          <td className="p-2 text-right font-mono font-black text-slate-900">
                            ₹{(rm.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveRawMaterial(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Cost Summary & Additional Costs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block">
                Additional Costs (Labor, Packaging, Power) ₹
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={formData.additionalCost || 0}
                onChange={(e) => setFormData({ ...formData, additionalCost: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:border-cyan-500"
              />

              <div className="mt-3">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block">
                  Narration / Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Manufactured batch ZXP-101 at KSV unit"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Calculations Panel */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2 text-xs font-semibold">
              <div className="flex justify-between items-center text-slate-600">
                <span>Cost of Components:</span>
                <span className="font-mono font-bold text-slate-900">
                  ₹{totalComponentsCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-600 border-b border-slate-100 pb-1.5">
                <span>Additional Cost:</span>
                <span className="font-mono font-bold text-slate-800">
                  ₹{additionalCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between items-center pt-1 text-slate-900">
                <span className="font-bold">Effective Cost:</span>
                <strong className="font-mono font-black text-sm text-cyan-700">
                  ₹{effectiveCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </div>

              <div className="flex justify-between items-center pt-1 border-t border-slate-100 text-slate-900">
                <span className="font-black">Effective Rate / {formData.unit}:</span>
                <strong className="font-mono font-black text-emerald-600 text-sm">
                  ₹{effectiveRatePerUnit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-600/20 active:scale-95 transition-all cursor-pointer uppercase tracking-wider"
            >
              <Save className="w-4 h-4" />
              Save Production Log
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
