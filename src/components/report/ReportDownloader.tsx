'use client'

// This file is the ONLY place @react-pdf/renderer is imported.
// It is always loaded via dynamic(() => import(...), { ssr: false })
// so react-pdf never touches the server bundle.

import { PDFDownloadLink } from '@react-pdf/renderer'
import ReportDocument from './ReportDocument'
import type { ReportSections, ReportMeta } from '@/lib/types'

interface Props {
  sections: ReportSections
  meta: ReportMeta
  fileName: string
  variant?: 'primary' | 'secondary'
}

export default function ReportDownloader({ sections, meta, fileName, variant = 'primary' }: Props) {
  const isPrimary = variant === 'primary'

  return (
    <PDFDownloadLink
      document={<ReportDocument sections={sections} meta={meta} />}
      fileName={fileName}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: '100%',
        padding: isPrimary ? 12 : '7px 12px',
        background: isPrimary ? 'linear-gradient(135deg,#0f766e,#0ea5e9)' : 'var(--ink-3)',
        border: isPrimary ? 'none' : '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        fontSize: isPrimary ? 13 : 12,
        fontWeight: 500,
        color: isPrimary ? '#fff' : 'var(--text-2)',
        cursor: 'pointer',
        textDecoration: 'none',
        marginBottom: isPrimary ? 8 : 0,
        boxSizing: 'border-box',
      }}
    >
      {({ loading }: { loading: boolean }) =>
        loading
          ? 'Rendering PDF…'
          : (
            <>
              <i className="ph ph-download-simple" />
              {isPrimary ? 'Download PDF' : 'Download'}
            </>
          )
      }
    </PDFDownloadLink>
  )
}
