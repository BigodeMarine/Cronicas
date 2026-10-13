"use client";
import { useRef, useState } from 'react';
import { request } from '@/services/journal';
import { downloadVaultFile, uploadVaultFile, type VaultFile } from '@/services/characters';
import styles from './Vault.module.css';
import FilePicker from './FilePicker';

export default function FileSlot({ endpoint, title, file, portrait = false, changed }: { endpoint: string; title: string; file: VaultFile | null; portrait?: boolean; changed: (file: VaultFile | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  async function action(work: () => Promise<void>) {
    setBusy(true); setError(''); setNotice('');
    try { await work(); } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível concluir a operação.'); }
    finally { setBusy(false); }
  }
  function upload(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault(); const selected = ref.current?.files?.[0]; if (!selected) { setError('Selecione um arquivo para enviar.'); return; }
    action(async () => { const result = await uploadVaultFile(endpoint, selected, portrait); changed(result); if (ref.current) ref.current.value = ''; setNotice('Arquivo salvo com acesso privado.'); });
  }
  return <section className={styles.fileSlot} aria-label={title}><h3>{title}</h3>
    <p>{file ? `${file.filename} · ${(file.size / 1024).toFixed(1)} KB` : 'Nenhum arquivo anexado.'}</p>
    <form className={styles.form} onSubmit={upload}><FilePicker key={file?.created_at ?? 'empty'} label={file ? `Substituir ${title.toLowerCase()}` : `Anexar ${title.toLowerCase()}`} inputRef={ref} accept={portrait ? '.png,.jpg,.jpeg,image/png,image/jpeg' : '.pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg'} disabled={busy} /><p className={styles.muted}>{portrait ? 'PNG/JPEG, até 5 MB.' : 'PDF/PNG/JPEG, até 10 MB.'}</p><button className={styles.primary} disabled={busy}>{busy ? 'Processando…' : file ? 'Substituir arquivo' : 'Enviar arquivo'}</button></form>
    {file && <div className={styles.actions}><button className={styles.secondary} disabled={busy} onClick={() => action(async () => { await downloadVaultFile(endpoint, file); setNotice('Download iniciado.'); })}>Baixar arquivo</button><button className={styles.danger} disabled={busy} onClick={() => { if (window.confirm(`Remover ${title.toLowerCase()}?`)) action(async () => { await request(endpoint, 'DELETE'); changed(null); setNotice('Arquivo removido.'); }); }}>Remover arquivo</button></div>}
    {error && <p role="alert" className={styles.error}>{error}</p>}{notice && <p role="status" className={styles.success}>{notice}</p>}
  </section>;
}
