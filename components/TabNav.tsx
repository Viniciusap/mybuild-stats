'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Monitor, Wrench } from 'lucide-react'
import { clsx } from 'clsx'

const tabs = [
  { href: '/', label: 'DASHBOARD', icon: Monitor },
  { href: '/automations', label: 'AUTOMATIONS', icon: Wrench },
]

export default function TabNav() {
  const path = usePathname()

  return (
    <nav className="flex items-center gap-1 px-3 md:px-5 pt-3 border-b border-cyber-border/60">
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = href === '/' ? path === '/' : path.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold tracking-widest rounded-t border border-b-0 transition-colors',
              active
                ? 'text-cyber-cyan border-cyber-border bg-cyber-panel'
                : 'text-cyber-text-dim border-transparent hover:text-cyber-text hover:border-cyber-border/40'
            )}
          >
            <Icon size={11} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
