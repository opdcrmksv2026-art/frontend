"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, 
  User, 
  Fingerprint, 
  Calendar, 
  Activity, 
  Phone, 
  MessageSquare, 
  Home, 
  MapPin, 
  Map, 
  Tag, 
  Key, 
  Users,
  CheckCircle2
} from "lucide-react"

export default function NewPatientPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    uniqueId: "",
    name: "",
    houseNumber: "",
    galiNumber: "",
    state: "",
    pincode: "",
    age: "",
    gender: "Male",
    whatsappNumber: "",
    callingNumber: "",
    agentToken: "",
    referredByUniqueId: "",
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      const res = await fetch(`${API_URL}/api/patients/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          age: formData.age ? parseInt(formData.age) : null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to register patient")
      }

      alert("Patient registered successfully!")
      router.push("/patients")
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-4 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-700 w-full pb-16">
      
      {/* Navigation & Header */}
      <div className="mb-6">
        <Link 
          href="/patients" 
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Patients Directory
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-medium">
            {error}
          </div>
        )}

        {/* 2-Column Desktop Grid for Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT COLUMN: Personal & Contact */}
          <div className="space-y-8">
            
            {/* Card 1: Personal Details */}
            <div className="bg-white rounded-[2rem] p-6 border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.01)] space-y-6">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-3">
                <User className="w-5 h-5 text-primary" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Fingerprint className="w-3.5 h-3.5 text-slate-400" />
                    Unique ID (Aadhar/Mobile) *
                  </label>
                  <input
                    required
                    name="uniqueId"
                    value={formData.uniqueId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-2 border-slate-50 focus:border-primary/20 rounded-2xl outline-none transition-all text-sm font-semibold text-slate-700"
                    placeholder="Enter ID number"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Patient Name *
                  </label>
                  <input
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-2 border-slate-50 focus:border-primary/20 rounded-2xl outline-none transition-all text-sm font-semibold text-slate-700"
                    placeholder="Enter full name"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Age
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-2 border-slate-50 focus:border-primary/20 rounded-2xl outline-none transition-all text-sm font-semibold text-slate-700"
                    placeholder="Enter age"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-slate-400" />
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border-2 border-slate-50 focus:border-primary/20 rounded-2xl outline-none transition-all text-sm font-bold text-slate-600 cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Card 2: Contact Details */}
            <div className="bg-white rounded-[2rem] p-6 border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.01)] space-y-6">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-3">
                <Phone className="w-5 h-5 text-primary" />
                Contact Details
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                    WhatsApp Number
                  </label>
                  <input
                    name="whatsappNumber"
                    value={formData.whatsappNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-2 border-slate-50 focus:border-primary/20 rounded-2xl outline-none transition-all text-sm font-semibold text-slate-700"
                    placeholder="e.g. +91 99999..."
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    Calling Number
                  </label>
                  <input
                    name="callingNumber"
                    value={formData.callingNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-2 border-slate-50 focus:border-primary/20 rounded-2xl outline-none transition-all text-sm font-semibold text-slate-700"
                    placeholder="e.g. 99999..."
                  />
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Address & Referral */}
          <div className="space-y-8">
            
            {/* Card 3: Address Details */}
            <div className="bg-white rounded-[2rem] p-6 border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.01)] space-y-6">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-3">
                <MapPin className="w-5 h-5 text-primary" />
                Address Details
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 text-slate-400" />
                    House / Flat Number
                  </label>
                  <input
                    name="houseNumber"
                    value={formData.houseNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-2 border-slate-50 focus:border-primary/20 rounded-2xl outline-none transition-all text-sm font-semibold text-slate-700"
                    placeholder="e.g. 102, Ground Floor"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    Gali Number / Street
                  </label>
                  <input
                    name="galiNumber"
                    value={formData.galiNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-2 border-slate-50 focus:border-primary/20 rounded-2xl outline-none transition-all text-sm font-semibold text-slate-700"
                    placeholder="e.g. Gali No. 4"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Map className="w-3.5 h-3.5 text-slate-400" />
                    State
                  </label>
                  <input
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-2 border-slate-50 focus:border-primary/20 rounded-2xl outline-none transition-all text-sm font-semibold text-slate-700"
                    placeholder="e.g. Delhi"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    Pin Code
                  </label>
                  <input
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-2 border-slate-50 focus:border-primary/20 rounded-2xl outline-none transition-all text-sm font-semibold text-slate-700"
                    placeholder="e.g. 110001"
                  />
                </div>
              </div>
            </div>

            {/* Card 4: Referrals */}
            <div className="bg-white rounded-[2rem] p-6 border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.01)] space-y-6">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-3">
                <Users className="w-5 h-5 text-primary" />
                Referral Details (Optional)
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-slate-400" />
                    Agent Token
                  </label>
                  <input
                    name="agentToken"
                    value={formData.agentToken}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-2 border-slate-50 focus:border-primary/20 rounded-2xl outline-none transition-all text-sm font-semibold text-slate-700"
                    placeholder="e.g. TK-102"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    Referred By (Patient ID)
                  </label>
                  <input
                    name="referredByUniqueId"
                    value={formData.referredByUniqueId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-2 border-slate-50 focus:border-primary/20 rounded-2xl outline-none transition-all text-sm font-semibold text-slate-700"
                    placeholder="Referrer's ID"
                  />
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Submit button bar */}
        <div className="pt-6">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-primary text-primary-foreground font-bold py-4 px-6 rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base select-none cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            {loading ? "Registering Patient..." : "Register Patient Profile"}
          </button>
        </div>
      </form>
    </div>
  )
}
