'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useApp } from '@/context/AppContext'
import { createClient } from '@/lib/supabase/client'
import type { Evidence } from '@/lib/types'
import type { ReportSections, ReportMeta } from '@/lib/types'
import toast from 'react-hot-toast'

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((m) => m.PDFDownloadLink),
  { ssr: false, loading: () => null }
)
const ReportDocument = dynamic(
  () => import('@/components/report/ReportDocument'),
  { ssr: false, loading: () => null }
)

interface SavedReport {
  id: string
  caseName: string
  reportType: string
  generatedAt: string
  recipientName: string
  totalMemories: number
  contentHash: string
  sections: ReportSections
  meta: ReportMeta
}

const REPORT_TYPES = [
  { id: 'full',     label: 'Full Documentation',  desc: 'All memories, evidence, timeline, confidence ratings and audit trail',  icon: 'ph-files' },
  { id: 'summary',  label: 'Summary Report',       desc: 'Narrative overview and key events — suitable for initial legal review', icon: 'ph-file-text' },
  { id: 'evidence', label: 'Evidence Index',       desc: 'Vault contents with SHA-256 hashes and chain of custody only',         icon: 'ph-file-lock' },
  { id: 'timeline', label: 'Timeline Report',      desc: 'Chronological account of documented events with confidence ratings',   icon: 'ph-calendar-dots' },
]

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function genId() {
  return 'WR-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase()
}

