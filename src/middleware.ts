// src/middleware.ts (simples, para dev – em prod use KV/Redis)
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const hits = new Map<string, { count: number; ts: number }>();
const WINDOW_MS = 60_000;
const LIMIT = 30; // 30 mensagens por minuto por IP

export function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/api/chat")) return NextResponse.next();

  const ip = req.ip ?? req.headers.get("x-forwarded-for") ?? "anon";
  const now = Date.now();
  const rec = hits.get(ip) ?? { count: 0, ts: now };
  if (now - rec.ts > WINDOW_MS) { rec.count = 0; rec.ts = now; }
  rec.count++;
  hits.set(ip, rec);

  if (rec.count > LIMIT) {
    return NextResponse.json({ reply: "Muitas mensagens em pouco tempo. Tente em 1 min 🙏" }, { status: 200 });
  }
  return NextResponse.next();
}
