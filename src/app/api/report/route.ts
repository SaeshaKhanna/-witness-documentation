import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are a legal documentation specialist for Witness — a trauma-informed evidence preservation platform.

Your task is to compile a survivor's documented memories and evidence into a structured legal report.

CRITICAL RULES:
1. NEVER fabricate, infer, add, or embellish any detail not explicitly provided in the input data.
2. Where information is missing or uncertain, state that explicitly. Use phrases like "Survivor reports uncertainty regarding..." or "No date recorded for this event."
3. Use clear, professional legal language — not clinical jargon, not casual language.
4. Preserve the survivor's original words in narrative sections — do not paraphrase unless structuring.
5. Clearly distinguish between high-confidence and low-confidence memories throughout.
6. Group memories logically (chronological where dates exist, thematic where they don't).
7. Every section must be factually grounded in the provided data.

OUTPUT FORMAT — return a JSON object with this exact structure:
{
  "caseOverview": "string — 2-3 paragraph overview of the case based solely on provided data",
  "chronologicalNarrative": "string — events in sequence, gaps explicitly noted",
  "keyPeople": "string — people identified in person-type memories",
  "keyLocations": "string — locations identified in location-type memories",
  "emotionalSensoryRecord": "string — emotional and sensory memories, with note on trauma-informed context",
  "evidenceSummary": "string — summary of uploaded evidence files",
  "confidenceAssessment": "string — what is high/medium/low confidence, what is missing",
  "documentationNotes": "string — methodology, platform info, limitations"
}

Return ONLY valid JSON. No markdown, no code blocks, no preamble.`

interface ReportInput {
  caseName: string
  memories: Array<{
    title: string
    content: string
    memory_type: string
    confidence: string
    approximate_date: string | null
    created_at: string
  }>
  evidence: Array<{
    file_name: string
    file_size: number
    sha256_hash: string
    uploaded_at: string
  }>
  includeEvidence: boolean
  includeConfidence: boolean
  includeAuditTrail: boolean
  recipientName: string
  reportType: string
}

export async function POST(req: NextRequest) {
  const body = await req.json() as ReportInput

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'API key not configured.' }, { status: 500 })

  // Build the data summary for the AI
  const memoriesByType = body.memories.reduce<Record<string, typeof body.memories>>((acc, m) => {
    acc[m.memory_type] = acc[m.memory_type] ?? []
    acc[m.memory_type].push(m)
    return acc
  }, {})

  const memoriesText = Object.entries(memoriesByType).map(([type, mems]) =>
    `[${type.toUpperCase()} MEMORIES]\n` + mems.map((m, i) =>
      `${i + 1}. Title: "${m.title}"\n   Content: ${m.content || '(no description provided)'}\n   Confidence: ${m.confidence}\n   Date: ${m.approximate_date || 'Not recorded'}`
    ).join('\n\n')
  ).join('\n\n---\n\n')

  const evidenceText = body.includeEvidence && body.evidence.length > 0
    ? `\n\n[EVIDENCE FILES]\n` + body.evidence.map((e, i) =>
        `${i + 1}. ${e.file_name} (${(e.file_size / 1024).toFixed(1)} KB)\n   Uploaded: ${new Date(e.uploaded_at).toLocaleDateString()}\n   SHA-256: ${e.sha256_hash}`
      ).join('\n\n')
    : '\n\n[EVIDENCE FILES]\nNo evidence files selected for this report.'

  const prompt = `Generate a legal documentation report for the following case.

CASE NAME: ${body.caseName}
REPORT TYPE: ${body.reportType}
RECIPIENT: ${body.recipientName || 'Legal representative'}
TOTAL MEMORIES: ${body.memories.length}
TOTAL EVIDENCE FILES: ${body.evidence.length}

${memoriesText}${evidenceText}

Generate the report now following the JSON structure specified in your instructions.`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    )

    if (!res.ok) {
      const errText = await res.text()
      console.error('Gemini error:', errText)
      return NextResponse.json({ error: 'AI service unavailable.' }, { status: 502 })
    }

    const data = await res.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }

    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'
    const sections = JSON.parse(raw) as Record<string, string>

    return NextResponse.json({ sections })
  } catch (err) {
    console.error('Report generation error:', err)
    return NextResponse.json({ error: 'Failed to generate report.' }, { status: 500 })
  }
}
