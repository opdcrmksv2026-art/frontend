import Link from "next/link"
import { Briefcase, Package, ArrowRight, CheckCircle2 } from "lucide-react"

export default function KitsPage() {
  const medicineKits = [
    { name: "Sugar Control Kit - 30 Days", duration: "30 Days", price: "₹1,500", items: "Sugar Ras, Jamun Powder, Karela Extract" },
    { name: "Kidney Stone Flush Kit", duration: "45 Days", price: "₹2,200", items: "Pashanbhed Kwath, Varunadi Vati, Gokshura Churna" },
    { name: "Gallstone Care & Liver Detox Kit", duration: "60 Days", price: "₹3,400", items: "Arogyavardhini Vati, Liv-52 Syrup, Punarnava Asava" },
    { name: "Joint Care & Ortho Relief Kit", duration: "30 Days", price: "₹1,850", items: "Shallaki Capsules, Yograj Guggulu, Ortho Pain Oil" }
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
              <Briefcase className="w-7 h-7 text-emerald-600" />
              Pre-Packaged Medicine Kits
            </h1>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              Standardized therapy combinations, dosage regimens &amp; quick-billing kits
            </p>
          </div>
          <span className="self-start sm:self-auto px-3.5 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 font-extrabold text-xs rounded-full">
            Standard OPD Formulations
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {medicineKits.map((k, i) => (
            <div key={i} className="bg-slate-50 hover:bg-slate-100/60 p-5 rounded-2xl border border-slate-100 transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="text-base font-black text-slate-800">{k.name}</h3>
                  <span className="px-2.5 py-1 bg-white font-mono font-black text-xs text-slate-800 rounded-lg border border-slate-200">
                    {k.price}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">Duration: {k.duration}</p>
                <p className="text-[11px] text-slate-400 mt-2 font-mono line-clamp-1">{k.items}</p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-200/60 flex justify-between items-center text-xs">
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> In OPD Stock
                </span>
                <Link href="/billing/new" className="text-slate-800 font-extrabold flex items-center gap-1 hover:underline">
                  Bill Kit <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
