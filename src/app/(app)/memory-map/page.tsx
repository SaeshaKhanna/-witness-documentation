'use client'

import { useState, useRef, useCallback } from 'react'
import { useApp } from '@/context/AppContext'
import { createClient } from '@/lib/supabase/client'
import { MEMORY_COLOR } from '@/lib/types'
import type { Memory } from '@/lib/types'
import toast from 'react-hot-toast'

const TYPE_ICONS: Record<string, string> = {
  event: 'ph-calendar-dots',
  emotion: 'ph-heart',
  sensory: 'ph-nose',
  person: 'ph-user',
  location: 'ph-map-pin',
  evidence: 'ph-file-lock',
}

export default function MemoryMapPage() {
  const { memories, currentCase, loadMemories } = useApp()
  const supabase = createClient()
  const [tool, setTool] = useState<'select' | 'pan'>('select')
  const [selected, setSelected] = useState<string | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({})
  const canvasRef = useRef<HTMLDivElement>(null)

  function getPos(m: Memory) {
    return positions[m.id] ?? { x: m.map_x ?? 100, y: m.map_y ?? 100 }
  }

  const handleMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    if (tool !== 'select') return
    e.preventDefault()
    const mem = memories.find((m) => m.id === id)
    if (!mem) return
    const pos = positions[id] ?? { x: mem.map_x ?? 100, y: mem.map_y ?? 100 }
    setDragging(id)
    setDragOffset({ x: e.clientX - pos.x, y: e.clientY - pos.y })
    setSelected(id)
  }, [tool, memories, positions])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return
    setPositions((prev) => ({
      ...prev,
      [dragging]: { x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y },
    }))
  }, [dragging, dragOffset])

  const handleMouseUp = useCallback(async () => {
    if (!dragging) return
    const pos = positions[dragging]
    if (pos) {
      await supabase.from('memories').update({ map_x: pos.x, map_y: pos.y }).eq('id', dragging)
    }
    setDragging(null)
  }, [dragging, positions, supabase])

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{ height: 50, flexShrink: 0, background: 'var(--ink-2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 4, padding: '0 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {(['select', 'pan'] as const).map((t) => (
            <button key={t} onClick={() => setTool(t)} title={t === 'select' ? 'Select' : 'Pan'} style={{ width: 34, height: 34, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: tool === t ? 'var(--teal)' : 'var(--text-3)', background: tool === t ? 'var(--teal-dim)' : 'transparent', border: tool === t ? '1px solid rgba(45,212,191,0.2)' : '1px solid transparent', cursor: 'pointer' }}>
              <i className={`ph ${t === 'select' ? 'ph-cursor' : 'ph-hand'}`} />
            </button>
          ))}
        </div>
        <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 6px' }} />
        {Object.entries(TYPE_ICONS).map(([type, icon]) => (
          <button key={type} title={type} style={{ width: 34, height: 34, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--text-3)', cursor: 'pointer' }}>
            <i className={`ph ${icon}`} />
          </button>
        ))}
        <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 6px' }} />
        <button style={{ padding: '0 12px', height: 34, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 500, color: 'var(--text-2)', cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--ink-3)' }}>
          <i className="ph ph-arrows-out" />Fit view
        </button>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
          {memories.length} nodes
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ flex: 1, position: 'relative', overflow: 'hidden', background: 'var(--ink)', backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.03) 1px,transparent 1px)', backgroundSize: '28px 28px', cursor: tool === 'pan' ? 'grab' : 'default' }}
      >
        {/* SVG lines */}
        <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }} width="100%" height="100%">
          {/* Would render lines from memory_links table here */}
        </svg>

        {memories.map((m) => {
          const pos = getPos(m)
          const color = MEMORY_COLOR[m.memory_type]
          const isDragging = dragging === m.id
          const isSelected = selected === m.id

          return (
            <div
              key={m.id}
              onMouseDown={(e) => handleMouseDown(e, m.id)}
              style={{
                position: 'absolute',
                left: pos.x,
                top: pos.y,
                width: 220,
                background: 'var(--ink-2)',
                borderRadius: 'var(--r-lg)',
                border: `1px solid ${isSelected ? `var(--${color})` : 'var(--border)'}`,
                boxShadow: isSelected ? `0 0 0 2px var(--${color}-dim)` : isDragging ? '0 20px 60px rgba(0,0,0,0.6)' : 'none',
                transform: isDragging ? 'scale(1.02) translateY(-4px)' : 'none',
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: 'none',
                zIndex: isDragging ? 100 : 1,
                transition: isDragging ? 'none' : 'box-shadow 0.2s, transform 0.15s',
              }}
            >
              <div style={{ height: 4, borderRadius: 'var(--r-lg) var(--r-lg) 0 0', background: `linear-gradient(90deg,var(--${color}),var(--sky))` }} />
              <div style={{ padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: `var(--${color})`, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <i className={`ph ${TYPE_ICONS[m.memory_type] ?? 'ph-brain'}`} />{m.memory_type}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.5, marginBottom: 10 }}>{m.title}</div>
              </div>
              <div style={{ padding: '9px 14px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>{m.approximate_date || '—'}</span>
              </div>
            </div>
          )
        })}

        {memories.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ width: 64, height: 64, borderRadius: 'var(--r-xl)', background: 'var(--ink-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: 'var(--text-3)' }}>
              <i className="ph ph-graph" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--text-1)', marginBottom: 8 }}>No memories on this map</h4>
              <p style={{ fontSize: 13, color: 'var(--text-2)' }}>Add memories using the &quot;New entry&quot; button to populate the map.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
