"use client";

import { useEffect } from "react";
import { CircleAlert } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="narrow-page shell">
      <div className="form-card centered-card">
        <span className="round-icon"><CircleAlert /></span>
        <span className="eyebrow">A ribbon came loose</span>
        <h1>Something didn&apos;t go to plan</h1>
        <p>Your data is still tucked away safely. Try that step once more.</p>
        <button className="button button-primary" type="button" onClick={reset}>Try again</button>
      </div>
    </section>
  );
}
