import Link from "next/link"
import { Stethoscope, Plus, ArrowRight, Activity, BookOpen } from "lucide-react"

export default function DiseasesPage() {
  const commonDiseases = [
    { name: "Asthma & Respiratory Care", category: "Pulmonology", kitsCount: 3 },
    { name: "Kidney Stones & Renal Detox", category: "Nephrology", kitsCount: 2 },
    { name: "Gallstones & Liver Wellness", category: "Hepatology", kitsCount: 4 },
    { name: "Joint Pain & Arthritis Relief", category: "Orthopedics", kitsCount: 3 },
    { name: "Diabetes & Sugar Balance", category: "Endocrinology", kitsCount: 2 },
    { name: "Digestive Care & Acidity Relief", category: "Gastroenterology", kitsCount: 5 }
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
              <Stethoscope className="w-7 h-7 text-indigo-600" />
              Diseases &amp; Treatment Master
            </h1>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              Curated clinical diseases, therapeutic protocols &amp; ayurvedic formulation mappings
            </p>
          </div>
          <span className="self-start sm:self-auto px-3.5 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 font-extrabold text-xs rounded-full">
            Ayurveda Protocols Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {commonDiseases.map((d, i) => (
            <div key={i} className="bg-slate-50 hover:bg-slate-100/60 p-5 rounded-2xl border border-slate-100 transition-all flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-indigo-500 tracking-wider">
                  {d.category}
                </span>
                <h3 className="text-base font-black text-slate-800 mt-1">{d.name}</h3>
              </div>
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-200/60 text-xs">
                <span className="text-slate-500 font-bold">{d.kitsCount} Associated Kits</span>
                <Link href="/billing/new" className="text-indigo-600 font-bold flex items-center gap-1 hover:underline">
                  Prescribe <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
