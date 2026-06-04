'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useApp } from '@/context/AppContext'
import TwoFactorSetup from '@/components/settings/TwoFactorSetup'
import toast from 'react-hot-toast'
import type { Factor } from '@supabase/supabase-js'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { user, cases } = useApp()
  const [mfaFactors, setMfaFactors] = useState<Factor[]>([])
  const [showSetup, setShowSetup] = useState(false)
  const [prefs, setPrefs] = useState({ ai: true, emailNotif: false, compact: false })
  const [timeout, setTimeout2] = useState('60')

  useEffect(() => {
    loadMfa()
    try {
      const stored = localStorage.getItem('witness_prefs')
      if (stored) setPrefs(JSON.parse(stored))
      const t = localStorage.getItem('witness_timeout')
      if (t) setTimeout2(t)
    } catch { /* ignore */ }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadMfa() {
    const { data } = await supabase.auth.mfa.listFactors()
    setMfaFactors(data?.totp ?? [])
  }

  async function sendPasswordReset() {
    if (!user?.email) return
    const { error } = await supabase.auth.resetPasswordForEmail(user.email)
    if (error) toast.error(error.message)
    else toast.success('Password reset link sent to your email.')
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function removeMfa(factorId: string) {
    const { error } = await supabase.auth.mfa.unenroll({ factorId })
    if (error) toast.error(error.message)
    else { toast.success('2FA removed.'); loadMfa() }
  }

  function savePref(key: string, value: boolean) {
    const next = { ...prefs, [key]: value }
    setPrefs(next as typeof prefs)
    try { localStorage.setItem('witness_prefs', JSON.stringify(next)) } catch { /* ignore */ }
  }

  function saveTimeout(val: string) {
    setTimeout2(val)
    try { localStorage.setItem('witness_timeout', val) } catch { /* ignore */ }
  }

  const hasMfa = mfaFactors.some((f) => f.status === 'verified')

  const panelStyle = { background: 'var(--ink-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden', marginBottom: 16 }
  const panelHead = { padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }
  const rowStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between' as const }
  const divider = { height: 1, background: 'var(--border)' }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 24 }}>
      <div style={{ maxWidth: 680 }}>
        <h3 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 400, color: 'var(--text-1)', marginBottom: 6 }}>Settings</h3>
        <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 28 }}>Manage your account, privacy, and application preferences.</p>

        {/* Account */}
        <div style={panelStyle}>
          <div style={panelHead}>
            <h4 style={{ fontSize: 14, fontWeight: 500 }}><i className="ph ph-user-circle" style={{ marginRight: 8, color: 'var(--teal)' }} />Account</h4>
          </div>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={rowStyle}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', marginBottom: 3 }}>Email address</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{user?.email ?? '—'}</div>
              </div>
              <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 999, background: 'var(--ink-4)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>Verified</span>
            </div>
            <div style={divider} />
            <div style={rowStyle}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', marginBottom: 3 }}>Change password</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Send a password reset link to your email</div>
              </div>
              <button onClick={sendPasswordReset} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 'var(--r-sm)', fontSize: 12, fontWeight: 500, color: 'var(--text-2)', border: '1px solid var(--border)', background: 'var(--ink-2)', cursor: 'pointer' }}>
                <i className="ph ph-envelope" />Send reset link
              </button>
            </div>
            <div style={divider} />
            <div style={rowStyle}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--rose)', marginBottom: 3 }}>Sign out</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>End your current session on this device</div>
              </div>
              <button onClick={signOut} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 'var(--r-sm)', fontSize: 12, fontWeight: 500, color: 'var(--rose)', border: '1px solid var(--rose-dim)', background: 'var(--ink-2)', cursor: 'pointer' }}>
                <i className="ph ph-sign-out" />Sign out
              </button>
            </div>
          </div>
        </div>

        {/* Privacy & Security */}
        <div style={panelStyle}>
          <div style={panelHead}>
            <h4 style={{ fontSize: 14, fontWeight: 500 }}><i className="ph ph-shield-check" style={{ marginRight: 8, color: 'var(--teal)' }} />Privacy &amp; Security</h4>
          </div>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={rowStyle}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', marginBottom: 3 }}>End-to-end encryption</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>AES-256-GCM with PBKDF2 key derivation — always on</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--teal)', fontWeight: 500 }}>
                <i className="ph ph-lock-key" />Active
              </div>
            </div>
            <div style={divider} />
            <div style={rowStyle}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', marginBottom: 3 }}>Audit log</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Every action on your account is recorded immutably</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--teal)', fontWeight: 500 }}>
                <i className="ph ph-check-circle" />Enabled
              </div>
            </div>
            <div style={divider} />
            <div style={rowStyle}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', marginBottom: 3 }}>Session timeout</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Automatically sign out after inactivity</div>
              </div>
              <select value={timeout} onChange={(e) => saveTimeout(e.target.value)} style={{ background: 'var(--ink-3)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-sm)', color: 'var(--text-1)', fontSize: 12, padding: '6px 10px', cursor: 'pointer' }}>
                <option value="never">Never</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="480">8 hours</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2FA */}
        <div style={panelStyle}>
          <div style={panelHead}>
            <h4 style={{ fontSize: 14, fontWeight: 500 }}><i className="ph ph-device-mobile" style={{ marginRight: 8, color: 'var(--teal)' }} />Two-Factor Authentication</h4>
          </div>
          <div style={{ padding: 20 }}>
            {hasMfa ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--teal)', fontWeight: 500, padding: '6px 12px', background: 'var(--teal-dim)', border: '1px solid rgba(45,212,191,0.25)', borderRadius: 'var(--r-sm)' }}>
                    <i className="ph ph-shield-check" />2FA Active
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Your account is protected with TOTP.</span>
                </div>
                <button onClick={() => removeMfa(mfaFactors[0]?.id ?? '')} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 'var(--r-sm)', fontSize: 12, fontWeight: 500, color: 'var(--rose)', border: '1px solid var(--rose-dim)', background: 'var(--ink-2)', cursor: 'pointer' }}>
                  <i className="ph ph-x" />Remove 2FA
                </button>
              </div>
            ) : showSetup ? (
              <TwoFactorSetup onEnrolled={() => { setShowSetup(false); loadMfa() }} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', marginBottom: 3 }}>Two-factor authentication</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Add an extra layer of security to your account</div>
                </div>
                <button onClick={() => setShowSetup(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 'var(--r-sm)', fontSize: 13, fontWeight: 500, color: '#fff', border: '1px solid rgba(45,212,191,0.3)', background: 'linear-gradient(135deg,#0f766e,#0c6892)', cursor: 'pointer' }}>
                  <i className="ph ph-shield-plus" />Set up 2FA
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Preferences */}
        <div style={panelStyle}>
          <div style={panelHead}>
            <h4 style={{ fontSize: 14, fontWeight: 500 }}><i className="ph ph-sliders" style={{ marginRight: 8, color: 'var(--teal)' }} />Preferences</h4>
          </div>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { key: 'ai', label: 'AI assistant', sub: 'Enable the Gemini-powered documentation assistant' },
              { key: 'emailNotif', label: 'Email notifications', sub: 'Receive updates about your cases via email' },
              { key: 'compact', label: 'Compact memory list', sub: 'Show more entries with reduced spacing' },
            ].map((pref, i) => (
              <div key={pref.key}>
                {i > 0 && <div style={{ ...divider, marginBottom: 16 }} />}
                <div style={rowStyle}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', marginBottom: 3 }}>{pref.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{pref.sub}</div>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input type="checkbox" checked={prefs[pref.key as keyof typeof prefs]} onChange={(e) => savePref(pref.key, e.target.checked)} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
                    <div style={{ width: 40, height: 22, background: prefs[pref.key as keyof typeof prefs] ? 'var(--teal-dim)' : 'var(--ink-4)', border: `1px solid ${prefs[pref.key as keyof typeof prefs] ? 'rgba(45,212,191,0.35)' : 'var(--border-2)'}`, borderRadius: 999, position: 'relative', transition: 'background 0.2s' }}>
                      <div style={{ position: 'absolute', top: 3, left: prefs[pref.key as keyof typeof prefs] ? 21 : 3, width: 14, height: 14, background: prefs[pref.key as keyof typeof prefs] ? 'var(--teal)' : 'var(--text-3)', borderRadius: '50%', transition: 'left 0.2s, background 0.2s' }} />
                    </div>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data */}
        <div style={panelStyle}>
          <div style={panelHead}>
            <h4 style={{ fontSize: 14, fontWeight: 500 }}><i className="ph ph-database" style={{ marginRight: 8, color: 'var(--rose)' }} />Data &amp; Storage</h4>
          </div>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={rowStyle}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', marginBottom: 3 }}>Cases</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{cases.length} case file{cases.length !== 1 ? 's' : ''}</div>
              </div>
            </div>
            <div style={divider} />
            <div style={rowStyle}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--rose)', marginBottom: 3 }}>Delete account</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Permanently delete all your data. This cannot be undone.</div>
              </div>
              <button onClick={() => toast('To permanently delete your account, please contact support. This requires identity verification to protect your data.')} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 'var(--r-sm)', fontSize: 12, fontWeight: 500, color: 'var(--rose)', border: '1px solid var(--rose-dim)', background: 'var(--ink-2)', cursor: 'pointer' }}>
                <i className="ph ph-warning" />Delete account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
