import Link from "next/link"
import { Users, UserPlus, ShieldCheck, ArrowRight, Award } from "lucide-react"

export default function AgentsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
              <Users className="w-7 h-7 text-blue-600" />
              Field Agents &amp; Mediators
            </h1>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              Manage field medical representatives, tokens, referral agents, and patient acquisition
            </p>
          </div>
          <span className="self-start sm:self-auto px-3.5 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 font-extrabold text-xs rounded-full">
            Agent Network
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase">Registered Mediators</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">14 Agents</h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Active field representatives</p>
          </div>
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase">Assigned Patients</p>
            <h3 className="text-2xl font-black text-blue-600 mt-1">320 Patients</h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Referred through agents</p>
          </div>
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase">Referral System</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">Integrated</h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Direct OPD counter tracking</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
          <div>
            <h4 className="font-black text-slate-800 text-sm">View Patient Referrals Directory</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect all patient-to-patient and agent-to-patient referrals and loyalty points.
            </p>
          </div>
          <Link
            href="/patients/referrals"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" /> Open Referrals <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
