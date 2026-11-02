import { useEffect } from 'react'
import { create } from 'zustand'

export interface Crumb {
  label: string
  to?: string
}

interface UIState {
  breadcrumbs: Crumb[]
  searchOpen: boolean
  mobileNavOpen: boolean
  createProject: { open: boolean; clientId?: string; editId?: string; templateId?: string }
  createTask: { open: boolean; projectId?: string; parentTaskId?: string; status?: string }
  setBreadcrumbs: (c: Crumb[]) => void
  setSearchOpen: (open: boolean) => void
  setMobileNavOpen: (open: boolean) => void
  openCreateProject: (opts?: { clientId?: string; editId?: string; templateId?: string }) => void
  closeCreateProject: () => void
  openCreateTask: (opts?: { projectId?: string; parentTaskId?: string; status?: string }) => void
  closeCreateTask: () => void
}

/** Transient UI state (not persisted). */
export const useUI = create<UIState>()((set) => ({
  breadcrumbs: [],
  searchOpen: false,
  mobileNavOpen: false,
  createProject: { open: false },
  createTask: { open: false },
  setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
  openCreateProject: (opts) => set({ createProject: { open: true, ...opts } }),
  closeCreateProject: () => set({ createProject: { open: false } }),
  openCreateTask: (opts) => set({ createTask: { open: true, ...opts } }),
  closeCreateTask: () => set({ createTask: { open: false } }),
}))

/** Pages call this to populate the top-bar breadcrumb trail. */
export function useBreadcrumbs(crumbs: Crumb[]) {
  const setBreadcrumbs = useUI((s) => s.setBreadcrumbs)
  const key = JSON.stringify(crumbs)
  useEffect(() => {
    setBreadcrumbs(JSON.parse(key))
  }, [key, setBreadcrumbs])
}
