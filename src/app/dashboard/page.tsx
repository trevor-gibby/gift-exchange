import { isLocalMode } from "@/lib/features";
import { LocalDashboard } from "@/components/local-exchanges";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Gift, Plus, Sparkles, UsersRound } from "lucide-react";
import { auth } from "@/auth";
import { formatDate } from "@/lib/format";
import { getGuestOwnerHash } from "@/lib/guest";
import { claimGuestExchange } from "@/lib/ownership";
import { getPrisma } from "@/lib/prisma";
import { MessageBanner } from "@/components/message-banner";

export const metadata: Metadata = { title: "My exchanges" };
export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  if (isLocalMode()) return <LocalDashboard />;
  const session = await auth();
  const prisma = getPrisma();

  if (session?.user.id) await claimGuestExchange(session.user.id);

  const guestOwnerHash = session?.user.id ? null : await getGuestOwnerHash();
  const events = await prisma.exchangeEvent.findMany({
    where: session?.user.id ? { ownerId: session.user.id } : guestOwnerHash ? { guestOwnerHash } : { id: "__none__" },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { participants: true } } },
  });
  const query = await searchParams;

  return (
    <section className="dashboard-page shell page-section">
      <MessageBanner error={query.error} notice={query.notice} />
      <div className="page-heading heading-with-action">
        <div>
          <span className="eyebrow"><Sparkles size={14} /> Holiday headquarters</span>
          <h1>{session?.user.name ? `${session.user.name.split(" ")[0]}'s exchanges` : "Your exchange"}</h1>
          <p>{session ? "Plan every draw from one cheerful place." : "Your guest exchange is saved securely on this device."}</p>
        </div>
        {(session || events.length === 0) ? (
          <Link className="button button-primary" href="/exchanges/new"><Plus size={18} /> New exchange</Link>
        ) : null}
      </div>

      {!session ? (
        <div className="guest-banner">
          <div><Gift size={21} /><p><strong>Planning as a guest</strong><span>Create an account to keep this exchange across devices and plan more.</span></p></div>
          <Link className="button button-secondary button-small" href="/register">Save with an account</Link>
        </div>
      ) : null}

      {events.length ? (
        <div className="event-grid">
          {events.map((event) => (
            <Link className="event-card" href={`/events/${event.id}`} key={event.id}>
              <div className="event-card-top">
                <span className={`status-chip ${event.status === "FINALIZED" ? "status-final" : "status-draft"}`}>
                  {event.status === "FINALIZED" ? event.isSecret ? "Draw complete" : "Public draw complete" : "Planning"}
                </span>
                <ArrowRight size={20} aria-hidden="true" />
              </div>
              <div className="event-gift" aria-hidden="true"><Gift /></div>
              <h2>{event.name}</h2>
              <p>{event.description || (event.isSecret ? "A merry mystery is taking shape." : "A public gift draw is taking shape.")}</p>
              <div className="event-meta">
                <span><UsersRound size={16} /> {event._count.participants} participant{event._count.participants === 1 ? "" : "s"}</span>
                <span><CalendarDays size={16} /> {formatDate(event.exchangeDate)}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-art"><Gift size={42} /></span>
          <span className="eyebrow">A blank guest list</span>
          <h2>Start your first merry mystery</h2>
          <p>Name the occasion now. You can invite everyone and tune the rules next.</p>
          <Link className="button button-primary" href="/exchanges/new">Create an exchange <ArrowRight size={18} /></Link>
        </div>
      )}
    </section>
  );
}
