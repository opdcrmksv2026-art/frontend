import Link from "next/link"
import { Users, ShieldCheck, Stethoscope, UserCheck, Key, Lock } from "lucide-react"

export default function UsersPage() {
  const staffUsers = [
    { name: "Dr. Vikas Rajput", role: "Chief Doctor & Administrator", access: "Full Superadmin Access", status: "Active" },
    { name: "OPD Billing Desk", role: "Reception & Billing Specialist", access: "Billing, Patients, Invoices", status: "Active" },
    { name: "Pharmacy Store Manager", role: "Inventory & Dispatch Controller", access: "Inventory, Stock Registers, Manufacturing", status: "Active" }
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
              <Users className="w-7 h-7 text-indigo-600" />
              Staff &amp; Role Management
            </h1>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              Authorized clinical personnel, OPD desk accounts, and role permissions
            </p>
          </div>
          <span className="self-start sm:self-auto px-3.5 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 font-extrabold text-xs rounded-full">
            Role-Based Access
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {staffUsers.map((u, i) => (
            <div key={i} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">{u.name}</h3>
                  <p className="text-xs text-indigo-600 font-bold mt-0.5">{u.role}</p>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">{u.access}</p>
                </div>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full">
                  {u.status}
                </span>
                <span className="text-slate-400 font-mono text-[10px] flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Secure PIN
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
