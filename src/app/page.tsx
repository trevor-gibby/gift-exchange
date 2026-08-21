import Link from "next/link";
import { ArrowRight, Ban, Gift, Link2, ShieldCheck, Shuffle, Sparkles, UsersRound } from "lucide-react";

export default function HomePage() {
  return (
    <>
      <section className="hero shell">
        <div className="hero-copy">
          <span className="eyebrow"><Sparkles size={14} /> A little magic, perfectly matched</span>
          <h1>Make the season <em>surprising.</em></h1>
          <p className="hero-lede">
            Gather your people, set the ground rules, and make a fair draw—then keep the matches private or share them with the group.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary button-large" href="/exchanges/new">
              Start an exchange <ArrowRight size={18} />
            </Link>
            <Link className="button button-secondary button-large" href="/dashboard">
              View my exchanges
            </Link>
          </div>
          <p className="hero-note"><ShieldCheck size={16} /> No account needed for your first exchange</p>
        </div>

        <div className="hero-art" aria-label="An animated gift exchange illustration">
          <div className="hero-halo halo-one" />
          <div className="hero-halo halo-two" />
          <span className="floating-star star-one">✦</span>
          <span className="floating-star star-two">✦</span>
          <span className="floating-dot dot-one" />
          <span className="floating-dot dot-two" />
          <div className="present present-back">
            <span className="present-lid" />
            <span className="present-ribbon" />
          </div>
          <div className="present present-main">
            <span className="present-lid" />
            <span className="present-ribbon" />
            <span className="present-bow bow-left" />
            <span className="present-bow bow-right" />
          </div>
          <div className="match-pill pill-one"><span>AM</span><Shuffle size={16} /><span>JR</span></div>
          <div className="match-pill pill-two"><span>SK</span><Gift size={16} /><span>TM</span></div>
        </div>
      </section>

      <section className="feature-section">
        <div className="shell">
          <div className="section-heading">
            <span className="eyebrow">Everything you need</span>
            <h2>Gift exchanges, minus the spreadsheet</h2>
            <p>A thoughtful flow from the first invite to private or public results.</p>
          </div>
          <div className="feature-grid">
            <article className="feature-card feature-berry">
              <span className="feature-icon"><UsersRound /></span>
              <h3>Gather your crew</h3>
              <p>Add everyone yourself or share one private event link so guests can save their own spot.</p>
            </article>
            <article className="feature-card feature-pine">
              <span className="feature-icon"><Ban /></span>
              <h3>Set smart exclusions</h3>
              <p>Avoid partners, repeat matches, or tricky pairings with clear person-by-person rules.</p>
            </article>
            <article className="feature-card feature-gold">
              <span className="feature-icon"><Shuffle /></span>
              <h3>Draw with confidence</h3>
              <p>Our constraint solver finds a complete fair draw—or tells you exactly when the rules need a tweak.</p>
            </article>
            <article className="feature-card feature-ink">
              <span className="feature-icon"><Link2 /></span>
              <h3>Reveal your way</h3>
              <p>Keep each match private, or publish the complete assignment list through one magic link.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="steps-section shell">
        <div className="section-heading section-heading-left">
          <span className="eyebrow">From idea to exchange</span>
          <h2>Ready before the cocoa cools</h2>
        </div>
        <ol className="steps-list">
          <li><span>01</span><div><h3>Create</h3><p>Name the occasion, add a date and an optional budget.</p></div></li>
          <li><span>02</span><div><h3>Invite</h3><p>Build the guest list or let friends join from your event link.</p></div></li>
          <li><span>03</span><div><h3>Draw</h3><p>Set exclusions, finalize once, and reveal the results privately or publicly.</p></div></li>
        </ol>
      </section>

      <section className="cta-section shell">
        <div>
          <span className="eyebrow eyebrow-light"><Sparkles size={14} /> Your merry little mystery awaits</span>
          <h2>Who will you surprise?</h2>
          <p>Create your exchange in minutes. The delightful part lasts all season.</p>
        </div>
        <Link className="button button-gold button-large" href="/exchanges/new">
          Make an exchange <Gift size={19} />
        </Link>
      </section>
    </>
  );
}
