import { Suspense, useEffect } from 'react'
import { Skeleton } from '@/components/ui/display'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar, MobileNav } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { GlobalSearch } from '@/components/layout/GlobalSearch'
import { TaskDetailSheet } from '@/components/tasks/TaskDetailSheet'
import { ProjectFormDialog } from '@/components/forms/ProjectFormDialog'
import { TaskFormDialog } from '@/components/forms/TaskFormDialog'

export function AppShell() {
  const { pathname } = useLocation()
  useEffect(() => {
    document.getElementById('main')?.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="flex min-h-screen bg-background">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:shadow-md">
        Skip to content
      </a>
      <Sidebar />
      <MobileNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main id="main" className="min-w-0 flex-1" tabIndex={-1}>
          <Suspense
            fallback={
              <div className="space-y-3 px-6 py-6" aria-busy="true" aria-label="Loading page">
                <Skeleton className="h-6 w-56" />
                <Skeleton className="h-4 w-80" />
                <Skeleton className="mt-6 h-64 w-full" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
      <GlobalSearch />
      <TaskDetailSheet />
      <ProjectFormDialog />
      <TaskFormDialog />
    </div>
  )
}
