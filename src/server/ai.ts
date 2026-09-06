import { parseQuickEntry, type ParsedLine } from "@/lib/documents/quick-entry";
import { incrementUsage } from "./usage";
import { prisma } from "./db";

export type { ParsedLine };

const SAFETY =
  "Never invent prices, tax rates, customer details, quantities, specifications, legal requirements, or payment information. If a value is missing, omit it and mark uncertain. Financial calculations are done elsewhere.";

function extractJson(text: string) {
  const match = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

async function complete(prompt: string) {
  const provider = process.env.AI_PROVIDER;
  const started = Date.now();
  if (provider === "openai" && process.env.OPENAI_API_KEY) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          { role: "system", content: SAFETY },
          { role: "user", content: prompt },
        ],
      }),
    });
    const json = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
      model?: string;
    };
    return {
      text: json.choices?.[0]?.message?.content || "",
      provider: "openai",
      model: json.model || process.env.AI_MODEL || "gpt-4o-mini",
      inputTokens: json.usage?.prompt_tokens || 0,
      outputTokens: json.usage?.completion_tokens || 0,
      latencyMs: Date.now() - started,
    };
  }
  if (provider === "gemini" && process.env.GEMINI_API_KEY) {
    const model = process.env.AI_MODEL || "gemini-2.0-flash";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${SAFETY}\n\n${prompt}` }] }],
        }),
      },
    );
    const json = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    return {
      text: json.candidates?.[0]?.content?.parts?.[0]?.text || "",
      provider: "gemini",
      model,
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: Date.now() - started,
    };
  }
  return null;
}

export async function parseRequestWithAi(
  text: string,
  context: { organizationId: string; businessId?: string; userId?: string },
) {
  const local = parseQuickEntry(text);
  const completion = await complete(
    `Turn these business notes into JSON array of {quantity, name, unitPrice?, category?}. Only use numbers present in the text.\n\n${text}`,
  );
  if (!completion) {
    return { items: local, source: "local" as const, notice: "Please verify this information." };
  }
  const parsed = extractJson(completion.text);
  await prisma.aiRequest.create({
    data: {
      organizationId: context.organizationId,
      businessId: context.businessId,
      userId: context.userId,
      purpose: "parse-request",
      provider: completion.provider,
      model: completion.model,
      inputTokens: completion.inputTokens,
      outputTokens: completion.outputTokens,
      latencyMs: completion.latencyMs,
      success: Array.isArray(parsed),
    },
  });
  await incrementUsage(context.organizationId, "aiCalls");
  if (!Array.isArray(parsed)) {
    return { items: local, source: "local" as const, notice: "Please verify this information." };
  }
  return {
    items: parsed.map((item: ParsedLine) => ({
      quantity: String(item.quantity || ""),
      name: String(item.name || ""),
      unitPrice: item.unitPrice ? String(item.unitPrice) : undefined,
      category: item.category,
      uncertain: !item.unitPrice || !item.quantity,
    })),
    source: "ai" as const,
    notice: "Please verify this information.",
  };
}

export async function rewriteText(
  text: string,
  purpose: string,
  context: { organizationId: string; businessId?: string; userId?: string },
) {
  const completion = await complete(
    `${purpose}. Keep facts unchanged. Do not add prices or legal claims.\n\n${text}`,
  );
  if (!completion) {
    return { text, notice: "AI is not configured. The original text was kept." };
  }
  await prisma.aiRequest.create({
    data: {
      organizationId: context.organizationId,
      businessId: context.businessId,
      userId: context.userId,
      purpose,
      provider: completion.provider,
      model: completion.model,
      inputTokens: completion.inputTokens,
      outputTokens: completion.outputTokens,
      latencyMs: completion.latencyMs,
      success: Boolean(completion.text),
    },
  });
  await incrementUsage(context.organizationId, "aiCalls");
  return { text: completion.text || text, notice: "Please verify this information." };
}
