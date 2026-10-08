import { isLocalMode } from "@/lib/features";
import { LocalNewExchange } from "@/components/local-exchanges";
import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ChevronLeft, DollarSign, Eye, Gift, PartyPopper, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createExchangeAction } from "@/actions/exchanges";
import { getGuestOwnerHash } from "@/lib/guest";
import { getPrisma } from "@/lib/prisma";
import { MessageBanner } from "@/components/message-banner";

export const metadata: Metadata = { title: "New exchange" };
export const dynamic = "force-dynamic";

export default async function NewExchangePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (isLocalMode()) return <LocalNewExchange />;
  const session = await auth();

  if (!session) {
    const guestOwnerHash = await getGuestOwnerHash();
    if (guestOwnerHash) {
      const existing = await getPrisma().exchangeEvent.findUnique({ where: { guestOwnerHash } });
      if (existing) redirect(`/events/${existing.id}`);
    }
  }

  const query = await searchParams;

  return (
    <section className="narrow-page shell create-page">
      <Link className="back-link text-link" href="/dashboard"><ChevronLeft size={17} /> Back to exchanges</Link>
      <MessageBanner error={query.error} />
      <div className="form-card create-card">
        <div className="create-heading">
          <span className="round-icon"><PartyPopper /></span>
          <span className="eyebrow"><Sparkles size={14} /> A new merry mystery</span>
          <h1>Set the scene</h1>
          <p>Just the essentials for now. You&apos;ll build the guest list next.</p>
        </div>
        <form action={createExchangeAction} className="form-stack">
          <label className="field">
            <span>Exchange name</span>
            <input name="name" required minLength={3} maxLength={80} placeholder="Friendsmas 2026" autoFocus />
          </label>
          <label className="field">
            <span>A little context <small>Optional</small></span>
            <textarea name="description" maxLength={500} rows={3} placeholder="Cozy gifts, good snacks, no peeking…" />
          </label>
          <fieldset className="mode-picker">
            <legend>How should this exchange work?</legend>
            <label>
              <input type="radio" name="isSecret" value="secret" defaultChecked />
              <span className="mode-option-icon"><Gift size={20} /></span>
              <span><strong>Secret draw</strong><small>Everyone privately reveals one matched person.</small></span>
            </label>
            <label>
              <input type="radio" name="isSecret" value="open" />
              <span className="mode-option-icon"><Eye size={20} /></span>
              <span><strong>Public draw</strong><small>Everyone with the link sees every match.</small></span>
            </label>
          </fieldset>
          <div className="field-row">
            <label className="field field-with-icon">
              <span>Exchange date <small>Optional</small></span>
              <div><CalendarDays size={18} /><input name="exchangeDate" type="date" /></div>
            </label>
            <label className="field field-with-icon">
              <span>Budget <small>Optional</small></span>
              <div><DollarSign size={18} /><input name="budget" inputMode="decimal" placeholder="40.00" /></div>
            </label>
          </div>
          <button className="button button-primary button-full button-large" type="submit">Create the exchange <Sparkles size={18} /></button>
        </form>
        {!session ? <p className="form-footnote">This exchange will be saved to this browser. Create an account anytime to keep it across devices.</p> : null}
      </div>
    </section>
  );
}
