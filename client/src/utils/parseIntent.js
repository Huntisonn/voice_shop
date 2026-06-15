/**
 * parseIntent.js
 * Converts a raw voice transcript string into a structured intent object.
 *
 * Output shape:
 * {
 *   action: "search" | "addToCart" | "removeFromCart" | "checkout" | "nextPage" | null,
 *   category: string | null,   // shirts, jeans, kurtas, shoes, phones
 *   color: string | null,
 *   priceMax: number | null,
 *   priceMin: number | null,
 * }
 *
 * Strategy:
 *   1. Always run local keyword rules (fast, offline)
 *   2. If VITE_USE_AI=true AND local rules didn't find an action, call OpenAI
 */

// ─── Keyword Maps ────────────────────────────────────────────────────────────

const ACTION_PATTERNS = [
  { pattern: /\b(add|add\s+to\s+cart|buy|purchase|i\s+want|order)\b/i, action: "addToCart" },
  { pattern: /\b(remove|delete|undo|take\s+out|cancel\s+last)\b/i, action: "removeFromCart" },
  { pattern: /\b(checkout|place\s+order|complete\s+order|pay|proceed)\b/i, action: "checkout" },
  { pattern: /\b(next\s+page|show\s+more|load\s+more|next)\b/i, action: "nextPage" },
  // "search" is the fallback when a category/color/price is detected
];

const CATEGORY_PATTERNS = [
  { pattern: /\b(shirt|shirts|top|tops)\b/i, category: "shirts" },
  { pattern: /\b(jean|jeans|denim|denims)\b/i, category: "jeans" },
  { pattern: /\b(kurta|kurtas|kurti|ethnic)\b/i, category: "kurtas" },
  { pattern: /\b(shoe|shoes|sneaker|sneakers|footwear|loafer|loafers|oxford)\b/i, category: "shoes" },
  { pattern: /\b(phone|phones|mobile|smartphone|handset)\b/i, category: "phones" },
];

const COLOR_PATTERNS = [
  "red", "blue", "green", "black", "white", "yellow", "grey", "gray",
  "maroon", "brown", "silver", "orange", "pink", "purple", "navy",
].map((c) => ({ pattern: new RegExp(`\\b${c}\\b`, "i"), color: c === "gray" ? "grey" : c }));

// Price patterns: "under 500", "below 1000 rupees", "above 200", "more than 300"
const PRICE_MAX_PATTERN = /\b(?:under|below|less\s+than|max(?:imum)?|upto?|up\s+to)\s+(?:rs\.?|₹)?\s*(\d+)\b/i;
const PRICE_MIN_PATTERN = /\b(?:above|over|more\s+than|min(?:imum)?|at\s+least|starting)\s+(?:rs\.?|₹)?\s*(\d+)\b/i;
// Also handle "₹500 to ₹1000" or "500 to 1000"
const PRICE_RANGE_PATTERN = /(?:rs\.?|₹)?\s*(\d+)\s+to\s+(?:rs\.?|₹)?\s*(\d+)/i;

// ─── Local Rule Engine ────────────────────────────────────────────────────────

function parseLocal(transcript) {
  const t = transcript.toLowerCase().trim();
  const intent = {
    action: null,
    category: null,
    color: null,
    priceMax: null,
    priceMin: null,
  };

  // 1. Detect action
  for (const { pattern, action } of ACTION_PATTERNS) {
    if (pattern.test(t)) {
      intent.action = action;
      break;
    }
  }

  // 2. Detect category
  for (const { pattern, category } of CATEGORY_PATTERNS) {
    if (pattern.test(t)) {
      intent.category = category;
      break;
    }
  }

  // 3. Detect color
  for (const { pattern, color } of COLOR_PATTERNS) {
    if (pattern.test(t)) {
      intent.color = color;
      break;
    }
  }

  // 4. Detect price range (e.g. "500 to 1000")
  const rangeMatch = PRICE_RANGE_PATTERN.exec(t);
  if (rangeMatch) {
    intent.priceMin = parseInt(rangeMatch[1], 10);
    intent.priceMax = parseInt(rangeMatch[2], 10);
  } else {
    // 5. Detect priceMax
    const maxMatch = PRICE_MAX_PATTERN.exec(t);
    if (maxMatch) intent.priceMax = parseInt(maxMatch[1], 10);

    // 6. Detect priceMin
    const minMatch = PRICE_MIN_PATTERN.exec(t);
    if (minMatch) intent.priceMin = parseInt(minMatch[1], 10);
  }

  // 7. If we found category/color/price but no explicit action → "search"
  if (!intent.action && (intent.category || intent.color || intent.priceMax || intent.priceMin)) {
    intent.action = "search";
  }

  return intent;
}

// ─── Groq Fallback (Truly Free — No Credit Card Needed) ──────────────────────
// Groq API is OpenAI-compatible. Free tier: 14,400 req/day, 30 req/min
// Sign up: https://console.groq.com → API Keys

