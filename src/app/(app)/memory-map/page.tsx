'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useApp } from '@/context/AppContext'
import { createClient } from '@/lib/supabase/client'
import { MEMORY_COLOR } from '@/lib/types'
import type { Memory } from '@/lib/types'

type MemoryType = Memory['memory_type']
import MemoryModal from '@/components/memory/MemoryModal'

const TYPE_ICONS: Record<string, string> = {
  event:    'ph-calendar-dots',
  emotion:  'ph-heart',
  sensory:  'ph-nose',
  person:   'ph-user',
  location: 'ph-map-pin',
  evidence: 'ph-file-lock',
}

const MEMORY_TYPES = Object.keys(TYPE_ICONS)

export default function MemoryMapPage() {
  const { memories, currentCase, loadMemories } = useApp()
  const supabase = createClient()

  const [tool, setTool]           = useState<'select' | 'pan'>('select')
  const [filterType, setFilterType] = useState<string | null>(null)
  const [selected, setSelected]   = useState<string | null>(null)
  const [dragging, setDragging]   = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({})
  const [showModal, setShowModal] = useState(false)
  const [detailMem, setDetailMem] = useState<Memory | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Reset positions when memories change (e.g. new memory added)
  useEffect(() => {
    setPositions({})
  }, [memories.length])

  function getPos(m: Memory) {
    return positions[m.id] ?? { x: m.map_x ?? 80, y: m.map_y ?? 80 }
  }

  const handleMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    if (tool !== 'select') return
    e.preventDefault()
    e.stopPropagation()
    const mem = memories.find((m) => m.id === id)
    if (!mem) return
    const pos = positions[id] ?? { x: mem.map_x ?? 80, y: mem.map_y ?? 80 }
    setDragging(id)
    setDragOffset({ x: e.clientX - pos.x, y: e.clientY - pos.y })
    setSelected(id)
  }, [tool, memories, positions])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - dragOffset.x, rect.width  - 220))
    const y = Math.max(0, Math.min(e.clientY - dragOffset.y, rect.height - 140))
    setPositions((prev) => ({ ...prev, [dragging]: { x, y } }))
  }, [dragging, dragOffset])

  const handleMouseUp = useCallback(async () => {
    if (!dragging) return
    const pos = positions[dragging]
    if (pos) {
      await supabase.from('memories').update({ map_x: pos.x, map_y: pos.y }).eq('id', dragging)
    }
    setDragging(null)
  }, [dragging, positions, supabase])

  // Click without drag = open detail
  const handleNodeClick = useCallback((e: React.MouseEvent, m: Memory) => {
    e.stopPropagation()
    if (dragging) return
    setDetailMem(m)
  }, [dragging])

  // Fit view: spread nodes evenly in a grid
  function fitView() {
    const canvas = canvasRef.current
    if (!canvas || memories.length === 0) return
    const rect  = canvas.getBoundingClientRect()
    const cols  = Math.ceil(Math.sqrt(memories.length))
    const newPos: Record<string, { x: number; y: number }> = {}
    memories.forEach((m, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      newPos[m.id] = {
        x: 60 + col * ((rect.width  - 60) / cols),
        y: 60 + row * ((rect.height - 60) / Math.ceil(memories.length / cols)),
      }
    })
    setPositions(newPos)
  }

  const visibleMemories = filterType
    ? memories.filter((m) => m.memory_type === filterType)
    : memories

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>

      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div style={{ height: 50, flexShrink: 0, background: 'var(--ink-2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 4, padding: '0 14px', overflowX: 'auto' }}>

        {/* Select / Pan */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {(['select', 'pan'] as const).map((t) => (
            <button key={t} onClick={() => setTool(t)} title={t === 'select' ? 'Select & drag' : 'Pan canvas'} style={{ width: 34, height: 34, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: tool === t ? 'var(--teal)' : 'var(--text-3)', background: tool === t ? 'var(--teal-dim)' : 'transparent', border: tool === t ? '1px solid rgba(45,212,191,0.2)' : '1px solid transparent', cursor: 'pointer', transition: 'all 0.15s' }}>
              <i className={`ph ${t === 'select' ? 'ph-cursor' : 'ph-hand'}`} />
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 6px' }} />

        {/* Type filter buttons */}
        {MEMORY_TYPES.map((type) => {
          const active = filterType === type
          const color  = MEMORY_COLOR[type as MemoryType] ?? 'teal'
          return (
            <button
              key={type}
              onClick={() => setFilterType(active ? null : type)}
              title={`Filter: ${type}`}
              style={{
                width: 34, height: 34, borderRadius: 'var(--r-sm)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                color:       active ? `var(--${color})` : 'var(--text-3)',
                background:  active ? `var(--${color}-dim)` : 'transparent',
                border:      active ? `1px solid var(--${color}-dim)` : '1px solid transparent',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <i className={`ph ${TYPE_ICONS[type]}`} />
            </button>
          )
        })}

        <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 6px' }} />

        {/* Fit view */}
        <button
          onClick={fitView}
          style={{ padding: '0 12px', height: 34, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 500, color: 'var(--text-2)', cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--ink-3)', whiteSpace: 'nowrap', transition: 'all 0.15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-1)'; e.currentTarget.style.borderColor = 'var(--border-2)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          <i className="ph ph-arrows-out" />Fit view
        </button>

        {/* Add node */}
        <button
          onClick={() => setShowModal(true)}
          style={{ padding: '0 12px', height: 34, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 500, color: 'var(--teal)', cursor: 'pointer', border: '1px solid var(--teal-dim)', background: 'var(--teal-dim)', marginLeft: 4, whiteSpace: 'nowrap', transition: 'all 0.15s' }}
        >
          <i className="ph ph-plus" />Add node
        </button>

        <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)', flexShrink: 0 }}>
          {visibleMemories.length}{filterType ? ` ${filterType}` : ''} node{visibleMemories.length !== 1 ? 's' : ''}
          {filterType && <span style={{ color: 'var(--teal)', marginLeft: 6, cursor: 'pointer' }} onClick={() => setFilterType(null)}>✕ clear filter</span>}
        </div>
      </div>

      {/* ── Canvas ──────────────────────────────────────────── */}
      <div
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={() => setSelected(null)}
        style={{ flex: 1, position: 'relative', overflow: 'hidden', background: 'var(--ink)', backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.03) 1px,transparent 1px)', backgroundSize: '28px 28px', cursor: tool === 'pan' ? 'grab' : 'default' }}
      >
        {visibleMemories.map((m) => {
          const pos       = getPos(m)
          const color     = MEMORY_COLOR[m.memory_type as MemoryType] ?? 'teal'
          const isDragging = dragging === m.id
          const isSelected = selected === m.id

          return (
            <div
              key={m.id}
              onMouseDown={(e) => handleMouseDown(e, m.id)}
              onClick={(e) => handleNodeClick(e, m)}
              style={{
                position: 'absolute',
                left: pos.x,
                top:  pos.y,
                width: 220,
                background: 'var(--ink-2)',
                borderRadius: 'var(--r-lg)',
                border: `1px solid ${isSelected ? `var(--${color})` : 'var(--border)'}`,
                boxShadow: isSelected
                  ? `0 0 0 3px var(--${color}-dim), 0 12px 40px rgba(0,0,0,0.4)`
                  : isDragging ? '0 20px 60px rgba(0,0,0,0.6)' : 'none',
                transform: isDragging ? 'scale(1.02) translateY(-4px)' : isSelected ? 'translateY(-2px)' : 'none',
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: 'none',
                zIndex: isDragging ? 100 : isSelected ? 10 : 1,
                transition: isDragging ? 'none' : 'box-shadow 0.2s, transform 0.15s, border-color 0.15s',
              }}
            >
              {/* Color stripe */}
              <div style={{ height: 4, borderRadius: 'var(--r-lg) var(--r-lg) 0 0', background: `linear-gradient(90deg,var(--${color}),var(--sky))` }} />

              <div style={{ padding: 14 }}>
                {/* Type label */}
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: `var(--${color})`, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <i className={`ph ${TYPE_ICONS[m.memory_type] ?? 'ph-brain'}`} />
                  {m.memory_type}
                </div>
                {/* Title */}
                <div style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.5, marginBottom: 8 }}>{m.title}</div>
                {/* Confidence dots */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {[1,2,3,4,5].map((n) => (
                      <div key={n} style={{ width: 5, height: 5, borderRadius: '50%', background: n <= ({ high:4, medium:2, low:1, verified:5 }[m.confidence] ?? 2) ? `var(--${color})` : 'var(--border-2)' }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{m.confidence}</span>
                </div>
              </div>

              {/* Footer */}
              <div style={{ padding: '9px 14px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>{m.approximate_date || '—'}</span>
                <span style={{ fontSize: 10, color: 'var(--text-3)' }}>click to view</span>
              </div>
            </div>
          )
        })}

        {/* Empty state */}
        {memories.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ width: 64, height: 64, borderRadius: 'var(--r-xl)', background: 'var(--ink-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: 'var(--text-3)' }}>
              <i className="ph ph-graph" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--text-1)', marginBottom: 8 }}>No memories on this map</h4>
              <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>Click &ldquo;Add node&rdquo; to place your first memory.</p>
              <button onClick={() => setShowModal(true)} style={{ padding: '10px 20px', background: 'linear-gradient(135deg,#0f766e,#0ea5e9)', border: 'none', borderRadius: 'var(--r-md)', fontSize: 14, fontWeight: 500, color: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <i className="ph ph-plus" />Add first memory
              </button>
            </div>
          </div>
        )}

        {/* Filtered-out notice */}
        {memories.length > 0 && visibleMemories.length === 0 && filterType && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ fontSize: 13, color: 'var(--text-2)' }}>No <strong>{filterType}</strong> memories yet.</div>
            <button onClick={() => setFilterType(null)} style={{ fontSize: 12, color: 'var(--teal)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Show all</button>
          </div>
        )}
      </div>

      {/* ── Memory detail modal ──────────────────────────────── */}
      {detailMem && (
        <div
          onClick={() => setDetailMem(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: 540, background: 'var(--ink-2)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
            <div style={{ height: 4, background: `linear-gradient(90deg,var(--${MEMORY_COLOR[detailMem.memory_type] ?? 'teal'}),var(--sky))` }} />
            <div style={{ padding: 32 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: `var(--${MEMORY_COLOR[detailMem.memory_type] ?? 'teal'})`, marginBottom: 8 }}>{detailMem.memory_type}</div>
                  <h3 style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 400, color: 'var(--text-1)' }}>{detailMem.title}</h3>
                </div>
                <button onClick={() => setDetailMem(null)} style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'var(--text-3)', cursor: 'pointer', background: 'none', border: 'none', flexShrink: 0 }}>
                  <i className="ph ph-x" />
                </button>
              </div>

              {detailMem.content && (
                <div style={{ background: 'var(--ink-3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 16, fontSize: 14, color: 'var(--text-1)', lineHeight: 1.7, marginBottom: 16, whiteSpace: 'pre-wrap' }}>
                  {detailMem.content}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'Confidence',  value: detailMem.confidence },
                  { label: 'Timeframe',   value: detailMem.approximate_date || 'Not specified' },
                  { label: 'Type',        value: detailMem.memory_type },
                  { label: 'Recorded',    value: new Date(detailMem.created_at).toLocaleDateString() },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: 'var(--ink-3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 5 }}>{label}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-1)' }}>{value}</div>
                  </div>
                ))}
              </div>

              <button onClick={() => setDetailMem(null)} style={{ width: '100%', padding: 12, background: 'var(--ink-3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 13, color: 'var(--text-2)', cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add memory modal ─────────────────────────────────── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MemoryModal onClose={async () => { setShowModal(false); if (currentCase) await loadMemories(currentCase.id) }} />
        </div>
      )}
    </div>
  )
}
