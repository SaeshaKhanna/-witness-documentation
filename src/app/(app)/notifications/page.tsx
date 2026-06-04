'use client'

import { useApp } from '@/context/AppContext'
import { timeAgo } from '@/lib/utils'

const NOTIF_ICONS: Record<string, { icon: string; color: string }> = {
  signin: { icon: 'ph-lock-key', color: 'teal' },
  case: { icon: 'ph-folder-plus', color: 'violet' },
  memory: { icon: 'ph-brain', color: 'amber' },
  evidence: { icon: 'ph-shield-check', color: 'rose' },
  info: { icon: 'ph-info', color: 'teal' },
}

export default function NotificationsPage() {
  const { notifications, unreadCount, markAllRead } = useApp()

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 24 }}>
      <div style={{ maxWidth: 680 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <h3 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 400, color: 'var(--text-1)', marginBottom: 4 }}>Notifications</h3>
            <p style={{ fontSize: 13, color: 'var(--text-2)' }}>Activity across your cases and account.{unreadCount > 0 ? ` (${unreadCount} unread)` : ''}</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 'var(--r-sm)', fontSize: 12, fontWeight: 500, color: 'var(--text-2)', border: '1px solid var(--border)', background: 'var(--ink-2)', cursor: 'pointer' }}
            >
              <i className="ph ph-checks" />Mark all read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>No notifications yet.</div>
        ) : (
          <div style={{ background: 'var(--ink-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
            {notifications.map((n, i) => {
              const ni = NOTIF_ICONS[n.type] ?? NOTIF_ICONS.info
              return (
                <div key={n.id} style={{ padding: '14px 20px', display: 'flex', alignItems: 'flex-start', gap: 14, borderBottom: i < notifications.length - 1 ? '1px solid var(--border)' : 'none', background: n.read ? 'transparent' : 'rgba(45,212,191,0.02)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, background: `var(--${ni.color}-dim)`, color: `var(--${ni.color})`, flexShrink: 0 }}>
                    <i className={`ph ${ni.icon}`} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <h5 style={{ fontSize: 13, color: 'var(--text-1)', fontWeight: 500 }}>{n.title}</h5>
                      {!n.read && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)', flexShrink: 0 }} />}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-2)' }}>{n.message}</p>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)', flexShrink: 0 }}>{timeAgo(n.timestamp)}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
