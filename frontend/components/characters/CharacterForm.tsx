"use client";
import { useState } from 'react';
import { request } from '@/services/journal';
import { statusLabels, uploadVaultFile, validateFile, type Character } from '@/services/characters';
import VaultModal from './VaultModal';
import FilePicker from './FilePicker';
import styles from './Vault.module.css';

export default function CharacterForm({ initial, onSaved, close }: { initial?: Character; onSaved: (character: Character) => void; close: () => void }) {
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    setBusy(true); setError(''); setNotice('');
    let persisted = false;
    const portrait = form.get('portrait') as File;
    try {
      if (portrait?.name) validateFile(portrait, true);
      const body = { name: String(form.get('name')).trim(), system: String(form.get('system')).trim(), history: String(form.get('history')) || null, status: form.get('status') };
      const character = await request<Character>(saved ? `/characters/${saved.id}` : '/characters', saved ? 'PUT' : 'POST', body);
      setSaved(character);
      persisted = true;
      if (portrait?.name) {
        setNotice('Personagem salvo. Enviando o retrato…');
        character.portrait = await uploadVaultFile(`/characters/${character.id}/portrait`, portrait, true);
      }
      onSaved(character);
    } catch (e) { if (persisted) setNotice('Os dados foram salvos. O retrato ainda não foi enviado; você pode tentar novamente.'); setError(e instanceof Error ? e.message : 'Não foi possível salvar o personagem.'); }
    finally { setBusy(false); }
  }
  return <VaultModal title={initial ? 'Editar personagem' : 'Novo personagem'} close={close} busy={busy}>
    <form className={styles.form} onSubmit={submit}>
      <label>Nome<input name="name" required maxLength={150} defaultValue={initial?.name} disabled={busy} /></label>
      <label>Sistema de RPG<input name="system" maxLength={100} placeholder="Ex.: Tormenta20, D&D 5e" defaultValue={initial?.system} disabled={busy} /></label>
      <label>Estado<select aria-label="Estado" name="status" defaultValue={initial?.status ?? 'active'} disabled={busy}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>História ou descrição<textarea aria-label="História ou descrição" name="history" rows={5} maxLength={50000} defaultValue={initial?.history ?? ''} disabled={busy} /></label>
      <FilePicker label="Retrato (PNG/JPEG, até 5 MB)" name="portrait" accept="image/png,image/jpeg,.png,.jpg,.jpeg" disabled={busy} />
      {initial?.portrait && <p>Retrato atual: {initial.portrait.filename}. Selecione outro arquivo para substituir.</p>}
      {notice && <p role="status">{notice}</p>}{error && <p role="alert" className={styles.error}>{error}</p>}
      <button className={styles.primary} disabled={busy}>{busy ? 'Salvando…' : 'Salvar personagem'}</button>
    </form>
  </VaultModal>;
}
