'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useApp } from '@/context/AppContext'
import { hashFile, formatBytes, timeAgo } from '@/lib/utils'
import type { Evidence } from '@/lib/types'
import toast from 'react-hot-toast'

const FILE_TABS = ['All files', 'Documents', 'Images', 'Audio', 'Messages'] as const
const FILE_FILTERS = ['All', 'Verified', 'Linked to memory', 'Unreviewed'] as const

const TAB_EXTS: Record<string, string[]> = {
  'All files':  [],
  'Documents':  ['pdf','doc','docx','txt','csv'],
  'Images':     ['png','jpg','jpeg','gif','webp','heic'],
  'Audio':      ['mp3','m4a','wav','ogg','aac'],
  'Messages':   ['txt','csv','eml','mbox'],
}

const TYPE_ORDER: Record<string, number> = {
  pdf:0, docx:1, doc:1, txt:2, png:3, jpg:3, jpeg:3, gif:3, mp4:4, mp3:5, m4a:5, wav:5
}

const FILE_TYPE_MAP: Record<string, { thumb: string; icon: string; color: string }> = {
  pdf: { thumb: 'pdf', icon: 'ph-file-pdf', color: 'var(--rose)' },
  png: { thumb: 'img', icon: 'ph-image', color: 'var(--sky)' },
  jpg: { thumb: 'img', icon: 'ph-image', color: 'var(--sky)' },
  jpeg: { thumb: 'img', icon: 'ph-image', color: 'var(--sky)' },
  mp3: { thumb: 'audio', icon: 'ph-microphone', color: 'var(--violet)' },
  m4a: { thumb: 'audio', icon: 'ph-microphone', color: 'var(--violet)' },
  wav: { thumb: 'audio', icon: 'ph-microphone', color: 'var(--violet)' },
  docx: { thumb: 'doc', icon: 'ph-file-text', color: '#4ade80' },
  doc: { thumb: 'doc', icon: 'ph-file-text', color: '#4ade80' },
  mp4: { thumb: 'vid', icon: 'ph-video', color: 'var(--amber)' },
}

const THUMB_BG: Record<string, string> = {
  pdf: 'linear-gradient(135deg,#1e0a0a,#2d0f0f)',
  img: 'linear-gradient(135deg,#0a1020,#0f1e30)',
  audio: 'linear-gradient(135deg,#100a1e,#180f2d)',
  doc: 'linear-gradient(135deg,#0a1408,#0f2010)',
  vid: 'linear-gradient(135deg,#1e1000,#2d1a00)',
}

function getFileType(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  return FILE_TYPE_MAP[ext] ?? { thumb: 'doc', icon: 'ph-file', color: 'var(--text-2)' }
}

