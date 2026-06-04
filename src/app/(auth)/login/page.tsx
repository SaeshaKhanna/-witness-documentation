'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setError('')
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (signInError) throw signInError
      // Check for MFA
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyData = data as any
      if (anyData?.nextStep?.type === 'MFA_TOTP_VERIFICATION_CHALLENGE') {
        sessionStorage.setItem('mfa_factor_id', anyData.nextStep.factorId ?? '')
        router.push('/verify-mfa')
        return
      }
      toast.success('Welcome back!')
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign in failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ink)' }}>
      {/* Background orbs */}
      <div style={{ position: 'fixed', width: 600, height: 600, top: -200, left: -100, borderRadius: '50%', background: 'radial-gradient(circle,rgba(45,212,191,0.07),transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none', animation: 'drift 20s ease-in-out infinite alternate' }} />
      <div style={{ position: 'fixed', width: 500, height: 500, bottom: -100, right: -100, borderRadius: '50%', background: 'radial-gradient(circle,rgba(167,139,250,0.08),transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none', animation: 'drift 20s ease-in-out infinite alternate', animationDelay: '-10s' }} />

      <div style={{ width: 460, position: 'relative', zIndex: 1, animation: 'fadeUp 0.8s var(--ease) both' }}>
        {/* Wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48 }}>
          <div style={{ width: 52, height: 52, borderRadius: 'var(--r-md)', background: 'linear-gradient(135deg,var(--teal),#0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, color: '#fff', boxShadow: '0 0 32px rgba(45,212,191,0.35),0 0 64px rgba(45,212,191,0.12)' }}>
            <i className="ph ph-shield-check" />
          </div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 32, fontWeight: 400, background: 'linear-gradient(135deg,var(--text-1),var(--teal))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>Witness</h1>
        </div>

        {/* Card */}
        <div style={{ background: 'var(--ink-2)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-xl)', padding: 40, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(45,212,191,0.04),transparent 60%)', pointerEvents: 'none' }} />

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 400, color: 'var(--text-1)', marginBottom: 8, lineHeight: 1.3 }}>Welcome back.</h2>
            <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>Sign in to access your encrypted case files and continue your documentation.</p>
          </div>

          <form onSubmit={handleSubmit} autoComplete="off">
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="off"
                style={{ width: '100%', padding: '14px 18px', background: 'var(--ink-3)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-md)', fontSize: 15, color: 'var(--text-1)' }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  style={{ width: '100%', padding: '14px 48px 14px 18px', background: 'var(--ink-3)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-md)', fontSize: 15, color: 'var(--text-1)' }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', fontSize: 18, display: 'flex', alignItems: 'center' }}>
                  <i className={`ph ${showPw ? 'ph-eye-slash' : 'ph-eye'}`} />
                </button>
              </div>
            </div>

            <div style={{ marginTop: -8, marginBottom: 16, textAlign: 'right' }}>
              <Link href="/forgot-password" style={{ fontSize: 12, color: 'var(--teal)', textDecoration: 'underline', textUnderlineOffset: 3 }}>Forgot password?</Link>
            </div>

            {error && (
              <div style={{ marginBottom: 16, padding: '14px 18px', background: 'var(--rose-dim)', border: '1px solid rgba(251,113,133,0.25)', borderRadius: 'var(--r-md)', fontSize: 13, color: 'var(--rose)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: 16, marginTop: 8, background: 'linear-gradient(135deg,#0f766e,#0ea5e9)', borderRadius: 'var(--r-md)', fontSize: 15, fontWeight: 500, color: '#fff', opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 24px rgba(45,212,191,0.2)' }}
            >
              {loading ? 'Signing in…' : 'Sign in securely'}
            </button>
          </form>

          <p style={{ marginTop: 24, fontSize: 13, color: 'var(--text-2)', textAlign: 'center' }}>
            Don&apos;t have an account?{' '}
            <Link href="/signup" style={{ color: 'var(--teal)', textDecoration: 'underline', textUnderlineOffset: 3 }}>Sign up</Link>
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Security</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <div style={{ padding: 16, background: 'rgba(45,212,191,0.04)', border: '1px solid rgba(45,212,191,0.12)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <i className="ph ph-lock-key" style={{ color: 'var(--teal)', fontSize: 18, flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--teal)', fontWeight: 500 }}>End-to-end encrypted.</strong> Your data is secured with AES-256-GCM and PBKDF2 key derivation. Witness cannot read your data.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
