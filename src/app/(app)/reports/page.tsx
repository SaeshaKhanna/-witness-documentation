'use client'

import { useApp } from '@/context/AppContext'

export default function ReportsPage() {
  const { setAiPanelOpen } = useApp()

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', maxWidth: 400 }}>
        <div style={{ width: 68, height: 68, borderRadius: 'var(--r-xl)', background: 'var(--ink-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, color: 'var(--text-3)', marginBottom: 18 }}>
          <i className="ph ph-file-doc" />
        </div>
        <h4 style={{ fontSize: 18, fontFamily: 'var(--serif)', color: 'var(--text-1)', marginBottom: 8 }}>No reports generated yet</h4>
        <p style={{ fontSize: 13, color: 'var(--text-2)', maxWidth: 300, lineHeight: 1.6, marginBottom: 22 }}>
          Use the AI Assistant to compile your documented memories and evidence into a structured legal report.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => setAiPanelOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 'var(--r-sm)', fontSize: 14, fontWeight: 500, color: '#fff', border: '1px solid rgba(45,212,191,0.3)', background: 'linear-gradient(135deg,#0f766e,#0c6892)', cursor: 'pointer' }}
          >
            <i className="ph ph-sparkle" />Draft with AI
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 'var(--r-sm)', fontSize: 14, fontWeight: 500, color: 'var(--text-2)', border: '1px solid var(--border)', background: 'var(--ink-2)', cursor: 'pointer' }}>
            <i className="ph ph-pencil-simple" />Write manually
          </button>
        </div>
      </div>
    </div>
  )
}
