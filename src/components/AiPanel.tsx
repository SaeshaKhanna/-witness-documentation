'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  text: string
  time: string
}

const QUICK_CHIPS = [
  'Help me organize my memories into a timeline',
  'Draft a summary for legal review',
  'What gaps exist in my documentation?',
]

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function AiPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: "Hello. I'm here to help you structure your memories and documentation — without ever adding details you haven't provided. What would you like to work on today?",
      time: nowTime(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const msgsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    msgsRef.current?.scrollTo({ top: msgsRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  async function send(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')

    const userMsg: Message = { role: 'user', text: msg, time: nowTime() }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const contents = [...messages, userMsg].map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      }))

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: contents }),
      })
      const data = await res.json() as { reply: string }
      setMessages((prev) => [...prev, { role: 'assistant', text: data.reply, time: nowTime() }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Sorry, I encountered an error. Please try again.', time: nowTime() }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Header */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--teal)', boxShadow: '0 0 7px var(--teal)', animation: 'blink 2s ease-in-out infinite' }} />
          <h4 style={{ fontSize: 14, fontWeight: 500 }}>AI Documentation Assistant</h4>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, fontFamily: 'var(--mono)', background: 'var(--teal-dim)', color: 'var(--teal)', padding: '2px 7px', borderRadius: 999, border: '1px solid rgba(45,212,191,0.2)' }}>Gemini</span>
          <button onClick={onClose} style={{ width: 26, height: 26, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: 'var(--text-3)', cursor: 'pointer' }}>
            <i className="ph ph-x" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={msgsRef} style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ maxWidth: '90%', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', animation: 'msgIn 0.3s var(--ease) both' }}>
            <div style={{ padding: '11px 13px', borderRadius: 'var(--r-md)', fontSize: 13, lineHeight: 1.6, ...(m.role === 'user' ? { background: 'linear-gradient(135deg,#0f766e,#0c6892)', color: '#fff', borderBottomRightRadius: 4 } : { background: 'var(--ink-3)', border: '1px solid var(--border)', color: 'var(--text-1)', borderBottomLeftRadius: 4 }) }}>
              {m.text}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3, fontFamily: 'var(--mono)', ...(m.role === 'user' ? { textAlign: 'right' } : {}) }}>{m.time}</div>
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start' }}>
            <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: 12, background: 'var(--ink-3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', borderBottomLeftRadius: 4, width: 'fit-content' }}>
              {[0, 1, 2].map((i) => (
                <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--text-3)', display: 'block', animation: `typing 1.2s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input zone */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 9 }}>
          {QUICK_CHIPS.map((chip) => (
            <button key={chip} onClick={() => send(chip)} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 999, border: '1px solid var(--border)', color: 'var(--text-2)', background: 'var(--ink-3)', cursor: 'pointer' }}>
              {chip}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 7, alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Describe a memory or ask for help…"
            rows={1}
            style={{ flex: 1, background: 'var(--ink-3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '9px 12px', fontSize: 13, color: 'var(--text-1)', resize: 'none', minHeight: 38, maxHeight: 110 }}
          />
          <button onClick={() => send()} disabled={loading || !input.trim()} style={{ width: 34, height: 34, borderRadius: 'var(--r-sm)', background: 'linear-gradient(135deg,#0f766e,#0c6892)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff', flexShrink: 0, opacity: (loading || !input.trim()) ? 0.5 : 1, cursor: 'pointer' }}>
            <i className="ph ph-paper-plane-tilt" />
          </button>
        </div>
      </div>
    </>
  )
}
