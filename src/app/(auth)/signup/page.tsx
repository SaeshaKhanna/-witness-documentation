'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

function getPasswordStrength(pw: string): { label: string; color: string; width: string } {
  if (pw.length === 0) return { label: '', color: 'var(--border-2)', width: '0%' }
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 14) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 2) return { label: 'Weak', color: 'var(--rose)', width: '33%' }
  if (score <= 3) return { label: 'Medium', color: 'var(--amber)', width: '66%' }
  return { label: 'Strong', color: 'var(--teal)', width: '100%' }
}

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const strength = getPasswordStrength(password)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    try {
      const { error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password })
      if (signUpError) throw signUpError
      toast.success('Account created! Please check your email to confirm, then sign in.')
      router.push('/login')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign up failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ink)' }}>
      <div style={{ position: 'fixed', width: 600, height: 600, top: -200, left: -100, borderRadius: '50%', background: 'radial-gradient(circle,rgba(45,212,191,0.07),transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <div style={{ width: 460, position: 'relative', zIndex: 1, animation: 'fadeUp 0.8s var(--ease) both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48 }}>
          <div style={{ width: 52, height: 52, borderRadius: 'var(--r-md)', background: 'linear-gradient(135deg,var(--teal),#0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, color: '#fff', boxShadow: '0 0 32px rgba(45,212,191,0.35)' }}>
            <i className="ph ph-shield-check" />
          </div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 32, fontWeight: 400, background: 'linear-gradient(135deg,var(--text-1),var(--teal))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>Witness</h1>
        </div>

        <div style={{ background: 'var(--ink-2)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-xl)', padding: 40, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(45,212,191,0.04),transparent 60%)', pointerEvents: 'none' }} />

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 400, color: 'var(--text-1)', marginBottom: 8, lineHeight: 1.3 }}>
              Your truth, preserved with{' '}
              <em style={{ color: 'var(--teal)', fontStyle: 'italic' }}>integrity.</em>
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>Create a secure account to begin documenting your experiences in a safe, private environment.</p>
          </div>

          <form onSubmit={handleSubmit} autoComplete="off">
            {[
              { label: 'Email address', type: 'email', value: email, onChange: setEmail, placeholder: 'you@example.com' },
            ].map((field) => (
              <div key={field.label} style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>{field.label}</label>
                <input type={field.type} value={field.value} onChange={(e) => field.onChange(e.target.value)} placeholder={field.placeholder} style={{ width: '100%', padding: '14px 18px', background: 'var(--ink-3)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-md)', fontSize: 15, color: 'var(--text-1)' }} />
              </div>
            ))}

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a strong password" autoComplete="new-password" style={{ width: '100%', padding: '14px 48px 14px 18px', background: 'var(--ink-3)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-md)', fontSize: 15, color: 'var(--text-1)' }} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', fontSize: 18, display: 'flex', alignItems: 'center' }}>
                  <i className={`ph ${showPw ? 'ph-eye-slash' : 'ph-eye'}`} />
                </button>
              </div>
              {password && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ height: 3, background: 'var(--border-2)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: strength.width, background: strength.color, borderRadius: 2, transition: 'width 0.3s, background 0.3s' }} />
                  </div>
                  <span style={{ fontSize: 11, color: strength.color, marginTop: 4, display: 'block' }}>{strength.label}</span>
                </div>
              )}
              <span style={{ display: 'block', marginTop: 8, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>Create a strong password. This locally encrypts all your data and cannot be recovered if lost.</span>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Confirm Password</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter your password" autoComplete="new-password" style={{ width: '100%', padding: '14px 18px', background: 'var(--ink-3)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-md)', fontSize: 15, color: 'var(--text-1)' }} />
            </div>

            {error && (
              <div style={{ marginBottom: 16, padding: '14px 18px', background: 'var(--rose-dim)', border: '1px solid rgba(251,113,133,0.25)', borderRadius: 'var(--r-md)', fontSize: 13, color: 'var(--rose)' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{ width: '100%', padding: 16, marginTop: 8, background: 'linear-gradient(135deg,#0f766e,#0ea5e9)', borderRadius: 'var(--r-md)', fontSize: 15, fontWeight: 500, color: '#fff', opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 24px rgba(45,212,191,0.2)' }}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p style={{ marginTop: 24, fontSize: 13, color: 'var(--text-2)', textAlign: 'center' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--teal)', textDecoration: 'underline', textUnderlineOffset: 3 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
