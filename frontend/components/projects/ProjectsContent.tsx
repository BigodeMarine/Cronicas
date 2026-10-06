"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { request, type Campaign, type CurrentUser } from '@/services/journal';

export default function ProjectsContent() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.all([request<Campaign[]>('/campaigns'), request<CurrentUser>('/auth/me')])
      .then(([data, me]) => { if (active) { setCampaigns(data); setUser(me); } })
      .catch(e => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true); setError('');
    try {
      const result = await request<Campaign>(editing ? `/campaigns/${editing.id}` : '/campaigns', editing ? 'PUT' : 'POST', Object.fromEntries(data));
      setCampaigns(current => editing ? current.map(c => c.id === result.id ? result : c) : [result, ...current]);
      setShowForm(false); setEditing(null);
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível salvar.'); }
    finally { setBusy(false); }
  }
  async function remove(c: Campaign) {
    if (!window.confirm(`Excluir "${c.name}" e todos os seus relatos e sessões?`)) return;
    setBusy(true); setError('');
    try { await request(`/campaigns/${c.id}`, 'DELETE'); setCampaigns(current => current.filter(x => x.id !== c.id)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível excluir.'); }
    finally { setBusy(false); }
  }
  if (loading) return <p>Carregando suas campanhas…</p>;
  return <>
    {error && <div role="alert" className="login-error">{error} {!user && <Link href="/login">Entrar</Link>}</div>}
    <div className="projects-toolbar"><p>{campaigns.length} campanhas · suas mesas, suas histórias</p><button className="primary-button" disabled={busy || !user} onClick={() => { setEditing(null); setShowForm(true); }}>+ Nova campanha</button></div>
    {showForm && <section className="project-form-card"><h3>{editing ? 'Editar campanha' : 'Uma nova aventura'}</h3><form className="project-form" key={editing?.id ?? 'new'} onSubmit={submit}>
      <div className="form-field"><label htmlFor="campaign-name">Nome da campanha</label><input id="campaign-name" name="name" required minLength={2} maxLength={150} defaultValue={editing?.name} /></div>
      <div className="form-field"><label htmlFor="campaign-system">Sistema de RPG</label><input id="campaign-system" name="system" maxLength={100} placeholder="Ex.: D&D 5e, Tormenta20" defaultValue={editing?.system} /></div>
      <div className="form-field"><label htmlFor="campaign-description">Cenário e premissa</label><textarea id="campaign-description" name="description" rows={4} maxLength={10000} defaultValue={editing?.description ?? ''} /></div>
      <div className="project-form-actions"><button className="secondary-button" type="button" disabled={busy} onClick={() => setShowForm(false)}>Cancelar</button><button className="primary-button" disabled={busy}>{busy ? 'Salvando…' : 'Salvar campanha'}</button></div>
    </form></section>}
    {!campaigns.length && <div className="empty-state"><h3>Seu diário começa com uma campanha</h3><p>Crie uma mesa e adicione jogadores para escreverem a história juntos.</p></div>}
    <section className="projects-grid">{campaigns.map(c => <article className="project-card" key={c.id}>
      <div className="project-card-content"><span className="journal-eyebrow">{c.system || 'Sistema livre'} · {c.owner_id === user?.id ? 'Mestre' : 'Jogador'}</span><h3>{c.name}</h3><p>{c.description || 'Uma história esperando para ser contada.'}</p></div>
      <div className="project-card-actions"><Link className="primary-button" href={`/journal?campaignId=${c.id}`}>Abrir diário</Link>{c.owner_id === user?.id && <><button className="project-action-button" disabled={busy} onClick={() => { setEditing(c); setShowForm(true); }}>Editar</button><button className="project-action-button project-delete-button" disabled={busy} onClick={() => remove(c)}>Excluir</button></>}</div>
    </article>)}</section>
  </>;
}
