"use client"

import { useState, useEffect } from "react"
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Stethoscope,
  Activity,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck
} from "lucide-react"

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  // Login Form States
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  useEffect(() => {
    // Check if user is logged in
    const authStatus = localStorage.getItem("ksv_user_auth")
    if (authStatus === "true") {
      setIsAuthenticated(true)
    } else {
      setIsAuthenticated(false)
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccessMsg("")

    const cleanEmail = email.trim().toLowerCase()

    if (!cleanEmail || !password) {
      setError("Enter Username/Email & Password")
      return
    }

    setLoading(true)

    setTimeout(() => {
      // Validates admin credentials (admin / admin@ksv.com with admin123 or KSV@2026#Admin)
      if (
        (cleanEmail === "admin@ksv.com" || cleanEmail === "admin") &&
        (password === "admin123" || password === "KSV@2026#Admin" || password === "admin")
      ) {
        localStorage.setItem("ksv_user_auth", "true")
        localStorage.setItem("ksv_user_name", "Dr. Vikas Rajput")
        localStorage.setItem("ksv_user_role", "Chief Doctor")

        setSuccessMsg("Logging in...")
        setTimeout(() => {
          setIsAuthenticated(true)
          setLoading(false)
        }, 500)
      } else {
        setError("Invalid Username or Password. Please try again.")
        setLoading(false)
      }
    }, 400)
  }

  // While checking initial state
  if (isAuthenticated === null) {
    return (
      <div className="h-screen w-full bg-slate-50 flex flex-col items-center justify-center text-slate-600 space-y-3">
        <Activity className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs font-bold tracking-wider uppercase text-slate-400">Loading KSV Portal...</p>
      </div>
    )
  }

  // RENDER ATTRACTIVE, EXECUTIVE LOGIN PAGE
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-slate-100/90 flex items-center justify-center p-4 text-slate-700 relative overflow-hidden">
        
        {/* Soft Decorative Ambient Background Blurs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Clean Center Card Container */}
        <div className="w-full max-w-sm relative z-10">
          
          {/* Stunning Logo & Header Branding */}
          <div className="text-center mb-7 space-y-2">
            <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-blue-500/25 border-4 border-white">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>

            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase pt-1">
              KSV HEALTHCARE
            </h1>

            <div>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-blue-50 border border-blue-100 text-blue-600 font-extrabold text-[10px] uppercase tracking-wider rounded-full shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5" /> OPD &amp; Clinic Portal
              </span>
            </div>
          </div>

          {/* White Premium Login Box */}
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 space-y-5">
            
            {/* Error / Success Notifications */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              
              {/* Username Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Username / Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter username..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-blue-600 rounded-2xl outline-none text-xs font-bold text-slate-800 placeholder-slate-400 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-blue-600 rounded-2xl outline-none text-xs font-bold text-slate-800 placeholder-slate-400 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Activity className="w-4 h-4 animate-spin" /> Signing In...
                    </>
                  ) : (
                    <>
                      Sign In to Portal <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>

          {/* Footer Copyright */}
          <p className="text-center text-[10px] text-slate-400 mt-5 font-bold uppercase tracking-wider">
            © 2026 KSV Healthcare &amp; Ayurveda Portal
          </p>

        </div>

      </div>
    )
  }

  // RENDER APP CHILDREN IF AUTHENTICATED
  return <>{children}</>
}
