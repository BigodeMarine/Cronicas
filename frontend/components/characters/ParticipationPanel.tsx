"use client";
import { useEffect, useState } from 'react';
import { request, type Session } from '@/services/journal';
import type { CharacterNote, Page, Participation } from '@/services/characters';
import FileSlot from './FileSlot';
import NoteForm from './NoteForm';
import VaultPager from './VaultPager';
import styles from './Vault.module.css';

export default function ParticipationPanel({ characterId, participation, changed, removed }: { characterId: number; participation: Participation; changed: (p: Participation) => void; removed: () => void }) {
  const base = `/characters/${characterId}/participations/${participation.id}`;
  const [notes, setNotes] = useState<Page<CharacterNote> | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [offset, setOffset] = useState(0);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [noteForm, setNoteForm] = useState<CharacterNote | 'new' | null>(null);
  useEffect(() => {
    let active = true;
    Promise.all([request<Page<CharacterNote>>(`${base}/notes?limit=5&offset=${offset}`), request<Session[]>(`/campaigns/${participation.project_id}/sessions`)])
      .then(([page, values]) => { if (active) { setNotes(page); setSessions(values); setError(''); } })
      .catch(e => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [base, participation.project_id, offset, revision]);
  async function action(work: () => Promise<void>) {
    setBusy(true); setError(''); setNotice('');
    try { await work(); } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível concluir a operação.'); }
    finally { setBusy(false); }
  }
  function refreshNotes() { setLoading(true); setRevision(r => r + 1); }
  function saveLink(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault(); const external_url = String(new FormData(event.currentTarget).get('external_url')).trim() || null;
    action(async () => { const next = await request<Participation>(base, 'PUT', { external_url }); changed(next); setNotice('Link externo salvo.'); });
  }
  return <section className={styles.participation} aria-label={`Participação em ${participation.campaign_name}`}>
    <header className={styles.header}><h3>{participation.campaign_name}</h3><button className={styles.danger} disabled={busy} onClick={() => { if (window.confirm('Desvincular esta campanha? As anotações privadas e a ficha específica serão excluídas. A ficha geral será preservada.')) action(async () => { await request(base, 'DELETE'); removed(); }); }}>Desvincular campanha</button></header>
    <FileSlot endpoint={`${base}/sheet`} title="Ficha da campanha" file={participation.sheet} changed={file => changed({ ...participation, sheet: file })} />
    <form className={styles.form} onSubmit={saveLink}><label>Link externo da ficha<input name="external_url" type="url" pattern="https?://.+" maxLength={2048} placeholder="https://" defaultValue={participation.external_url ?? ''} disabled={busy} /></label><button className={styles.secondary} disabled={busy}>Salvar link externo</button></form>
    {participation.external_url && <a className={styles.secondary} href={participation.external_url} target="_blank" rel="noopener noreferrer">Abrir ficha externa</a>}
    <div className={styles.header}><div><h4>Anotações privadas</h4><p>Só você pode ler estas lembranças da campanha.</p></div><button className={styles.primary} disabled={busy || loading || !!error} onClick={() => setNoteForm('new')}>Nova anotação</button></div>
    {loading && <p role="status">Carregando anotações…</p>}
    {error && <p role="alert" className={styles.error}>{error} <button className={styles.secondary} onClick={refreshNotes}>Tentar novamente</button></p>}
    {notice && <p role="status" className={styles.success}>{notice}</p>}
    {!loading && notes && <>
      {!notes.items.length && <p>Nenhuma anotação nesta campanha. Registre sua primeira lembrança.</p>}
      <div className={styles.notes}>{notes.items.map(note => <article className={styles.note} key={note.id}><h4>{note.title}</h4><p className={styles.muted}>{note.session_id && `Sessão: ${sessions.find(s => s.id === note.session_id)?.title ?? 'Sessão vinculada'}. `}{note.session_date && `Data: ${new Date(`${note.session_date}T12:00:00`).toLocaleDateString('pt-BR')}. `}Atualizada em {new Date(note.updated_at).toLocaleString('pt-BR')}</p><div className={styles.prose}>{note.content}</div><div className={styles.actions}><button className={styles.secondary} disabled={busy} onClick={() => setNoteForm(note)}>Editar anotação</button><button className={styles.danger} disabled={busy} onClick={() => { if (window.confirm(`Excluir a anotação "${note.title}"?`)) action(async () => { await request(`${base}/notes/${note.id}`, 'DELETE'); setOffset(0); refreshNotes(); setNotice('Anotação excluída.'); }); }}>Excluir anotação</button></div></article>)}</div>
      <VaultPager page={notes} busy={loading} onChange={next => { setLoading(true); setOffset(next); }} />
    </>}
    {noteForm && <NoteForm endpoint={`${base}/notes`} initial={noteForm === 'new' ? undefined : noteForm} sessions={sessions} close={() => setNoteForm(null)} saved={() => { setNoteForm(null); setOffset(0); refreshNotes(); setNotice('Anotação privada salva.'); }} />}
  </section>;
}
