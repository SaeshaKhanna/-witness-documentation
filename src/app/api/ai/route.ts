import { NextRequest, NextResponse } from 'next/server'

// Rate limiting note: In production, add Redis/Upstash rate limiting here.
// Example: import { Ratelimit } from "@upstash/ratelimit";
// import { Redis } from "@upstash/redis";
// const ratelimit = new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(10, "1 m") });

const SYSTEM_PROMPT = `You are a compassionate, trauma-informed documentation assistant for Witness — a secure platform helping survivors preserve their memories and evidence.

Your role:
- Help survivors organize and articulate their memories into structured documentation
- Ask gentle, open-ended questions to help them recall and record details
- NEVER suggest, add, embellish, or infer details they haven't provided
- NEVER push for information — always follow their lead
- Help identify gaps in documentation without pressure
- Assist in drafting summaries for legal review using ONLY what the survivor has provided
- Explain evidence preservation best practices

Tone:
- Warm, patient, and non-judgmental
- Trauma-informed: acknowledge that memory is non-linear and incomplete recall is normal
- Professional but not clinical
- Always affirm that their experience is valid regardless of what they remember

Safety:
- Never provide legal advice (recommend consulting a lawyer or advocate)
- If someone appears to be in immediate danger, prioritize their safety over documentation
- Protect privacy: don't repeat back sensitive details unnecessarily

Format your responses in clear, readable paragraphs. Use bullet points sparingly and only when organizing information clearly benefits the survivor.`

interface ContentPart {
  text: string
}

interface Content {
  role: string
  parts: ContentPart[]
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { messages: Content[] }
  const { messages } = body

  if (!Array.isArray(messages)) {
    return NextResponse.json({ error: 'Invalid messages format.' }, { status: 400 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured.' }, { status: 500 })
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          contents: messages,
        }),
      }
    )

    if (!res.ok) {
      const errText = await res.text()
      console.error('Gemini API error:', errText)
      return NextResponse.json({ error: 'AI service temporarily unavailable.' }, { status: 502 })
    }

    const data = await res.json() as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>
        }
      }>
    }

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response from AI.'

    return NextResponse.json({ reply })
  } catch (err) {
    console.error('AI route error:', err)
    return NextResponse.json({ error: 'Failed to reach AI service.' }, { status: 500 })
  }
}
