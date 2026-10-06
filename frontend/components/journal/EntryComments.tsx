"use client";

import { useState } from "react";
import { request, type JournalComment } from "@/services/journal";
import styles from "./EntryComments.module.css";

export default function EntryComments({ campaignId, entryId, initialComments, userId, master }: {
  campaignId: number; entryId: number; initialComments: JournalComment[]; userId: number; master: boolean;
}) {
  const [comments, setComments] = useState(initialComments);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const base = `/campaigns/${campaignId}/entries/${entryId}/comments`;

  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim()) return;
    setBusy(true); setError("");
    try {
      const comment = await request<JournalComment>(editing ? `${base}/${editing}` : base, editing ? "PUT" : "POST", { content: draft });
      setComments(current => editing ? current.map(c => c.id === comment.id ? comment : c) : [...current, comment]);
      setDraft(""); setEditing(null);
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível salvar o comentário."); }
    finally { setBusy(false); }
  }

  async function remove(id: number) {
    if (!window.confirm("Excluir este comentário?")) return;
    setBusy(true); setError("");
    try {
      await request(`${base}/${id}`, "DELETE");
      setComments(current => current.filter(c => c.id !== id));
      if (editing === id) { setEditing(null); setDraft(""); }
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível excluir o comentário."); }
    finally { setBusy(false); }
  }

  return <section className={styles.thread} aria-label="Comentários do relato">
    <h4>Comentários da mesa ({comments.length})</h4>
    {!comments.length && <p className={styles.empty}>Deixe sua anotação ou converse com a mesa sobre este relato.</p>}
    <ol className={styles.list}>{comments.map(comment => <li className={styles.comment} key={comment.id}>
      <p className={styles.byline}><strong>{comment.author_name}</strong> <time dateTime={comment.created_at}>{new Date(comment.created_at).toLocaleString("pt-BR")}</time>{comment.updated_at !== comment.created_at && <span> · editado</span>}</p>
      <p className={styles.content}>{comment.content}</p>
      {(master || comment.author_id === userId) && <div className={styles.actions}>
        <button type="button" disabled={busy} onClick={() => { setEditing(comment.id); setDraft(comment.content); setError(""); }}>Editar comentário</button>
        <button type="button" disabled={busy} onClick={() => remove(comment.id)}>Excluir comentário</button>
      </div>}
    </li>)}</ol>
    <form className={styles.form} onSubmit={submit}>
      <label htmlFor={`comment-${entryId}`}>{editing ? "Editar comentário" : "Escreva um comentário"}</label>
      <textarea id={`comment-${entryId}`} value={draft} onChange={e => setDraft(e.target.value)} required maxLength={5000} rows={3} disabled={busy} placeholder="Acrescente uma lembrança, uma pergunta ou sua visão da aventura." />
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <div className={styles.actions}>
        <button className={styles.submit} disabled={busy || !draft.trim()}>{busy ? "Salvando…" : editing ? "Salvar comentário" : "Publicar comentário"}</button>
        {editing && <button type="button" disabled={busy} onClick={() => { setEditing(null); setDraft(""); }}>Cancelar</button>}
      </div>
    </form>
  </section>;
}
