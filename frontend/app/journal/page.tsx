"use client";
import EntryComments from "@/components/journal/EntryComments";
import styles from "@/styles/Ui.module.css";
import { classNames } from "@/styles/classNames";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  request,
  type Campaign,
  type CurrentUser,
  type Entry,
  type Participant,
  type Session,
} from "@/services/journal";

type Diary = {
  campaign: Campaign;
  entries: Entry[];
  sessions: Session[];
  participants: Participant[];
};
function Journal() {
  const router = useRouter();
  const params = useSearchParams();
  const campaignId = Number(params.get("campaignId"));
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [diary, setDiary] = useState<Diary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"entries" | "sessions" | "participants">(
    params.get("tab") === "participants" ? "participants" : "entries",
  );
  const [filter, setFilter] = useState("all");
  const [entryForm, setEntryForm] = useState<Entry | "new" | null>(null);
  const [sessionForm, setSessionForm] = useState<Session | "new" | null>(null);
  const base = `/campaigns/${campaignId}`;
  const master = diary?.campaign.owner_id === user?.id;
  useEffect(() => {
    let active = true;
    Promise.all([
      request<Campaign[]>("/campaigns"),
      request<CurrentUser>("/auth/me"),
    ])
      .then(([data, me]) => {
        if (active) {
          setCampaigns(data);
          setUser(me);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    async function load() {
      if (!campaignId) {
        if (active) setLoading(false);
        return;
      }
      try {
        const [campaign, entries, sessions, participants] = await Promise.all([
          request<Campaign>(`/campaigns/${campaignId}`),
          request<Entry[]>(`/campaigns/${campaignId}/entries`),
          request<Session[]>(`/campaigns/${campaignId}/sessions`),
          request<Participant[]>(`/campaigns/${campaignId}/participants`),
        ]);
        if (active) {
          setDiary({ campaign, entries, sessions, participants });
          setError("");
        }
      } catch (e) {
        if (active)
          setError(
            e instanceof Error
              ? e.message
              : "Não foi possível carregar o diário.",
          );
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [campaignId]);
  async function mutate(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }
  function submitEntry(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const editing = entryForm && entryForm !== "new" ? entryForm : null;
    mutate(async () => {
      const entry = await request<Entry>(
        editing ? `${base}/entries/${editing.id}` : `${base}/entries`,
        editing ? "PUT" : "POST",
        {
          title: form.get("title"),
          content: form.get("content"),
          session_id: form.get("session_id")
            ? Number(form.get("session_id"))
            : null,
        },
      );
      setDiary(
        (d) =>
          d && {
            ...d,
            entries: editing
              ? d.entries.map((e) => (e.id === entry.id ? entry : e))
              : [entry, ...d.entries],
          },
      );
      setEntryForm(null);
    });
  }
  function submitSession(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const editing = sessionForm && sessionForm !== "new" ? sessionForm : null;
    mutate(async () => {
      const session = await request<Session>(
        editing ? `${base}/sessions/${editing.id}` : `${base}/sessions`,
        editing ? "PUT" : "POST",
        Object.fromEntries(form),
      );
      setDiary(
        (d) =>
          d && {
            ...d,
            sessions: (editing
              ? d.sessions.map((s) => (s.id === session.id ? session : s))
              : [session, ...d.sessions]
            ).sort(
              (a, b) => b.played_on.localeCompare(a.played_on) || b.id - a.id,
            ),
          },
      );
      setSessionForm(null);
    });
  }
  function addParticipant(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const email = new FormData(formElement).get("email");
    mutate(async () => {
      const p = await request<Participant>(`${base}/participants`, "POST", {
        email,
      });
      setDiary((d) => d && { ...d, participants: [...d.participants, p] });
      formElement.reset();
    });
  }
  const editEntry = entryForm && entryForm !== "new" ? entryForm : null;
  const editSession = sessionForm && sessionForm !== "new" ? sessionForm : null;
  const current = diary?.campaign.id === campaignId ? diary : null;
  const entries =
    current?.entries.filter(
      (e) =>
        filter === "all" ||
        (filter === "none"
          ? e.session_id === null
          : e.session_id === Number(filter)),
    ) ?? [];
  return (
    <div className={styles["journal-page"]}>
      <div className={styles["page-header"]}>
        <div>
          <span className={styles["journal-eyebrow"]}>
            O diário da sua mesa
          </span>
          <h2>{current?.campaign.name ?? "Diário compartilhado"}</h2>
          <p>
            {current
              ? `${current.campaign.system || "Sistema livre"} · ${master ? "Você é o mestre desta campanha" : "Cada jogador conta uma parte da história"}`
              : "Escolha uma campanha para acompanhar a aventura."}
          </p>
        </div>
        <Link className={styles["secondary-button"]} href="/projects">
          Campanhas
        </Link>
      </div>
      <div className={styles["form-field"]}>
        <label htmlFor="campaign-select">Campanha</label>
        <select
          id="campaign-select"
          value={campaignId || ""}
          onChange={(e) => router.push(`/journal?campaignId=${e.target.value}`)}
        >
          <option value="">Selecione uma campanha</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p role="alert" className={styles["login-error"]}>
          {error} {!user && <Link href="/login">Entrar</Link>}
        </p>
      )}
      {loading && <p>Carregando diário…</p>}
      {!loading && !campaignId && (
        <section className={styles["empty-state"]}>
          <h3>A história pertence a todos</h3>
          <p>
            Mestres e jogadores podem registrar suas memórias em um só lugar.
          </p>
          <Link href="/projects" className={styles["primary-button"]}>
            Escolher ou criar campanha
          </Link>
        </section>
      )}
      {current && (
        <>
          <nav
            className={styles["journal-tabs"]}
            aria-label="Seções da campanha"
          >
            {(["entries", "sessions", "participants"] as const).map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={tab === t}
                className={classNames(
                  styles,
                  tab === t ? "primary-button" : "secondary-button",
                )}
                onClick={() => {
                  setTab(t);
                  setEntryForm(null);
                  setSessionForm(null);
                }}
              >
                {t === "entries"
                  ? `Relatos (${current.entries.length})`
                  : t === "sessions"
                    ? `Sessões (${current.sessions.length})`
                    : `Mesa (${current.participants.length})`}
              </button>
            ))}
          </nav>
          {tab === "entries" && (
            <>
              <div className={styles["projects-toolbar"]}>
                <div className={styles["form-field"]}>
                  <label htmlFor="session-filter">Filtrar por sessão</label>
                  <select
                    id="session-filter"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">Todos os relatos</option>
                    <option value="none">Relatos livres</option>
                    {current.sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  className={styles["primary-button"]}
                  disabled={busy}
                  onClick={() => setEntryForm("new")}
                >
                  + Escrever relato
                </button>
              </div>
              {entryForm && (
                <section className={styles["project-form-card"]}>
                  <h3>
                    {editEntry ? "Editar relato" : "Sua versão da aventura"}
                  </h3>
                  <form
                    className={styles["project-form"]}
                    key={editEntry?.id ?? "new"}
                    onSubmit={submitEntry}
                  >
                    <div className={styles["form-field"]}>
                      <label htmlFor="entry-title">Título</label>
                      <input
                        id="entry-title"
                        name="title"
                        required
                        minLength={2}
                        maxLength={150}
                        defaultValue={editEntry?.title}
                      />
                    </div>
                    <div className={styles["form-field"]}>
                      <label htmlFor="entry-session">Sessão (opcional)</label>
                      <select
                        id="entry-session"
                        name="session_id"
                        defaultValue={editEntry?.session_id ?? ""}
                      >
                        <option value="">Relato livre da campanha</option>
                        {current.sessions.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles["form-field"]}>
                      <label htmlFor="entry-content">O que aconteceu?</label>
                      <textarea
                        id="entry-content"
                        name="content"
                        rows={9}
                        required
                        maxLength={50000}
                        placeholder="Conte a aventura pelos olhos do seu personagem…"
                        defaultValue={editEntry?.content}
                      />
                    </div>
                    <div className={styles["project-form-actions"]}>
                      <button
                        type="button"
                        className={styles["secondary-button"]}
                        disabled={busy}
                        onClick={() => setEntryForm(null)}
                      >
                        Cancelar
                      </button>
                      <button
                        className={styles["primary-button"]}
                        disabled={busy}
                      >
                        {busy
                          ? "Salvando…"
                          : editEntry
                            ? "Salvar alterações"
                            : "Publicar para a mesa"}
                      </button>
                    </div>
                  </form>
                </section>
              )}
              {!entries.length && (
                <section className={styles["empty-state"]}>
                  <h3>A primeira página está em branco</h3>
                  <p>
                    Registre um encontro, uma descoberta ou uma lembrança da
                    sessão.
                  </p>
                </section>
              )}
              <section className={styles["journal-feed"]}>
                {entries.map((e) => (
                  <article className={styles["journal-entry"]} key={e.id}>
                    <span className={styles["journal-eyebrow"]}>
                      {e.session_id
                        ? current.sessions.find((s) => s.id === e.session_id)
                            ?.title
                        : "Relato livre"}
                    </span>
                    <h3>{e.title}</h3>
                    <p className={styles["journal-meta"]}>
                      Por {e.author_name} ·{" "}
                      {new Date(e.created_at).toLocaleString("pt-BR")}
                      {e.updated_at !== e.created_at ? " · editado" : ""}
                    </p>
                    <div className={styles["journal-prose"]}>{e.content}</div>
                    {(master || e.author_id === user?.id) && (
                      <div className={styles["project-card-actions"]}>
                        <button
                          className={styles["project-action-button"]}
                          disabled={busy}
                          onClick={() => setEntryForm(e)}
                        >
                          Editar
                        </button>
                        <button
                          className={[
                            styles["project-action-button"],
                            styles["project-delete-button"],
                          ].join(" ")}
                          disabled={busy}
                          onClick={() => {
                            if (window.confirm("Excluir este relato da mesa?"))
                              mutate(async () => {
                                await request(
                                  `${base}/entries/${e.id}`,
                                  "DELETE",
                                );
                                setDiary(
                                  (d) =>
                                    d && {
                                      ...d,
                                      entries: d.entries.filter(
                                        (x) => x.id !== e.id,
                                      ),
                                    },
                                );
                                if (editEntry?.id === e.id) setEntryForm(null);
                              });
                          }}
                        >
                          Excluir
                        </button>
                      </div>
                    )}
                    <EntryComments
                      campaignId={campaignId}
                      entryId={e.id}
                      initialComments={e.comments ?? []}
                      userId={user!.id}
                      master={master}
                    />
                  </article>
                ))}
              </section>
            </>
          )}
          {tab === "sessions" && (
            <>
              <div className={styles["projects-toolbar"]}>
                <p>Os capítulos da campanha, do mais recente ao mais antigo.</p>
                {master && (
                  <button
                    className={styles["primary-button"]}
                    disabled={busy}
                    onClick={() => setSessionForm("new")}
                  >
                    + Registrar sessão
                  </button>
                )}
              </div>
              {sessionForm && (
                <section className={styles["project-form-card"]}>
                  <h3>{editSession ? "Editar sessão" : "Novo capítulo"}</h3>
                  <form
                    className={styles["project-form"]}
                    key={editSession?.id ?? "new"}
                    onSubmit={submitSession}
                  >
                    <div className={styles["form-field"]}>
                      <label htmlFor="session-title">Título da sessão</label>
                      <input
                        id="session-title"
                        name="title"
                        required
                        minLength={2}
                        maxLength={150}
                        defaultValue={editSession?.title}
                      />
                    </div>
                    <div className={styles["form-field"]}>
                      <label htmlFor="session-date">Data da sessão</label>
                      <input
                        id="session-date"
                        name="played_on"
                        type="date"
                        required
                        defaultValue={editSession?.played_on}
                      />
                    </div>
                    <div className={styles["form-field"]}>
                      <label htmlFor="session-summary">Resumo do mestre</label>
                      <textarea
                        id="session-summary"
                        name="summary"
                        rows={5}
                        maxLength={20000}
                        defaultValue={editSession?.summary}
                      />
                    </div>
                    <div className={styles["project-form-actions"]}>
                      <button
                        className={styles["secondary-button"]}
                        type="button"
                        disabled={busy}
                        onClick={() => setSessionForm(null)}
                      >
                        Cancelar
                      </button>
                      <button
                        className={styles["primary-button"]}
                        disabled={busy}
                      >
                        {busy ? "Salvando…" : "Salvar sessão"}
                      </button>
                    </div>
                  </form>
                </section>
              )}
              {!current.sessions.length && (
                <section className={styles["empty-state"]}>
                  <h3>Nenhuma sessão registrada</h3>
                  <p>
                    {master
                      ? "Registre a primeira sessão e deixe a mesa completar a história."
                      : "O mestre ainda não registrou uma sessão. Você já pode escrever relatos livres."}
                  </p>
                </section>
              )}
              <section className={styles["journal-feed"]}>
                {current.sessions.map((s) => (
                  <article className={styles["journal-entry"]} key={s.id}>
                    <span className={styles["journal-eyebrow"]}>
                      {new Date(`${s.played_on}T12:00:00`).toLocaleDateString(
                        "pt-BR",
                      )}
                    </span>
                    <h3>{s.title}</h3>
                    <div className={styles["journal-prose"]}>
                      {s.summary || "Sem resumo por enquanto."}
                    </div>
                    <div className={styles["project-card-actions"]}>
                      <button
                        className={styles["project-action-button"]}
                        onClick={() => {
                          setFilter(String(s.id));
                          setTab("entries");
                        }}
                      >
                        Ler relatos desta sessão
                      </button>
                      {master && (
                        <button
                          className={styles["project-action-button"]}
                          disabled={busy}
                          onClick={() => setSessionForm(s)}
                        >
                          Editar sessão
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </section>
            </>
          )}
          {tab === "participants" && (
            <>
              <p>
                Todos os participantes podem ler e escrever. O mestre gerencia a
                mesa e pode moderar relatos.
              </p>
              {master && (
                <section className={styles["project-form-card"]}>
                  <h3>Adicionar jogador</h3>
                  <p>
                    A pessoa precisa ter uma conta no Crônicas. O acesso é
                    concedido imediatamente, sem envio de e-mail.
                  </p>
                  <form
                    className={styles["project-form"]}
                    onSubmit={addParticipant}
                  >
                    <div className={styles["form-field"]}>
                      <label htmlFor="participant-email">E-mail da conta</label>
                      <input
                        id="participant-email"
                        name="email"
                        type="email"
                        required
                      />
                    </div>
                    <button
                      className={styles["primary-button"]}
                      disabled={busy}
                    >
                      {busy ? "Adicionando…" : "Adicionar à mesa"}
                    </button>
                  </form>
                </section>
              )}
              <section className={styles["members-panel"]}>
                <div className={styles["members-list"]}>
                  {current.participants.map((p) => (
                    <div className={styles["member-item"]} key={p.user_id}>
                      <div className={styles["member-info"]}>
                        <div className={styles["member-avatar"]}>
                          {p.name.charAt(0)}
                        </div>
                        <span>{p.name}</span>
                      </div>
                      <span className={styles["member-role"]}>
                        {p.role === "MASTER" ? "Mestre" : "Jogador"}
                      </span>
                      {master && p.role !== "MASTER" && (
                        <button
                          className={styles["project-action-button"]}
                          disabled={busy}
                          onClick={() => {
                            if (
                              window.confirm(
                                `Remover ${p.name} da mesa? Seus relatos serão preservados.`,
                              )
                            )
                              mutate(async () => {
                                await request(
                                  `${base}/participants/${p.user_id}`,
                                  "DELETE",
                                );
                                setDiary(
                                  (d) =>
                                    d && {
                                      ...d,
                                      participants: d.participants.filter(
                                        (x) => x.user_id !== p.user_id,
                                      ),
                                    },
                                );
                              });
                          }}
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
function JournalRoute() {
  const params = useSearchParams();
  return <Journal key={params.get("campaignId") ?? "choose"} />;
}
export default function JournalPage() {
  return (
    <Suspense fallback={<p>Carregando diário…</p>}>
      <JournalRoute />
    </Suspense>
  );
}
