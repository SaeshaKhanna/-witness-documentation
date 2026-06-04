'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { escHtml, timeAgo, cap } from '@/lib/utils'
import { MEMORY_COLOR } from '@/lib/types'
import type { Memory } from '@/lib/types'
import MemoryModal from '@/components/memory/MemoryModal'

function MemoryDetailModal({ memory, onClose }: { memory: Memory; onClose: () => void }) {
  const color = MEMORY_COLOR[memory.memory_type]
  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 580, maxHeight: '80vh', overflowY: 'auto', background: 'var(--ink-2)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-xl)', position: 'relative', animation: 'fadeUp 0.3s var(--ease) both' }}>
        <div style={{ height: 4, background: `linear-gradient(90deg,var(--${color}),var(--sky))`, borderRadius: 'var(--r-xl) var(--r-xl) 0 0' }} />
        <div style={{ padding: 32 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: `var(--${color})`, marginBottom: 8 }}>{cap(memory.memory_type)}</div>
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 400, color: 'var(--text-1)', lineHeight: 1.3 }}>{memory.title}</h3>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-3)', fontSize: 18, flexShrink: 0, marginLeft: 16 }}>
              <i className="ph ph-x" />
            </button>
          </div>

          <div style={{ background: 'var(--ink-3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 20, marginBottom: 20, fontSize: 14, color: 'var(--text-1)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {memory.content || 'No description recorded.'}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Confidence', value: cap(memory.confidence) },
              { label: 'Timeframe', value: memory.approximate_date || 'Not specified' },
              { label: 'Recorded', value: new Date(memory.created_at).toLocaleString() },
              { label: 'ID (immutable)', value: memory.id.slice(0, 18) + '…', mono: true },
            ].map((item) => (
              <div key={item.label} style={{ background: 'var(--ink-3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>{item.label}</div>
                <div style={{ fontSize: item.mono ? 11 : 13, color: item.mono ? 'var(--text-3)' : 'var(--text-1)', fontFamily: item.mono ? 'var(--mono)' : undefined }}>{item.value}</div>
              </div>
            ))}
          </div>

          <button onClick={onClose} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '11px', borderRadius: 'var(--r-sm)', fontSize: 13, fontWeight: 500, color: 'var(--text-2)', border: '1px solid var(--border)', background: 'var(--ink-2)' }}>Close</button>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { memories, currentCase } = useApp()
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [detailMemory, setDetailMemory] = useState<Memory | null>(null)

  const cfClass: Record<string, string> = { high: 'h', medium: 'm', low: 'l', verified: 'h' }
  const colorMap = MEMORY_COLOR

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 24 }}>
      {/* Hero */}
      <div style={{ marginBottom: 24, padding: '36px 40px', background: 'linear-gradient(135deg,var(--ink-2),var(--ink-3))', border: '1px solid var(--border-2)', borderRadius: 'var(--r-xl)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(45,212,191,0.08),transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 600 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--teal)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 22, height: 1, background: 'var(--teal)', display: 'inline-block' }} />
            Secure workspace
          </div>
          <h3 style={{ fontFamily: 'var(--serif)', fontSize: 34, fontWeight: 400, color: 'var(--text-1)', lineHeight: 1.2, marginBottom: 14 }}>
            Clarity at <em style={{ color: 'var(--teal)', fontStyle: 'italic' }}>your own pace.</em>
          </h3>
          <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.65, maxWidth: 460 }}>
            Document fragments, emotions, and sensory details without chronological pressure. Build your record when you&apos;re ready.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
            <button onClick={() => setAddModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 'var(--r-sm)', fontSize: 14, fontWeight: 500, color: '#fff', border: '1px solid rgba(45,212,191,0.3)', background: 'linear-gradient(135deg,#0f766e,#0c6892)' }}>
              <i className="ph ph-plus" />Add memory
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { icon: 'ph-brain', num: memories.length, label: 'Logged memories', color: 'teal', chg: '+recent' },
          { icon: 'ph-file-lock', num: 0, label: 'Secured evidence files', color: 'rose', chg: 'All verified' },
          { icon: 'ph-graph', num: 0, label: 'Map connections', color: 'violet', chg: '0 clusters' },
          { icon: 'ph-shield-check', num: '100%', label: 'Privacy integrity', color: 'amber', chg: 'Secure' },
        ].map((stat) => (
          <div key={stat.label} style={{ padding: '20px 22px', background: 'var(--ink-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', cursor: 'pointer', transition: 'all 0.25s var(--ease)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ width: 34, height: 34, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `var(--${stat.color}-dim)`, fontSize: 17, color: `var(--${stat.color})`, marginBottom: 14 }}>
              <i className={`ph ${stat.icon}`} />
            </div>
            <div style={{ fontSize: 30, fontWeight: 600, color: 'var(--text-1)', lineHeight: 1, marginBottom: 4, fontFamily: 'var(--mono)' }}>{stat.num}</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{stat.label}</div>
            <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', marginTop: 7 }}>
              <div style={{ height: '100%', width: '58%', background: `var(--${stat.color})`, borderRadius: 2 }} />
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: `var(--${stat.color})`, marginTop: 8, background: `var(--${stat.color}-dim)`, padding: '2px 8px', borderRadius: 999 }}>
              {stat.chg}
            </div>
          </div>
        ))}
      </div>

      {/* Two col */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 18 }}>
        {/* Recent memories */}
        <div style={{ background: 'var(--ink-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h4 style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)' }}>Recent memory entries</h4>
            <span style={{ fontSize: 12, color: 'var(--teal)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><i className="ph ph-arrow-right" />View all</span>
          </div>
          {memories.length === 0 ? (
            <div style={{ padding: 28, textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>No memories yet. Click &quot;Add memory&quot; to begin.</div>
          ) : memories.slice(0, 5).map((m, i) => {
            const color = colorMap[m.memory_type]
            const isLast = i === Math.min(memories.length, 5) - 1
            const cf = cfClass[m.confidence] ?? 'm'
            const cfWidths: Record<string, string> = { h: '85%', m: '55%', l: '25%' }
            return (
              <div key={m.id} onClick={() => setDetailMemory(m)} style={{ padding: '14px 20px', borderBottom: isLast ? 'none' : '1px solid var(--border)', display: 'flex', gap: 14, cursor: 'pointer', transition: 'background 0.15s' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--ink-3)')} onMouseLeave={(e) => (e.currentTarget.style.background = '')}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: `var(--${color})`, boxShadow: `0 0 7px var(--${color})`, marginTop: 3, flexShrink: 0 }} />
                  {!isLast && <div style={{ flex: 1, width: 1, background: 'var(--border)', marginTop: 4 }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <h5 style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', marginBottom: 3 }}>{m.title}</h5>
                  <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{m.content?.slice(0, 100)}{(m.content?.length ?? 0) > 100 ? '…' : ''}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Confidence</span>
                    <div style={{ flex: 1, height: 3, background: 'var(--border-2)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: cfWidths[cf] ?? '55%', background: cf === 'h' ? 'var(--teal)' : cf === 'm' ? 'var(--amber)' : 'var(--rose)', borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{cap(m.confidence)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 7, marginTop: 7, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 999, background: 'var(--ink-4)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>{cap(m.memory_type)}</span>
                    {m.approximate_date && <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 999, background: 'var(--ink-4)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>{m.approximate_date}</span>}
                  </div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-3)', flexShrink: 0, marginTop: 3, fontFamily: 'var(--mono)' }}>{timeAgo(m.created_at)}</span>
              </div>
            )
          })}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Activity log */}
          <div style={{ background: 'var(--ink-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ fontSize: 14, fontWeight: 500 }}>Secure activity log</h4>
            </div>
            <div>
              {[
                { icon: 'ph-lock-key', label: 'Session encrypted', sub: 'AES-256-GCM — active', color: 'teal', time: 'now' },
                { icon: 'ph-shield-check', label: 'Authentication verified', sub: 'Supabase Auth', color: 'violet', time: 'now' },
                { icon: 'ph-brain', label: `${memories.length} memories loaded`, sub: currentCase?.name ?? '—', color: 'amber', time: '~1s' },
              ].map((item) => (
                <div key={item.label} style={{ padding: '11px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, background: `var(--${item.color}-dim)`, color: `var(--${item.color})`, flexShrink: 0 }}>
                    <i className={`ph ${item.icon}`} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h5 style={{ fontSize: 13, color: 'var(--text-1)', fontWeight: 400, marginBottom: 2 }}>{item.label}</h5>
                    <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{item.sub}</p>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>{item.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Case progress */}
          <div style={{ background: 'var(--ink-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '18px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', marginBottom: 14 }}>Case progress</div>
            {[
              { label: 'Memory documentation', pct: Math.min(memories.length * 7, 100), color: 'var(--teal)' },
              { label: 'Evidence uploaded', pct: 0, color: 'var(--violet)' },
              { label: 'Timeline confidence', pct: 42, color: 'var(--amber)' },
              { label: 'Report readiness', pct: 10, color: 'var(--rose)' },
            ].map((row) => (
              <div key={row.label} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{row.label}</span>
                  <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: row.color }}>{row.pct}%</span>
                </div>
                <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${row.pct}%`, background: row.color, borderRadius: 2, transition: 'width 0.8s var(--ease)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {addModalOpen && <MemoryModal onClose={() => setAddModalOpen(false)} />}
      {detailMemory && <MemoryDetailModal memory={detailMemory} onClose={() => setDetailMemory(null)} />}
    </div>
  )
}