const GROQ_SYSTEM_PROMPT = `You are an intent parser for an Indian voice-driven e-commerce app (VoiceShop).
Users speak in English, Hindi, or Hinglish (Hindi+English mix).

Your job: Parse the voice command and return ONLY a valid JSON object. No explanation, no markdown.

OUTPUT SCHEMA (use null for unknown fields):
{ "action": "search"|"addToCart"|"removeFromCart"|"checkout"|"nextPage"|null,
  "category": "shirts"|"jeans"|"kurtas"|"shoes"|"phones"|null,
  "color": string|null,
  "priceMax": number|null,
  "priceMin": number|null }

HINDI/HINGLISH KEYWORD GUIDE:
- "dikhao", "dikha", "show", "dekhna", "dekhao" → action: "search"
- "chahiye", "lena hai", "add karo", "cart mein daalo" → action: "addToCart"
- "hatao", "remove", "wapas", "cancel" → action: "removeFromCart"
- "checkout", "order karo", "khareedna hai", "pay karo" → action: "checkout"
- "kurta", "kurte", "ethnic", "sherwani" → category: "kurtas"
- "shirt", "shirts", "top" → category: "shirts"
- "jean", "jeans", "denim" → category: "jeans"
- "shoe", "joote", "chappal", "sneaker" → category: "shoes"
- "phone", "mobile", "smartphone" → category: "phones"
- "sasta", "cheap", "budget", "kam daam" → priceMax: 1000
- "mahenga", "premium", "best quality" → priceMin: 3000
- "tadapti", "fadkati", "exciting", "stylish", "trendy", "mast" → best-guess search

RULES:
1. If the user says "dikhao" or "show me" anything → action MUST be "search"
2. If the command is vague but involves shopping, default to action: "search"
3. For vague/exciting clothing requests ("tadapti", "stylish", "trendy") → category: "kurtas" or "shirts"
4. Always attempt a best-guess rather than returning all nulls
5. Numbers in Hindi: "sau"=100, "paanch sau"=500, "hazaar"=1000, "do hazaar"=2000

EXAMPLES:
"show me red shirts under 1000" → {"action":"search","category":"shirts","color":"red","priceMax":1000,"priceMin":null}
"Kuchh tadapti fadkati chij dikhao" → {"action":"search","category":"kurtas","color":null,"priceMax":null,"priceMin":null}
"blue jeans chahiye" → {"action":"addToCart","category":"jeans","color":"blue","priceMax":null,"priceMin":null}
"add to cart karo" → {"action":"addToCart","category":null,"color":null,"priceMax":null,"priceMin":null}
"order place karo" → {"action":"checkout","category":null,"color":null,"priceMax":null,"priceMin":null}`;


async function parseWithAI(transcript) {
  const apiKey = import.meta.env.VITE_GROQ_KEY;
  if (!apiKey) {
    console.warn("[parseIntent] VITE_GROQ_KEY not set, skipping AI fallback.");
    return null;
  }

  console.log("%c[AI] 🤖 Sending to Groq (llama-3.3-70b-versatile)...", "color: #a78bfa; font-weight: bold");
  console.log("%c[AI] Transcript:", "color: #a78bfa", `"${transcript}"`);

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0,
        messages: [
          { role: "system", content: GROQ_SYSTEM_PROMPT },
          { role: "user", content: transcript },
        ],
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(
        `Groq API error ${response.status}: ${errBody?.error?.message || response.statusText}`
      );
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) throw new Error("Empty response from Groq");

    // Strip markdown fences just in case
    const clean = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    const parsed = JSON.parse(clean);

    console.log("%c[AI] ✅ Groq responded!", "color: #34d399; font-weight: bold");
    console.log("%c[AI] Raw response:", "color: #34d399", raw);
    console.log("%c[AI] Parsed intent:", "color: #34d399", parsed);
    console.log(
      "%c[AI] Tokens used:",
      "color: #94a3b8",
      data.usage || "n/a"
    );

    return parsed;
  } catch (err) {
    console.error("%c[AI] ❌ Groq call failed:", "color: #f87171; font-weight: bold", err.message);
    return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * parseIntent(transcript) → intent object
 * Async to support optional AI fallback.
 */
export async function parseIntent(transcript) {
  if (!transcript || !transcript.trim()) {
    return { action: null, category: null, color: null, priceMax: null, priceMin: null };
  }

  const local = parseLocal(transcript);

  console.log("%c[parseIntent] 🔍 Local rules result:", "color: #60a5fa", local);

  // If we got a clear action from local rules, use it — no AI needed
  if (local.action) {
    console.log("%c[parseIntent] ✔ Local rules matched — Gemini NOT called", "color: #60a5fa");
    return local;
  }

  // Local rules found nothing useful — try AI if enabled
  if (import.meta.env.VITE_USE_AI === "true") {
    console.log("%c[parseIntent] ⚡ Local rules found no action — falling back to Gemini", "color: #f59e0b");
    const aiResult = await parseWithAI(transcript);
    if (aiResult) return aiResult;
  } else {
    console.log("%c[parseIntent] AI disabled (VITE_USE_AI=false)", "color: #94a3b8");
  }

  // Return local result even if action is null
  return local;
}

export default parseIntent;
