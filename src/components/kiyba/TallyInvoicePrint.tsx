"use client"

import React, { useRef, useState } from 'react'
import { KiybaInvoice } from '@/types/kiybaBilling'
import { Printer, X, Copy, Check, ZoomIn, ZoomOut } from 'lucide-react'

interface TallyInvoicePrintProps {
  invoice: KiybaInvoice
  onClose?: () => void
}

export default function TallyInvoicePrint({ invoice, onClose }: TallyInvoicePrintProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const [copyType, setCopyType] = useState<'Original Copy' | 'Duplicate for Transporter' | 'Triplicate for Supplier' | 'Extra Copy'>('Original Copy')
  const [zoomLevel, setZoomLevel] = useState<number>(100)
  const [copiedLink, setCopiedLink] = useState(false)

  const handlePrint = () => {
    window.print()
  }

  const handleCopySummary = () => {
    const text = `TAX INVOICE: ${invoice.invoiceNo}\nSeller: ${invoice.company.name}\nBuyer: ${invoice.buyer.name}\nGrand Total: ₹${invoice.grandTotal.toLocaleString('en-IN')}\nDate: ${invoice.invoiceDate}`
    navigator.clipboard.writeText(text)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}-${month}-${year}`
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex flex-col items-center p-2 sm:p-6 print:p-0 print:bg-white print:static print:overflow-visible">
      {/* Top Action Bar (hidden during print) */}
      <div className="w-full max-w-4xl bg-slate-900 text-white rounded-2xl p-3.5 mb-4 flex flex-wrap items-center justify-between gap-3 shadow-2xl border border-slate-800 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-mono font-black text-sm">
            ₹
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              Tally Tax Invoice — #{invoice.invoiceNo}
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {invoice.status}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              {invoice.company.name} ➔ {invoice.buyer.name}
            </p>
          </div>
        </div>

        {/* Copy Type & Action Buttons */}
        <div className="flex items-center gap-2">
          <select
            value={copyType}
            onChange={(e) => setCopyType(e.target.value as any)}
            className="bg-slate-950 text-xs font-semibold text-slate-200 border border-slate-700 rounded-xl px-2.5 py-1.5 outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="Original Copy">Original Copy</option>
            <option value="Duplicate for Transporter">Duplicate for Transporter</option>
            <option value="Triplicate for Supplier">Triplicate for Supplier</option>
            <option value="Extra Copy">Extra Copy</option>
          </select>

          {/* Zoom Controls */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded text-xs"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono font-bold text-slate-400 px-1">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded text-xs"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleCopySummary}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            title="Copy invoice details"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedLink ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print A4 Bill
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer ml-1"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Printable Paper Canvas (True 1:1 Tally Tax Invoice Replica) */}
      <div
        id="tally-printable-invoice"
        ref={printRef}
        style={{
          transform: `scale(${zoomLevel / 100})`,
          transformOrigin: 'top center',
          fontFamily: "'Segoe UI', Arial, Helvetica, sans-serif"
        }}
        className="w-full max-w-[800px] bg-white text-black text-[11px] leading-tight border-2 border-black shadow-2xl p-0 print:border print:border-black print:m-0 print:w-full print:max-w-none print:shadow-none transition-transform"
      >
        {/* Header Ribbon: GSTIN | TAX INVOICE | Copy Type */}
        <div className="border-b border-black px-2 py-1 flex justify-between items-center bg-white text-[10px]">
          <div>
            GSTIN : <strong className="font-mono text-[11px] font-black">{invoice.company.gstin}</strong>
          </div>
          <div className="text-xs font-black uppercase tracking-widest text-center">
            TAX INVOICE
          </div>
          <div className="italic text-[9.5px] font-medium">
            {copyType}
          </div>
        </div>

        {/* Company / Seller Banner */}
        <div className="border-b border-black p-2.5 text-center bg-white">
          <h1 className="text-xl font-black tracking-wide uppercase font-serif text-black leading-none">
            {invoice.company.name}
          </h1>
          {invoice.company.tagline && (
            <p className="text-[9.5px] font-semibold text-neutral-700 mt-0.5 tracking-wide">
              {invoice.company.tagline}
            </p>
          )}
          <p className="text-[10px] font-medium text-black mt-1">
            {invoice.company.addressLine1}
            {invoice.company.addressLine2 ? `, ${invoice.company.addressLine2}` : ''}
          </p>
          <p className="text-[10px] font-medium text-black">
            {invoice.company.city}, {invoice.company.state} - {invoice.company.pincode}
          </p>
          <div className="flex justify-center items-center gap-4 text-[9.5px] font-semibold text-neutral-800 mt-1 flex-wrap">
            <span>State Name : <strong>{invoice.company.state}</strong>, Code : <strong>{invoice.company.stateCode}</strong></span>
            {invoice.company.phone && <span>Tel : <strong>{invoice.company.phone}</strong></span>}
            {invoice.company.email && <span>E-Mail : <strong>{invoice.company.email}</strong></span>}
          </div>
        </div>

        {/* Invoice Metadata & Transportation Grid (Tally 2-Column Section) */}
        <div className="grid grid-cols-2 border-b border-black text-[9.5px]">
          {/* Left Column */}
          <div className="border-r border-black p-2 space-y-0.5">
            <div className="grid grid-cols-3 gap-1">
              <span className="font-bold text-neutral-700">Invoice No.</span>
              <span className="col-span-2 font-mono font-black text-black">: {invoice.invoiceNo}</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <span className="font-bold text-neutral-700">Date of Invoice</span>
              <span className="col-span-2 font-semibold text-black">: {formatDate(invoice.invoiceDate)}</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <span className="font-bold text-neutral-700">Ref. No. / PO No.</span>
              <span className="col-span-2 font-semibold text-black">: {invoice.refNo || invoice.poNo || '-'}</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <span className="font-bold text-neutral-700">Place of Supply</span>
              <span className="col-span-2 font-semibold text-black">: {invoice.placeOfSupply || `${invoice.buyer.state} (${invoice.buyer.stateCode})`}</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <span className="font-bold text-neutral-700">Reverse Charge</span>
              <span className="col-span-2 font-semibold text-black">: {invoice.reverseCharge || 'N'}</span>
            </div>
            {invoice.salesmanName && (
              <div className="grid grid-cols-3 gap-1">
                <span className="font-bold text-neutral-700">Salesman Name</span>
                <span className="col-span-2 font-semibold text-black">: {invoice.salesmanName}</span>
              </div>
            )}
            {invoice.matCenter && (
              <div className="grid grid-cols-3 gap-1">
                <span className="font-bold text-neutral-700">Mat. Center</span>
                <span className="col-span-2 font-semibold text-black">: {invoice.matCenter}</span>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="p-2 space-y-0.5">
            <div className="grid grid-cols-3 gap-1">
              <span className="font-bold text-neutral-700">Vehicle No.</span>
              <span className="col-span-2 font-semibold text-black">: {invoice.vehicleNo || '-'}</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <span className="font-bold text-neutral-700">Station / Dest.</span>
              <span className="col-span-2 font-semibold text-black">: {invoice.station || invoice.buyer.city || '-'}</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <span className="font-bold text-neutral-700">E-Way Bill No.</span>
              <span className="col-span-2 font-mono font-semibold text-black">: {invoice.eWayBillNo || '-'}</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <span className="font-bold text-neutral-700">Payment Terms</span>
              <span className="col-span-2 font-semibold text-black">: {invoice.paymentTerms || invoice.paymentMode || 'Immediate'}</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <span className="font-bold text-neutral-700">Total Bags / Pkgs</span>
              <span className="col-span-2 font-semibold text-black">: {invoice.totalBags || `${invoice.items.length} Packages`}</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <span className="font-bold text-neutral-700">Transport / Courier</span>
              <span className="col-span-2 font-semibold text-black">: {invoice.transport || 'Direct'}</span>
            </div>
            {invoice.grRrNo && (
              <div className="grid grid-cols-3 gap-1">
                <span className="font-bold text-neutral-700">GR / RR No.</span>
                <span className="col-span-2 font-semibold text-black">: {invoice.grRrNo}</span>
              </div>
            )}
          </div>
        </div>

        {/* Party (Billed To) & Consignee (Shipped To) */}
        <div className="grid grid-cols-2 border-b border-black text-[9.5px]">
          {/* Billed To */}
          <div className="border-r border-black p-2 space-y-0.5">
            <div className="font-black text-black uppercase tracking-wider mb-0.5">
              Party / Billed to :
            </div>
            <div className="font-black text-[11px] text-black">{invoice.buyer.name}</div>
            <div className="text-neutral-800">{invoice.buyer.addressLine1}</div>
            {invoice.buyer.addressLine2 && <div className="text-neutral-800">{invoice.buyer.addressLine2}</div>}
            <div className="text-neutral-800">
              {invoice.buyer.city}, {invoice.buyer.state} - {invoice.buyer.pincode}
            </div>
            <div className="pt-1 space-y-0.5">
              <div>Party Mobile No : <strong className="font-mono">{invoice.buyer.phone}</strong></div>
              <div>State Name : <strong>{invoice.buyer.state}</strong>, Code : <strong>{invoice.buyer.stateCode}</strong></div>
              <div>GSTIN / UIN : <strong className="font-mono font-bold">{invoice.buyer.gstin || 'URP / Unregistered'}</strong></div>
            </div>
          </div>

          {/* Shipped To */}
          <div className="p-2 space-y-0.5">
            <div className="font-black text-black uppercase tracking-wider mb-0.5">
              Shipped to :
            </div>
            {invoice.shippedToSameAsBilled || !invoice.shippedTo ? (
              <>
                <div className="font-black text-[11px] text-black">{invoice.buyer.name}</div>
                <div className="text-neutral-800">{invoice.buyer.addressLine1}</div>
                {invoice.buyer.addressLine2 && <div className="text-neutral-800">{invoice.buyer.addressLine2}</div>}
                <div className="text-neutral-800">
                  {invoice.buyer.city}, {invoice.buyer.state} - {invoice.buyer.pincode}
                </div>
                <div className="pt-1 space-y-0.5">
                  <div>Party Mobile No : <strong className="font-mono">{invoice.buyer.phone}</strong></div>
                  <div>State Name : <strong>{invoice.buyer.state}</strong>, Code : <strong>{invoice.buyer.stateCode}</strong></div>
                  <div>GSTIN / UIN : <strong className="font-mono font-bold">{invoice.buyer.gstin || 'URP'}</strong></div>
                </div>
              </>
            ) : (
              <>
                <div className="font-black text-[11px] text-black">{invoice.shippedTo.name}</div>
                <div className="text-neutral-800">{invoice.shippedTo.addressLine1}</div>
                {invoice.shippedTo.addressLine2 && <div className="text-neutral-800">{invoice.shippedTo.addressLine2}</div>}
                <div className="text-neutral-800">
                  {invoice.shippedTo.city}, {invoice.shippedTo.state} - {invoice.shippedTo.pincode}
                </div>
                <div className="pt-1 space-y-0.5">
                  <div>Party Mobile No : <strong className="font-mono">{invoice.shippedTo.phone}</strong></div>
                  <div>State Name : <strong>{invoice.shippedTo.state}</strong>, Code : <strong>{invoice.shippedTo.stateCode}</strong></div>
                  <div>GSTIN / UIN : <strong className="font-mono font-bold">{invoice.shippedTo.gstin || 'URP'}</strong></div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Item Rows Table (Exact Tally Grid Format) */}
        <table className="w-full border-collapse text-[10px]">
          <thead>
            <tr className="border-b border-black bg-white text-black font-black">
              <th className="border-r border-black p-1 text-center w-7">Sl<br />No.</th>
              <th className="border-r border-black p-1 text-left">Description of Goods</th>
              <th className="border-r border-black p-1 text-center w-20">HSN/SAC</th>
              <th className="border-r border-black p-1 text-right w-24">Quantity</th>
              <th className="border-r border-black p-1 text-right w-20">Rate<br /><span className="text-[8px] font-normal">(Incl. of Tax)</span></th>
              <th className="border-r border-black p-1 text-right w-16">Rate</th>
              <th className="border-r border-black p-1 text-center w-10">per</th>
              <th className="border-r border-black p-1 text-right w-12">Disc. %</th>
              <th className="p-1 text-right w-24">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black font-mono text-[9.5px]">
            {invoice.items.map((item, idx) => {
              const inclTaxRate = item.rateInclTax || (item.taxRate ? item.rate * (1 + item.taxRate / 100) : item.rate)
              return (
                <tr key={item.id || idx} className="hover:bg-slate-50 print:hover:bg-white">
                  <td className="border-r border-black p-1 text-center font-sans font-bold text-black">{idx + 1}</td>
                  <td className="border-r border-black p-1 text-left font-sans font-bold text-black">
                    {item.description}
                  </td>
                  <td className="border-r border-black p-1 text-center">{item.hsnSac || '-'}</td>
                  <td className="border-r border-black p-1 text-right font-bold">
                    {item.quantity.toFixed(3)} {item.unit}
                  </td>
                  <td className="border-r border-black p-1 text-right text-neutral-800">
                    {inclTaxRate > 0 ? inclTaxRate.toFixed(2) : '-'}
                  </td>
                  <td className="border-r border-black p-1 text-right font-semibold">
                    {item.rate.toFixed(2)}
                  </td>
                  <td className="border-r border-black p-1 text-center font-sans">{item.unit}</td>
                  <td className="border-r border-black p-1 text-right">
                    {item.discountPercent > 0 ? `${item.discountPercent}%` : ''}
                  </td>
                  <td className="p-1 text-right font-bold text-black">
                    {item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              )
            })}

            {/* Subtotal Row */}
            <tr className="border-t border-black font-sans font-bold">
              <td colSpan={8} className="border-r border-black p-1 text-right uppercase tracking-wider text-[9.5px]">
                Subtotal
              </td>
              <td className="p-1 text-right font-mono font-bold text-black">
                {invoice.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>

            {/* Tax and Adjustment rows */}
            {invoice.isInterState ? (
              invoice.igstAmount > 0 && (
                <tr className="font-sans font-semibold text-black">
                  <td colSpan={8} className="border-r border-black p-1 text-right">
                    Add : IGST
                  </td>
                  <td className="p-1 text-right font-mono font-bold">
                    {invoice.igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              )
            ) : (
              <>
                {invoice.sgstAmount > 0 && (
                  <tr className="font-sans font-semibold text-black">
                    <td colSpan={8} className="border-r border-black p-1 text-right">
                      Add : SGST
                    </td>
                    <td className="p-1 text-right font-mono font-bold">
                      {invoice.sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}
                {invoice.cgstAmount > 0 && (
                  <tr className="font-sans font-semibold text-black">
                    <td colSpan={8} className="border-r border-black p-1 text-right">
                      Add : CGST
                    </td>
                    <td className="p-1 text-right font-mono font-bold">
                      {invoice.cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}
              </>
            )}

            {invoice.freightCharges > 0 && (
              <tr className="font-sans font-semibold text-black">
                <td colSpan={8} className="border-r border-black p-1 text-right">
                  Add : Freight &amp; Forwarding Charges
                </td>
                <td className="p-1 text-right font-mono font-bold">
                  {invoice.freightCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            )}

            {invoice.extraDiscount > 0 && (
              <tr className="font-sans font-semibold text-black">
                <td colSpan={8} className="border-r border-black p-1 text-right">
                  Less : Special Discount
                </td>
                <td className="p-1 text-right font-mono font-bold">
                  (-){invoice.extraDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            )}

            {invoice.roundOff !== 0 && (
              <tr className="font-sans font-semibold text-black">
                <td colSpan={8} className="border-r border-black p-1 text-right">
                  {invoice.roundOff < 0 ? 'Less : Round Off' : 'Add : Round Off'}
                </td>
                <td className="p-1 text-right font-mono font-bold">
                  {invoice.roundOff < 0 ? `(-) ${Math.abs(invoice.roundOff).toFixed(2)}` : `(+) ${invoice.roundOff.toFixed(2)}`}
                </td>
              </tr>
            )}

            {/* Grand Total Row with Thick Top and Bottom Borders */}
            <tr className="border-t-2 border-b-2 border-black font-sans font-black bg-white text-[11px]">
              <td colSpan={3} className="border-r border-black p-1.5 text-right uppercase tracking-wider">
                Total
              </td>
              <td className="border-r border-black p-1.5 text-right font-mono">
                {invoice.totalQuantity.toFixed(3)}
              </td>
              <td colSpan={4} className="border-r border-black p-1.5 text-right uppercase tracking-wider">
                Grand Total
              </td>
              <td className="p-1.5 text-right font-mono text-[12px] font-black text-black">
                ₹ {invoice.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Amount Chargeable in Words & E. & O.E */}
        <div className="border-b border-black p-1.5 flex justify-between items-center text-[9.5px] bg-white">
          <div>
            <span className="font-bold text-neutral-700 uppercase">Amount Chargeable (in words): </span>
            <strong className="text-black font-serif font-black text-[10px]">{invoice.amountInWords}</strong>
          </div>
          <div className="italic font-bold text-neutral-700">E. &amp; O.E</div>
        </div>

        {/* HSN/SAC Tax Summary Ledger Table */}
        <div className="border-b border-black">
          <div className="px-2 py-0.5 border-b border-black font-black text-[8.5px] uppercase tracking-wider text-neutral-700 bg-white">
            Tax Breakdown by HSN/SAC
          </div>
          <table className="w-full border-collapse text-[9px]">
            <thead>
              <tr className="border-b border-black font-bold text-black bg-white">
                <th rowSpan={2} className="border-r border-black p-0.5 text-center w-24">HSN/SAC</th>
                <th rowSpan={2} className="border-r border-black p-0.5 text-right w-28">Taxable Value</th>
                {invoice.isInterState ? (
                  <th colSpan={2} className="border-r border-black p-0.5 text-center">Integrated Tax (IGST)</th>
                ) : (
                  <>
                    <th colSpan={2} className="border-r border-black p-0.5 text-center">Central Tax (CGST)</th>
                    <th colSpan={2} className="border-r border-black p-0.5 text-center">State / UT Tax (SGST)</th>
                  </>
                )}
                <th rowSpan={2} className="p-0.5 text-right w-28">Total Tax Amount</th>
              </tr>
              <tr className="border-b border-black font-semibold text-neutral-800 bg-white">
                {invoice.isInterState ? (
                  <>
                    <th className="border-r border-black p-0.5 text-center w-14">Rate</th>
                    <th className="border-r border-black p-0.5 text-right w-20">Amount</th>
                  </>
                ) : (
                  <>
                    <th className="border-r border-black p-0.5 text-center w-14">Rate</th>
                    <th className="border-r border-black p-0.5 text-right w-20">Amount</th>
                    <th className="border-r border-black p-0.5 text-center w-14">Rate</th>
                    <th className="border-r border-black p-0.5 text-right w-20">Amount</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-black font-mono text-[8.5px]">
              {invoice.hsnSummary && invoice.hsnSummary.length > 0 ? (
                invoice.hsnSummary.map((hsn, idx) => (
                  <tr key={idx}>
                    <td className="border-r border-black p-0.5 text-center font-bold font-sans">{hsn.hsnSac}</td>
                    <td className="border-r border-black p-0.5 text-right font-bold">
                      {hsn.taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    {invoice.isInterState ? (
                      <>
                        <td className="border-r border-black p-0.5 text-center">{hsn.igstRate}%</td>
                        <td className="border-r border-black p-0.5 text-right">
                          {hsn.igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="border-r border-black p-0.5 text-center">{hsn.cgstRate}%</td>
                        <td className="border-r border-black p-0.5 text-right">
                          {hsn.cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="border-r border-black p-0.5 text-center">{hsn.sgstRate}%</td>
                        <td className="border-r border-black p-0.5 text-right">
                          {hsn.sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </>
                    )}
                    <td className="p-0.5 text-right font-bold">
                      {hsn.totalTaxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              ) : null}

              {/* Total HSN Row */}
              <tr className="border-t border-black font-black bg-white">
                <td className="border-r border-black p-0.5 text-center uppercase font-sans">Total</td>
                <td className="border-r border-black p-0.5 text-right">
                  {invoice.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                {invoice.isInterState ? (
                  <>
                    <td className="border-r border-black p-0.5 text-center">-</td>
                    <td className="border-r border-black p-0.5 text-right">
                      {invoice.igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="border-r border-black p-0.5 text-center">-</td>
                    <td className="border-r border-black p-0.5 text-right">
                      {invoice.cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="border-r border-black p-0.5 text-center">-</td>
                    <td className="border-r border-black p-0.5 text-right">
                      {invoice.sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </>
                )}
                <td className="p-0.5 text-right font-black">
                  {invoice.totalTaxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Tax in Words */}
          <div className="p-1 border-t border-black text-[9px] bg-white">
            <span className="font-bold text-neutral-700 uppercase">Tax Amount (in words): </span>
            <strong className="text-black font-serif font-black">{invoice.taxInWords}</strong>
          </div>
        </div>

        {/* Bank Details & Terms & Declaration & Signatures */}
        <div className="grid grid-cols-2 text-[9px]">
          {/* Left: Bank Details & Terms */}
          <div className="border-r border-black p-2 space-y-1.5">
            <div>
              <div className="font-bold text-black uppercase tracking-wider underline mb-0.5">
                Company Bank Details :
              </div>
              <div className="grid grid-cols-3 gap-0.5">
                <span className="text-neutral-700 font-semibold">Bank Name</span>
                <span className="col-span-2 font-bold text-black">: {invoice.company.bankName}</span>
              </div>
              <div className="grid grid-cols-3 gap-0.5">
                <span className="text-neutral-700 font-semibold">Branch</span>
                <span className="col-span-2 font-semibold text-black">: {invoice.company.branch}</span>
              </div>
              <div className="grid grid-cols-3 gap-0.5">
                <span className="text-neutral-700 font-semibold">A/c No.</span>
                <span className="col-span-2 font-mono font-black text-black">: {invoice.company.accountNo}</span>
              </div>
              <div className="grid grid-cols-3 gap-0.5">
                <span className="text-neutral-700 font-semibold">IFSC Code</span>
                <span className="col-span-2 font-mono font-bold text-black">: {invoice.company.ifscCode}</span>
              </div>
            </div>

            <div className="pt-1 border-t border-dashed border-neutral-300">
              <div className="font-bold text-black uppercase tracking-wider mb-0.5">Terms &amp; Conditions :</div>
              <ol className="list-decimal list-inside space-y-0.5 text-[8px] text-neutral-800 leading-tight">
                {invoice.company.terms && invoice.company.terms.length > 0 ? (
                  invoice.company.terms.map((t, i) => <li key={i}>{t}</li>)
                ) : (
                  <>
                    <li>Goods once sold will not be taken back.</li>
                    <li>Interest @ 18% p.a. will be charged for delayed payment.</li>
                    <li>Seller not responsible for in-transit damages.</li>
                    <li>Subject to local jurisdiction.</li>
                  </>
                )}
              </ol>
            </div>
          </div>

          {/* Right: Declaration & Stamp / Authorised Signatory */}
          <div className="p-2 flex flex-col justify-between space-y-2">
            <div>
              <div className="font-bold text-black uppercase tracking-wider mb-0.5">Declaration :</div>
              <p className="text-[8px] text-neutral-800 italic leading-tight">
                {invoice.company.declaration ||
                  'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.'}
              </p>
            </div>

            <div className="pt-1 flex flex-col items-end text-right">
              <div className="font-bold text-[9.5px] uppercase text-black">
                for <span className="font-black">{invoice.company.name}</span>
              </div>

              {/* Digital Stamp Seal */}
              <div className="my-1 mr-2 relative">
                <div className="w-24 h-14 border-2 border-dashed border-blue-600/40 rounded-full flex flex-col items-center justify-center p-1 text-blue-700 rotate-[-4deg] opacity-75 pointer-events-none">
                  <span className="text-[7px] font-black uppercase tracking-wider">{invoice.company.name}</span>
                  <span className="text-[6px] font-bold">SEAL &amp; SIGNED</span>
                  <span className="text-[6px] font-medium">{invoice.company.city}</span>
                </div>
              </div>

              <div className="text-[9px] font-bold text-black pt-1 border-t border-black w-44 text-center mt-0.5">
                Authorised Signatory
              </div>
            </div>
          </div>
        </div>

        {/* Footer Ribbon */}
        <div className="border-t border-black px-2 py-1 flex justify-between items-center text-[8px] text-neutral-700 bg-white">
          <div>
            <span>Receiver&apos;s Signature : ____________________</span>
          </div>
          <div className="font-medium italic">
            This is a Computer Generated Invoice
          </div>
        </div>
      </div>
    </div>
  )
}
