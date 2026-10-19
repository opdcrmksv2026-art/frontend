import Link from "next/link"
import { Pill, ShoppingBag, ArrowRight, Clock, CheckCircle2, FileText } from "lucide-react"

export default function OrdersPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
              <Pill className="w-7 h-7 text-emerald-600" />
              Medicine Orders &amp; Dispatches
            </h1>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              Track medicine orders, clinic dispatches, and patient prescription fulfillments
            </p>
          </div>
          <span className="self-start sm:self-auto px-3.5 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 font-extrabold text-xs rounded-full">
            Active Fulfillment
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase">Today's Orders</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">28 Orders</h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 24 Dispatched
            </p>
          </div>
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase">Awaiting Courier Dispatch</p>
            <h3 className="text-2xl font-black text-blue-600 mt-1">4 Parcels</h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Ready for pickup
            </p>
          </div>
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase">Fulfillment Rate</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">98.5%</h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-1">Same-day turnaround</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100/60 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
          <div>
            <h4 className="font-black text-slate-800 text-sm">Create New Patient Order or Invoice</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Prescribe medicines, add custom dosage kits, and print official tax invoices.
            </p>
          </div>
          <Link
            href="/billing/new"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <FileText className="w-4 h-4" /> Create Invoice <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
