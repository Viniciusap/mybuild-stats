import type { Metadata } from 'next'
import './globals.css'
import TabNav from '@/components/TabNav'

export const metadata: Metadata = {
  title: 'MyBuild Stats',
  description: 'Hardware monitor, upgrade radar & price tracker',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-cyber-bg antialiased">
        <TabNav />
        {children}
      </body>
    </html>
  )
}
