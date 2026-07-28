"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Search, Menu, X, LayoutDashboard, Users, FileText, 
  Pill, Package, Factory, Stethoscope, Briefcase, MessagesSquare, 
  Settings, Send, ChevronDown, Hexagon, UserPlus,
  type LucideIcon
} from 'lucide-react'

// Types
type NavItem = {
  name: string
  href?: string
  icon: LucideIcon
  badge?: { text: string; color: string }
  subItems?: { name: string; href: string; badge?: { text: string; color: string } }[]
}

type NavGroup = {
  label: string
  items: NavItem[]
}

// Data Structure
const navigationGroups: NavGroup[] = [
  {
    label: "Main",
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { 
        name: 'Patients', 
        icon: Users,
        subItems: [
          { name: 'New Patient', href: '/patients/new' },
          { name: 'Patient List', href: '/patients' },
          { name: 'Patient History', href: '/patients/history' },
          { name: 'Follow Ups', href: '/patients/followups', badge: { text: '22', color: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' } },
          { name: 'Referral Patients', href: '/patients/referrals' }
        ]
      },

      {
        name: 'Billing',
        icon: FileText,
        subItems: [
          { name: 'Create Invoice', href: '/billing/new' },
          { name: 'Orders', href: '/billing/orders' },
          { name: 'Payments', href: '/billing/payments' },
          { name: 'Refunds', href: '/billing/refunds' }
        ]
      },
      { name: 'Medicine Orders', href: '/orders', icon: Pill },
      {
        name: 'Inventory',
        icon: Package,
        badge: { text: '5', color: 'bg-rose-500/20 text-rose-400 border border-rose-500/20' },
        subItems: [
          { name: 'Medicine Stock', href: '/inventory/medicine' },
          { name: 'Plant', href: '/inventory/plant' },
          { name: 'Transfers', href: '/inventory/transfers', badge: { text: '12', color: 'bg-blue-500/20 text-blue-400 border border-blue-500/20' } },
          { name: 'Low Stock', href: '/inventory/low-stock' },
          { name: 'Expiry', href: '/inventory/expiry' }
        ]
      }
    ]
  },
  {
    label: "Operations",
    items: [
      { name: 'Manufacturing Plant', href: '/plant', icon: Factory },
      { name: 'OPD Inventory', href: '/opd-inventory', icon: Package },
      { name: 'Transfers', href: '/transfers', icon: Send },
      { name: 'Diseases', href: '/diseases', icon: Stethoscope },
      { name: 'Medicine Kits', href: '/kits', icon: Briefcase }
    ]
  },
  {
    label: "CRM",
    items: [
      { name: 'Agents', href: '/agents', icon: Users },
      { name: 'Patient Referrals', href: '/referrals', icon: UserPlus },
      { name: 'WhatsApp', href: '/whatsapp', icon: MessagesSquare, badge: { text: '18', color: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20' } },
      { name: 'Reports', href: '/reports', icon: FileText }
    ]
  },
  {
    label: "System",
    items: [
      { name: 'Users', href: '/users', icon: Users },
      { name: 'Settings', href: '/settings', icon: Settings }
    ]
  }
]

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    'Patients': true,
  })
  const pathname = usePathname()

  const toggleMenu = (name: string) => {
    setExpandedMenus(prev => ({ ...prev, [name]: !prev[name] }))
  }

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between bg-[#0B1220] text-white p-4 border-b border-white/5 relative z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
             <Hexagon className="w-5 h-5 text-white fill-emerald-500/50" />
          </div>
          <h2 className="text-lg font-bold tracking-tight">Karan Singh Vaidh</h2>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="text-slate-400 hover:text-white transition-colors">
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0B1220]/80 backdrop-blur-md z-40 md:hidden" 
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex flex-col bg-[#0B1220] border-r border-white/[0.05] shadow-2xl md:shadow-none
        transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
        md:relative w-[300px] shrink-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Subtle glass layered background */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

        {/* 1. Logo Area */}
        <div className="p-6 pb-4 relative z-10 shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-white/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Hexagon className="w-6 h-6 text-white fill-emerald-300/30 drop-shadow-md" />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-white tracking-tight leading-tight">Karan Singh Vaidh</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-widest">Enterprise CRM</p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Global Search */}
        <div className="px-5 mb-4 relative z-10 shrink-0">
          <div className="relative group cursor-pointer">
            <div className="absolute inset-0 bg-white/5 rounded-xl border border-white/5 group-hover:border-white/10 group-hover:bg-white/10 transition-colors" />
            <div className="flex items-center justify-between px-3 py-2.5 relative">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                <span className="text-sm font-medium text-slate-400 group-hover:text-slate-200 transition-colors">Search...</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold text-slate-400 bg-black/40 rounded border border-white/10">⌘</kbd>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold text-slate-400 bg-black/40 rounded border border-white/10">K</kbd>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 relative z-10 custom-scrollbar space-y-8">
          {navigationGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                {group.label}
              </p>
              <div className="flex flex-col space-y-0.5">
                {group.items.map((item) => {
                  const isGroupActive = item.href ? pathname === item.href : item.subItems?.some(sub => pathname === sub.href)
                  const isExpanded = expandedMenus[item.name]
                  const Icon = item.icon

                  return (
                    <div key={item.name} className="flex flex-col">
                      {item.href ? (
                        <Link
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className="relative block group outline-none"
                        >
                          {/* Active Indicator & Background */}
                          {isGroupActive && (
                            <motion.div 
                              layoutId="activeNavIndicator"
                              className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent rounded-2xl border border-blue-500/20"
                            />
                          )}
                          {isGroupActive && (
                            <motion.div 
                              layoutId="activeNavLeftBorder"
                              className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-blue-500 rounded-r-full shadow-[0_0_12px_rgba(59,130,246,0.8)]"
                            />
                          )}
                          {!isGroupActive && (
                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                          )}

                          <div className="flex items-center justify-between px-3 py-3 relative z-10">
                            <div className="flex items-center gap-3">
                              <Icon className={`w-[22px] h-[22px] transition-all duration-300 ${isGroupActive ? 'text-blue-400 drop-shadow-md' : 'text-slate-400 group-hover:text-slate-200 group-hover:scale-110'}`} strokeWidth={isGroupActive ? 2.5 : 2} />
                              <span className={`text-sm font-semibold transition-colors ${isGroupActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                                {item.name}
                              </span>
                            </div>
                            {item.badge && (
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${item.badge.color}`}>
                                {item.badge.text}
                              </span>
                            )}
                          </div>
                        </Link>
                      ) : (
                        <button 
                          onClick={() => toggleMenu(item.name)}
                          className="relative w-full group outline-none cursor-pointer"
                        >
                          {/* Active Indicator & Background */}
                          {isGroupActive && !isExpanded && (
                            <motion.div 
                              layoutId="activeNavIndicator"
                              className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent rounded-2xl border border-blue-500/10"
                            />
                          )}
                          {isGroupActive && !isExpanded && (
                            <motion.div 
                              layoutId="activeNavLeftBorder"
                              className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-blue-500/50 rounded-r-full"
                            />
                          )}
                          <div className={`absolute inset-0 rounded-2xl transition-opacity ${isExpanded ? 'bg-white/5 opacity-100' : 'bg-white/5 opacity-0 group-hover:opacity-100'}`} />

                          <div className="flex items-center justify-between px-3 py-3 relative z-10">
                            <div className="flex items-center gap-3">
                              <Icon className={`w-[22px] h-[22px] transition-all duration-300 ${isGroupActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200 group-hover:scale-110'}`} strokeWidth={isGroupActive ? 2.5 : 2} />
                              <span className={`text-sm font-semibold transition-colors ${isGroupActive || isExpanded ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                                {item.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {item.badge && !isExpanded && (
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${item.badge.color}`}>
                                  {item.badge.text}
                                </span>
                              )}
                              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
                            </div>
                          </div>
                        </button>
                      )}

                      {/* Submenus */}
                      <AnimatePresence initial={false}>
                        {item.subItems && isExpanded && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="flex flex-col pl-[22px] py-1 space-y-1 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-px before:bg-white/10">
                              {item.subItems.map(subItem => {
                                const isSubActive = pathname === subItem.href
                                return (
                                  <Link
                                    key={subItem.name}
                                    href={subItem.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex items-center justify-between px-3 py-2 text-sm font-medium transition-all rounded-xl relative group ${
                                      isSubActive ? 'text-blue-400 bg-white/5' : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`w-[5px] h-[5px] rounded-full transition-colors ${isSubActive ? 'bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-transparent group-hover:bg-slate-600'}`} />
                                      {subItem.name}
                                    </div>
                                    {subItem.badge && (
                                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${subItem.badge.color}`}>
                                        {subItem.badge.text}
                                      </span>
                                    )}
                                  </Link>
                                )
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}


        </div>

        {/* 4. User Profile */}
        <div className="p-4 relative z-10 shrink-0 border-t border-white/5 bg-black/20 backdrop-blur-md">
          <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-white/5 cursor-pointer transition-colors group">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4" alt="Dr. Admin" className="w-10 h-10 rounded-full border-2 border-[#0B1220] group-hover:border-slate-700 transition-colors" />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#0B1220] rounded-full" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-tight group-hover:text-blue-400 transition-colors">Dr. Vikas</p>
                <p className="text-[11px] text-slate-400 font-medium">Administrator</p>
              </div>
            </div>
            <Settings className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors group-hover:rotate-90 duration-300" />
          </div>
        </div>



      </aside>
    </>
  )
}
