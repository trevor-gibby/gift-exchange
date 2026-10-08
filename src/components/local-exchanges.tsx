"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore, type FormEvent } from "react";
import { ArrowRight, Ban, CalendarDays, ChevronLeft, CircleDollarSign, Gift, Plus, Shuffle, Sparkles, Trash2, UsersRound } from "lucide-react";
import { ZodError } from "zod";
import { MessageBanner } from "@/components/message-banner";
import { formatBudget, formatBudgetInput, formatDate } from "@/lib/format";
import { initials } from "@/lib/identity";
import {
  LOCAL_EXCHANGES_CHANGED, LOCAL_EXCHANGES_KEY, finalizeLocalExchange, localExchangeDetails,
  readLocalExchanges, removeLocalParticipant, saveLocalParticipant, serializeLocalExchanges,
  setLocalExclusion, updateLocalDetails, type LocalExchange,
} from "@/lib/local-exchanges";

function subscribe(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === LOCAL_EXCHANGES_KEY || event.key === null) listener();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(LOCAL_EXCHANGES_CHANGED, listener);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(LOCAL_EXCHANGES_CHANGED, listener);
  };
}

function getSnapshot() {
  try { return window.localStorage.getItem(LOCAL_EXCHANGES_KEY) ?? ""; }
  catch { return "storage-unavailable"; }
}

function serverSnapshot() { return null; }

function useLocalExchanges() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, serverSnapshot);
  return useMemo(() => {
    if (raw === null) return { loading: true, exchanges: [] as LocalExchange[] };
    try { return { loading: false, exchanges: readLocalExchanges(raw) }; }
    catch { return { loading: false, exchanges: [] as LocalExchange[], error: "Your browser storage is unavailable or contains an unreadable save. Enable local storage or use another browser. Existing saves have been left intact." }; }
  }, [raw]);
}

function persist(update: (events: LocalExchange[]) => LocalExchange[]) {
  // Read again at mutation time so a stale tab cannot overwrite a finalized draw.
  const latest = readLocalExchanges(window.localStorage.getItem(LOCAL_EXCHANGES_KEY) ?? "");
  window.localStorage.setItem(LOCAL_EXCHANGES_KEY, serializeLocalExchanges(update(latest)));
  window.dispatchEvent(new Event(LOCAL_EXCHANGES_CHANGED));
}

function errorMessage(error: unknown) {
  if (error instanceof ZodError) return error.issues[0]?.message ?? "Please check the form.";
  if (error instanceof DOMException) return "Your browser could not save this exchange. Check that local storage is enabled and has space.";
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export function LocalModeNote() {
  return <div className="guest-banner"><div><Gift size={21} /><p><strong>Saved in this browser</strong><span>Draws show all matches here. Invitations and private reveals are unavailable. Clearing browser data removes your exchanges.</span></p></div></div>;
}

function ExchangeFields({ event }: { event?: LocalExchange }) {
  return <>
    <label className="field"><span>Exchange name</span><input name="name" defaultValue={event?.name} required minLength={3} maxLength={80} placeholder="Friendsmas 2026" /></label>
    <label className="field"><span>A little context <small>Optional</small></span><textarea name="description" defaultValue={event?.description ?? ""} maxLength={500} rows={3} placeholder="Cozy gifts and good snacks…" /></label>
    <div className="field-row">
      <label className="field"><span>Exchange date <small>Optional</small></span><input name="exchangeDate" type="date" defaultValue={event?.exchangeDate?.slice(0, 10) ?? ""} /></label>
      <label className="field"><span>Budget <small>Optional</small></span><input name="budget" inputMode="decimal" defaultValue={formatBudgetInput(event?.budgetCents ?? null)} placeholder="40.00" /></label>
    </div>
  </>;
}

export function LocalNewExchange() {
  const router = useRouter();
  const store = useLocalExchanges();
  const [error, setError] = useState<string>();
  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const id = crypto.randomUUID();
      const exchange: LocalExchange = { id, ...localExchangeDetails(new FormData(event.currentTarget)), status: "DRAFT", participants: [], assignments: [] };
      persist((events) => [exchange, ...events]);
      router.push(`/events/${id}`);
    } catch (error) { setError(errorMessage(error)); }
  }
  return <section className="narrow-page shell create-page">
    <Link className="back-link text-link" href="/dashboard"><ChevronLeft size={17} /> Back to exchanges</Link>
    <LocalModeNote /><MessageBanner error={store.error ?? error} />
    <div className="form-card create-card">
      <div className="create-heading"><span className="round-icon"><Gift /></span><span className="eyebrow">A new merry exchange</span><h1>Set the scene</h1><p>Add the occasion, then build your guest list.</p></div>
      <form onSubmit={create} className="form-stack"><ExchangeFields /><button className="button button-primary button-full button-large" disabled={store.loading || Boolean(store.error)} type="submit">Create the exchange <Sparkles size={18} /></button></form>
    </div>
  </section>;
}

