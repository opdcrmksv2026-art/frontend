"use client"

import React, { useState, useEffect } from 'react'
import {
  StockEntity,
  BatchStock,
  getCentralStock,
  executeStockAdjustment
} from '@/lib/centralInventorySystem'
import { X, SlidersHorizontal, AlertCircle, CheckCircle2 } from 'lucide-react'

interface StockAdjustmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  defaultEntity?: StockEntity
}

export default function StockAdjustmentModal({
  isOpen,
  onClose,
  onSuccess,
  defaultEntity = 'THIRD_PARTY'
}: StockAdjustmentModalProps) {
  const [entity, setEntity] = useState<StockEntity>(defaultEntity)
  const [availableBatches, setAvailableBatches] = useState<BatchStock[]>([])
  const [selectedBatchId, setSelectedBatchId] = useState<string>('')
  const [adjustmentType, setAdjustmentType] = useState<'INCREASE' | 'DECREASE'>('INCREASE')
  const [quantity, setQuantity] = useState<number>(1)
  const [reason, setReason] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  useEffect(() => {
    const batches = getCentralStock(entity)
    setAvailableBatches(batches)
    if (batches.length > 0) {
      setSelectedBatchId(batches[0].id)
    } else {
      setSelectedBatchId('')
    }
  }, [entity, isOpen])

  if (!isOpen) return null

  const selectedBatch = availableBatches.find((b) => b.id === selectedBatchId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!selectedBatchId || !selectedBatch) {
      setErrorMsg('Please select a valid batch.')
      return
    }

    if (quantity <= 0) {
      setErrorMsg('Adjustment quantity must be greater than 0.')
      return
    }

    if (!reason.trim()) {
      setErrorMsg('Mandatory adjustment reason must be provided for audit logging.')
      return
    }

    if (adjustmentType === 'DECREASE' && selectedBatch.availableQty < quantity) {
      setErrorMsg(`Cannot decrease more than available stock (${selectedBatch.availableQty}).`)
      return
    }

    setIsSubmitting(true)

    const res = executeStockAdjustment({
      batchId: selectedBatchId,
      adjustmentType,
      quantity,
      reason,
      createdBy: 'Dr. Vikas'
    })

    setIsSubmitting(false)

    if (res.success) {
      onSuccess()
      onClose()
    } else {
      setErrorMsg(res.message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Manual Stock Adjustment</h2>
              <p className="text-xs text-slate-400 font-medium">Audit-Logged Stock Correction</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          {/* Entity Selection */}
          <div>
            <label className="text-[10px] uppercase font-extrabold text-slate-500 block mb-1">Target Entity</label>
            <select
              value={entity}
              onChange={(e) => setEntity(e.target.value as StockEntity)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:border-purple-500"
            >
              <option value="THIRD_PARTY">Third Party (Kiyava)</option>
              <option value="KSV">Karan Singh Vaidh (KSV)</option>
              <option value="MAXXI_PHARMA">Maxxi Pharma</option>
            </select>
          </div>

          {/* Batch Selection */}
          <div>
            <label className="text-[10px] uppercase font-extrabold text-slate-500 block mb-1">Select Product Batch</label>
            {availableBatches.length > 0 ? (
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:border-purple-500"
              >
                {availableBatches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.productName} (Batch: {b.batchNumber}) — Current: {b.availableQty} {b.unit}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 text-xs font-bold">
                No inventory batches present for {entity}.
              </div>
            )}
          </div>

          {/* Adjustment Type */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAdjustmentType('INCREASE')}
              className={`py-2 px-3 rounded-xl font-black uppercase text-xs transition-all border ${
                adjustmentType === 'INCREASE'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              ➕ Increase (+ Stock)
            </button>

            <button
              type="button"
              onClick={() => setAdjustmentType('DECREASE')}
              className={`py-2 px-3 rounded-xl font-black uppercase text-xs transition-all border ${
                adjustmentType === 'DECREASE'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              ➖ Decrease (- Stock)
            </button>
          </div>

          {/* Quantity */}
          <div>
            <label className="text-[10px] uppercase font-extrabold text-slate-500 block mb-1">Adjustment Quantity</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="text-[10px] uppercase font-extrabold text-slate-500 block mb-1">
              Audit Reason / Note <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              required
              placeholder="e.g. Damage correction, Physical audit discrepancy..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || availableBatches.length === 0}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply Adjustment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
