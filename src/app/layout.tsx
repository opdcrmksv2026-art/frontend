import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'KSV CRM',
  description: 'Clinic Inventory & OPD CRM System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex h-screen flex-col bg-background overflow-hidden`}>
          <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden w-full">
            <Navigation />
            <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 bg-slate-50 relative w-full">
              <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none"></div>
              <div className="mx-auto max-w-[1400px] relative z-10 w-full">
                {children}
              </div>
            </div>
          </div>
      </body>
    </html>
  )
}
