"use client"

import React from 'react'
import { getInvoiceTraceabilityChain, TraceabilityStep } from '@/lib/centralInventorySystem'
import { X, GitCommit, FileText, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react'

interface InvoiceTraceabilityModalProps {
  isOpen: boolean
  onClose: () => void
  batchNumber?: string
  invoiceNo?: string
}

export default function InvoiceTraceabilityModal({
  isOpen,
  onClose,
  batchNumber = 'KYV-GDK-901',
  invoiceNo
}: InvoiceTraceabilityModalProps) {
  if (!isOpen) return null

  const steps: TraceabilityStep[] = getInvoiceTraceabilityChain(batchNumber)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <GitCommit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                Supply Chain Traceability Ledger
                <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase">
                  Batch: {batchNumber}
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Complete Upstream &amp; Downstream Audit Trail (Supplier ➔ Third Party ➔ KSV ➔ Maxxi ➔ Customer)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Flow */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4">
          {steps.length > 0 ? (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-200">
              {steps.map((step) => (
                <div key={step.stepIndex} className="relative flex items-start gap-4">
                  {/* Step Dot */}
                  <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shadow-md shadow-indigo-300">
                    {step.stepIndex}
                  </div>

                  {/* Step Card */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex-1 space-y-2 hover:border-indigo-300 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 font-black text-[10px] uppercase tracking-wider rounded-lg border border-indigo-200">
                        {step.action}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400">{step.date}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Reference Invoice</span>
                        <span className="font-mono font-bold text-slate-800">{step.invoiceNo || 'N/A'}</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Party / Description</span>
                        <span className="font-semibold text-slate-800 truncate block">{step.partyName}</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Quantity Transferred</span>
                        <span className="font-mono font-black text-indigo-600">{step.quantity} Units</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Transaction Value</span>
                        <span className="font-mono font-black text-emerald-700">₹{step.amount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">No linked transaction history found for Batch: {batchNumber}</p>
              <p className="text-[11px] text-slate-400">Perform stock transfers or sales to generate supply chain traceability steps.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Verified Supply Chain Ledger</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white font-extrabold text-xs rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close Traceability
          </button>
        </div>
      </div>
    </div>
  )
}
