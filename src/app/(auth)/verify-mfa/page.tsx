'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function VerifyMfaPage() {
  const router = useRouter()
  const supabase = createClient()
  const [code, setCode] = useState('')
  const [factorId, setFactorId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fid = sessionStorage.getItem('mfa_factor_id')
    if (!fid) { router.replace('/login'); return }
    setFactorId(fid)
  }, [router])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (code.length !== 6) { setError('Enter your 6-digit code.'); return }
    setLoading(true)
    setError('')
    try {
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code,
      })
      if (verifyError) throw verifyError
      sessionStorage.removeItem('mfa_factor_id')
      toast.success('Verified! Welcome back.')
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ink)' }}>
      <div style={{ width: 400, position: 'relative', zIndex: 1, animation: 'fadeUp 0.8s var(--ease) both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48 }}>
          <div style={{ width: 52, height: 52, borderRadius: 'var(--r-md)', background: 'linear-gradient(135deg,var(--teal),#0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, color: '#fff', boxShadow: '0 0 32px rgba(45,212,191,0.35)' }}>
            <i className="ph ph-shield-check" />
          </div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 32, fontWeight: 400, background: 'linear-gradient(135deg,var(--text-1),var(--teal))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Witness</h1>
        </div>

        <div style={{ background: 'var(--ink-2)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-xl)', padding: 40 }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 400, color: 'var(--text-1)', marginBottom: 8 }}>Two-factor verification</h2>
            <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>Enter the 6-digit code from your authenticator app to continue.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Verification Code</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                autoFocus
                style={{ width: '100%', padding: '14px 18px', background: 'var(--ink-3)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-md)', fontSize: 24, color: 'var(--text-1)', fontFamily: 'var(--mono)', letterSpacing: '0.3em', textAlign: 'center' }}
              />
            </div>

            {error && (
              <div style={{ marginBottom: 16, padding: '14px 18px', background: 'var(--rose-dim)', border: '1px solid rgba(251,113,133,0.25)', borderRadius: 'var(--r-md)', fontSize: 13, color: 'var(--rose)' }}>{error}</div>
            )}

            <button type="submit" disabled={loading || code.length !== 6} style={{ width: '100%', padding: 16, marginTop: 8, background: 'linear-gradient(135deg,#0f766e,#0ea5e9)', borderRadius: 'var(--r-md)', fontSize: 15, fontWeight: 500, color: '#fff', opacity: (loading || code.length !== 6) ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Verifying…' : 'Verify'}
            </button>
          </form>

          <p style={{ marginTop: 16, fontSize: 12, color: 'var(--text-3)', textAlign: 'center' }}>
            Lost access to your authenticator? Use your backup code or contact support.
          </p>
        </div>
      </div>
    </div>
  )
}
