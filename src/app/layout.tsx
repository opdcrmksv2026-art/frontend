import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'
import AuthProvider from '@/components/AuthProvider'

const inter = Inter({ subsets: ['latin'] })
export const metadata: Metadata = {
  title: 'KSV CRM',
  description: 'Clinic Inventory & OPD CRM System',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex h-screen flex-col bg-background overflow-hidden print:h-auto print:overflow-visible print:bg-white`}>
        <AuthProvider>
          <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden w-full print:block print:h-auto print:overflow-visible">
            <Navigation />
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 bg-slate-50 relative w-full custom-scrollbar print:overflow-visible print:p-0 print:block print:h-auto print:bg-white">
              <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none print:hidden"></div>
              <div className="w-full relative z-10">
                {children}
              </div>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
