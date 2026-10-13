"use client";
import { useState } from 'react';
import { request, type Session } from '@/services/journal';
import type { CharacterNote } from '@/services/characters';
import VaultModal from './VaultModal';
import styles from './Vault.module.css';

export default function NoteForm({ endpoint, initial, sessions, close, saved }: { endpoint: string; initial?: CharacterNote; sessions: Session[]; close: () => void; saved: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); setBusy(true); setError('');
    try {
      await request(initial ? `${endpoint}/${initial.id}` : endpoint, initial ? 'PUT' : 'POST', {
        title: String(form.get('title')).trim(), content: String(form.get('content')).trim(), session_id: form.get('session_id') ? Number(form.get('session_id')) : null, session_date: form.get('session_date') || null,
      });
      saved();
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível salvar a anotação.'); }
    finally { setBusy(false); }
  }
  return <VaultModal title={initial ? 'Editar anotação privada' : 'Nova anotação privada'} busy={busy} close={close}>
    <form className={styles.form} onSubmit={submit}>
      <label>Título<input name="title" required maxLength={150} defaultValue={initial?.title} disabled={busy} /></label>
      <label>Conteúdo<textarea aria-label="Conteúdo" name="content" required rows={7} maxLength={50000} defaultValue={initial?.content} disabled={busy} /></label>
      <label>Sessão (opcional)<select aria-label="Sessão (opcional)" name="session_id" defaultValue={initial?.session_id ?? ''} disabled={busy}><option value="">Sem sessão vinculada</option>{sessions.map(session => <option key={session.id} value={session.id}>{session.title}</option>)}</select></label>
      <label>Data da sessão (opcional)<input type="date" name="session_date" defaultValue={initial?.session_date ?? ''} disabled={busy} /></label>
      <p className={styles.privacy}>Esta anotação é privada. Apenas você pode consultá-la.</p>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <button className={styles.primary} disabled={busy}>{busy ? 'Salvando…' : 'Salvar anotação'}</button>
    </form>
  </VaultModal>;
}
