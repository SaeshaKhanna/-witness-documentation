'use client'

import {
  Document, Page, Text, View, StyleSheet, Font,
} from '@react-pdf/renderer'

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ReportSections {
  caseOverview: string
  chronologicalNarrative: string
  keyPeople: string
  keyLocations: string
  emotionalSensoryRecord: string
  evidenceSummary: string
  confidenceAssessment: string
  documentationNotes: string
}

export interface ReportMeta {
  caseName: string
  reportId: string
  reportType: string
  recipientName: string
  generatedAt: string
  generatedBy: string
  totalMemories: number
  totalEvidence: number
  contentHash: string
  evidenceList: Array<{
    file_name: string
    file_size: number
    sha256_hash: string
    uploaded_at: string
  }>
  includeEvidence: boolean
  includeAuditTrail: boolean
}

// ── Styles ────────────────────────────────────────────────────────────────────
const C = {
  ink:     '#0d0f12',
  dark:    '#13161b',
  teal:    '#0d9488',
  tealLt:  '#ccfbf1',
  text:    '#1e293b',
  muted:   '#64748b',
  border:  '#e2e8f0',
  white:   '#ffffff',
  rose:    '#e11d48',
  amber:   '#d97706',
}

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: C.text,
    paddingTop: 0,
    paddingBottom: 48,
    paddingHorizontal: 0,
  },

  // Cover
  cover: {
    backgroundColor: C.ink,
    minHeight: '100%',
    padding: 56,
    display: 'flex',
    flexDirection: 'column',
  },
  coverLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 48,
    gap: 12,
  },
  coverLogoBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: C.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverLogoText: {
    fontSize: 20,
    color: C.white,
    fontFamily: 'Helvetica-Bold',
  },
  coverWordmark: {
    fontSize: 22,
    color: C.white,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
  },
  coverDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: 40,
  },
  coverTitle: {
    fontSize: 28,
    color: C.white,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    lineHeight: 1.3,
  },
  coverSubtitle: {
    fontSize: 13,
    color: C.tealLt,
    marginBottom: 48,
  },
  coverMeta: {
    marginTop: 'auto',
    borderTop: `1px solid rgba(255,255,255,0.12)`,
    paddingTop: 24,
    gap: 8,
  },
  coverMetaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  coverMetaLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.4)',
    width: 110,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  coverMetaValue: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.85)',
    flex: 1,
  },
  coverHash: {
    marginTop: 24,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6,
    borderLeft: `3px solid ${C.teal}`,
  },
  coverHashLabel: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  coverHashValue: {
    fontSize: 8,
    color: C.teal,
    fontFamily: 'Courier',
  },
  coverConfidential: {
    position: 'absolute',
    top: 24,
    right: 40,
    fontSize: 8,
    color: C.rose,
    borderWidth: 1,
    borderColor: C.rose,
    borderRadius: 3,
    padding: '3 8',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // Body pages
  bodyPage: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: C.text,
    paddingBottom: 48,
    paddingHorizontal: 0,
  },
  header: {
    backgroundColor: C.dark,
    paddingHorizontal: 48,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: `2px solid ${C.teal}`,
    marginBottom: 32,
  },
  headerLeft: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  headerRight: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.3)',
    fontFamily: 'Courier',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 48,
    paddingVertical: 12,
    borderTop: `1px solid ${C.border}`,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8,
    color: C.muted,
  },
  footerPage: {
    fontSize: 8,
    color: C.muted,
    fontFamily: 'Courier',
  },

  // Content
  content: { paddingHorizontal: 48 },
  section: { marginBottom: 28 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottom: `1px solid ${C.border}`,
    gap: 8,
  },
  sectionBadge: {
    width: 4,
    height: 16,
    backgroundColor: C.teal,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: C.ink,
    letterSpacing: 0.3,
  },
  sectionNum: {
    fontSize: 10,
    color: C.muted,
    fontFamily: 'Courier',
    marginLeft: 'auto',
  },
  body: {
    fontSize: 10,
    color: C.text,
    lineHeight: 1.7,
  },

  // Evidence table
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: C.dark,
    padding: '6 12',
    borderRadius: '4 4 0 0',
  },
  tableHeaderCell: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  tableRow: {
    flexDirection: 'row',
    padding: '8 12',
    borderBottom: `1px solid ${C.border}`,
    alignItems: 'flex-start',
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  tableCell: {
    fontSize: 9,
    color: C.text,
    lineHeight: 1.4,
  },
  tableCellMono: {
    fontSize: 8,
    color: C.muted,
    fontFamily: 'Courier',
    lineHeight: 1.4,
  },

  // Confidence badges
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  badge: {
    fontSize: 8,
    padding: '3 8',
    borderRadius: 999,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
  },
  badgeHigh:   { backgroundColor: '#ccfbf1', color: '#0d9488' },
  badgeMed:    { backgroundColor: '#fef3c7', color: '#d97706' },
  badgeLow:    { backgroundColor: '#fee2e2', color: '#e11d48' },

  // Disclaimer box
  disclaimer: {
    backgroundColor: '#fef9c3',
    borderLeft: `3px solid ${C.amber}`,
    padding: 12,
    borderRadius: '0 4 4 0',
    marginBottom: 20,
  },
  disclaimerText: {
    fontSize: 9,
    color: '#92400e',
    lineHeight: 1.5,
  },
})

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1048576).toFixed(1)} MB`
}

function PageHeader({ caseName, reportId }: { caseName: string; reportId: string }) {
  return (
    <View style={s.header} fixed>
      <Text style={s.headerLeft}>Witness — {caseName}</Text>
      <Text style={s.headerRight}>ID: {reportId}</Text>
    </View>
  )
}

function PageFooter({ generatedAt }: { generatedAt: string }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>CONFIDENTIAL — Generated by Witness Platform · {generatedAt}</Text>
      <Text style={s.footerPage} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  )
}

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <View style={s.section} wrap={false}>
      <View style={s.sectionHeader}>
        <View style={s.sectionBadge} />
        <Text style={s.sectionTitle}>{title}</Text>
        <Text style={s.sectionNum}>{num}</Text>
      </View>
      {children}
    </View>
  )
}

// ── Main Document ─────────────────────────────────────────────────────────────
export default function ReportDocument({ sections, meta }: { sections: ReportSections; meta: ReportMeta }) {
  const reportTypeLabel: Record<string, string> = {
    full:      'Full Documentation Report',
    summary:   'Summary Report',
    evidence:  'Evidence Index Report',
    timeline:  'Timeline Report',
  }
  const label = reportTypeLabel[meta.reportType] ?? 'Documentation Report'

  return (
    <Document
      title={`Witness Report — ${meta.caseName}`}
      author="Witness Platform"
      subject={label}
      keywords="witness, evidence, legal, confidential"
    >
      {/* ── Cover Page ───────────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <View style={s.cover}>
          <Text style={s.coverConfidential}>Confidential</Text>

          {/* Logo */}
          <View style={s.coverLogo}>
            <View style={s.coverLogoBox}>
              <Text style={s.coverLogoText}>W</Text>
            </View>
            <Text style={s.coverWordmark}>WITNESS</Text>
          </View>

          <View style={s.coverDivider} />

          <Text style={s.coverTitle}>{label}</Text>
          <Text style={s.coverSubtitle}>{meta.caseName}</Text>

          {/* Meta grid */}
          <View style={s.coverMeta}>
            {[
              ['Report ID',        meta.reportId],
              ['Generated',        meta.generatedAt],
              ['Prepared by',      meta.generatedBy],
              ['Prepared for',     meta.recipientName || 'Legal representative'],
              ['Total memories',   `${meta.totalMemories} documented entries`],
              ['Evidence files',   `${meta.totalEvidence} file${meta.totalEvidence !== 1 ? 's' : ''}`],
            ].map(([label, value]) => (
              <View key={label} style={s.coverMetaRow}>
                <Text style={s.coverMetaLabel}>{label}</Text>
                <Text style={s.coverMetaValue}>{value}</Text>
              </View>
            ))}

            {/* Chain of custody hash */}
            <View style={s.coverHash}>
              <Text style={s.coverHashLabel}>Chain of Custody — Content Hash (SHA-256)</Text>
              <Text style={s.coverHashValue}>{meta.contentHash}</Text>
            </View>
          </View>
        </View>
      </Page>

      {/* ── Disclaimer Page ──────────────────────────────────────── */}
      <Page size="A4" style={s.bodyPage}>
        <PageHeader caseName={meta.caseName} reportId={meta.reportId} />
        <View style={s.content}>
          <Section num="§ 0" title="Important Notice">
            <View style={s.disclaimer}>
              <Text style={s.disclaimerText}>
                This document has been generated by the Witness platform and contains
                information documented by the survivor. All content reflects the survivor&apos;s
                own recollections as recorded in the platform. No details have been added,
                inferred, or fabricated by the system.{'\n\n'}
                Traumatic memory is non-linear. Incomplete recall, approximate dates, and
                fragmented recollections are normal and do not diminish the validity of
                this documentation. Confidence levels assigned to each memory reflect
                the survivor&apos;s own assessment.{'\n\n'}
                This document is intended for use by legal professionals and advocates.
                It does not constitute legal advice. Recipients must maintain strict
                confidentiality and handle this document in accordance with applicable
                privacy laws and professional obligations.
              </Text>
            </View>
          </Section>
        </View>
        <PageFooter generatedAt={meta.generatedAt} />
      </Page>

      {/* ── Body Pages ───────────────────────────────────────────── */}
      <Page size="A4" style={s.bodyPage}>
        <PageHeader caseName={meta.caseName} reportId={meta.reportId} />
        <View style={s.content}>

          <Section num="§ 1" title="Case Overview">
            <Text style={s.body}>{sections.caseOverview}</Text>
          </Section>

          <Section num="§ 2" title="Chronological Narrative">
            <Text style={s.body}>{sections.chronologicalNarrative}</Text>
          </Section>

        </View>
        <PageFooter generatedAt={meta.generatedAt} />
      </Page>

      <Page size="A4" style={s.bodyPage}>
        <PageHeader caseName={meta.caseName} reportId={meta.reportId} />
        <View style={s.content}>

          <Section num="§ 3" title="Key People Identified">
            <Text style={s.body}>{sections.keyPeople}</Text>
          </Section>

          <Section num="§ 4" title="Key Locations">
            <Text style={s.body}>{sections.keyLocations}</Text>
          </Section>

          <Section num="§ 5" title="Emotional & Sensory Record">
            <View style={s.disclaimer}>
              <Text style={s.disclaimerText}>
                Sensory and emotional memories are well-established in trauma research as
                reliable indicators of experienced events. Their inclusion here is consistent
                with trauma-informed legal practice.
              </Text>
            </View>
            <Text style={s.body}>{sections.emotionalSensoryRecord}</Text>
          </Section>

        </View>
        <PageFooter generatedAt={meta.generatedAt} />
      </Page>

      {/* Evidence page */}
      {meta.includeEvidence && (
        <Page size="A4" style={s.bodyPage}>
          <PageHeader caseName={meta.caseName} reportId={meta.reportId} />
          <View style={s.content}>

            <Section num="§ 6" title="Evidence Index">
              <Text style={[s.body, { marginBottom: 12 }]}>{sections.evidenceSummary}</Text>

              {meta.evidenceList.length > 0 && (
                <View>
                  <View style={s.tableHeader}>
                    <Text style={[s.tableHeaderCell, { flex: 3 }]}>File name</Text>
                    <Text style={[s.tableHeaderCell, { flex: 1 }]}>Size</Text>
                    <Text style={[s.tableHeaderCell, { flex: 1 }]}>Uploaded</Text>
                    <Text style={[s.tableHeaderCell, { flex: 4 }]}>SHA-256 Hash</Text>
                  </View>
                  {meta.evidenceList.map((e, i) => (
                    <View key={i} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]} wrap={false}>
                      <Text style={[s.tableCell, { flex: 3 }]}>{e.file_name}</Text>
                      <Text style={[s.tableCell, { flex: 1 }]}>{fmtBytes(e.file_size)}</Text>
                      <Text style={[s.tableCell, { flex: 1 }]}>{new Date(e.uploaded_at).toLocaleDateString()}</Text>
                      <Text style={[s.tableCellMono, { flex: 4 }]}>{e.sha256_hash.slice(0, 32)}…</Text>
                    </View>
                  ))}
                </View>
              )}
            </Section>

          </View>
          <PageFooter generatedAt={meta.generatedAt} />
        </Page>
      )}

      {/* Final page — confidence + notes */}
      <Page size="A4" style={s.bodyPage}>
        <PageHeader caseName={meta.caseName} reportId={meta.reportId} />
        <View style={s.content}>

          <Section num="§ 7" title="Confidence Assessment">
            <View style={s.badgeRow}>
              <Text style={[s.badge, s.badgeHigh]}>High confidence</Text>
              <Text style={[s.badge, s.badgeMed]}>Medium confidence</Text>
              <Text style={[s.badge, s.badgeLow]}>Low / uncertain</Text>
            </View>
            <Text style={s.body}>{sections.confidenceAssessment}</Text>
          </Section>

          <Section num="§ 8" title="Documentation & Methodology Notes">
            <Text style={s.body}>{sections.documentationNotes}</Text>
          </Section>

          {meta.includeAuditTrail && (
            <Section num="§ 9" title="Audit Trail">
              {[
                ['Report generated',   meta.generatedAt],
                ['Generated by',       meta.generatedBy],
                ['Platform',           'Witness v1.0 — Next.js + Supabase'],
                ['Encryption',         'AES-256-GCM with PBKDF2 key derivation'],
                ['Content hash',       meta.contentHash],
                ['Report ID',          meta.reportId],
              ].map(([label, value]) => (
                <View key={label} style={[s.tableRow, { borderBottom: `1px solid ${C.border}` }]} wrap={false}>
                  <Text style={[s.tableCell, { width: 160, fontFamily: 'Helvetica-Bold' }]}>{label}</Text>
                  <Text style={s.tableCellMono}>{value}</Text>
                </View>
              ))}
            </Section>
          )}

        </View>
        <PageFooter generatedAt={meta.generatedAt} />
      </Page>
    </Document>
  )
}
