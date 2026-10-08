import { redirect } from "next/navigation";
import { isLocalMode } from "@/lib/features";
import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { ForgotPasswordForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  if (isLocalMode()) redirect("/dashboard");
  return (
    <section className="narrow-page shell">
      <div className="form-card centered-card">
        <span className="round-icon"><KeyRound /></span>
        <span className="eyebrow">Password reset</span>
        <h1>Find your way back in</h1>
        <p>Enter your account email and we&apos;ll send a one-hour reset link.</p>
        <ForgotPasswordForm />
        <Link className="text-link back-link" href="/login">Back to login</Link>
      </div>
    </section>
  );
}
