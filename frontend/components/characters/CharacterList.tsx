"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { request } from '@/services/journal';
import { statusLabels, type Character, type Page } from '@/services/characters';
import CharacterForm from './CharacterForm';
import PrivatePortrait from './PrivatePortrait';
import VaultPager from './VaultPager';
import styles from './Vault.module.css';

export default function CharacterList() {
  const [query, setQuery] = useState({ q: '', system: '', status: '', offset: 0 });
  const [data, setData] = useState<Page<Character> | null>(null);
  const [systems, setSystems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    const parameters = new URLSearchParams({ q: query.q, offset: String(query.offset), limit: '12' });
    if (query.system) parameters.set('system', query.system === '__free__' ? '' : query.system);
    if (query.status) parameters.set('status', query.status);
    Promise.all([request<Page<Character>>(`/characters?${parameters}`), request<string[]>('/characters/systems')])
      .then(([page, values]) => { if (active) { setData(page); setSystems(values); setError(''); } })
      .catch(e => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [query, revision]);
  function filters(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); setLoading(true);
    setQuery({ q: String(form.get('q')).trim(), system: String(form.get('system')), status: String(form.get('status')), offset: 0 });
  }
  return <div className={styles.vault}>
    <header className={styles.header}><div><span className={styles.kicker}>Cofre de Personagens</span><h2>Meus personagens</h2><p>Personagens, fichas e lembranças das suas mesas em um só lugar.</p></div><button className={styles.primary} onClick={() => setFormOpen(true)}>Novo personagem</button></header>
    <p className={styles.privacy}>Seu cofre é privado. Outros jogadores e mestres não podem consultar suas fichas e anotações.</p>
    <form className={styles.filters} onSubmit={filters}>
      <label>Buscar por nome<input name="q" type="search" maxLength={150} placeholder="Nome do personagem" /></label>
      <label>Sistema<select aria-label="Sistema" name="system"><option value="">Todos os sistemas</option><option value="__free__">Sem sistema definido</option>{systems.map(system => <option key={system}>{system}</option>)}</select></label>
      <label>Estado<select aria-label="Estado" name="status"><option value="">Todos os estados</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <button className={styles.secondary} disabled={loading}>Filtrar</button>
    </form>
    {notice && <p role="status" className={styles.success}>{notice}</p>}
    {loading && <p role="status">Carregando personagens…</p>}
    {error && <div role="alert" className={styles.error}><p>{error}</p><button className={styles.secondary} onClick={() => { setLoading(true); setRevision(r => r + 1); }}>Tentar novamente</button></div>}
    {!loading && !error && data && <>
      {!data.items.length && <section className={styles.empty}><h3>{query.q || query.system || query.status ? 'Nenhum personagem corresponde aos filtros' : 'Seu cofre está esperando a primeira história'}</h3><p>Crie seu personagem para guardar uma ficha geral ou vinculá-lo às campanhas que você participa.</p><button className={styles.primary} onClick={() => setFormOpen(true)}>Criar primeiro personagem</button></section>}
      <section className={styles.cards} aria-label="Personagens">{data.items.map(character => <article className={styles.card} key={character.id}><PrivatePortrait character={character} /><div><span className={styles.badge}>{statusLabels[character.status]}</span><h3>{character.name}</h3><p>{character.system || 'Sistema não definido'}</p><Link className={styles.secondary} href={`/characters/${character.id}`}>Abrir personagem</Link></div></article>)}</section>
      <VaultPager page={data} busy={loading} onChange={offset => { setLoading(true); setQuery(q => ({ ...q, offset })); }} />
    </>}
    {formOpen && <CharacterForm close={() => { setFormOpen(false); setLoading(true); setRevision(r => r + 1); }} onSaved={() => { setFormOpen(false); setNotice('Personagem salvo no cofre.'); setLoading(true); setQuery({ q: '', system: '', status: '', offset: 0 }); setRevision(r => r + 1); }} />}
  </div>;
}
