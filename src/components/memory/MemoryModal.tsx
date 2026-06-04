'use client'

import { useState, FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useApp } from '@/context/AppContext'
import toast from 'react-hot-toast'

interface Props {
  onClose: () => void
}

export default function MemoryModal({ onClose }: Props) {
  const supabase = createClient()
  const { user, currentCase, loadMemories, pushNotification } = useApp()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [memType, setMemType] = useState<string>('event')
  const [confidence, setConfidence] = useState<string>('medium')
  const [approxDate, setApproxDate] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !user || !currentCase) return
    setLoading(true)
    try {
      const { error } = await supabase.from('memories').insert({
        case_id: currentCase.id,
        user_id: user.id,
        title: title.trim(),
        content: content.trim(),
        memory_type: memType,
        confidence,
        approximate_date: approxDate.trim() || null,
        map_x: Math.floor(Math.random() * 600) + 50,
        map_y: Math.floor(Math.random() * 400) + 50,
      })
      if (error) throw error
      toast.success('Memory saved.')
      pushNotification('Memory logged', title.trim(), 'memory')
      await loadMemories(currentCase.id)
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save memory.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ width: 520, background: 'var(--ink-2)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-xl)', padding: 36, position: 'relative', animation: 'fadeUp 0.3s var(--ease) both' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h3 style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 400, color: 'var(--text-1)' }}>Add a memory entry</h3>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-3)', fontSize: 18 }}>
            <i className="ph ph-x" />
          </button>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off">
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Memory title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Sensory memory — the drive home" required style={{ width: '100%', padding: '14px 18px', background: 'var(--ink-3)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-md)', fontSize: 15, color: 'var(--text-1)' }} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
              Description <span style={{ color: 'var(--text-3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(in your own words — never edited)</span>
            </label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Describe what you remember, using whatever fragments or details feel right. There is no wrong way to record this." rows={4} style={{ width: '100%', padding: '14px 18px', background: 'var(--ink-3)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-md)', fontSize: 15, color: 'var(--text-1)', resize: 'vertical' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Memory type</label>
              <select value={memType} onChange={(e) => setMemType(e.target.value)} style={{ width: '100%', padding: '12px 14px', background: 'var(--ink-3)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-md)', fontSize: 14, color: 'var(--text-1)', cursor: 'pointer' }}>
                <option value="event">Event</option>
                <option value="emotion">Emotion</option>
                <option value="sensory">Sensory detail</option>
                <option value="person">Person</option>
                <option value="location">Location</option>
                <option value="evidence">Evidence</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Confidence level</label>
              <select value={confidence} onChange={(e) => setConfidence(e.target.value)} style={{ width: '100%', padding: '12px 14px', background: 'var(--ink-3)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-md)', fontSize: 14, color: 'var(--text-1)', cursor: 'pointer' }}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low / uncertain</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: 14, marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
              Approximate time <span style={{ color: 'var(--text-3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
            </label>
            <input type="text" value={approxDate} onChange={(e) => setApproxDate(e.target.value)} placeholder="e.g. Summer 2021, Before the move, During college" style={{ width: '100%', padding: '14px 18px', background: 'var(--ink-3)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-md)', fontSize: 15, color: 'var(--text-1)' }} />
            <span style={{ display: 'block', marginTop: 8, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>You can use any timeframe that feels right — a season, a year, or a relative event.</span>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 13, borderRadius: 'var(--r-sm)', fontSize: 13, fontWeight: 500, color: 'var(--text-2)', border: '1px solid var(--border)', background: 'var(--ink-2)' }}>Cancel</button>
            <button type="submit" disabled={loading || !currentCase} style={{ flex: 2, padding: 16, background: 'linear-gradient(135deg,#0f766e,#0ea5e9)', borderRadius: 'var(--r-md)', fontSize: 15, fontWeight: 500, color: '#fff', opacity: (loading || !currentCase) ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Saving…' : 'Save memory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
