import Link from "next/link"
import { MessagesSquare, Send, CheckCheck, Clock, Users } from "lucide-react"

export default function WhatsAppPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
              <MessagesSquare className="w-7 h-7 text-emerald-600" />
              WhatsApp Reminders &amp; Patient Messaging
            </h1>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              Automated medicine schedule alerts, dosage reminders, and follow-up consultation notifications
            </p>
          </div>
          <span className="self-start sm:self-auto px-3.5 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 font-extrabold text-xs rounded-full">
            WhatsApp Gateway Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase">Follow-Up Reminders Sent</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">142 Messages</h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <CheckCheck className="w-3.5 h-3.5" /> 99% Delivery Rate
            </p>
          </div>
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase">Pending Scheduled Alerts</p>
            <h3 className="text-2xl font-black text-blue-600 mt-1">18 Queue</h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Scheduled for today
            </p>
          </div>
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase">Direct Patient Link</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">Enabled</h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">1-click WhatsApp web trigger</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
          <div>
            <h4 className="font-black text-slate-800 text-sm">Review Scheduled Follow-Up Dates</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Check patients due for checkups and send personalized WhatsApp alerts with a single click.
            </p>
          </div>
          <Link
            href="/patients/followups"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Clock className="w-4 h-4" /> Open Follow-Ups <Send className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
