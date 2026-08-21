import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { VerificationRequestForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Verify email" };

export default function RequestEmailVerificationPage() {
  return (
    <section className="narrow-page shell auth-standalone-page">
      <div className="form-card centered-card">
        <span className="round-icon"><MailCheck /></span>
        <span className="eyebrow">Email verification</span>
        <h1>Send a fresh link</h1>
        <p>Enter the email used for your account and we&apos;ll send a new 24-hour verification link.</p>
        <VerificationRequestForm />
        <p className="auth-switch"><Link className="text-link" href="/login">Back to login</Link></p>
      </div>
    </section>
  );
}
