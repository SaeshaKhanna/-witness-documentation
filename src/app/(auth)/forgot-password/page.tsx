'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) { setError('Please enter your email address.'); return }
    setLoading(true)
    setError('')
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/login`,
    })
    setLoading(false)
    if (resetError) {
      setError(resetError.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ink)' }}>
      <div style={{ width: 460, position: 'relative', zIndex: 1, animation: 'fadeUp 0.8s var(--ease) both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48 }}>
          <div style={{ width: 52, height: 52, borderRadius: 'var(--r-md)', background: 'linear-gradient(135deg,var(--teal),#0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, color: '#fff', boxShadow: '0 0 32px rgba(45,212,191,0.35)' }}>
            <i className="ph ph-shield-check" />
          </div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 32, fontWeight: 400, background: 'linear-gradient(135deg,var(--text-1),var(--teal))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>Witness</h1>
        </div>

        <div style={{ background: 'var(--ink-2)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-xl)', padding: 40 }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 400, color: 'var(--text-1)', marginBottom: 8 }}>Reset your password</h2>
            <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>Enter your email and we&apos;ll send you a reset link.</p>
          </div>

          {sent ? (
            <div style={{ padding: '14px 18px', background: 'var(--teal-dim)', border: '1px solid rgba(45,212,191,0.25)', borderRadius: 'var(--r-md)', fontSize: 13, color: 'var(--teal)' }}>
              <i className="ph ph-check-circle" style={{ marginRight: 8 }} />
              Password reset link sent to <strong>{email}</strong>. Check your inbox.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Email address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={{ width: '100%', padding: '14px 18px', background: 'var(--ink-3)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-md)', fontSize: 15, color: 'var(--text-1)' }} />
              </div>
              {error && (
                <div style={{ marginBottom: 16, padding: '14px 18px', background: 'var(--rose-dim)', border: '1px solid rgba(251,113,133,0.25)', borderRadius: 'var(--r-md)', fontSize: 13, color: 'var(--rose)' }}>{error}</div>
              )}
              <button type="submit" disabled={loading} style={{ width: '100%', padding: 16, marginTop: 8, background: 'linear-gradient(135deg,#0f766e,#0ea5e9)', borderRadius: 'var(--r-md)', fontSize: 15, fontWeight: 500, color: '#fff', opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          )}

          <p style={{ marginTop: 24, fontSize: 13, color: 'var(--text-2)', textAlign: 'center' }}>
            <Link href="/login" style={{ color: 'var(--teal)', textDecoration: 'underline', textUnderlineOffset: 3 }}>Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
