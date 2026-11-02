import { create } from 'zustand'
import type { Database } from '@/types'
import { createSeedDatabase } from '@/data'

/**
 * In-memory mock database. Components subscribe to slices for reactivity; all writes go
 * through `services/api.ts` so that the write path matches a future API client.
 *
 * Data intentionally resets on reload (only preferences are persisted).
 * TODO(BACKEND): Replace mock data with the production API and persistent database.
 * TODO(REALTIME): Add server-side synchronization or WebSocket updates for team collaboration;
 * incoming events should patch this cache (or a query cache such as TanStack Query).
 * TODO(BACKUPS): Production data needs scheduled backups and point-in-time restore — not a
 * frontend concern, but list it in the infrastructure checklist.
 */
export const useDb = create<Database>()(() => createSeedDatabase())

export const db = {
  get: () => useDb.getState(),
  set: (updater: (state: Database) => Partial<Database>) => useDb.setState(updater),
  reset: () => useDb.setState(createSeedDatabase(), true),
}
