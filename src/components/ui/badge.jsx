import * as React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
        outline: 'text-foreground',
        success: 'border-transparent bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400',
        warning: 'border-transparent bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400',
        info: 'border-transparent bg-sky-50 text-sky-800 dark:bg-sky-500/15 dark:text-sky-400',
        finance: 'border-transparent bg-indigo-50 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300',
        sales: 'border-transparent bg-teal-50 text-teal-800 dark:bg-teal-500/15 dark:text-teal-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
