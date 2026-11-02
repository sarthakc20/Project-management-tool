import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { Tooltip } from '@/components/ui/tooltip'
import { useCan } from '@/hooks/useData'
import type { Permission, RestrictionMode } from '@/lib/permissions'

/**
 * Renders children according to the simulated role.
 * - mode="hide": nothing is rendered when the role lacks permission.
 * - mode="disable": the control is rendered disabled with a lock icon and an explanation,
 *   so reviewers can see the action exists but is restricted for this role.
 * TODO(RBAC): Enforce permissions on the backend; frontend checks are only for UI behavior.
 */
export function Gate({
  permission,
  mode = 'disable',
  children,
  fallback = null,
}: {
  permission: Permission
  mode?: RestrictionMode
  children: ReactElement<{ disabled?: boolean; children?: ReactNode; 'aria-disabled'?: boolean }>
  fallback?: ReactNode
}) {
  const { allowed, reason } = useCan(permission)
  if (allowed) return children
  if (mode === 'hide') return <>{fallback}</>
  if (!isValidElement(children)) return null
  return (
    <Tooltip content={reason}>
      <span className="inline-flex cursor-not-allowed" tabIndex={0} aria-label={reason}>
        {cloneElement(children, {
          disabled: true,
          'aria-disabled': true,
          children: (
            <>
              <Lock className="size-3.5 opacity-70" aria-hidden />
              {children.props.children}
            </>
          ),
        })}
      </span>
    </Tooltip>
  )
}

/** Inline notice explaining why a section is read-only for the current role. */
export function RestrictedNotice({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-border-strong bg-surface-2 px-3 py-2 text-xs text-muted-foreground">
      <Lock className="size-3.5 shrink-0" />
      {children}
    </div>
  )
}