export default function ReportsPage() {
  const { user, currentCase, memories } = useApp()
  const supabase = createClient()

  const [reportType, setReportType]               = useState('full')
  const [recipientName, setRecipientName]         = useState('')
  const [includeEvidence, setIncludeEvidence]     = useState(true)
  const [includeConfidence, setIncludeConfidence] = useState(true)
  const [includeAuditTrail, setIncludeAuditTrail] = useState(true)
  const [includeLowConf, setIncludeLowConf]       = useState(true)
  const [evidence, setEvidence]                   = useState<Evidence[]>([])
  const [generating, setGenerating]               = useState(false)
  const [progress, setProgress]                   = useState('')
  const [readyReport, setReadyReport]             = useState<{ sections: ReportSections; meta: ReportMeta } | null>(null)
  const [savedReports, setSavedReports]           = useState<SavedReport[]>([])

  useEffect(() => {
    if (currentCase) loadEvidence(currentCase.id)
    loadHistory()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCase])

  async function loadEvidence(caseId: string) {
    const { data } = await supabase.from('evidence').select('*').eq('case_id', caseId)
    setEvidence(data ?? [])
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem('witness_reports')
      setSavedReports(raw ? (JSON.parse(raw) as SavedReport[]) : [])
    } catch { setSavedReports([]) }
  }

  function saveToHistory(report: SavedReport) {
    const all = [report, ...savedReports].slice(0, 20)
    localStorage.setItem('witness_reports', JSON.stringify(all))
    setSavedReports(all)
  }

  const generate = useCallback(async () => {
    if (!currentCase || !user) { toast.error('Select a case first.'); return }
    if (memories.length === 0) { toast.error('Add at least one memory before generating a report.'); return }

    setGenerating(true); setReadyReport(null); setProgress('Preparing case data…')

    try {
      const filteredMemories = memories.filter((m) => includeLowConf ? true : m.confidence !== 'low')
      setProgress('Sending to AI for analysis…')

      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseName: currentCase.name,
          memories: filteredMemories.map((m) => ({
            title: m.title, content: m.content ?? '',
            memory_type: m.memory_type, confidence: m.confidence,
            approximate_date: m.approximate_date, created_at: m.created_at,
          })),
          evidence: includeEvidence ? evidence.map((e) => ({
            file_name: e.file_name, file_size: e.file_size,
            sha256_hash: e.sha256_hash, uploaded_at: e.uploaded_at ?? e.created_at,
          })) : [],
          includeEvidence, includeConfidence, includeAuditTrail, recipientName, reportType,
        }),
      })

      if (!res.ok) { const e = await res.json() as { error: string }; throw new Error(e.error) }
      const { sections } = await res.json() as { sections: ReportSections }

      setProgress('Computing chain of custody hash…')
      const contentHash = await sha256(JSON.stringify(sections) + currentCase.id + Date.now())
      const reportId    = genId()
      const generatedAt = new Date().toLocaleString()

      const meta: ReportMeta = {
        caseName: currentCase.name, reportId, reportType,
        recipientName: recipientName || 'Legal representative',
        generatedAt, generatedBy: user.email ?? 'Unknown',
        totalMemories: filteredMemories.length, totalEvidence: evidence.length,
        contentHash,
        evidenceList: includeEvidence ? evidence.map((e) => ({
          file_name: e.file_name, file_size: e.file_size,
          sha256_hash: e.sha256_hash, uploaded_at: e.uploaded_at ?? e.created_at,
        })) : [],
        includeEvidence, includeAuditTrail,
      }

      setReadyReport({ sections, meta })
      saveToHistory({ id: reportId, caseName: currentCase.name, reportType, generatedAt,
        recipientName: meta.recipientName, totalMemories: filteredMemories.length,
        contentHash, sections, meta })
      setProgress('')
      toast.success('Report generated!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Generation failed.')
      setProgress('')
    } finally { setGenerating(false) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCase, user, memories, evidence, reportType, recipientName, includeEvidence, includeConfidence, includeAuditTrail, includeLowConf])

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 24 }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 400, color: 'var(--text-1)', marginBottom: 6 }}>Legal Reports</h2>
          <p style={{ fontSize: 13, color: 'var(--text-2)' }}>
            Compile documented memories and evidence into a structured, court-ready PDF.
            {currentCase
              ? <span style={{ color: 'var(--teal)', marginLeft: 6 }}>Working on: <strong>{currentCase.name}</strong></span>
              : <span style={{ color: 'var(--rose)', marginLeft: 6 }}>Select a case from the sidebar first.</span>}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

          {/* ── Config ────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Report type selector */}
            <div style={{ background: 'var(--ink-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', marginBottom: 2 }}>Report type</h4>
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {REPORT_TYPES.map((rt) => (
                  <div key={rt.id} onClick={() => setReportType(rt.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 'var(--r-md)', border: `1px solid ${reportType === rt.id ? 'rgba(45,212,191,0.4)' : 'var(--border)'}`, background: reportType === rt.id ? 'var(--teal-dim)' : 'var(--ink-3)', cursor: 'pointer', transition: 'all 0.15s' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 'var(--r-sm)', background: reportType === rt.id ? 'rgba(45,212,191,0.2)' : 'var(--ink-4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: reportType === rt.id ? 'var(--teal)' : 'var(--text-3)', flexShrink: 0 }}>
                      <i className={`ph ${rt.icon}`} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: reportType === rt.id ? 'var(--text-1)' : 'var(--text-2)', marginBottom: 2 }}>{rt.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.4 }}>{rt.desc}</div>
                    </div>
                    {reportType === rt.id && <i className="ph ph-check-circle" style={{ color: 'var(--teal)', fontSize: 18, flexShrink: 0 }} />}
                  </div>
                ))}
              </div>
            </div>

            {/* Recipient */}
            <div style={{ background: 'var(--ink-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 20 }}>
              <h4 style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', marginBottom: 12 }}>Prepared for</h4>
              <input type="text" value={recipientName} onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Lawyer / advocate name or organization"
                style={{ width: '100%', padding: '11px 14px', background: 'var(--ink-3)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-md)', fontSize: 13, color: 'var(--text-1)', outline: 'none', boxSizing: 'border-box' }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--teal)'; e.target.style.boxShadow = '0 0 0 3px var(--teal-dim)' }}
                onBlur={(e)  => { e.target.style.borderColor = 'var(--border-2)'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {/* Options */}
            <div style={{ background: 'var(--ink-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>Include in report</h4>
              </div>
              {[
                { label: 'Evidence vault index',    desc: `${evidence.length} file${evidence.length !== 1 ? 's' : ''} with SHA-256 hashes`, val: includeEvidence,   set: setIncludeEvidence },
                { label: 'Confidence ratings',      desc: 'Show high / medium / low on all entries',                                        val: includeConfidence, set: setIncludeConfidence },
                { label: 'Audit trail',             desc: 'Generation metadata and chain of custody',                                       val: includeAuditTrail, set: setIncludeAuditTrail },
                { label: 'Low-confidence memories', desc: 'Include entries marked as uncertain',                                            val: includeLowConf,    set: setIncludeLowConf },
              ].map((opt, idx, arr) => (
                <div key={opt.label} onClick={() => opt.set(!opt.val)}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', cursor: 'pointer', borderBottom: idx < arr.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--ink-3)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '' }}>
                  <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${opt.val ? 'var(--teal)' : 'var(--border-2)'}`, background: opt.val ? 'var(--teal)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                    {opt.val && <i className="ph ph-check" style={{ fontSize: 11, color: 'var(--ink)' }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text-1)' }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{opt.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats strip */}
            <div style={{ background: 'var(--ink-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 16, display: 'flex', gap: 12 }}>
              {[
                { label: 'Memories',  value: memories.length,                                            icon: 'ph-brain',     color: 'teal' },
                { label: 'Evidence',  value: evidence.length,                                            icon: 'ph-file-lock', color: 'rose' },
                { label: 'High conf', value: memories.filter((m) => m.confidence === 'high').length,    icon: 'ph-seal-check',color: 'teal' },
              ].map((stat) => (
                <div key={stat.label} style={{ flex: 1, background: 'var(--ink-3)', borderRadius: 'var(--r-md)', padding: '12px 14px', textAlign: 'center' }}>
                  <i className={`ph ${stat.icon}`} style={{ fontSize: 20, color: `var(--${stat.color})`, marginBottom: 6, display: 'block' }} />
                  <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-1)', fontFamily: 'var(--mono)', lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right panel ───────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 24 }}>

            {/* Generate */}
            <div style={{ background: 'var(--ink-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--r-sm)', background: 'var(--teal-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'var(--teal)' }}>
                  <i className="ph ph-sparkle" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>AI Report Generation</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Powered by Gemini 2.5 Flash</div>
                </div>
              </div>
              <button onClick={generate} disabled={generating || !currentCase || memories.length === 0}
                style={{ width: '100%', padding: 14, background: generating ? 'var(--ink-3)' : 'linear-gradient(135deg,#0f766e,#0ea5e9)', border: `1px solid ${generating ? 'var(--border)' : 'rgba(45,212,191,0.3)'}`, borderRadius: 'var(--r-md)', fontSize: 14, fontWeight: 500, color: generating ? 'var(--text-3)' : '#fff', cursor: generating || !currentCase || memories.length === 0 ? 'not-allowed' : 'pointer', opacity: !currentCase || memories.length === 0 ? 0.5 : 1, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {generating
                  ? <><span style={{ width: 14, height: 14, border: '2px solid var(--border-2)', borderTopColor: 'var(--teal)', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />{progress || 'Generating…'}</>
                  : <><i className="ph ph-file-pdf" />Generate Report</>}
              </button>
            </div>

            {/* Download */}
            {readyReport && (
              <div style={{ background: 'var(--ink-2)', border: '1px solid rgba(45,212,191,0.3)', borderRadius: 'var(--r-lg)', padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <i className="ph ph-check-circle" style={{ fontSize: 20, color: 'var(--teal)' }} />
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>Report ready</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 14, lineHeight: 1.6 }}>
                  <div>ID: <span style={{ fontFamily: 'var(--mono)', color: 'var(--teal)' }}>{readyReport.meta.reportId}</span></div>
                  <div style={{ marginTop: 2 }}>Hash: <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-2)' }}>{readyReport.meta.contentHash.slice(0, 20)}…</span></div>
                </div>
                
                <PDFDownloadLink document={<ReportDocument sections={readyReport.sections} meta={readyReport.meta} />}
                  fileName={`witness-report-${readyReport.meta.reportId}.pdf`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: 12, background: 'linear-gradient(135deg,#0f766e,#0ea5e9)', border: 'none', borderRadius: 'var(--r-md)', fontSize: 13, fontWeight: 500, color: '#fff', cursor: 'pointer', textDecoration: 'none', marginBottom: 8 }}>
                  {({ loading }: { loading: boolean }) => loading ? 'Rendering PDF…' : <><i className="ph ph-download-simple" />Download PDF</>}
                </PDFDownloadLink>
                <button onClick={() => setReadyReport(null)} style={{ width: '100%', padding: 10, background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 12, color: 'var(--text-3)', cursor: 'pointer' }}>
                  Generate another
                </button>
              </div>
            )}

            {/* Info box */}
            <div style={{ background: 'rgba(45,212,191,0.04)', border: '1px solid rgba(45,212,191,0.12)', borderRadius: 'var(--r-md)', padding: 14 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <i className="ph ph-lock-key" style={{ color: 'var(--teal)', fontSize: 16, flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
                  The AI only structures what you have documented. It never adds, infers, or fabricates details. All uncertainty is clearly labeled.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── History ───────────────────────────────────────────── */}
        {savedReports.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <h3 style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 400, color: 'var(--text-1)', marginBottom: 14 }}>Report history</h3>
            <div style={{ background: 'var(--ink-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
              {savedReports.map((r, i) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: i < savedReports.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--ink-3)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--r-sm)', background: 'var(--rose-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'var(--rose)', flexShrink: 0 }}>
                    <i className="ph ph-file-pdf" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {REPORT_TYPES.find((t) => t.id === r.reportType)?.label ?? 'Report'} — {r.caseName}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                      {r.generatedAt} · {r.totalMemories} memories · For: {r.recipientName}
                    </div>
                  </div>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', flexShrink: 0 }}>{r.id}</span>
                  
                  <PDFDownloadLink document={<ReportDocument sections={r.sections} meta={r.meta} />}
                    fileName={`witness-report-${r.id}.pdf`}
                    style={{ padding: '7px 12px', background: 'var(--ink-3)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: 12, color: 'var(--text-2)', cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {({ loading }: { loading: boolean }) => loading ? 'Loading…' : <><i className="ph ph-download-simple" />Download</>}
                  </PDFDownloadLink>
                  <button onClick={() => { const u = savedReports.filter((x) => x.id !== r.id); localStorage.setItem('witness_reports', JSON.stringify(u)); setSavedReports(u) }}
                    style={{ width: 30, height: 30, borderRadius: 'var(--r-sm)', background: 'none', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--text-3)', cursor: 'pointer', flexShrink: 0 }}>
                    <i className="ph ph-trash" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
