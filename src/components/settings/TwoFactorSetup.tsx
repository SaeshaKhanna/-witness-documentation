'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import QRCode from 'qrcode'

interface Props {
  onEnrolled: () => void
}

export default function TwoFactorSetup({ onEnrolled }: Props) {
  const supabase = createClient()
  const [step, setStep] = useState<'init' | 'qr' | 'verify' | 'done'>('init')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [uri, setUri] = useState('')
  const [factorId, setFactorId] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function startEnrollment() {
    setLoading(true)
    setError('')
    try {
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'Witness',
        friendlyName: 'Authenticator App',
      })
      if (enrollError) throw enrollError
      if (!data?.totp) throw new Error('TOTP data not returned.')

      const { qr_code, uri: totpUri, secret } = data.totp
      const fid = data.id
      setFactorId(fid)
      setUri(totpUri)

      // Generate QR from the uri
      const dataUrl = await QRCode.toDataURL(totpUri, { width: 200, margin: 2, color: { dark: '#2dd4bf', light: '#13161b' } })
      setQrDataUrl(dataUrl)
      setStep('qr')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start enrollment.')
    } finally {
      setLoading(false)
    }
  }

  async function verifyCode() {
    if (code.length !== 6) { setError('Enter your 6-digit code.'); return }
    setLoading(true)
    setError('')
    try {
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code,
      })
      if (verifyError) throw verifyError
      setStep('done')
      toast.success('2FA is now active on your account!')
      onEnrolled()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed. Check your code.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'init') {
    return (
      <div>
        <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16, lineHeight: 1.6 }}>
          Add an extra layer of protection to your account. You&apos;ll need an authenticator app like Google Authenticator, Authy, or 1Password.
        </p>
        {error && <div style={{ padding: '12px 16px', background: 'var(--rose-dim)', border: '1px solid rgba(251,113,133,0.25)', borderRadius: 'var(--r-md)', fontSize: 13, color: 'var(--rose)', marginBottom: 16 }}>{error}</div>}
        <button onClick={startEnrollment} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 'var(--r-sm)', fontSize: 13, fontWeight: 500, color: '#fff', border: '1px solid rgba(45,212,191,0.3)', background: 'linear-gradient(135deg,#0f766e,#0c6892)', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}>
          <i className="ph ph-qr-code" />{loading ? 'Starting…' : 'Set up 2FA'}
        </button>
      </div>
    )
  }

  if (step === 'qr') {
    return (
      <div>
        <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16, lineHeight: 1.6 }}>
          Scan this QR code with your authenticator app, then enter the 6-digit code below.
        </p>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginBottom: 20 }}>
          {qrDataUrl && <img src={qrDataUrl} alt="2FA QR Code" style={{ borderRadius: 8, border: '1px solid var(--border-2)' }} />}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Manual entry URI</div>
            <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text-2)', background: 'var(--ink-3)', padding: '8px 12px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', wordBreak: 'break-all', maxWidth: 220 }}>{uri}</div>
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Verification Code</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            autoFocus
            style={{ width: '100%', maxWidth: 200, padding: '12px 16px', background: 'var(--ink-3)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-md)', fontSize: 20, color: 'var(--text-1)', fontFamily: 'var(--mono)', letterSpacing: '0.3em', textAlign: 'center' }}
          />
        </div>
        {error && <div style={{ padding: '12px 16px', background: 'var(--rose-dim)', border: '1px solid rgba(251,113,133,0.25)', borderRadius: 'var(--r-md)', fontSize: 13, color: 'var(--rose)', marginBottom: 16 }}>{error}</div>}
        <button onClick={verifyCode} disabled={loading || code.length !== 6} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 'var(--r-sm)', fontSize: 13, fontWeight: 500, color: '#fff', border: '1px solid rgba(45,212,191,0.3)', background: 'linear-gradient(135deg,#0f766e,#0c6892)', cursor: 'pointer', opacity: (loading || code.length !== 6) ? 0.5 : 1 }}>
          <i className="ph ph-check" />{loading ? 'Verifying…' : 'Verify & activate 2FA'}
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--teal-dim)', border: '1px solid rgba(45,212,191,0.25)', borderRadius: 'var(--r-md)', fontSize: 13, color: 'var(--teal)' }}>
      <i className="ph ph-check-circle" style={{ fontSize: 18 }} />
      <strong>2FA is now active</strong> — your account is protected with two-factor authentication.
    </div>
  )
}
