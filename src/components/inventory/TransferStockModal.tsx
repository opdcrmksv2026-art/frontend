"use client"

import React, { useState, useEffect } from 'react'
import {
  StockEntity,
  BatchStock,
  getCentralStock,
  executeStockTransfer
} from '@/lib/centralInventorySystem'
import { X, ArrowRight, ArrowLeftRight, Package, AlertCircle, CheckCircle2 } from 'lucide-react'

interface TransferStockModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  defaultSourceEntity?: StockEntity
}

export default function TransferStockModal({
  isOpen,
  onClose,
  onSuccess,
  defaultSourceEntity = 'THIRD_PARTY'
}: TransferStockModalProps) {
  const [sourceEntity, setSourceEntity] = useState<StockEntity>(defaultSourceEntity)
  const [destinationEntity, setDestinationEntity] = useState<StockEntity>(
    defaultSourceEntity === 'THIRD_PARTY' ? 'KSV' : 'MAXXI_PHARMA'
  )
  const [availableBatches, setAvailableBatches] = useState<BatchStock[]>([])
  const [selectedBatchId, setSelectedBatchId] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(1)
  const [transferRate, setTransferRate] = useState<number>(0)
  const [notes, setNotes] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Update source batches when source entity changes
  useEffect(() => {
    const batches = getCentralStock(sourceEntity).filter(
      (b) => b.availableQty > 0 && new Date(b.expiryDate).getTime() >= new Date().getTime()
    )
    setAvailableBatches(batches)
    if (batches.length > 0) {
      setSelectedBatchId(batches[0].id)
      setTransferRate(batches[0].sellingRate || batches[0].purchaseRate)
    } else {
      setSelectedBatchId('')
      setTransferRate(0)
    }
  }, [sourceEntity, isOpen])

  // Update rates when batch changes
  const selectedBatch = availableBatches.find((b) => b.id === selectedBatchId)
  useEffect(() => {
    if (selectedBatch) {
      setTransferRate(selectedBatch.sellingRate || selectedBatch.purchaseRate)
    }
  }, [selectedBatchId])

  // Ensure destination is not equal to source
  const handleSourceChange = (entity: StockEntity) => {
    setSourceEntity(entity)
    if (entity === 'THIRD_PARTY') setDestinationEntity('KSV')
    else if (entity === 'KSV') setDestinationEntity('MAXXI_PHARMA')
    else setDestinationEntity('KSV')
  }

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!selectedBatchId || !selectedBatch) {
      setErrorMsg('Please select a valid product batch.')
      return
    }

    if (quantity <= 0) {
      setErrorMsg('Quantity must be greater than 0.')
      return
    }

    if (quantity > selectedBatch.availableQty) {
      setErrorMsg(
        `Insufficient stock! Requested ${quantity} ${selectedBatch.unit}, but only ${selectedBatch.availableQty} ${selectedBatch.unit} available in ${sourceEntity}.`
      )
      return
    }

    setIsSubmitting(true)

    const res = executeStockTransfer({
      sourceEntity,
      destinationEntity,
      batchId: selectedBatchId,
      quantity,
      transferRate,
      notes,
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

  const calculatedTotal = (quantity || 0) * (transferRate || 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Stock Transfer Workflow</h2>
              <p className="text-xs text-slate-400 font-medium">Supply Chain Transfer (Source ➔ Destination)</p>
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
          {/* Source ➔ Destination */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="text-[10px] uppercase font-extrabold text-slate-500 block mb-1">Source Inventory</label>
              <select
                value={sourceEntity}
                onChange={(e) => handleSourceChange(e.target.value as StockEntity)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                <option value="THIRD_PARTY">Third Party (Kiyava)</option>
                <option value="KSV">Karan Singh Vaidh (KSV)</option>
                <option value="MAXXI_PHARMA">Maxxi Pharma</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-extrabold text-slate-500 block mb-1">Destination Inventory</label>
              <select
                value={destinationEntity}
                onChange={(e) => setDestinationEntity(e.target.value as StockEntity)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                {sourceEntity !== 'THIRD_PARTY' && <option value="THIRD_PARTY">Third Party (Kiyava)</option>}
                {sourceEntity !== 'KSV' && <option value="KSV">Karan Singh Vaidh (KSV)</option>}
                {sourceEntity !== 'MAXXI_PHARMA' && <option value="MAXXI_PHARMA">Maxxi Pharma</option>}
              </select>
            </div>
          </div>

          {/* Product Batch Selection */}
          <div>
            <label className="text-[10px] uppercase font-extrabold text-slate-500 block mb-1">
              Select Available Product Batch ({availableBatches.length} Batches)
            </label>
            {availableBatches.length > 0 ? (
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                {availableBatches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.productName} | Batch: {b.batchNumber} (Avail: {b.availableQty} {b.unit})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold">
                No active non-expired stock available in {sourceEntity} to transfer. Please perform a Purchase first.
              </div>
            )}
          </div>

          {selectedBatch && (
            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between text-indigo-900 text-xs">
              <div>
                <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider block">Available Stock</span>
                <span className="font-mono font-black text-sm text-indigo-700">
                  {selectedBatch.availableQty} {selectedBatch.unit}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider block">Expiry Date</span>
                <span className="font-mono font-bold text-xs">{selectedBatch.expiryDate}</span>
              </div>
              <div>
                <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider block">Tax Rate</span>
                <span className="font-mono font-bold text-xs">{selectedBatch.taxRate}%</span>
              </div>
            </div>
          )}

          {/* Quantity & Transfer Rate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-extrabold text-slate-500 block mb-1">Quantity to Transfer</label>
              <input
                type="number"
                min="1"
                max={selectedBatch?.availableQty || 1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-extrabold text-slate-500 block mb-1">Transfer Rate (₹)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={transferRate}
                onChange={(e) => setTransferRate(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] uppercase font-extrabold text-slate-500 block mb-1">Notes / Dispatch Detail</label>
            <input
              type="text"
              placeholder="e.g. Stock replenishment for OPD consultations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Total Calculation */}
          <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">Total Taxable Value</span>
            <span className="text-base font-black font-mono text-emerald-400">
              ₹{calculatedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
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
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Stock Transfer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
