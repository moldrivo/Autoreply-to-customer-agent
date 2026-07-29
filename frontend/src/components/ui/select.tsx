'use client'

import { forwardRef, useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, Search, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  options: SelectOption[]
  value?: string
  onChange?: (_value: string) => void
  placeholder?: string
  className?: string
  searchable?: boolean
  label?: string
  error?: string
}

const Select = forwardRef<HTMLDivElement, SelectProps>(
  ({ options, value, onChange, placeholder = 'Select...', className, searchable, label, error }, _ref) => {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const containerRef = useRef<HTMLDivElement>(null)

    const filtered = searchable
      ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
      : options

    const selected = options.find((o) => o.value === value)

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false)
        }
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
      <div ref={containerRef} className="relative w-full">
        {label && (
          <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {label}
          </label>
        )}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            error && 'border-red-500',
            className
          )}
        >
          <span className={cn(!selected && 'text-muted-foreground')}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 opacity-50 transition-transform duration-200',
              open && 'rotate-180'
            )}
          />
        </button>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 mt-1 w-full min-w-[12rem] overflow-hidden rounded-xl border bg-popover p-1 shadow-lg"
            >
              {searchable && (
                <div className="flex items-center border-b px-2 pb-1 mb-1">
                  <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  <input
                    className="flex h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                  />
                </div>
              )}
              <div className="max-h-60 overflow-auto">
                {filtered.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">No options found</div>
                ) : (
                  filtered.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={cn(
                        'relative flex w-full cursor-default select-none items-center rounded-lg px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground',
                        value === option.value && 'bg-accent font-medium text-accent-foreground'
                      )}
                      onClick={() => {
                        onChange?.(option.value)
                        setOpen(false)
                        setSearch('')
                      }}
                    >
                      <span className="flex-1 text-left">{option.label}</span>
                      {value === option.value && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }
)
Select.displayName = 'Select'

export { Select, type SelectOption }
