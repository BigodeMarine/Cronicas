"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { request, type Campaign } from '@/services/journal';
import { statusLabels, type Character, type Page, type Participation } from '@/services/characters';
import CharacterForm from './CharacterForm';
import PrivatePortrait from './PrivatePortrait';
import FileSlot from './FileSlot';
import ParticipationPanel from './ParticipationPanel';
import VaultPager from './VaultPager';
import styles from './Vault.module.css';

export default function CharacterDetail({ id }: { id: number }) {
  const router = useRouter();
  const [character, setCharacter] = useState<Character | null>(null);
  const [participations, setParticipations] = useState<Page<Participation> | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [offset, setOffset] = useState(0);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState(false);
  const base = `/characters/${id}`;
  useEffect(() => {
    let active = true;
    Promise.all([request<Character>(base), request<Page<Participation>>(`${base}/participations?limit=5&offset=${offset}`), request<Campaign[]>('/campaigns')])
      .then(([data, page, tables]) => { if (active) { setCharacter(data); setParticipations(page); setCampaigns(tables); setError(''); } })
      .catch(e => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [base, offset, revision]);
  async function action(work: () => Promise<void>) {
    setBusy(true); setError(''); setNotice('');
    try { await work(); } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível concluir a operação.'); }
    finally { setBusy(false); }
  }
  function refresh() { setLoading(true); setRevision(r => r + 1); }
  function linkCampaign(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const project_id = Number(form.get('project_id')); const external_url = String(form.get('external_url')).trim() || null;
    action(async () => { await request(`${base}/participations`, 'POST', { project_id, external_url }); setOffset(0); refresh(); setNotice('Campanha vinculada ao personagem.'); });
  }
  const available = campaigns.filter(c => !participations?.items.some(p => p.project_id === c.id));
  return <div className={styles.vault}>
    <Link className={styles.secondary} href="/characters">Meus personagens</Link>
    {loading && <p role="status">Carregando personagem…</p>}
    {error && <p role="alert" className={styles.error}>{error} <button className={styles.secondary} onClick={refresh}>Tentar novamente</button></p>}
    {notice && <p role="status" className={styles.success}>{notice}</p>}
    {character && <>
      <header className={styles.characterHeader}><PrivatePortrait character={character} /><div><span className={styles.kicker}>Cofre de Personagens</span><h2>{character.name}</h2><p>{character.system || 'Sistema não definido'} · <span className={styles.badge}>{statusLabels[character.status]}</span></p><p className={styles.muted}>Criado em {new Date(character.created_at).toLocaleDateString('pt-BR')}</p>
        <div className={styles.actions}><button className={styles.secondary} disabled={busy} onClick={() => setEditing(true)}>Editar personagem</button>{character.status === 'active' && <button className={styles.secondary} disabled={busy} onClick={() => action(async () => { const { name, system, history } = character; setCharacter(await request<Character>(base, 'PUT', { name, system, history, status: 'retired' })); setNotice('Personagem aposentado. Suas fichas e anotações foram preservadas.'); })}>Aposentar personagem</button>}<button className={styles.danger} disabled={busy} onClick={() => { if (window.confirm(`Excluir "${character.name}" e todas as fichas e anotações? Esta ação não pode ser desfeita.`)) action(async () => { await request(base, 'DELETE'); router.push('/characters'); }); }}>Excluir personagem</button></div>
      </div></header>
      {character.history && <section className={styles.section}><h3>História</h3><div className={styles.prose}>{character.history}</div></section>}
      <p className={styles.privacy}>Seu personagem, seus anexos e suas anotações são privados, inclusive para os mestres das campanhas.</p>
      <div className={styles.files}><FileSlot endpoint={`${base}/portrait`} title="Retrato" portrait file={character.portrait} changed={file => setCharacter(c => c && ({ ...c, portrait: file }))} /><FileSlot endpoint={`${base}/sheet`} title="Ficha geral" file={character.sheet} changed={file => setCharacter(c => c && ({ ...c, sheet: file }))} /></div>
      <section className={styles.section}><h3>Campanhas vinculadas</h3><p>O mesmo personagem pode ter uma ficha diferente em cada mesa.</p>
        {available.length ? <form className={styles.form} onSubmit={linkCampaign}><label>Campanha<select aria-label="Campanha" name="project_id" required disabled={busy}><option value="">Escolha uma campanha acessível</option>{available.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Link externo (opcional)<input name="external_url" type="url" pattern="https?://.+" maxLength={2048} placeholder="https://" disabled={busy} /></label><button className={styles.primary} disabled={busy}>Vincular campanha</button></form> : <p>{campaigns.length ? 'As campanhas desta página já estão vinculadas.' : 'Você ainda não participa de campanhas. Crie uma campanha ou peça ao mestre para incluir sua conta na mesa.'} <Link href="/projects">Ver campanhas</Link></p>}
        {!participations?.items.length && !loading && <p>Nenhuma campanha vinculada com acesso atual.</p>}
      </section>
      {participations?.items.map(p => <ParticipationPanel key={p.id} characterId={id} participation={p} changed={next => setParticipations(current => current && ({ ...current, items: current.items.map(item => item.id === next.id ? next : item) }))} removed={() => { setOffset(0); refresh(); setNotice('Campanha desvinculada.'); }} />)}
      {participations && <VaultPager page={participations} busy={loading} onChange={next => { setLoading(true); setOffset(next); }} />}
      {editing && <CharacterForm initial={character} close={() => { setEditing(false); refresh(); }} onSaved={next => { setCharacter(next); setEditing(false); setNotice('Personagem atualizado.'); }} />}
    </>}
  </div>;
}
