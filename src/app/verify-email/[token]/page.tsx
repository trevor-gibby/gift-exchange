import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { VerifyEmailForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Confirm email" };

export default async function VerifyEmailPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  return (
    <section className="narrow-page shell auth-standalone-page">
      <div className="form-card centered-card">
        <span className="round-icon"><BadgeCheck /></span>
        <span className="eyebrow">One last step</span>
        <h1>Confirm your email</h1>
        <p>Verify this address to activate password login for your Gift Exchange account.</p>
        <VerifyEmailForm token={token} />
        <p className="auth-switch"><Link className="text-link" href="/verify-email">Request another link</Link></p>
      </div>
    </section>
  );
}