export function LocalDashboard() {
  const { exchanges, loading, error } = useLocalExchanges();
  return <section className="dashboard-page shell page-section">
    <div className="page-heading heading-with-action"><div><span className="eyebrow"><Sparkles size={14} /> Holiday headquarters</span><h1>Your exchanges</h1><p>A little holiday magic, right on this device.</p></div><Link className="button button-primary" href="/exchanges/new"><Plus size={18} /> New exchange</Link></div>
    <LocalModeNote /><MessageBanner error={error} />
    {loading ? <p role="status">Opening your exchanges…</p> : exchanges.length ? <div className="event-grid">{exchanges.map((event) =>
      <Link className="event-card" href={`/events/${event.id}`} key={event.id}>
        <div className="event-card-top"><span className={`status-chip ${event.status === "DRAFT" ? "status-draft" : "status-final"}`}>{event.status === "DRAFT" ? "Planning" : "Draw complete"}</span><ArrowRight size={20} /></div>
        <div className="event-gift" aria-hidden="true"><Gift /></div><h2>{event.name}</h2><p>{event.description || "A merry exchange is taking shape."}</p>
        <div className="event-meta"><span><UsersRound size={16} /> {event.participants.length} participants</span><span><CalendarDays size={16} /> {formatDate(event.exchangeDate ? new Date(event.exchangeDate) : null)}</span></div>
      </Link>)}</div> : !error ? <div className="empty-state"><span className="empty-art"><Gift size={42} /></span><h2>Start your first exchange</h2><p>Add your people and set the rules for a fair draw.</p><Link className="button button-primary" href="/exchanges/new">Create an exchange <ArrowRight size={18} /></Link></div> : null}
  </section>;
}

