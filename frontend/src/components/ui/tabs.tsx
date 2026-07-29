'use client'

import { forwardRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface TabsProps {
  defaultValue: string
  value?: string
  onValueChange?: (_value: string) => void
  children: React.ReactNode | ((_props: { activeValue: string; onValueChange: (_val: string) => void }) => React.ReactNode)
  className?: string
}

function Tabs({ defaultValue, value, onValueChange, children, className }: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue)
  const activeValue = value !== undefined ? value : internalValue

  const handleChange = (val: string) => {
    if (onValueChange) {
      onValueChange(val)
    } else {
      setInternalValue(val)
    }
  }

  return (
    <div className={className} data-active={activeValue}>
      {typeof children === 'function'
        ? (children as any)({ activeValue, onValueChange: handleChange })
        : children}
    </div>
  )
}

interface TabsListProps {
  children: React.ReactNode
  className?: string
  activeValue?: string
  onValueChange?: (_value: string) => void
}

const TabsList = forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex h-10 items-center justify-center rounded-xl bg-muted p-1 text-muted-foreground',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
TabsList.displayName = 'TabsList'

interface TabsTriggerProps {
  value: string
  children: React.ReactNode
  className?: string
  activeValue?: string
  onValueChange?: (_value: string) => void
}

const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, children, activeValue, onValueChange, ...props }, ref) => {
    const isActive = activeValue === value
    return (
      <button
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          className
        )}
        onClick={() => onValueChange?.(value)}
        {...props}
      >
        {isActive && (
          <motion.div
            layoutId="tab-indicator"
            className="absolute inset-0 rounded-lg bg-background shadow-sm"
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
        <span className="relative z-10">{children}</span>
      </button>
    )
  }
)
TabsTrigger.displayName = 'TabsTrigger'

interface TabsContentProps {
  value: string
  children: React.ReactNode
  className?: string
  activeValue?: string
}

const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, children, activeValue, ...props }, ref) => {
    if (activeValue !== value) return null
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className={cn('mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', className)}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
TabsContent.displayName = 'TabsContent'

export { Tabs, TabsList, TabsTrigger, TabsContent }
