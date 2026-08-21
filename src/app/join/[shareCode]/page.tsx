import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarDays, CircleDollarSign, Eye, Gift, LockKeyhole, Mail, PartyPopper, Sparkles, UserRound, UsersRound } from "lucide-react";
import { joinExchangeAction } from "@/actions/exchanges";
import { MessageBanner } from "@/components/message-banner";
import { RevealCard } from "@/components/reveal-card";
import { formatBudget, formatDate } from "@/lib/format";
import { getParticipantToken } from "@/lib/guest";
import { getPrisma } from "@/lib/prisma";
import { hashToken } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ shareCode: string }> }): Promise<Metadata> {
  const { shareCode } = await params;
  const event = await getPrisma().exchangeEvent.findUnique({ where: { shareCode }, select: { name: true } });
  return { title: event ? `Join ${event.name}` : "Join an exchange" };
}

export default async function JoinExchangePage({
  params,
  searchParams,
}: {
  params: Promise<{ shareCode: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { shareCode } = await params;
  const prisma = getPrisma();
  const [event, participantToken, query] = await Promise.all([
    prisma.exchangeEvent.findUnique({
      where: { shareCode },
      select: {
        id: true,
        name: true,
        description: true,
        exchangeDate: true,
        budgetCents: true,
        isSecret: true,
        status: true,
        _count: { select: { participants: true } },
      },
    }),
    getParticipantToken(shareCode),
    searchParams,
  ]);

  if (!event) notFound();

  const finalized = event.status === "FINALIZED";
  const participant = event.isSecret && participantToken
    ? await prisma.participant.findFirst({
        where: { eventId: event.id, accessTokenHash: hashToken(participantToken) },
        select: {
          name: true,
          email: true,
          assignmentAsGiver: {
            select: { recipient: { select: { name: true, email: true } } },
          },
        },
      })
    : null;
  const publicAssignments = event.isSecret || !finalized
    ? []
    : await prisma.assignment.findMany({
        where: { eventId: event.id },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          giver: { select: { name: true } },
          recipient: { select: { name: true } },
        },
      });
  publicAssignments.sort((a, b) => a.giver.name.localeCompare(b.giver.name));

  return (
    <section className="join-page">
      <div className="join-confetti" aria-hidden="true"><span>✦</span><span>•</span><span>✦</span><span>•</span></div>
      <div className="shell join-shell">
        <div className="join-event-intro">
          <span className="join-gift"><Gift size={34} /></span>
          <span className="eyebrow eyebrow-light"><Sparkles size={14} /> You&apos;re invited</span>
          <h1>{event.name}</h1>
          <p>{event.description || (event.isSecret ? "A gift exchange and a little holiday mystery are waiting for you." : "A public gift exchange draw is waiting for you.")}</p>
          <div className="join-meta">
            <span><CalendarDays size={17} /> {formatDate(event.exchangeDate)}</span>
            <span><CircleDollarSign size={17} /> {formatBudget(event.budgetCents)}</span>
            <span><UsersRound size={17} /> {event._count.participants} participant{event._count.participants === 1 ? "" : "s"}</span>
          </div>
        </div>

        <MessageBanner error={query.error} notice={query.notice} />

        <div className="join-card">
          {!event.isSecret ? (
            <div className="public-draw-state">
              <span className="round-icon"><Eye /></span>
              <span className="eyebrow"><Sparkles size={14} /> Public draw</span>
              <h2>{finalized ? "The full draw is live" : "The draw is coming soon"}</h2>
              {!finalized ? <p>The organizer is still adding participants and setting exclusions.</p> : null}
              {finalized && publicAssignments.length ? (
                <ol className="public-assignment-list public-assignment-list-guest">
                  {publicAssignments.map((assignment, index) => (
                    <li key={assignment.id}>
                      <span className="assignment-number">{index + 1}</span>
                      <strong>{assignment.giver.name}</strong>
                      <span className="assignment-direction">gives to <ArrowRight size={16} aria-hidden="true" /></span>
                      <strong>{assignment.recipient.name}</strong>
                    </li>
                  ))}
                </ol>
              ) : finalized ? (
                <div className="inline-empty"><Gift size={32} /><p><strong>Results unavailable</strong><span>This draw does not have saved assignments.</span></p></div>
              ) : (
                <div className="waiting-state public-waiting-state">
                  <span className="waiting-orbit"><LockKeyhole size={28} /></span>
                  <div className="waiting-pill"><span className="pulse-dot" /> Waiting for the draw</div>
                </div>
              )}
            </div>
          ) : participant ? (
            <div className="joined-state">
              <span className="eyebrow"><PartyPopper size={14} /> Welcome, {participant.name}</span>
              {finalized && participant.assignmentAsGiver ? (
                <>
                  <h2>The draw is complete</h2>
                  <p>Your match is private to this browser. Ready for the moment of truth?</p>
                  <RevealCard
                    recipientName={participant.assignmentAsGiver.recipient.name}
                    recipientEmail={participant.assignmentAsGiver.recipient.email}
                  />
                </>
              ) : (
                <div className="waiting-state">
                  <span className="waiting-orbit"><LockKeyhole size={28} /></span>
                  <h2>Your spot is saved</h2>
                  <p>The organizer is still making the list and setting the rules. Return here after the draw to reveal your match.</p>
                  <div className="waiting-pill"><span className="pulse-dot" /> Waiting for the draw</div>
                </div>
              )}
            </div>
          ) : (
            <div className="join-form-wrap">
              <div className="join-form-heading">
                <span className="round-icon"><UserRound /></span>
                <span className="eyebrow">{finalized ? "Claim your place" : "Join the exchange"}</span>
                <h2>{finalized ? "Find your saved spot" : "Add your name to the fun"}</h2>
                <p>{finalized ? "Use the same name or email the organizer added before the draw." : "If the organizer already added you, use the same name or email to claim that spot."}</p>
              </div>
              <form action={joinExchangeAction} className="form-stack">
                <input type="hidden" name="shareCode" value={shareCode} />
                <label className="field field-with-icon">
                  <span>Your name</span>
                  <div><UserRound size={18} /><input name="name" required minLength={2} maxLength={80} placeholder="Alex Rivera" autoFocus /></div>
                </label>
                <label className="field field-with-icon">
                  <span>Email <small>Optional, but helps identify your spot</small></span>
                  <div><Mail size={18} /><input name="email" type="email" placeholder="alex@example.com" /></div>
                </label>
                <button className="button button-primary button-full button-large" type="submit">
                  {finalized ? "Claim my spot" : "Save my spot"} <Gift size={18} />
                </button>
              </form>
              <p className="privacy-note"><LockKeyhole size={14} /> Your private access is saved securely on this device.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
