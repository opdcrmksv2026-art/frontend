"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function NewPatientPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    uniqueId: "",
    name: "",
    address: "",
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
      // Calling our Next.js API route or Express backend
      // In this setup, we call the Express backend running on 5000
      const res = await fetch("http://localhost:5000/api/patients/register", {
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
      router.push("/")
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">New Patient Onboarding</h1>
        <p className="text-muted-foreground mt-2">Register a new patient and optionally link a referral.</p>
      </div>

      <div className="bg-card border shadow-sm rounded-xl overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Unique ID (Aadhar/Mobile) *</label>
              <input
                required
                name="uniqueId"
                value={formData.uniqueId}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-background border rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="Enter unique ID"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Patient Name *</label>
              <input
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-background border rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="Enter full name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-background border rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="Enter age"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-background border rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">WhatsApp Number</label>
              <input
                name="whatsappNumber"
                value={formData.whatsappNumber}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-background border rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="+91..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Calling Number</label>
              <input
                name="callingNumber"
                value={formData.callingNumber}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-background border rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="Phone number"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Address</label>
              <input
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-background border rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="Full address"
              />
            </div>
          </div>

          <hr className="border-border my-8" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Agent Token (Optional)</label>
              <input
                name="agentToken"
                value={formData.agentToken}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-background border rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="e.g. TK-102"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Referred By (Patient ID - Optional)</label>
              <input
                name="referredByUniqueId"
                value={formData.referredByUniqueId}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-background border rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="Referrer's Unique ID"
              />
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-primary/90 transition-all focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                "Registering..."
              ) : (
                "Register Patient"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
