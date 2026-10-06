"use client";
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  return <header className="header">
    <button className="mobile-menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu da mesa" aria-expanded={menuOpen} aria-controls="mobile-nav">☰</button>
    <div className="header-title"><h1>Crônicas</h1><p>Uma mesa. Muitas vozes. Uma história.</p></div>
    <div className="header-actions"><Link href="/projects">Minhas campanhas</Link><button className="secondary-button" onClick={() => { localStorage.removeItem('forgehub_token'); router.push('/login'); }}>Sair</button></div>
    {menuOpen && <nav id="mobile-nav" className="journal-mobile-nav" aria-label="Menu móvel"><Link href="/home" onClick={() => setMenuOpen(false)}>Início</Link><Link href="/projects" onClick={() => setMenuOpen(false)}>Campanhas</Link><Link href="/journal" onClick={() => setMenuOpen(false)}>Diário da mesa</Link></nav>}
  </header>;
}
