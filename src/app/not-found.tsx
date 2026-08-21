import Link from "next/link";
import { Gift } from "lucide-react";

export default function NotFound() {
  return (
    <section className="narrow-page shell">
      <div className="form-card centered-card">
        <span className="round-icon"><Gift /></span>
        <span className="eyebrow">404 — Lost in the snow</span>
        <h1>That gift isn&apos;t under this tree</h1>
        <p>The exchange may have moved, or the private link may be incomplete.</p>
        <Link className="button button-primary" href="/">Back home</Link>
      </div>
    </section>
  );
}
