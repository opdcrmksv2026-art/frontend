import Link from "next/link"
import { Settings, Building2, ShieldCheck, Database, HardDrive, RefreshCw } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
              <Settings className="w-7 h-7 text-slate-700" />
              System &amp; Clinic Configuration
            </h1>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              Clinic letterhead branding, default tax states, GSTIN numbers &amp; backup preferences
            </p>
          </div>
          <span className="self-start sm:self-auto px-3.5 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 font-extrabold text-xs rounded-full">
            Clinic Portal v2.0
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase">
              <Building2 className="w-4 h-4 text-emerald-600" /> Clinic State
            </div>
            <h3 className="text-lg font-black text-slate-800 mt-2">Himachal Pradesh</h3>
            <p className="text-[11px] text-slate-400 mt-1">State Code: 02 (Default Intra-state)</p>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase">
              <Database className="w-4 h-4 text-blue-600" /> Database Sync
            </div>
            <h3 className="text-lg font-black text-slate-800 mt-2">MongoDB Cluster</h3>
            <p className="text-[11px] text-slate-400 mt-1">Real-time cloud database backup</p>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase">
              <HardDrive className="w-4 h-4 text-purple-600" /> Local Storage Cache
            </div>
            <h3 className="text-lg font-black text-slate-800 mt-2">Instant 0ms Load</h3>
            <p className="text-[11px] text-slate-400 mt-1">Offline-first resilience enabled</p>
          </div>
        </div>

        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
          <h4 className="font-black text-slate-800 text-sm">Company Profiles &amp; GST Configuration</h4>
          <p className="text-xs text-slate-500 mt-1">
            To edit bank details, GSTIN, PAN, terms &amp; conditions for invoices, visit the company profiles section in the inventory module.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <Link
              href="/inventory/maxxi-pharma"
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 shadow-xs transition-all"
            >
              Maxxi Pharma Settings
            </Link>
            <Link
              href="/inventory/ksv"
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 shadow-xs transition-all"
            >
              KSV Pharmacy Settings
            </Link>
            <Link
              href="/inventory/kiyava"
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 shadow-xs transition-all"
            >
              Kiyava Herbals Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
