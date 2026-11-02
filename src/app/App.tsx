import { lazy, type ComponentType } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useApplyTheme } from '@/hooks/useTheme'
import { AppShell } from './AppShell'

/** Route-level code splitting for named page exports. */
function page<K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) {
  const Component = lazy<ComponentType>(() => load().then((m) => ({ default: m[name] as ComponentType })))
  return <Component />
}

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: page(() => import('@/pages/DashboardPage'), 'DashboardPage') },
      { path: '/my-work', element: page(() => import('@/pages/MyWorkPage'), 'MyWorkPage') },
      { path: '/inbox', element: page(() => import('@/pages/InboxPage'), 'InboxPage') },
      { path: '/clients', element: page(() => import('@/pages/ClientsPage'), 'ClientsPage') },
      { path: '/clients/:clientId', element: page(() => import('@/pages/ClientDetailPage'), 'ClientDetailPage') },
      { path: '/projects', element: page(() => import('@/pages/ProjectsPage'), 'ProjectsPage') },
      { path: '/projects/:projectId', element: page(() => import('@/pages/ProjectDetailPage'), 'ProjectDetailPage') },
      { path: '/tasks/mine', element: page(() => import('@/pages/MyTasksPage'), 'MyTasksPage') },
      { path: '/bugs', element: page(() => import('@/pages/BugsPage'), 'BugsPage') },
      { path: '/calendar', element: page(() => import('@/pages/CalendarPage'), 'CalendarPage') },
      { path: '/timeline', element: page(() => import('@/pages/TimelinePage'), 'TimelinePage') },
      { path: '/departments/:department', element: page(() => import('@/pages/DepartmentPage'), 'DepartmentPage') },
      { path: '/qi', element: page(() => import('@/pages/QIPage'), 'QIPage') },
      { path: '/cro', element: page(() => import('@/pages/CROPage'), 'CROPage') },
      { path: '/experiments', element: page(() => import('@/pages/ExperimentsPage'), 'ExperimentsPage') },
      { path: '/admin/team', element: page(() => import('@/pages/admin/TeamPage'), 'TeamPage') },
      { path: '/admin/workflows', element: page(() => import('@/pages/admin/WorkflowsPage'), 'WorkflowsPage') },
      { path: '/admin/templates', element: page(() => import('@/pages/admin/TemplatesPage'), 'TemplatesPage') },
      { path: '/settings', element: page(() => import('@/pages/admin/SettingsPage'), 'SettingsPage') },
      { path: '*', element: page(() => import('@/pages/NotFoundPage'), 'NotFoundPage') },
    ],
  },
])

export function App() {
  const dark = useApplyTheme()
  return (
    <TooltipProvider delayDuration={300}>
      <RouterProvider router={router} />
      <Toaster
        theme={dark ? 'dark' : 'light'}
        position="bottom-right"
        closeButton
        toastOptions={{
          classNames: {
            toast: '!bg-surface !text-foreground !border-border !shadow-lg !text-[13px]',
            description: '!text-muted-foreground',
            actionButton: '!bg-primary !text-primary-foreground',
          },
        }}
      />
    </TooltipProvider>
  )
}
