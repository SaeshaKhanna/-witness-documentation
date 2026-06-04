'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Case, Memory, Notification } from '@/lib/types'
import { timeAgo } from '@/lib/utils'
import toast from 'react-hot-toast'

interface AppContextValue {
  user: User | null
  cases: Case[]
  currentCase: Case | null
  memories: Memory[]
  notifications: Notification[]
  unreadCount: number
  aiPanelOpen: boolean
  setAiPanelOpen: (open: boolean) => void
  setCurrentCase: (c: Case) => void
  loadCases: () => Promise<void>
  loadMemories: (caseId: string) => Promise<void>
  pushNotification: (title: string, message: string, type: Notification['type']) => void
  markAllRead: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children, user }: { children: ReactNode; user: User | null }) {
  const supabase = createClient()
  const [cases, setCases] = useState<Case[]>([])
  const [currentCase, setCurrentCaseState] = useState<Case | null>(null)
  const [memories, setMemories] = useState<Memory[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [aiPanelOpen, setAiPanelOpen] = useState(false)

  // Load notifications from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('witness_notifications')
      if (stored) setNotifications(JSON.parse(stored))
    } catch {
      // ignore
    }
  }, [])

  const saveNotifications = useCallback((notifs: Notification[]) => {
    setNotifications(notifs)
    try {
      localStorage.setItem('witness_notifications', JSON.stringify(notifs))
    } catch {
      // ignore
    }
  }, [])

  const pushNotification = useCallback(
    (title: string, message: string, type: Notification['type']) => {
      const notif: Notification = {
        id: crypto.randomUUID(),
        type,
        title,
        message,
        read: false,
        timestamp: new Date().toISOString(),
      }
      setNotifications((prev) => {
        const next = [notif, ...prev].slice(0, 50)
        try {
          localStorage.setItem('witness_notifications', JSON.stringify(next))
        } catch {
          // ignore
        }
        return next
      })
    },
    []
  )

  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }))
      try {
        localStorage.setItem('witness_notifications', JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  const loadMemories = useCallback(
    async (caseId: string) => {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false })
      if (error) {
        toast.error('Failed to load memories')
        return
      }
      setMemories(data ?? [])
    },
    [supabase]
  )

  const setCurrentCase = useCallback(
    async (c: Case) => {
      setCurrentCaseState(c)
      await loadMemories(c.id)
    },
    [loadMemories]
  )

  const loadCases = useCallback(async () => {
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .order('updated_at', { ascending: false })
    if (error) {
      toast.error('Failed to load cases')
      return
    }
    const loaded = data ?? []
    setCases(loaded)
    if (loaded.length > 0 && !currentCase) {
      await setCurrentCase(loaded[0])
    }
  }, [supabase, currentCase, setCurrentCase])

  useEffect(() => {
    if (user) {
      loadCases()
      pushNotification('Signed in', 'Welcome back. Your session is encrypted and active.', 'signin')
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <AppContext.Provider
      value={{
        user,
        cases,
        currentCase,
        memories,
        notifications,
        unreadCount,
        aiPanelOpen,
        setAiPanelOpen,
        setCurrentCase,
        loadCases,
        loadMemories,
        pushNotification,
        markAllRead,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
