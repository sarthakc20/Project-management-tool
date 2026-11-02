import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { ProjectStatus } from '@/types'
import { PROJECT_BOARD_COLUMNS } from '@/lib/workflow'

export type ThemePreference = 'light' | 'dark' | 'system'
export type ProjectView = 'table' | 'board' | 'calendar' | 'timeline'
export type TaskView = 'table' | 'board'

interface SessionState {
  /**
   * Simulated signed-in user. The role switcher changes this.
   * TODO(AUTH): Replace simulated user selection with company SSO and authenticated sessions.
   */
  currentUserId: string
  theme: ThemePreference
  sidebarCollapsed: boolean
  projectView: ProjectView
  taskView: TaskView
  hiddenProjectColumns: string[]
  /** Status columns shown on project status boards (rendered in lifecycle order). */
  boardStatuses: ProjectStatus[]
  boardHideEmpty: boolean
  /** Recently used comment colours, newest first, e.g. 'text:blue', 'bg:yellow'. */
  recentTextStyles: string[]
  setCurrentUser: (id: string) => void
  setTheme: (theme: ThemePreference) => void
  toggleSidebar: () => void
  setProjectView: (view: ProjectView) => void
  setTaskView: (view: TaskView) => void
  toggleProjectColumn: (column: string) => void
  setBoardStatuses: (statuses: ProjectStatus[]) => void
  setBoardHideEmpty: (hide: boolean) => void
  pushRecentTextStyle: (style: string) => void
}

/** Prototype preferences persisted in localStorage (key shared with the inline theme script in index.html). */
export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      currentUserId: 'u_rufus',
      theme: 'system',
      sidebarCollapsed: false,
      projectView: 'table',
      taskView: 'table',
      hiddenProjectColumns: [],
      boardStatuses: PROJECT_BOARD_COLUMNS,
      boardHideEmpty: true,
      recentTextStyles: [],
      pushRecentTextStyle: (style) => set((s) => ({ recentTextStyles: [style, ...s.recentTextStyles.filter((x) => x !== style)].slice(0, 5) })),
      setBoardStatuses: (boardStatuses) => set({ boardStatuses }),
      setBoardHideEmpty: (boardHideEmpty) => set({ boardHideEmpty }),
      setCurrentUser: (currentUserId) => set({ currentUserId }),
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setProjectView: (projectView) => set({ projectView }),
      setTaskView: (taskView) => set({ taskView }),
      toggleProjectColumn: (column) =>
        set((s) => ({
          hiddenProjectColumns: s.hiddenProjectColumns.includes(column)
            ? s.hiddenProjectColumns.filter((c) => c !== column)
            : [...s.hiddenProjectColumns, column],
        })),
    }),
    {
      name: 'ecom-workspace:prefs',
      version: 1,
      storage: createJSONStorage(() => {
        try {
          return localStorage
        } catch {
          // Storage blocked (private mode / sandbox): fall back to memory.
          const mem = new Map<string, string>()
          return {
            getItem: (k: string) => mem.get(k) ?? null,
            setItem: (k: string, v: string) => void mem.set(k, v),
            removeItem: (k: string) => void mem.delete(k),
          }
        }
      }),
    },
  ),
)
