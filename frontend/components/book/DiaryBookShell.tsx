"use client";
import styles from "./DiaryBookShell.module.css";
import ui from "@/styles/Ui.module.css";


import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { request, type CurrentUser } from "@/services/journal";
import { BookSigil } from "./BookEntrance";

export default function DiaryBookShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    if (!localStorage.getItem("forgehub_token")) {
      router.replace("/login");
      return;
    }
    request<CurrentUser>("/auth/me")
      .then(me => { if (active) setUser(me); })
      .catch(e => {
        if (!active) return;
        if (/expirou|inválido|conta|autenticado|encontrado/i.test(e.message)) {
          localStorage.removeItem("forgehub_token");
          router.replace("/login");
        } else setError("Não foi possível abrir o diário. Recarregue a página para tentar novamente.");
      });
    return () => { active = false; };
  }, [router]);

  function closeBook() {
    localStorage.removeItem("forgehub_token");
    router.push("/");
  }

  return <main className={styles['diary-desk']}>
    <div className={styles['diary-desk-caption']}><Link href="/">Crônicas</Link><span>O registro de suas aventuras</span></div>
    <div className={styles['diary-bound-book']}>
      <aside className={styles['diary-index-page']}>
        <span className={styles['book-page-kicker']}>Crônicas da mesa</span>
        <BookSigil className={styles['diary-index-sigil']} />
        <h1>DIÁRIO</h1>
        <p className={styles['diary-index-intro']}>Um lugar para guardar<br />o que a aventura deixou.</p>
        <div className={styles['book-ornament']} aria-hidden="true">✦</div>
        <nav className={styles['diary-index-nav']} aria-label="Capítulos do diário">
          <Link href="/journal" aria-current={pathname === "/journal" ? "page" : undefined}><span>01</span> Diário da mesa</Link>
          <Link href="/projects" aria-current={pathname === "/projects" ? "page" : undefined}><span>02</span> Campanhas</Link>
        </nav>
        <div className={styles['diary-index-bottom']}><p>{user ? `Um capítulo de ${user.name}` : "Abrindo as páginas…"}</p><button type="button" onClick={closeBook}>Fechar o livro e sair <span aria-hidden="true">↙</span></button></div>
        <span className={styles['book-folio']}>Crônicas</span>
      </aside>
      <section className={styles['diary-content-page']} key={pathname} aria-label="Páginas do diário">
        <div className={styles['diary-running-title']}><span>{pathname === "/projects" ? "Os mundos que habitamos" : "As histórias que escrevemos"}</span><span aria-hidden="true">✦</span></div>
        {error ? <p role="alert" className={ui['login-error']}>{error}</p> : user ? children : <p role="status">Abrindo seu diário…</p>}
        <footer className={styles['diary-page-footer']}>Que estas páginas nunca fiquem em branco.</footer>
      </section>
    </div>
  </main>;
}
