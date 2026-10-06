"use client";
import styles from "@/styles/Ui.module.css";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  return (
    <header className={styles["header"]}>
      <button
        className={styles["mobile-menu-button"]}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Menu da mesa"
        aria-expanded={menuOpen}
        aria-controls="mobile-nav"
      >
        ☰
      </button>
      <div className={styles["header-title"]}>
        <h1>Crônicas</h1>
      </div>
      <div className={styles["header-actions"]}>
        <Link href="/projects">Minhas campanhas</Link>
        <button
          className={styles["secondary-button"]}
          onClick={() => {
            localStorage.removeItem("forgehub_token");
            router.push("/login");
          }}
        >
          Sair
        </button>
      </div>
      {menuOpen && (
        <nav
          id="mobile-nav"
          className={styles["journal-mobile-nav"]}
          aria-label="Menu móvel"
        >
          <Link href="/home" onClick={() => setMenuOpen(false)}>
            Início
          </Link>
          <Link href="/projects" onClick={() => setMenuOpen(false)}>
            Campanhas
          </Link>
          <Link href="/journal" onClick={() => setMenuOpen(false)}>
            Diário da mesa
          </Link>
        </nav>
      )}
    </header>
  );
}
