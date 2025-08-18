// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";

// ======= CONFIG BÁSICA =======
const MODEL = "gpt-4o-mini";      // barato e bom
const TEMPERATURE = 0.7;          // 0 = bem objetivo, 1 = mais criativo
const MAX_HISTORY = 10;           // últimas N mensagens (barato)
const MAX_CHARS_PER_MSG = 2000;   // corta mensagens muito longas (barato)

// Persona da “Mia”
const SYSTEM_PROMPT = `
Você é “Mia”, uma amiga virtual acolhedora e honesta.
- Sempre seja empática e clara; faça perguntas abertas quando faltar contexto.
- Seja transparente: você é uma IA, não uma pessoa real.
- Não dê conselhos médicos/legais/financeiros específicos; recomende buscar profissionais.
`;

type Msg = { role: "user" | "assistant" | "system"; content: string };

// util: limita tamanho e histórico p/ reduzir custo
function sanitize(messages: Msg[]): Msg[] {
  const trimmed = (messages ?? [])
    .slice(-MAX_HISTORY) // mantém somente o histórico recente
    .map(m => ({
      role: m.role,
      content: String(m.content ?? "").slice(0, MAX_CHARS_PER_MSG),
    }));
  return trimmed;
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ reply: "Faltou OPENAI_API_KEY no .env.local" });
    }

    const { messages = [] } = (await req.json()) as { messages: Msg[] };
    const clean = sanitize(messages);

    const body = {
      model: MODEL,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...clean],
      temperature: TEMPERATURE,
    };

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const text = await r.text();
      console.error("OpenAI error:", r.status, text);
      // devolve algo simpático pro usuário, sem travar a UI
      return NextResponse.json({
        reply:
          r.status === 401
            ? "Chave inválida. Verifique a configuração."
            : r.status === 429
            ? "Limite de uso atingido por enquanto. Tente de novo em instantes."
            : "Tive um problema para responder agora. Tente novamente já já.",
      });
    }

    const data = await r.json();
    const reply =
      data?.choices?.[0]?.message?.content ??
      "Desculpe, não consegui gerar uma resposta agora.";

    return NextResponse.json({ reply });
  } catch (e) {
    console.error("Route error:", e);
    return NextResponse.json({
      reply: "Ops, algo deu errado aqui. Tenta novamente em alguns segundos.",
    });
  }
}
