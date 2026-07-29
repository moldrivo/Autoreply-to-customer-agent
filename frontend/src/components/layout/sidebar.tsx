'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { useAuthStore } from '@/stores/auth-store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import {
  LayoutDashboard,
  MessageSquare,
  // Send,
  Mic,
  BarChart3,
  Shield,
  Settings,
  Sun,
  Moon,
  X,
  Bot,
} from 'lucide-react'
import { useEffect, useState } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/reviews', label: 'Reviews', icon: MessageSquare },
  // { href: '/replies', label: 'Replies', icon: Send },
  { href: '/brand', label: 'Brand Voice', icon: Mic },
  { href: '/agent', label: 'Agent', icon: Bot },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin', label: 'Admin', icon: Shield },
  { href: '/settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const user = useAuthStore((s) => s.user)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-6 py-5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-sky-600 text-white text-sm font-bold">
            A
          </div>
          <span className="bg-gradient-to-r from-emerald-500 to-sky-500 bg-clip-text text-lg font-bold text-transparent dark:from-emerald-400 dark:to-sky-400">
            AutoReply AI
          </span>
        </Link>
        <button onClick={onClose} className="rounded-lg p-1 hover:bg-accent lg:hidden">
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onClose()}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-sky-600 dark:bg-sky-400"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            <AvatarImage src="" />
            <AvatarFallback className="text-xs">{user ? getInitials(user.full_name) : 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {user?.full_name || 'User'}
            </p>
            <p className="truncate text-xs text-neutral-500">{user?.email || 'user@example.com'}</p>
          </div>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-lg p-1.5 hover:bg-accent transition-colors"
          >
            {mounted && theme === 'dark' ? (
              <Sun className="h-4 w-4 text-neutral-400" />
            ) : (
              <Moon className="h-4 w-4 text-neutral-500" />
            )}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-1 flex-col border-r bg-background">{sidebarContent}</div>
      </aside>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          >
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-background shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {sidebarContent}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
