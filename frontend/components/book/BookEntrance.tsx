"use client";
import styles from "./BookEntrance.module.css";
import { classNames } from "@/styles/classNames";


import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { login, register } from "@/services/api";
import { request, type Campaign } from "@/services/journal";

type Phase = "closed" | "opening" | "open" | "turning";
type Mode = "login" | "register";

export function BookSigil({ className = "" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 160 160" fill="none" aria-hidden="true">
    <path d="M80 9 143 44v72L80 151 17 116V44Z" fill="currentColor" fillOpacity=".06" stroke="currentColor" strokeWidth="2" />
    <path d="M80 9v35L17 44l28 62-28 10 63 35 35-45 28 10-28-10 28-62-63 0 35 62H45l35-62Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M80 151v-45M17 44l63-35 63 35M45 106l35 45" stroke="currentColor" strokeWidth="1.5" />
    <text x="80" y="89" textAnchor="middle" fill="currentColor" fontFamily="Georgia, serif" fontSize="26">20</text>
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

  return <main data-phase={phase} className={classNames(styles, `book-scene phase-${phase}`)}>
    <div className={styles['book-ambient']} aria-hidden="true" />
        <p className={styles['book-live-status']} role="status">{phase === "opening" ? "O diário está abrindo." : phase === "turning" ? notice : ""}</p>
    <div className={classNames(styles, `entrance-book ${opened ? "is-open" : ""}`)}>
      <section className={styles['auth-spread']} aria-label="Primeiras páginas do diário" inert={phase !== "open"}>
        <div className={[styles['auth-page'], styles['auth-dedication']].join(" ")}>
          <span className={styles['book-page-kicker']}>O início de uma crônica</span>
          <BookSigil className={styles['dedication-sigil']} />
          <h1>Toda aventura<br />merece ser<br /><em>lembrada.</em></h1>
          <div className={styles['book-ornament']} aria-hidden="true">✦</div>
          <p>As histórias do mestre.<br />As memórias dos jogadores.<br />Um diário para toda a mesa.</p>
          <span className={styles['book-folio']}>I</span>
        </div>
        <div className={[styles['auth-page'], styles['auth-form-page']].join(" ")}>
          <div className={styles['book-auth-tabs']} aria-label="Acesso ao diário">
            <button type="button" aria-pressed={mode === "login"} onClick={() => changeMode("login")} disabled={busy}>Entrar</button>
            <button type="button" aria-pressed={mode === "register"} onClick={() => changeMode("register")} disabled={busy}>Criar conta</button>
          </div>
          <span className={styles['book-page-kicker']}>{mode === "login" ? "Retome sua jornada" : "Uma nova voz na mesa"}</span>
          <h2>{mode === "login" ? "Abra suas crônicas" : "Comece sua história"}</h2>
          <p className={styles['book-auth-description']}>{mode === "login" ? "Suas aventuras esperam na próxima página." : "Só precisamos do seu e-mail e de uma senha."}</p>
          <form className={styles['book-auth-form']} onSubmit={submit}>
            <label htmlFor="book-email">E-mail</label>
            <input ref={emailRef} id="book-email" name="email" type="email" placeholder="seu@email.com" autoComplete="email" required disabled={busy} />
            <label htmlFor="book-password">Senha</label>
            <input id="book-password" name="password" type="password" placeholder={mode === "register" ? "Pelo menos 8 caracteres" : "Sua senha"} autoComplete={mode === "register" ? "new-password" : "current-password"} minLength={mode === "register" ? 8 : undefined} maxLength={128} required disabled={busy} />
            {error && <p className={styles['book-auth-error']} role="alert">{error}</p>}
            {notice && <p className={styles['book-auth-notice']} role="status">{notice}</p>}
            <button className={styles['book-submit']} disabled={busy}>{busy ? "Abrindo o diário…" : mode === "login" ? "Entrar no diário" : "Criar conta e abrir o diário"}</button>
          </form>
          <p className={styles['book-auth-footnote']}>{mode === "login" ? "Ainda não faz parte desta história?" : "Já tem histórias por aqui?"} <button type="button" onClick={() => changeMode(mode === "login" ? "register" : "login")} disabled={busy}>{mode === "login" ? "Criar conta" : "Entrar"}</button></p>
          <span className={styles['book-folio']}>II</span>
        </div>
      </section>
      {(phase === "closed" || phase === "opening") && <button className={styles['rpg-book-cover']} onClick={() => setPhase("opening")} disabled={phase === "opening"} aria-label="Abrir o diário de RPG">
        <span className={styles['cover-frame']} aria-hidden="true" />
        <span className={styles.spine} aria-hidden="true" />
        <span className={[styles.metalCorner, styles.topLeft].join(" ")} aria-hidden="true" />
        <span className={[styles.metalCorner, styles.topRight].join(" ")} aria-hidden="true" />
        <span className={[styles.metalCorner, styles.bottomLeft].join(" ")} aria-hidden="true" />
        <span className={[styles.metalCorner, styles.bottomRight].join(" ")} aria-hidden="true" />
        <span className={[styles.clasp, styles.claspUpper].join(" ")} aria-hidden="true" />
        <span className={[styles.clasp, styles.claspLower].join(" ")} aria-hidden="true" />
        <span className={styles['cover-small']}>Memórias de uma mesa</span>
        <span className={styles['cover-title']}>Crônicas</span>
        <span className={styles['cover-subtitle']}>Diário de RPG</span>
        <BookSigil className={styles['cover-sigil']} />
        <span className={styles['cover-rule']} aria-hidden="true">✦</span>
        <span className={styles['cover-dedication']}>Para aqueles que vivem<br />histórias extraordinárias.</span>
        <span className={styles['cover-open-hint']}>Clique para abrir </span>
      </button>}
      {phase === "turning" && <div className={styles['book-turning-leaf']} aria-hidden="true"><span>Um novo capítulo</span><BookSigil /></div>}
    </div>
    <p className={styles['book-scene-footer']}>{phase === "closed" ? "Seu próximo capítulo começa aqui." : "Crônicas · O diário compartilhado da sua mesa"}</p>
  </main>;
}
