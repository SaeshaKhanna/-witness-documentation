'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useApp } from '@/context/AppContext'
import AiPanel from '@/components/AiPanel'
import MemoryModal from '@/components/memory/MemoryModal'
import toast from 'react-hot-toast'
import { escHtml } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: 'ph-squares-four' },
  { href: '/memory-map', label: 'Memory Map', icon: 'ph-graph' },
  { href: '/vault', label: 'Evidence Vault', icon: 'ph-vault' },
  { href: '/reports', label: 'Legal Reports', icon: 'ph-file-doc' },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { user, cases, currentCase, setCurrentCase, loadCases, aiPanelOpen, setAiPanelOpen, unreadCount, pushNotification } = useApp()
  const [avatarMenu, setAvatarMenu] = useState(false)
  const [memoryModalOpen, setMemoryModalOpen] = useState(false)
  const [newCaseName, setNewCaseName] = useState('')
  const avatarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function createCase() {
    const name = prompt('Enter a case name (e.g. "Case #004 — Workplace"):')
    if (!name?.trim() || !user) return
    const { data, error } = await supabase
      .from('cases')
      .insert({ user_id: user.id, name: name.trim(), status: 'active' })
      .select()
      .single()
    if (error) { toast.error('Could not create case: ' + error.message); return }
    pushNotification('Case file created', `"${data.name}" is ready for documentation.`, 'case')
    await loadCases()
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '?'

  const palette = ['teal', 'amber', 'rose']

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `70px 240px 1fr ${aiPanelOpen ? '360px' : '0px'}`,
      height: '100vh',
      width: '100vw',
      position: 'relative',
      zIndex: 1,
      transition: 'grid-template-columns 0.4s var(--ease)',
    }}>
      {/* Background noise / orbs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")", opacity: 0.35 }} />
      <div style={{ position: 'fixed', width: 600, height: 600, top: -200, left: -100, borderRadius: '50%', background: 'radial-gradient(circle,rgba(45,212,191,0.07),transparent 70%)', filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none', animation: 'drift 20s ease-in-out infinite alternate' }} />
      <div style={{ position: 'fixed', width: 500, height: 500, bottom: -100, right: -100, borderRadius: '50%', background: 'radial-gradient(circle,rgba(167,139,250,0.08),transparent 70%)', filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none', animation: 'drift 20s ease-in-out infinite alternate', animationDelay: '-10s' }} />

      {/* RAIL */}
      <nav style={{ gridColumn: 1, background: 'var(--ink-2)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', gap: 6, zIndex: 20 }}>
        {/* Logo */}
        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,var(--teal),#0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, color: '#fff', marginBottom: 18, boxShadow: '0 0 20px rgba(45,212,191,0.3)' }}>
          <i className="ph ph-shield-check" />
        </div>

        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href} style={{ position: 'relative', width: 42, height: 42, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, color: active ? 'var(--teal)' : 'var(--text-3)', background: active ? 'var(--teal-dim)' : 'transparent', transition: 'all 0.18s', textDecoration: 'none' }} title={item.label}>
              {active && <span style={{ position: 'absolute', left: -1, top: '50%', transform: 'translateY(-50%)', width: 3, height: 18, background: 'var(--teal)', borderRadius: '0 2px 2px 0' }} />}
              <i className={`ph ${item.icon}`} />
            </Link>
          )
        })}

        <div style={{ width: 28, height: 1, background: 'var(--border)', margin: '6px 0' }} />

        <button onClick={() => setAiPanelOpen(!aiPanelOpen)} title="AI Assistant" style={{ width: 42, height: 42, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, color: aiPanelOpen ? 'var(--teal)' : 'var(--text-3)', background: aiPanelOpen ? 'var(--teal-dim)' : 'transparent' }}>
          <i className="ph ph-sparkle" />
        </button>

        {/* Bottom */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <Link href="/notifications" title="Notifications" style={{ position: 'relative', width: 42, height: 42, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, color: 'var(--text-3)', textDecoration: 'none' }}>
            <i className="ph ph-bell" />
            {unreadCount > 0 && <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: 'var(--rose)' }} />}
          </Link>
          <Link href="/settings" title="Settings" style={{ width: 42, height: 42, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, color: 'var(--text-3)', textDecoration: 'none' }}>
            <i className="ph ph-gear" />
          </Link>

          {/* Avatar */}
          <div ref={avatarRef} style={{ position: 'relative' }}>
            <div onClick={() => setAvatarMenu(!avatarMenu)} style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#7c3aed,var(--rose))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer', position: 'relative' }}>
              {initials}
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 8, height: 8, background: '#22c55e', borderRadius: '50%', border: '2px solid var(--ink-2)' }} />
            </div>

            {avatarMenu && (
              <div style={{ position: 'fixed', bottom: 70, left: 78, background: 'var(--ink-4)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-md)', padding: 6, zIndex: 500, minWidth: 160, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-3)', borderBottom: '1px solid var(--border)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.email}
                </div>
                <button onClick={signOut} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 6, fontSize: 13, color: 'var(--rose)', cursor: 'pointer', width: '100%' }}>
                  <i className="ph ph-sign-out" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* SIDEBAR */}
      <aside style={{ gridColumn: 2, background: 'var(--ink-2)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top */}
        <div style={{ padding: '20px 20px 0', flexShrink: 0 }}>
          {/* Search */}
          <div style={{ padding: '0 8px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--ink-3)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '9px 14px' }}>
              <i className="ph ph-magnifying-glass" style={{ color: 'var(--text-3)', fontSize: 15 }} />
              <input type="text" placeholder="Search cases, memories…" style={{ background: 'none', border: 'none', flex: 1, fontSize: 13, color: 'var(--text-1)' }} />
            </div>
          </div>

          {/* Nav */}
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10, padding: '0 8px' }}>Navigation</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 8px' }}>
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href
              return (
                <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 'var(--r-sm)', fontSize: 14, color: active ? 'var(--text-1)' : 'var(--text-2)', background: active ? 'var(--ink-3)' : 'transparent', border: `1px solid ${active ? 'var(--border-2)' : 'transparent'}`, textDecoration: 'none', transition: 'all 0.18s' }}>
                  <i className={`ph ${item.icon}`} style={{ fontSize: 17, width: 20, textAlign: 'center' }} />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Cases */}
        <div style={{ padding: '16px 20px 8px', flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Case files</div>
        </div>
        <div style={{ padding: '0 8px 8px', flexShrink: 0 }}>
          <button onClick={createCase} style={{ width: '100%', padding: 11, background: 'var(--ink-3)', border: '1px dashed var(--border-2)', borderRadius: 'var(--r-sm)', fontSize: 13, color: 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}>
            <i className="ph ph-plus" />New case file
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
          {cases.map((c, i) => {
            const isActive = currentCase?.id === c.id
            const dot = palette[i % palette.length]
            return (
              <div key={c.id} onClick={() => setCurrentCase(c)} style={{ padding: '12px 14px', borderRadius: 'var(--r-sm)', border: `1px solid ${isActive ? 'var(--border-2)' : 'transparent'}`, background: isActive ? 'var(--ink-4)' : 'transparent', cursor: 'pointer', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: `var(--${dot})`, flexShrink: 0 }} />
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 999, background: 'var(--ink-4)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>{c.status.charAt(0).toUpperCase() + c.status.slice(1)}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Enc pill */}
        <div style={{ padding: 12, borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'rgba(45,212,191,0.04)', border: '1px solid rgba(45,212,191,0.1)', borderRadius: 'var(--r-sm)' }}>
            <i className="ph ph-lock-simple" style={{ color: 'var(--teal)', fontSize: 15, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 11, color: 'var(--teal)', fontWeight: 500 }}>E2E Encrypted</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>AES-256-GCM</div>
            </div>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)', boxShadow: '0 0 8px var(--teal)', marginLeft: 'auto' }} />
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ gridColumn: 3, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--ink)', position: 'relative' }}>
        {/* Topbar */}
        <header style={{ height: 58, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 14, borderBottom: '1px solid var(--border)', background: 'rgba(13,15,18,0.85)', backdropFilter: 'blur(12px)', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 19, fontWeight: 400, whiteSpace: 'nowrap' }}>
              {NAV_ITEMS.find((n) => pathname.startsWith(n.href))?.label ?? 'Witness'}
            </h2>
            {currentCase && (
              <>
                <span style={{ color: 'var(--text-3)', fontSize: 17 }}>/</span>
                <span style={{ fontSize: 13, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentCase.name}</span>
              </>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--teal)', fontFamily: 'var(--mono)', background: 'var(--teal-dim)', border: '1px solid rgba(45,212,191,0.2)', padding: '5px 10px', borderRadius: 'var(--r-sm)' }}>
              <i className="ph ph-lock-key" /><span>Key active</span>
            </div>
            <button onClick={() => setAiPanelOpen(!aiPanelOpen)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 'var(--r-sm)', fontSize: 13, fontWeight: 500, color: aiPanelOpen ? 'var(--teal)' : 'var(--text-2)', border: `1px solid ${aiPanelOpen ? 'var(--teal-dim)' : 'var(--border)'}`, background: aiPanelOpen ? 'var(--teal-dim)' : 'var(--ink-2)' }}>
              <i className="ph ph-sparkle" style={{ fontSize: 16 }} />AI Assistant
            </button>
            <button onClick={() => setMemoryModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 'var(--r-sm)', fontSize: 13, fontWeight: 500, color: '#fff', border: '1px solid rgba(45,212,191,0.3)', background: 'linear-gradient(135deg,#0f766e,#0c6892)' }}>
              <i className="ph ph-plus" style={{ fontSize: 16 }} />New entry
            </button>
          </div>
        </header>

        {/* Page content */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {children}
        </div>
      </main>

      {/* AI Panel */}
      <div style={{ gridColumn: 4, background: 'var(--ink-2)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', opacity: aiPanelOpen ? 1 : 0, transition: 'opacity 0.4s', width: aiPanelOpen ? 360 : 0 }}>
        <AiPanel onClose={() => setAiPanelOpen(false)} />
      </div>

      {/* Memory Modal */}
      {memoryModalOpen && <MemoryModal onClose={() => setMemoryModalOpen(false)} />}
    </div>
  )
}
