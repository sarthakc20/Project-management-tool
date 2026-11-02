import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const control =
  'w-full rounded-md border border-input bg-surface px-2.5 text-[13px] text-foreground shadow-xs transition-colors placeholder:text-subtle-foreground hover:border-border-strong focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-destructive'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(control, 'h-8', className)} {...props} />
))
Input.displayName = 'Input'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(control, 'min-h-[80px] py-2 leading-relaxed', className)} {...props} />
))
Textarea.displayName = 'Textarea'

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...props }, ref) => (
  <div className={cn('relative', className)}>
    <select ref={ref} className={cn(control, 'h-8 appearance-none pr-7')} {...props}>
      {children}
    </select>
    <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
  </div>
))
Select.displayName = 'Select'

export function Label({ children, htmlFor, className, required }: { children: ReactNode; htmlFor?: string; className?: string; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className={cn('mb-1 block text-xs font-medium text-muted-foreground', className)}>
      {children}
      {required && <span className="ml-0.5 text-tone-red-fg">*</span>}
    </label>
  )
}

/** Label + control + hint/error, wiring ids for accessibility. */
export function Field({
  label,
  required,
  error,
  hint,
  className,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  hint?: string
  className?: string
  children: (props: { id: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }) => ReactNode
}) {
  const id = useId()
  const descId = error || hint ? `${id}-desc` : undefined
  return (
    <div className={className}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': descId })}
      {error ? (
        <p id={descId} className="mt-1 text-xs text-tone-red-fg">
          {error}
        </p>
      ) : hint ? (
        <p id={descId} className="mt-1 text-xs text-subtle-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export function Checkbox({
  checked,
  onChange,
  label,
  className,
  disabled,
  indeterminate,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  className?: string
  disabled?: boolean
  indeterminate?: boolean
}) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      checked={checked}
      disabled={disabled}
      ref={(el) => {
        if (el) el.indeterminate = Boolean(indeterminate)
      }}
      onChange={(e) => onChange(e.target.checked)}
      onClick={(e) => e.stopPropagation()}
      className={cn('size-3.5 cursor-pointer rounded border-input accent-[var(--primary)]', className)}
    />
  )
}

/** Segmented control used for view switchers. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string; icon?: ReactNode }[]
  label: string
  className?: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('inline-flex rounded-lg border border-border bg-muted p-0.5', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium text-muted-foreground transition-colors [&_svg]:size-3.5',
            value === o.value ? 'bg-surface text-foreground shadow-xs' : 'hover:text-foreground',
          )}
        >
          {o.icon}
          <span className="max-sm:sr-only">{o.label}</span>
        </button>
      ))}
    </div>
  )
}
