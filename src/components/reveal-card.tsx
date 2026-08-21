"use client";

import { useState } from "react";
import { Gift, Sparkles } from "lucide-react";

export function RevealCard({ recipientName, recipientEmail }: { recipientName: string; recipientEmail: string | null }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className={`reveal-card ${revealed ? "is-revealed" : ""}`}>
      <div className="reveal-glow" aria-hidden="true" />
      {!revealed ? (
        <div className="reveal-front">
          <span className="reveal-icon"><Gift size={44} /></span>
          <p>Your match is tucked inside</p>
          <button className="button button-gold" type="button" onClick={() => setRevealed(true)}>
            Reveal my person <Sparkles size={18} />
          </button>
        </div>
      ) : (
        <div className="reveal-result" aria-live="polite">
          <span className="eyebrow eyebrow-light">You&apos;re gifting to</span>
          <strong>{recipientName}</strong>
          {recipientEmail ? <a href={`mailto:${recipientEmail}`}>{recipientEmail}</a> : null}
          <p>Keep it merry. Keep it secret.</p>
        </div>
      )}
    </div>
  );
}
