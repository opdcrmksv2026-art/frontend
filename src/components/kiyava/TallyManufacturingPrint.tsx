"use client"

import React from 'react'
import { ManufacturingLog } from '@/types/kiyavaBilling'
import { Printer, X } from 'lucide-react'

interface TallyManufacturingPrintProps {
  log: ManufacturingLog
  onClose: () => void
}

export default function TallyManufacturingPrint({
  log,
  onClose
}: TallyManufacturingPrintProps) {
  const handlePrint = () => {
    window.print()
  }

  const totalComponentsCost = log.totalComponentsCost ?? log.rawMaterialsConsumed.reduce(
    (sum, rm) => sum + (rm.amount ?? (rm.quantity * (rm.rate || 0))),
    0
  )
  const additionalCost = log.additionalCost || 0
  const effectiveCost = log.effectiveCost ?? (totalComponentsCost + additionalCost)
  const effectiveRatePerUnit = log.effectiveRatePerUnit ?? (log.producedQuantity > 0 ? effectiveCost / log.producedQuantity : 0)

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center lg:justify-end p-4 lg:pr-8 lg:pl-64 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      {/* Floating Action Bar (Hidden during print) */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 print:hidden">
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all"
        >
          <Printer className="w-4 h-4" /> Print Voucher
        </button>
        <button
          onClick={onClose}
          className="p-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl shadow-lg border border-slate-200 cursor-pointer transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Printable Voucher Paper */}
      <div className="bg-white w-full max-w-4xl p-8 border border-slate-300 shadow-2xl rounded-xl print:shadow-none print:border-none print:p-4 text-black font-sans text-xs">
        
        {/* Title Header */}
        <div className="text-right font-black uppercase text-sm border-b-2 border-black pb-1 mb-4 tracking-wide">
          Manufacture of Materials
        </div>

        {/* Product Details Header */}
        <div className="space-y-1 mb-4 text-xs font-semibold">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-bold text-slate-600 italic">Name of product: </span>
              <strong className="font-black text-sm uppercase tracking-wide">{log.finishedGoodName}</strong>
            </div>
            <div>
              <span className="font-bold text-slate-600 italic">Mfg Date: </span>
              <span className="font-mono font-bold">{log.date}</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-1 border-t border-slate-200 text-xs">
            <div>
              <span className="font-bold text-slate-600 italic">%- of Cost allocation: </span>
              <span className="font-bold">{log.costAllocationPercent || 100} %</span>
            </div>
            <div>
              <span className="font-bold text-slate-600 italic">Batch name: </span>
              <span className="font-mono font-bold uppercase">{log.batchNo || 'N/A'}</span>
            </div>
            <div>
              <span className="font-bold text-slate-600 italic">Produced Qty: </span>
              <strong className="font-mono font-black">{log.producedQuantity} {log.unit}</strong>
            </div>
          </div>
        </div>

        {/* Main Table: Components (Consumption) */}
        <table className="w-full border-collapse border border-slate-400 text-xs mb-4">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-400 font-extrabold text-[11px]">
              <th className="border-r border-slate-400 p-2 text-left" colSpan={2}>
                Components (Consumption)
              </th>
              <th className="border-r border-slate-400 p-2 text-right">Quantity</th>
              <th className="border-r border-slate-400 p-2 text-right">Rate (₹)</th>
              <th className="p-2 text-right">Amount (₹)</th>
            </tr>
            <tr className="bg-slate-50 border-b border-slate-400 text-[10px] uppercase font-extrabold text-slate-700">
              <th className="border-r border-slate-400 p-1.5 text-left" colSpan={2}>Name of Item</th>
              <th className="border-r border-slate-400 p-1.5 text-right">Qty & Unit</th>
              <th className="border-r border-slate-400 p-1.5 text-right">Rate</th>
              <th className="p-1.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {log.rawMaterialsConsumed.map((rm, idx) => {
              const rowRate = rm.rate || 0
              const rowAmount = rm.amount ?? (rm.quantity * rowRate)
              return (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="p-2 border-r border-slate-300 font-bold text-slate-900" colSpan={2}>
                    {rm.itemName}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono font-bold text-slate-800">
                    {rm.quantity} <span className="text-[10px] text-slate-600">{rm.unit}</span>
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono text-slate-700">
                    {rowRate > 0 ? `${rowRate.toFixed(2)} / ${rm.unit}` : '—'}
                  </td>
                  <td className="p-2 text-right font-mono font-extrabold text-slate-900">
                    {rowAmount > 0 ? rowAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 border-t-2 border-slate-400 font-extrabold text-xs">
              <td className="p-2 border-r border-slate-400" colSpan={2}>
                Cost of components:
              </td>
              <td className="p-2 border-r border-slate-400 text-right font-mono" colSpan={2}>
                Total Components Cost
              </td>
              <td className="p-2 text-right font-mono text-sm font-black text-slate-900">
                ₹{totalComponentsCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Cost Allocation & Summary Block */}
        <div className="flex justify-end mb-6">
          <div className="w-full sm:w-1/2 border border-slate-400 p-3 rounded bg-slate-50 space-y-1.5 text-xs font-semibold">
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span className="text-slate-600">Total Addl. Cost:</span>
              <span className="font-mono font-bold">₹{additionalCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span className="text-slate-700 font-bold">Effective Cost:</span>
              <strong className="font-mono font-black text-sm text-slate-900">
                ₹{effectiveCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span className="text-slate-600">Allocation to Primary Item:</span>
              <span className="font-mono font-bold">{log.costAllocationPercent || 100}%</span>
            </div>
            <div className="flex justify-between pt-1 text-slate-900">
              <span className="font-black">Effective rate of Primary Item:</span>
              <strong className="font-mono font-black text-emerald-700 text-sm">
                ₹{effectiveRatePerUnit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / {log.unit}
              </strong>
            </div>
          </div>
        </div>

        {/* Narration */}
        <div className="border-t border-slate-400 pt-2 text-xs">
          <span className="font-bold text-slate-700 italic">Narration: </span>
          <span className="font-medium text-slate-900">{log.notes || 'Manufactured in-house.'}</span>
        </div>

        {/* Signatures */}
        <div className="mt-12 flex justify-between items-end pt-8 border-t border-slate-200 text-[11px] font-bold text-slate-600">
          <div>Prepared By: _______________</div>
          <div>Checked By: _______________</div>
          <div>Authorized Signatory</div>
        </div>
      </div>
    </div>
  )
}
