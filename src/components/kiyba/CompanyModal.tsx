"use client"

import React, { useState, useEffect } from 'react'
import { CompanyProfile } from '@/types/kiybaBilling'
import { X, Building2, Save, Check } from 'lucide-react'

interface CompanyModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (company: CompanyProfile) => void
  initialData?: CompanyProfile | null
}

export default function CompanyModal({
  isOpen,
  onClose,
  onSave,
  initialData
}: CompanyModalProps) {
  const [formData, setFormData] = useState<CompanyProfile>({
    id: '',
    name: '',
    tagline: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: 'Himachal Pradesh',
    stateCode: '02',
    pincode: '',
    gstin: '',
    pan: '',
    email: '',
    phone: '',
    bankName: 'HDFC Bank',
    branch: '',
    accountNo: '',
    ifscCode: '',
    declaration:
      'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
    terms: [
      'Goods once sold will not be taken back.',
      'Interest @ 18% p.a. for delayed payment.',
      'Seller is not responsible for any loss or damage in transit.',
      'Subject to local jurisdiction only.'
    ]
  })

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    } else {
      setFormData({
        id: `comp_${Date.now()}`,
        name: '',
        tagline: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: 'Himachal Pradesh',
        stateCode: '02',
        pincode: '',
        gstin: '',
        pan: '',
        email: '',
        phone: '',
        bankName: 'State Bank of India',
        branch: 'Solan',
        accountNo: '',
        ifscCode: '',
        declaration:
          'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
        terms: [
          'Goods once sold will not be taken back.',
          'Interest @ 18% p.a. for delayed payment.',
          'Seller is not responsible for in-transit damages.'
        ]
      })
    }
  }, [initialData, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    onSave({
      ...formData,
      id: formData.id || `comp_${Date.now()}`
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">
                {initialData ? 'Edit Company Profile' : 'Create New Company (Tally Style)'}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Company Details, GSTIN, Address &amp; Bank Settings
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

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Company Name & Tagline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Company / Firm Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. KIYAVA or NATIONAL BOTTLE HOUSE"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Tagline / Business Nature
              </label>
              <input
                type="text"
                value={formData.tagline || ''}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="e.g. Ayurvedic Raw Material Supplies"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* GSTIN, PAN & Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                GSTIN / UIN *
              </label>
              <input
                type="text"
                required
                value={formData.gstin}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase()
                  const stCode = val.substring(0, 2)
                  setFormData({
                    ...formData,
                    gstin: val,
                    stateCode: /^\d{2}$/.test(stCode) ? stCode : formData.stateCode
                  })
                }}
                placeholder="02DFBPS6121B1Z3"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 outline-none focus:border-emerald-500 uppercase"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                State Name &amp; Code *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="Himachal Pradesh"
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  required
                  value={formData.stateCode}
                  onChange={(e) => setFormData({ ...formData, stateCode: e.target.value })}
                  placeholder="02"
                  className="w-14 px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-center text-slate-800 outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Mobile / Phone *
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="78076 22577"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Address Details */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Address Line 1 *
              </label>
              <input
                type="text"
                required
                value={formData.addressLine1}
                onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                placeholder="Upper Thari, Near M.G. Steel Hardware"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:border-emerald-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Address Line 2 / Chowk / Area
                </label>
                <input
                  type="text"
                  value={formData.addressLine2 || ''}
                  onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                  placeholder="Subathu Main Road, Subathu Chowk"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  City &amp; Pincode *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Solan"
                    className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    required
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="173206"
                    className="w-20 px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-center text-slate-800 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Email & PAN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Company Email
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="karansinghvaidh@gmail.com"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                PAN No.
              </label>
              <input
                type="text"
                value={formData.pan || ''}
                onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                placeholder="DFBPS6121B"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 outline-none focus:border-emerald-500 uppercase"
              />
            </div>
          </div>

          {/* Bank Details Section */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              Bank Details (for Invoice Payment)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">Bank Name</label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="State Bank of India / HDFC"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">Branch</label>
                <input
                  type="text"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  placeholder="Subathu Branch, Solan"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-800 outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">Account Number</label>
                <input
                  type="text"
                  value={formData.accountNo}
                  onChange={(e) => setFormData({ ...formData, accountNo: e.target.value })}
                  placeholder="38920194821"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono font-bold text-slate-800 outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">IFSC Code</label>
                <input
                  type="text"
                  value={formData.ifscCode}
                  onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                  placeholder="SBIN0001234"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono font-bold text-slate-800 outline-none focus:border-emerald-500 uppercase"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
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
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Save Company
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
