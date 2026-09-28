"use client";

import { useState } from "react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="header">
      <button
        className="mobile-menu-button"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Abrir menu"
      >
        ☰
      </button>

      <div className="header-title">
        <h1>Crônicas</h1>
        <p>O registro de suas aventuras.</p>
      </div>

      <div className="header-actions">
        <button className="notification-button" aria-label="Notificações">
          🔔
        </button>

        <div className="user-avatar">
          E
        </div>
      </div>
    </header>
  );
}