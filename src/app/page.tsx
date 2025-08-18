"use client";
import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function Home() {
  const [msgs, setMsgs] = useState<Msg[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("amiga-history");
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    localStorage.setItem("amiga-history", JSON.stringify(msgs));
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;

    const next = [...msgs, { role: "user", content: text }];
    setMsgs(next);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      setMsgs((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMsgs((prev) => [
        ...prev,
        { role: "assistant", content: "Tive um problema para responder agora. Tente novamente." },
      ]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function reset() {
    setMsgs([]);
    localStorage.removeItem("amiga-history");
    inputRef.current?.focus();
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-zinc-900 text-slate-200 flex flex-col items-center">
      <div className="w-full max-w-2xl p-4 md:p-6">
        {/* Header */}
        <header className="flex items-center justify-between py-3">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
              AURI AI 
            </span>
          </h1>
          <button
            onClick={reset}
            className="text-sm text-slate-400 hover:text-slate-200 transition"
            title="Limpar conversa"
          >
            limpar o chat
          </button>
        </header>

        {/* Chat window */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 md:p-5 h-[70vh] overflow-y-auto shadow-inner backdrop-blur">
          {msgs.length === 0 && (
            <div className="text-slate-400 text-sm leading-relaxed">
              Dica: conte como foi seu dia, peça um conselho ou desabafe. AURI escuta você 💬
            </div>
          )}

          {msgs.map((m, i) => {
            const isUser = m.role === "user";
            return (
              <div
                key={i}
                className={`mb-3 flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={[
                    "inline-block px-4 py-2 rounded-2xl max-w-[80%] whitespace-pre-wrap shadow",
                    isUser
                      ? "bg-blue-600 text-white"
                      : "bg-slate-700 text-slate-100 border border-slate-600",
                  ].join(" ")}
                >
                  {m.content}
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        {/* Input row */}
        <div className="mt-3 flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escreva aqui..."
            rows={1}
            className="flex-1 resize-none border border-slate-700 rounded-xl px-4 py-3 bg-slate-800 text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          <button
            onClick={send}
            disabled={sending || !input.trim()}
            className={[
              "px-5 py-3 rounded-xl font-medium transition shadow",
              sending || !input.trim()
                ? "bg-blue-900/50 text-slate-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white",
            ].join(" ")}
          >
            {sending ? "Enviando..." : "Enviar"}
          </button>
        </div>

        <p className="text-xs text-slate-500 mt-3">
          Nota: AURI é uma IA. Não substitui profissionais de saúde, legais ou financeiros.
        </p>
      </div>
    </main>
  );
}
