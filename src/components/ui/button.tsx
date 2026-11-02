import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Slot } from 'radix-ui'
import { cn } from '@/lib/utils'

const variants = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-hover shadow-xs',
  secondary: 'bg-surface text-foreground border border-border-strong hover:bg-accent shadow-xs',
  ghost: 'text-foreground hover:bg-accent',
  subtle: 'bg-muted text-foreground hover:bg-accent',
  destructive: 'bg-destructive text-destructive-foreground hover:opacity-90 shadow-xs',
  'destructive-ghost': 'text-tone-red-fg hover:bg-tone-red-bg',
  link: 'text-primary underline-offset-4 hover:underline px-0 h-auto',
} as const

const sizes = {
  xs: 'h-6 px-2 text-xs gap-1 rounded-md',
  sm: 'h-7 px-2.5 text-[13px] gap-1.5 rounded-md',
  md: 'h-8 px-3 text-[13px] gap-1.5 rounded-md',
  lg: 'h-9 px-4 text-sm gap-2 rounded-lg',
  icon: 'h-8 w-8 rounded-md',
  'icon-sm': 'h-7 w-7 rounded-md',
  'icon-xs': 'h-6 w-6 rounded',
} as const

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
  asChild?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', asChild, type, ...props }, ref) => {
    const Comp = asChild ? Slot.Root : 'button'
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : (type ?? 'button')}
        className={cn(
          'inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition-colors select-none',
          'disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'
