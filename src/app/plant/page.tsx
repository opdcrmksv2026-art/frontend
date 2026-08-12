import { Factory, Truck, CheckCircle2, Package } from "lucide-react"

export default function PlantPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)] space-y-6">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Factory className="w-7 h-7 text-emerald-600" />
              Manufacturing Plant Inventory
            </h1>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              Production status, raw material batches &amp; dispatch logs
            </p>
          </div>
          <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 font-extrabold text-xs rounded-full">
            Plant Status: Operational
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase">Ready Bulk Batches</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">1,450 Units</h3>
          </div>
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase">In-Transit to OPD</p>
            <h3 className="text-2xl font-black text-blue-600 mt-1">12 Kits</h3>
          </div>
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase">Raw Material Reserves</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">88% Capacity</h3>
          </div>
        </div>
      </div>
    </div>
  )
}
