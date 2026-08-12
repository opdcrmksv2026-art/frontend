"use client"

import React, { useState, useEffect } from 'react'
import { PartyProfile } from '@/types/kiybaBilling'
import { X, Users, Save } from 'lucide-react'

interface PartyModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (party: PartyProfile) => void
  initialData?: PartyProfile | null
}

export default function PartyModal({
  isOpen,
  onClose,
  onSave,
  initialData
}: PartyModalProps) {
  const [formData, setFormData] = useState<PartyProfile>({
    id: '',
    name: '',
    contactPerson: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: 'Himachal Pradesh',
    stateCode: '02',
    pincode: '',
    gstin: '',
    phone: '',
    email: '',
    transport: '',
    station: ''
  })

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    } else {
      setFormData({
        id: `party_${Date.now()}`,
        name: '',
        contactPerson: '',
        addressLine1: '',
        addressLine2: '',
        city: 'Solan',
        state: 'Himachal Pradesh',
        stateCode: '02',
        pincode: '173206',
        gstin: '',
        phone: '',
        email: '',
        transport: 'Direct',
        station: 'Sabathu (SOLAN)'
      })
    }
  }, [initialData, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    onSave({
      ...formData,
      id: formData.id || `party_${Date.now()}`
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">
                {initialData ? 'Edit Buyer / Party' : 'Add New Party / Customer'}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Party Name, GSTIN, Address &amp; Delivery Station
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
              Party / Buyer Business Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. KARAN SINGH VAIDH or Maxxi Pharma"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Contact Person
              </label>
              <input
                type="text"
                value={formData.contactPerson || ''}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="e.g. Dr. Karan Singh"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Party Mobile / Phone *
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="78076 22577"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Party GSTIN / UIN
              </label>
              <input
                type="text"
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
                placeholder="02DFBPS6121B2Z2"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 outline-none focus:border-blue-500 uppercase"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                State &amp; State Code *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="Himachal Pradesh"
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  required
                  value={formData.stateCode}
                  onChange={(e) => setFormData({ ...formData, stateCode: e.target.value })}
                  placeholder="02"
                  className="w-14 px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-center text-slate-800 outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
              Address Line 1 (Village/Street) *
            </label>
            <input
              type="text"
              required
              value={formData.addressLine1}
              onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
              placeholder="VILL- RADIYANA, PO SUBATHU"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Address Line 2 (Tehsil / District)
              </label>
              <input
                type="text"
                value={formData.addressLine2 || ''}
                onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                placeholder="TEH & DISTT - SOLAN"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                City / Pincode
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Solan"
                  className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  placeholder="173206"
                  className="w-20 px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-center text-slate-800 outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Preferred Transport / Courier
              </label>
              <input
                type="text"
                value={formData.transport || ''}
                onChange={(e) => setFormData({ ...formData, transport: e.target.value })}
                placeholder="e.g. Chandra Mangal Tpt Co."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Destination Station
              </label>
              <input
                type="text"
                value={formData.station || ''}
                onChange={(e) => setFormData({ ...formData, station: e.target.value })}
                placeholder="e.g. Sabathu (SOLAN)"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
              />
            </div>
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
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Save Party
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