export function LocalEvent({ eventId }: { eventId: string }) {
  const router = useRouter();
  const { exchanges, loading, error: storageError } = useLocalExchanges();
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const event = exchanges.find(({ id }) => id === eventId);

  function update(transform: (event: LocalExchange) => LocalExchange, message?: string) {
    try {
      persist((events) => {
        if (!events.some(({ id }) => id === eventId)) throw new Error("This exchange is no longer saved in this browser.");
        return events.map((event) => event.id === eventId ? transform(event) : event);
      });
      setError(undefined); setNotice(message);
      return true;
    } catch (error) { setError(errorMessage(error)); return false; }
  }

  if (loading) return <section className="shell page-section"><p role="status">Opening your exchange…</p></section>;
  if (!event) return <section className="narrow-page shell"><div className="form-card centered-card"><h1>Exchange unavailable</h1><p>{storageError ?? "This exchange is not saved in this browser. Open it on the device where you created it."}</p><Link className="button button-primary" href="/dashboard">My exchanges</Link></div></section>;
  const isDraft = event.status === "DRAFT";
  const names = new Map(event.participants.map(({ id, name }) => [id, name]));

  function addParticipant(submit: FormEvent<HTMLFormElement>) {
    submit.preventDefault();
    const form = submit.currentTarget;
    const name = String(new FormData(form).get("name") ?? "");
    if (update((event) => saveLocalParticipant(event, name, crypto.randomUUID()), "Participant added.")) form.reset();
  }

  function draw() {
    if (!window.confirm("Draw names? Participants and exclusions will be locked, and all matches will be shown here.")) return;
    update((event) => finalizeLocalExchange(event, () => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32), "The draw is complete!");
  }

  function deleteExchange() {
    if (!window.confirm("Delete this exchange from this browser? This cannot be undone.")) return;
    try { persist((events) => events.filter(({ id }) => id !== eventId)); router.push("/dashboard"); }
    catch (error) { setError(errorMessage(error)); }
  }

  return <section className="event-page shell page-section">
    <Link className="back-link text-link" href="/dashboard"><ChevronLeft size={17} /> All exchanges</Link>
    <LocalModeNote /><MessageBanner error={storageError ?? error} notice={notice} />
    <div className="event-heading"><div><span className={`status-chip ${isDraft ? "status-draft" : "status-final"}`}>{isDraft ? "Planning" : "Draw complete"}</span><h1>{event.name}</h1><p>{event.description || "A merry exchange is in the making."}</p></div><div className="event-heading-gift" aria-hidden="true"><Gift /></div></div>
    <div className="stats-strip"><div><UsersRound /><span><strong>{event.participants.length}</strong> Participants</span></div><div><CalendarDays /><span><strong>{formatDate(event.exchangeDate ? new Date(event.exchangeDate) : null)}</strong> Exchange date</span></div><div><CircleDollarSign /><span><strong>{formatBudget(event.budgetCents)}</strong> Gift budget</span></div></div>
    <div className="event-layout"><div className="event-main-column">
      {!isDraft ? <section className="panel public-results-panel"><div className="panel-heading"><div><span className="eyebrow">The big reveal</span><h2>Full assignment list</h2></div><span className="count-badge">{event.assignments.length} matches</span></div><ol className="public-assignment-list">{event.assignments.map(({ giverId, recipientId }, index) => <li key={giverId}><span className="assignment-number">{index + 1}</span><strong>{names.get(giverId)}</strong><span className="assignment-direction">gives to <ArrowRight size={16} /></span><strong>{names.get(recipientId)}</strong></li>)}</ol></section> : null}
      <section className="panel participant-panel">
        <div className="panel-heading"><div><span className="eyebrow">Guest list</span><h2>Who&apos;s exchanging?</h2></div><span className="count-badge">{event.participants.length}/100</span></div>
        {isDraft ? <form className="local-participant-form" onSubmit={addParticipant}><label className="field"><span>Participant name</span><input name="name" required minLength={2} maxLength={80} placeholder="Alex Rivera" /></label><button className="button button-primary" disabled={event.participants.length >= 100} type="submit"><Plus size={17} /> Add participant</button></form> : <div className="locked-note">Participants and exclusions are locked after the draw.</div>}
        <div className="participant-list">{event.participants.map((person, index) => <article className="participant-row" key={person.id}>
          <div className={`avatar avatar-${index % 4 + 1}`}>{initials(person.name)}</div>
          <div className="participant-details"><strong>{person.name}</strong><span>{person.excludedRecipientIds.length} exclusion{person.excludedRecipientIds.length === 1 ? "" : "s"}</span></div>
          {isDraft ? <div className="participant-actions">
            <details className="exclusion-popover"><summary className="icon-button" aria-label={`Edit ${person.name}`}><Ban size={17} /></summary><div className="exclusion-menu">
              <form className="form-stack" onSubmit={(submit) => { submit.preventDefault(); const name = String(new FormData(submit.currentTarget).get("name") ?? ""); update((event) => saveLocalParticipant(event, name, person.id), "Name updated."); }}><label className="field"><span>Participant name</span><input name="name" defaultValue={person.name} required minLength={2} maxLength={80} /></label><button type="submit" className="button button-small button-secondary">Save name</button></form>
              <p><strong>{person.name}</strong> cannot draw:</p><div className="checkbox-list">{event.participants.filter(({ id }) => id !== person.id).map((recipient) => <label key={recipient.id}><input type="checkbox" checked={person.excludedRecipientIds.includes(recipient.id)} onChange={(change) => update((event) => setLocalExclusion(event, person.id, recipient.id, change.target.checked), "Exclusions saved.")} /><span>{recipient.name}</span></label>)}</div>
            </div></details>
            <button className="icon-button icon-danger" type="button" aria-label={`Remove ${person.name}`} onClick={() => { if (window.confirm(`Remove ${person.name}?`)) update((event) => removeLocalParticipant(event, person.id), "Participant removed."); }}><Trash2 size={17} /></button>
          </div> : null}
        </article>)}</div>
        {!event.participants.length ? <div className="inline-empty"><UsersRound size={34} /><p><strong>The sleigh is empty</strong><span>Add at least two people to make a draw.</span></p></div> : null}
      </section>
      {isDraft ? <details className="panel settings-panel"><summary>Edit exchange details</summary><form className="form-stack settings-form" onSubmit={(submit) => { submit.preventDefault(); const data = new FormData(submit.currentTarget); update((event) => updateLocalDetails(event, data), "Exchange details saved."); }}><ExchangeFields event={event} /><button type="submit" className="button button-primary">Save details</button></form></details> : null}
    </div><aside className="event-side-column">
      <section className={`panel draw-panel ${isDraft ? "" : "draw-complete"}`}><span className="side-icon"><Shuffle /></span><span className="eyebrow">The big moment</span><h2>{isDraft ? "Ready to draw names?" : "Matches are ready"}</h2><p>{isDraft ? "Everyone gives and receives once. Exclusions are respected, and all matches appear here after the draw." : "Your complete draw is saved in this browser."}</p>{isDraft ? <button className="button button-gold button-full" type="button" disabled={event.participants.length < 2} onClick={draw}>Draw names <Sparkles size={17} /></button> : <div className="complete-seal"><Gift size={26} /><span>{event.assignments.length} matches drawn</span></div>}</section>
      <section className="danger-zone"><button type="button" className="text-button danger-link" onClick={deleteExchange}><Trash2 size={15} /> Delete exchange</button></section>
    </aside></div>
  </section>;
}
