import Link from "next/link"
import { FileText, TrendingUp, DollarSign, Calendar, ArrowRight, BarChart3, Download } from "lucide-react"

export default function ReportsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
              <FileText className="w-7 h-7 text-indigo-600" />
              Financial &amp; Clinical Reports
            </h1>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              OPD daily collections, monthly tax summaries, disease distributions, and stock analytics
            </p>
          </div>
          <span className="self-start sm:self-auto px-3.5 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 font-extrabold text-xs rounded-full">
            Real-Time Analytics
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase">Billing &amp; Payments</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">Audit Ready</h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">GST &amp; Non-GST ledger separation</p>
          </div>
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase">Inventory Movement</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">Live Register</h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Kiyava, KSV &amp; Maxxi Pharma synced</p>
          </div>
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase">Patient Footfall</p>
            <h3 className="text-2xl font-black text-blue-600 mt-1">Active OPD</h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Repeat vs new patient tracking</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between">
            <div>
              <h4 className="font-black text-slate-800 text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" /> Payment &amp; Collections Ledger
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                View all generated invoices, cash vs online splits, GST calculations and print official vouchers.
              </p>
            </div>
            <Link
              href="/billing/payments"
              className="mt-4 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-between"
            >
              <span>View Payments Ledger</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between">
            <div>
              <h4 className="font-black text-slate-800 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" /> Live Inventory Stock Register
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Real-time stock register tracking opening balances, purchases, OPD sales, and manufacturing logs.
              </p>
            </div>
            <Link
              href="/inventory/maxxi-pharma"
              className="mt-4 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-between"
            >
              <span>View Stock Register</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
