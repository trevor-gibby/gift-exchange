import Link from "next/link";
import { Gift } from "lucide-react";

export default function JoinLandingPage() {
  return (
    <section className="narrow-page shell">
      <div className="form-card centered-card">
        <span className="round-icon"><Gift /></span>
        <span className="eyebrow">Private invitation</span>
        <h1>You&apos;ll need your event link</h1>
        <p>Ask your organizer to share the unique Gift Exchange invitation with you.</p>
        <Link className="button button-primary" href="/">Go to the homepage</Link>
      </div>
    </section>
  );
}
