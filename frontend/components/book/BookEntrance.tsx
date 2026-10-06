"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { login, register } from "@/services/api";
import { request, type Campaign } from "@/services/journal";

type Phase = "closed" | "opening" | "open" | "turning";
type Mode = "login" | "register";

export function BookSigil({ className = "" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 160 160" fill="none" aria-hidden="true">
    <circle cx="80" cy="80" r="65" stroke="currentColor" strokeWidth=".7" />
    <circle cx="80" cy="80" r="55" stroke="currentColor" strokeWidth=".7" strokeDasharray="2 7" />
    <path d="M80 12 98 62 148 80 98 98 80 148 62 98 12 80 62 62Z" stroke="currentColor" />
    <path d="m80 37 30 43-30 43-30-43Z" stroke="currentColor" />
    <path d="M80 37v86M50 80h60M80 37 50 80l30 13 30-13-30-43Z" stroke="currentColor" />
    <circle cx="80" cy="80" r="5" fill="currentColor" />
  </svg>;
}

export default function BookEntrance({ initialMode, initiallyOpen = false }: { initialMode?: Mode; initiallyOpen?: boolean }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>(initiallyOpen ? "open" : "closed");
  const [mode, setMode] = useState<Mode>(initialMode ?? "login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [destination, setDestination] = useState("/journal");
  const emailRef = useRef<HTMLInputElement>(null);
  const opened = phase !== "closed";

  useEffect(() => {
    if (phase === "opening") {
      const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 80 : 850;
      const timer = setTimeout(() => setPhase("open"), delay);
      return () => clearTimeout(timer);
    }
    if (phase === "open") emailRef.current?.focus();
    if (phase === "turning") {
      const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 80 : 950;
      const timer = setTimeout(() => router.push(destination), delay);
      return () => clearTimeout(timer);
    }
  }, [phase, destination, router]);

  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    setBusy(true); setError(""); setNotice("");
    let created = false;
    try {
      if (mode === "register") {
        await register(email, password);
        created = true;
      }
      const auth = await login(email, password);
      localStorage.setItem("forgehub_token", auth.access_token);
      // Resume an existing campaign; a new table starts at the diary's campaign selector.
      const campaigns = await request<Campaign[]>("/campaigns").catch(() => []);
      setDestination(campaigns.length ? `/journal?campaignId=${campaigns[0].id}` : "/journal");
      setNotice(created ? "Conta criada. Abrindo seu diário…" : "A aventura continua. Abrindo seu diário…");
      setPhase("turning");
    } catch (e) {
      if (created) {
        setMode("login");
        setNotice("Sua conta foi criada. Entre para continuar.");
      }
      const message = e instanceof Error ? e.message : "Não foi possível entrar. Tente novamente.";
      try {
        const parsed = JSON.parse(message);
        setError(typeof parsed.detail === "string" ? parsed.detail : "Confira seu e-mail e sua senha.");
      } catch { setError(message); }
      setBusy(false);
    }
  }

  function changeMode(next: Mode) {
    setMode(next); setError(""); setNotice("");
    emailRef.current?.focus();
  }

  return <main className={`book-scene phase-${phase}`}>
    <div className="book-ambient" aria-hidden="true" />
    <p className="book-scene-caption">Uma mesa. Muitas vozes. Uma história.</p>
    <p className="book-live-status" role="status">{phase === "opening" ? "O diário está abrindo." : phase === "turning" ? notice : ""}</p>
    <div className={`entrance-book ${opened ? "is-open" : ""}`}>
      <section className="auth-spread" aria-label="Primeiras páginas do diário" inert={phase !== "open"}>
        <div className="auth-page auth-dedication">
          <span className="book-page-kicker">O início de uma crônica</span>
          <BookSigil className="dedication-sigil" />
          <h1>Toda aventura<br />merece ser<br /><em>lembrada.</em></h1>
          <div className="book-ornament" aria-hidden="true">✦</div>
          <p>As histórias do mestre.<br />As memórias dos jogadores.<br />Um diário para toda a mesa.</p>
          <span className="book-folio">I</span>
        </div>
        <div className="auth-page auth-form-page">
          <div className="book-auth-tabs" aria-label="Acesso ao diário">
            <button type="button" aria-pressed={mode === "login"} onClick={() => changeMode("login")} disabled={busy}>Entrar</button>
            <button type="button" aria-pressed={mode === "register"} onClick={() => changeMode("register")} disabled={busy}>Criar conta</button>
          </div>
          <span className="book-page-kicker">{mode === "login" ? "Retome sua jornada" : "Uma nova voz na mesa"}</span>
          <h2>{mode === "login" ? "Abra suas crônicas" : "Comece sua história"}</h2>
          <p className="book-auth-description">{mode === "login" ? "Suas aventuras esperam na próxima página." : "Só precisamos do seu e-mail e de uma senha."}</p>
          <form className="book-auth-form" onSubmit={submit}>
            <label htmlFor="book-email">E-mail</label>
            <input ref={emailRef} id="book-email" name="email" type="email" placeholder="seu@email.com" autoComplete="email" required disabled={busy} />
            <label htmlFor="book-password">Senha</label>
            <input id="book-password" name="password" type="password" placeholder={mode === "register" ? "Pelo menos 8 caracteres" : "Sua senha"} autoComplete={mode === "register" ? "new-password" : "current-password"} minLength={mode === "register" ? 8 : undefined} maxLength={128} required disabled={busy} />
            {error && <p className="book-auth-error" role="alert">{error}</p>}
            {notice && <p className="book-auth-notice" role="status">{notice}</p>}
            <button className="book-submit" disabled={busy}>{busy ? "Abrindo o diário…" : mode === "login" ? "Entrar no diário" : "Criar conta e abrir o diário"}<span aria-hidden="true">→</span></button>
          </form>
          <p className="book-auth-footnote">{mode === "login" ? "Ainda não faz parte desta história?" : "Já tem histórias por aqui?"} <button type="button" onClick={() => changeMode(mode === "login" ? "register" : "login")} disabled={busy}>{mode === "login" ? "Criar conta" : "Entrar"}</button></p>
          <span className="book-folio">II</span>
        </div>
      </section>
      {(phase === "closed" || phase === "opening") && <button className="rpg-book-cover" onClick={() => setPhase("opening")} disabled={phase === "opening"} aria-label="Abrir o diário de RPG">
        <span className="cover-frame" aria-hidden="true" />
        <span className="cover-small">Memórias de uma mesa</span>
        <span className="cover-title">Crônicas</span>
        <span className="cover-subtitle">Diário de RPG</span>
        <BookSigil className="cover-sigil" />
        <span className="cover-rule" aria-hidden="true">✦</span>
        <span className="cover-dedication">Para aqueles que vivem<br />histórias extraordinárias.</span>
        <span className="cover-open-hint">Clique para abrir <span aria-hidden="true">↗</span></span>
      </button>}
      {phase === "turning" && <div className="book-turning-leaf" aria-hidden="true"><span>Um novo capítulo</span><BookSigil /></div>}
    </div>
    <p className="book-scene-footer">{phase === "closed" ? "Seu próximo capítulo começa aqui." : "Crônicas · O diário compartilhado da sua mesa"}</p>
  </main>;
}
