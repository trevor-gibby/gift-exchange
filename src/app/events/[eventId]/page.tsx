import { isLocalMode } from "@/lib/features";
import { LocalEvent } from "@/components/local-exchanges";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  deleteExchangeAction,
  finalizeExchangeAction,
  removeParticipantAction,
  updateExchangeAction,
} from "@/actions/exchanges";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { CopyLink } from "@/components/copy-link";
import { ExclusionEditor } from "@/components/exclusion-editor";
import { MessageBanner } from "@/components/message-banner";
import { ParticipantForm } from "@/components/participant-form";
import { formatBudget, formatBudgetInput, formatDate, formatDateInput } from "@/lib/format";
import { initials } from "@/lib/identity";
import { getOwnedEvent } from "@/lib/ownership";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  CircleDollarSign,
  Gift,
  Eye,
  Link2,
  LockKeyhole,
  Pencil,
  Share2,
  Shuffle,
  Sparkles,
  Trash2,
  UserCheck,
  UsersRound,
} from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ eventId: string }> }): Promise<Metadata> {
  const { eventId } = await params;
  if (isLocalMode()) return { title: "Your exchange" };
  const event = await getOwnedEvent(eventId);
  return { title: event?.name ?? "Exchange" };
}

export default async function EventPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { eventId } = await params;
  if (isLocalMode()) return <LocalEvent eventId={eventId} />;
  const [event, query] = await Promise.all([getOwnedEvent(eventId), searchParams]);
  if (!event) notFound();

  const isDraft = event.status === "DRAFT";
  const claimedCount = event.participants.filter(({ claimedAt }) => claimedAt).length;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const shareUrl = `${appUrl}/join/${event.shareCode}`;
  const publicAssignments = event.isSecret || isDraft
    ? []
    : event.participants.flatMap((participant) =>
        participant.assignmentAsGiver
          ? [{ giverId: participant.id, giverName: participant.name, recipient: participant.assignmentAsGiver.recipient }]
          : [],
      );

  return (
    <section className="event-page shell page-section">
      <Link className="back-link text-link" href="/dashboard"><ChevronLeft size={17} /> All exchanges</Link>
      <MessageBanner error={query.error} notice={query.notice} />

      <div className="event-heading">
        <div>
          <span className={`status-chip ${isDraft ? "status-draft" : "status-final"}`}>
            {isDraft ? "Planning" : event.isSecret ? "Draw complete" : "Public draw complete"}
          </span>
          <h1>{event.name}</h1>
          <p>{event.description || "A merry mystery is in the making."}</p>
        </div>
        <div className="event-heading-gift" aria-hidden="true"><Gift /></div>
      </div>

      <div className="stats-strip">
        <div><UsersRound /><span><strong>{event.participants.length}</strong> Participants</span></div>
        <div><CalendarDays /><span><strong>{formatDate(event.exchangeDate)}</strong> Exchange date</span></div>
        <div><CircleDollarSign /><span><strong>{formatBudget(event.budgetCents)}</strong> Gift budget</span></div>
      </div>

      <div className="event-layout">
        <div className="event-main-column">
          {!event.isSecret && !isDraft ? (
            <section className="panel public-results-panel">
              <div className="panel-heading">
                <div><span className="eyebrow"><Eye size={14} /> Public results</span><h2>Full assignment list</h2></div>
                <span className="count-badge">{publicAssignments.length} matches</span>
              </div>
              {publicAssignments.length ? (
                <ol className="public-assignment-list">
                  {publicAssignments.map((assignment, index) => (
                    <li key={assignment.giverId}>
                      <span className="assignment-number">{index + 1}</span>
                      <strong>{assignment.giverName}</strong>
                      <span className="assignment-direction">gives to <ArrowRight size={16} aria-hidden="true" /></span>
                      <strong>{assignment.recipient.name}</strong>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="inline-empty"><Gift size={32} /><p><strong>No saved matches</strong><span>This public draw does not have assignment results.</span></p></div>
              )}
            </section>
          ) : null}

          <section className="panel participant-panel">
            <div className="panel-heading">
              <div><span className="eyebrow">Guest list</span><h2>Who&apos;s exchanging?</h2></div>
              <span className="count-badge">{event.participants.length}/100</span>
            </div>

            {isDraft ? (
              <ParticipantForm eventId={event.id} />
            ) : (
              <div className="locked-note"><LockKeyhole size={17} /> The guest list is locked now that the exchange is finalized.</div>
            )}

            {event.participants.length ? (
              <div className="participant-list">
                {event.participants.map((participant, index) => {
                  const selected = new Set(participant.exclusionsAsGiver.map(({ recipientId }) => recipientId));
                  return (
                    <article className="participant-row" key={participant.id}>
                      <div className={`avatar avatar-${(index % 4) + 1}`}>{initials(participant.name)}</div>
                      <div className="participant-details">
                        <strong>{participant.name}</strong>
                        <span>{participant.email ?? "No email added"}</span>
                      </div>
                      {event.isSecret ? (
                        <span className={participant.claimedAt ? "claim-chip claimed" : "claim-chip"}>
                          {participant.claimedAt ? <><UserCheck size={14} /> Joined</> : "Invited"}
                        </span>
                      ) : <span className="claim-chip claimed"><Eye size={14} /> Public draw</span>}
                      {isDraft ? (
                        <div className="participant-actions">
                          {event.participants.length > 1 ? (
                            <ExclusionEditor
                              eventId={event.id}
                              giverId={participant.id}
                              giverName={participant.name}
                              recipients={event.participants
                                .filter(({ id }) => id !== participant.id)
                                .map(({ id, name }) => ({ id, name }))}
                              selectedRecipientIds={[...selected]}
                            />
                          ) : null}
                          <form action={removeParticipantAction}>
                            <input type="hidden" name="eventId" value={event.id} />
                            <input type="hidden" name="participantId" value={participant.id} />
                            <ConfirmSubmit className="icon-button icon-danger" type="submit" aria-label={`Remove ${participant.name}`} confirmation={`Remove ${participant.name} from this exchange?`}>
                              <Trash2 size={17} />
                            </ConfirmSubmit>
                          </form>
                        </div>
                      ) : <Check className="row-check" size={19} />}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="inline-empty"><UsersRound size={34} /><p><strong>The sleigh is empty</strong><span>Add at least two people to make a draw.</span></p></div>
            )}
          </section>

          {isDraft ? (
            <details className="panel settings-panel">
              <summary><span><Pencil size={18} /> Edit exchange details</span><span className="summary-hint">Date, budget & description</span></summary>
              <form action={updateExchangeAction} className="form-stack settings-form">
                <input type="hidden" name="eventId" value={event.id} />
                <label className="field"><span>Exchange name</span><input name="name" defaultValue={event.name} required minLength={3} maxLength={80} /></label>
                <label className="field"><span>Description <small>Optional</small></span><textarea name="description" defaultValue={event.description ?? ""} rows={3} maxLength={500} /></label>
                <fieldset className="mode-picker mode-picker-compact">
                  <legend>Exchange mode</legend>
                  <label>
                    <input type="radio" name="isSecret" value="secret" defaultChecked={event.isSecret} />
                    <span className="mode-option-icon"><Gift size={18} /></span>
                    <span><strong>Secret draw</strong><small>Private matched recipients</small></span>
                  </label>
                  <label>
                    <input type="radio" name="isSecret" value="open" defaultChecked={!event.isSecret} />
                    <span className="mode-option-icon"><Eye size={18} /></span>
                    <span><strong>Public draw</strong><small>All matches visible to everyone</small></span>
                  </label>
                </fieldset>
                <div className="field-row">
                  <label className="field"><span>Date</span><input name="exchangeDate" type="date" defaultValue={formatDateInput(event.exchangeDate)} /></label>
                  <label className="field"><span>Budget</span><input name="budget" inputMode="decimal" defaultValue={formatBudgetInput(event.budgetCents)} /></label>
                </div>
                <button className="button button-primary" type="submit">Save details</button>
              </form>
            </details>
          ) : null}
        </div>

        <aside className="event-side-column">
          <section className="panel share-panel">
            <span className="side-icon"><Share2 /></span>
            <span className="eyebrow">{event.isSecret ? "Invite participants" : "Share the public draw"}</span>
            <h2>Share one magic link</h2>
            <p>{event.isSecret ? "Guests use this link to join or claim their spot, then return to reveal their match." : "Anyone with this link sees every giver-to-recipient match after the draw—no name, email, or sign-in required."}</p>
            <CopyLink value={shareUrl} />
            {event.isSecret ? <div className="claim-summary"><UserCheck size={17} /><span><strong>{claimedCount}</strong> of {event.participants.length} have joined</span></div> : null}
            <Link className="text-link side-link" href={`/join/${event.shareCode}`} target="_blank">Preview guest page <Link2 size={15} /></Link>
          </section>

          <section className={`panel draw-panel ${isDraft ? "" : "draw-complete"}`}>
            <span className="side-icon"><Shuffle /></span>
            <span className="eyebrow">{isDraft ? "The big moment" : "Sealed with a bow"}</span>
            <h2>{isDraft ? "Ready to draw names?" : event.isSecret ? "Matches are ready" : "Public matches are live"}</h2>
            <p>{isDraft ? event.isSecret ? "This locks the guest list and exclusions. Every person will get exactly one valid, private match." : "This locks the guest list and exclusions, creates one valid match per person, and publishes the complete assignment list." : event.isSecret ? "Participants can now return through the event link and privately reveal their person." : "Everyone with the magic link can now see every giver-to-recipient match without entering any information."}</p>
            {isDraft ? (
              <form action={finalizeExchangeAction}>
                <input type="hidden" name="eventId" value={event.id} />
                <ConfirmSubmit className="button button-gold button-full" type="submit" confirmation={event.isSecret ? "Finalize this exchange? Participants and exclusions will be locked after the draw." : "Run and publish this draw? Participants, exclusions, and the resulting assignments will be locked."}>
                  Draw names <Sparkles size={17} />
                </ConfirmSubmit>
              </form>
            ) : (
              <div className="complete-seal"><Gift size={26} /><span>{event.isSecret ? `${event._count.assignments} private matches sealed` : `${event._count.assignments} public matches published`}</span></div>
            )}
            {isDraft && event.participants.length < 2 ? <small>Add at least two participants first.</small> : null}
          </section>

          <section className="danger-zone">
            <form action={deleteExchangeAction}>
              <input type="hidden" name="eventId" value={event.id} />
              <ConfirmSubmit className="text-button danger-link" type="submit" confirmation={`Permanently delete “${event.name}” and all of its participant data?`}>
                <Trash2 size={15} /> Delete exchange
              </ConfirmSubmit>
            </form>
          </section>
        </aside>
      </div>
    </section>
  );
}
