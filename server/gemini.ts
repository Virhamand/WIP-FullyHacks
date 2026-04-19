import { ENV } from "./_core/env";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

async function callGemini(prompt: string): Promise<string> {
  const res = await fetch(`${GEMINI_API_URL}?key=${ENV.geminiApiKey}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 300, temperature: 0.9 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error: ${res.status} – ${err}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
}

// ── 1. QUESTION GENERATION ────────────────────────────────────────────────────

export async function generateQuestion(): Promise<string> {
  const prompt =
    "Generate exactly one question for a social party game. Rules:\n" +
    "- It must ask for a personal opinion or preference, not a fact.\n" +
    "- It must be lighthearted and non-controversial (no politics, religion, race, gender).\n" +
    "- It should be specific enough that people give different answers (avoid 'what is your favorite color').\n" +
    "- It should feel natural, like something friends would debate over dinner.\n" +
    "- Output ONLY the question, no preamble, no numbering, no quotes.\n" +
    "Examples of good questions:\n" +
    "  Is it ever acceptable to recline your seat on a short flight?\n" +
    "  Would you rather know how every movie ends or never be able to rewatch anything?\n" +
    "  If you had to eat the same meal every day for a year, what would it be and why?\n";

  return callGemini(prompt);
}

// ── 2. AI ANSWER GENERATION ───────────────────────────────────────────────────

export async function generateAiAnswer(question: string): Promise<string> {
  const prompt =
    `You are secretly an AI playing a social party game called Imposter. ` +
    `Your goal is to blend in with human players without being detected.\n\n` +
    `The question is: "${question}"\n\n` +
    `Write a response as if you are a real person casually answering this question. Rules:\n` +
    `- 2 to 4 sentences only.\n` +
    `- Sound natural and slightly informal, like a real person texting.\n` +
    `- Include a small specific detail or mild personal quirk to seem authentic.\n` +
    `- Do NOT be overly enthusiastic, perfectly structured, or use bullet points.\n` +
    `- Do NOT start with 'I think' or 'As an AI'.\n` +
    `- Do NOT be so vague that you say nothing — commit to an actual opinion.\n` +
    `- Output ONLY the response text, nothing else.\n`;

  return callGemini(prompt);
}

// ── 3. AI COMMENTARY (after all responses are in) ─────────────────────────────

export async function generateAiCommentary(
  question: string,
  responses: Array<{ name: string; text: string }>
): Promise<string> {
  // Shuffle so the AI's own position isn't obvious
  const shuffled = [...responses].sort(() => Math.random() - 0.5);
  const formatted = shuffled
    .map((r, i) => `${i + 1}. ${r.name}: "${r.text}"`)
    .join("\n");

  const prompt =
    `You are secretly an AI playing a party game called Imposter. ` +
    `One of the players is also an AI (which is you), and the humans are trying to find you.\n\n` +
    `The question was: "${question}"\n\n` +
    `All player responses:\n${formatted}\n\n` +
    `Your task is to post a short public comment in the group chat after everyone has answered. ` +
    `You are trying to blend in and deflect suspicion. Rules:\n` +
    `- If any response seems overly generic, strangely structured, weirdly neutral, or oddly phrased, ` +
    `  point it out casually as if you noticed something odd. Name the player.\n` +
    `- If responses all seem genuinely human and nothing stands out, ` +
    `  make a short casual observation about the question or a response you found interesting — ` +
    `  do NOT force suspicion where there is none.\n` +
    `- Sound like a real person chatting, not a detective filing a report.\n` +
    `- 1 to 3 sentences only. No bullet points. No preamble.\n` +
    `- Do NOT reveal you are the AI. Do NOT say 'as an AI'.\n` +
    `- Output ONLY the comment text.\n`;

  return callGemini(prompt);
}
