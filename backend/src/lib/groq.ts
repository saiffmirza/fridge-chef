const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

export interface GroqCallResult {
  ok: true;
  parsed: unknown;
}
export interface GroqCallError {
  ok: false;
  status: number;
  error: string;
}

export async function callGroq(
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
): Promise<GroqCallResult | GroqCallError> {
  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    return { ok: false, status: 502, error: 'AI service is temporarily unavailable. Please try again.' };
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== 'string') {
    return { ok: false, status: 502, error: 'AI returned an unexpected response. Please try again.' };
  }

  const cleaned = text.trim().replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
  try {
    return { ok: true, parsed: JSON.parse(cleaned) };
  } catch {
    return { ok: false, status: 502, error: 'AI returned an invalid response. Please try again.' };
  }
}

export function extractArray(parsed: unknown, key: string): unknown[] | null {
  if (Array.isArray(parsed)) return parsed;
  if (typeof parsed === 'object' && parsed !== null) {
    const obj = parsed as Record<string, unknown>;
    const v = obj[key];
    if (Array.isArray(v)) return v;
  }
  return null;
}