export default function VaultPage() {
  const supabase = createClient()
  const { user, currentCase, pushNotification } = useApp()
  const [activeTab, setActiveTab] = useState<string>('All files')
  const [activeFilter, setActiveFilter] = useState<string>('All')
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [uploading, setUploading] = useState(false)
  const [draggingOver, setDraggingOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (currentCase) loadEvidence(currentCase.id)
  }, [currentCase]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadEvidence(caseId: string) {
    const { data } = await supabase
      .from('evidence')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })
    setEvidence(data ?? [])
  }

  async function uploadFile(file: File) {
    if (!user || !currentCase) { toast.error('Select a case first.'); return }
    setUploading(true)
    try {
      const hash = await hashFile(file)
      const path = `${user.id}/${currentCase.id}/${Date.now()}_${file.name}`
      const { error: uploadError } = await supabase.storage.from('evidence').upload(path, file)
      if (uploadError) throw uploadError
      const { error: dbError } = await supabase.from('evidence').insert({
        case_id: currentCase.id,
        user_id: user.id,
        file_name: file.name,
        file_type: file.type || 'application/octet-stream',
        file_size: file.size,
        storage_path: path,
        sha256_hash: hash,
      })
      if (dbError) throw dbError
      toast.success(`${file.name} uploaded and hashed.`)
      pushNotification('Evidence uploaded', file.name, 'evidence')
      await loadEvidence(currentCase.id)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDraggingOver(false)
    const files = Array.from(e.dataTransfer.files)
    files.forEach(uploadFile)
  }, [uploadFile]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 24 }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 18, background: 'var(--ink-2)', padding: 4, borderRadius: 'var(--r-sm)', width: 'fit-content', border: '1px solid var(--border)' }}>
        {FILE_TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500, color: activeTab === tab ? 'var(--text-1)' : 'var(--text-2)', background: activeTab === tab ? 'var(--ink-4)' : 'transparent', cursor: 'pointer', border: 'none' }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {FILE_FILTERS.map((f) => (
          <button key={f} onClick={() => setActiveFilter(f)} style={{ padding: '6px 13px', borderRadius: 999, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: `1px solid ${activeFilter === f ? 'rgba(45,212,191,0.3)' : 'var(--border)'}`, color: activeFilter === f ? 'var(--teal)' : 'var(--text-2)', background: activeFilter === f ? 'var(--teal-dim)' : 'var(--ink-2)' }}>
            {f}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: 14 }}>
        {/* Upload zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDraggingOver(true) }}
          onDragLeave={() => setDraggingOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{ border: `2px dashed ${draggingOver ? 'var(--teal)' : 'var(--border-2)'}`, borderRadius: 'var(--r-lg)', padding: 36, textAlign: 'center', cursor: 'pointer', background: draggingOver ? 'var(--teal-dim)' : 'var(--ink-2)', transition: 'all 0.2s' }}
        >
          <i className="ph ph-cloud-arrow-up" style={{ fontSize: 34, color: 'var(--text-3)', marginBottom: 10, display: 'block' }} />
          <h5 style={{ fontSize: 14, color: 'var(--text-1)', marginBottom: 5 }}>{uploading ? 'Uploading…' : 'Drop files to encrypt & upload'}</h5>
          <p style={{ fontSize: 12, color: 'var(--text-3)' }}>PDF, images, audio, video. All files are hashed & encrypted before upload.</p>
          <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={(e) => { Array.from(e.target.files ?? []).forEach(uploadFile); e.target.value = '' }} />
        </div>

        {[...evidence]
          .filter((ev) => {
            const ext = ev.file_name.split('.').pop()?.toLowerCase() ?? ''
            const allowed = TAB_EXTS[activeTab]
            if (allowed && allowed.length > 0 && !allowed.includes(ext)) return false
            return true
          })
          .sort((a, b) => {
            const extA = a.file_name.split('.').pop()?.toLowerCase() ?? ''
            const extB = b.file_name.split('.').pop()?.toLowerCase() ?? ''
            const orderA = TYPE_ORDER[extA] ?? 99
            const orderB = TYPE_ORDER[extB] ?? 99
            if (orderA !== orderB) return orderA - orderB
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          })
          .map((ev) => {
          const ft = getFileType(ev.file_name)
          return (
            <div key={ev.id} style={{ background: 'var(--ink-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s var(--ease)' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-2)'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.3)' }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
              <div style={{ height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, background: THUMB_BG[ft.thumb] ?? THUMB_BG.doc, color: ft.color }}>
                <i className={`ph ${ft.icon}`} />
              </div>
              <div style={{ padding: '12px 14px' }}>
                <h5 style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.file_name}</h5>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8, fontFamily: 'var(--mono)' }}>{timeAgo(ev.created_at)} · {formatBytes(ev.file_size)}</div>
                <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text-3)', background: 'var(--ink-3)', padding: '4px 8px', borderRadius: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>sha256: {ev.sha256_hash.slice(0, 32)}…</div>
              </div>
              <div style={{ padding: '9px 14px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--teal)', fontWeight: 500 }}>
                  <i className="ph ph-seal-check" style={{ fontSize: 13 }} />Chain of custody
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  <button style={{ width: 26, height: 26, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--text-3)', cursor: 'pointer' }}>
                    <i className="ph ph-eye" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
