import { Users, IndianRupee, Package, Truck } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-700">
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          { title: "Total Patients", value: "1,244", change: "+12.5%", isPositive: true, icon: Users, color: "from-blue-500 to-cyan-400", bg: "bg-blue-50", text: "text-blue-600" },
          { title: "Today's Revenue", value: "₹45,200", change: "+5.2%", isPositive: true, icon: IndianRupee, color: "from-emerald-500 to-teal-400", bg: "bg-emerald-50", text: "text-emerald-600" },
          { title: "OPD Stock", value: "850 units", change: "-2.1%", isPositive: false, icon: Package, color: "from-amber-500 to-orange-400", bg: "bg-orange-50", text: "text-orange-600" },
          { title: "Pending Transfers", value: "12", change: "+2", isPositive: true, icon: Truck, color: "from-purple-500 to-pink-400", bg: "bg-purple-50", text: "text-purple-600" }
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between hover:-translate-y-1 hover:shadow-[0_20px_40px_rgb(16,185,129,0.08)] transition-all duration-300 group cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-5 rounded-full blur-2xl -mr-10 -mt-10 transition-opacity group-hover:opacity-10"></div>
            
            <div className="flex justify-between items-start mb-6">
              <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.text} flex items-center justify-center shadow-sm`}>
                <stat.icon strokeWidth={2.5} className="w-7 h-7" />
              </div>
              <span className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide shadow-sm ${stat.isPositive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' : 'bg-red-50 text-red-600 border border-red-100/50'}`}>
                {stat.change}
              </span>
            </div>
            <div>
              <p className="text-slate-500 font-semibold text-sm tracking-wide">{stat.title}</p>
              <h3 className="text-3xl font-black text-slate-800 mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Analytics Graph */}
        <div className="xl:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-8 relative z-10">
            <div>
              <h3 className="text-2xl font-bold text-slate-800">Patient Onboarding Trends</h3>
              <p className="text-slate-500 text-sm font-medium mt-1">Daily new vs repeat patients over the last week.</p>
            </div>
            <div className="flex gap-6 bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-100">
               <span className="flex items-center gap-2 text-sm font-bold text-slate-600">
                 <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></div> New
               </span>
               <span className="flex items-center gap-2 text-sm font-bold text-slate-600">
                 <div className="w-3.5 h-3.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50"></div> Repeat
               </span>
            </div>
          </div>
          
          <div className="flex-1 relative w-full h-[320px] mt-6 pb-8">
            {/* Y-Axis labels */}
            <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-xs font-black text-slate-300">
              <span>50</span>
              <span>40</span>
              <span>30</span>
              <span>20</span>
              <span>10</span>
              <span>0</span>
            </div>
            
            {/* Graph Area */}
            <div className="absolute left-10 right-0 top-2 bottom-8">
               {/* Grid lines */}
               <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0">
                 {[...Array(6)].map((_, i) => (
                   <div key={i} className="w-full border-b-2 border-slate-50 flex-1"></div>
                 ))}
               </div>
               
               {/* Bars */}
               <div className="absolute inset-0 flex justify-between items-end px-2 sm:px-8 z-10">
                  {[
                    { day: "Mon", newP: 35, repeatP: 15 },
                    { day: "Tue", newP: 42, repeatP: 22 },
                    { day: "Wed", newP: 28, repeatP: 18 },
                    { day: "Thu", newP: 50, repeatP: 30 },
                    { day: "Fri", newP: 38, repeatP: 25 },
                    { day: "Sat", newP: 20, repeatP: 12 },
                    { day: "Sun", newP: 15, repeatP: 8 },
                  ].map((data, i) => (
                    <div key={i} className="flex flex-col items-center group cursor-pointer w-10 sm:w-14 h-full justify-end relative">
                      {/* Tooltip */}
                      <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs font-bold py-1.5 px-3 rounded-xl pointer-events-none z-20 whitespace-nowrap shadow-xl">
                         {data.newP + data.repeatP} Total
                      </div>
                      
                      {/* Bar Group */}
                      <div className="flex gap-1.5 sm:gap-2 items-end w-full justify-center h-full relative">
                        {/* New Patient Bar */}
                        <div 
                          className="w-3 sm:w-4 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-full relative group-hover:brightness-110 group-hover:-translate-y-1 transition-all duration-300 shadow-md shadow-emerald-500/20"
                          style={{ height: `${(data.newP / 50) * 100}%` }}
                        ></div>
                        {/* Repeat Patient Bar */}
                        <div 
                          className="w-3 sm:w-4 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-full relative group-hover:brightness-110 group-hover:-translate-y-1 transition-all duration-300 shadow-md shadow-indigo-500/20"
                          style={{ height: `${(data.repeatP / 50) * 100}%` }}
                        ></div>
                      </div>
                      
                      {/* X-Axis Label */}
                      <span className="absolute -bottom-8 text-xs font-black text-slate-400 group-hover:text-slate-700 transition-colors">{data.day}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>

        {/* Inventory Status & Actions */}
        <div className="space-y-8">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <h3 className="text-2xl font-bold text-slate-800 mb-8">Stock Alerts</h3>
            <div className="space-y-6">
              {[
                { name: "Gallstone Kit", percent: 85, color: "bg-emerald-500", text: "text-emerald-600" },
                { name: "Joint Pain Kit", percent: 45, color: "bg-amber-500", text: "text-amber-600" },
                { name: "Kidney Stone Kit", percent: 15, color: "bg-red-500", text: "text-red-600" },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm font-bold mb-3">
                    <span className="text-slate-700">{item.name}</span>
                    <span className={item.text}>{item.percent}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div className={`h-full ${item.color} rounded-full relative overflow-hidden`} style={{ width: `${item.percent}%` }}>
                      <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 py-3 rounded-xl border-2 border-slate-100 text-slate-600 font-bold hover:border-slate-200 hover:bg-slate-50 transition-all">
              View Detailed Inventory
            </button>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-[#047857] rounded-[2.5rem] p-8 shadow-[0_20px_40px_rgb(4,120,87,0.2)] text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-20 rounded-full blur-2xl -mr-10 -mt-10"></div>
             <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <Truck className="w-6 h-6 text-white" />
             </div>
             <h3 className="text-2xl font-bold mb-2 relative z-10">Pending Transfers</h3>
             <p className="text-emerald-50 font-medium text-sm mb-8 relative z-10">12 kits are in transit from the Plant and awaiting your confirmation.</p>
             <button className="w-full bg-white text-emerald-800 text-base font-black py-4 rounded-2xl shadow-lg hover:shadow-xl hover:bg-emerald-50 hover:-translate-y-1 transition-all relative z-10 flex items-center justify-center gap-2">
               Accept Shipment
             </button>
          </div>
        </div>

      </div>
    </div>
  )
}
