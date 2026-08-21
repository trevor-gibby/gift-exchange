import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthIllustration, RegisterForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage() {
  if (await auth()) redirect("/dashboard");

  return (
    <section className="auth-shell shell">
      <div className="auth-card">
        <div className="auth-form-panel">
          <span className="eyebrow">Your holiday headquarters</span>
          <h1>Create your account</h1>
          <p>Save and manage as many exchanges as your calendar can handle. We&apos;ll verify your email before your first password login.</p>
          <RegisterForm />
          <p className="auth-switch">Already have an account? <Link className="text-link" href="/login">Log in</Link></p>
        </div>
        <div className="auth-art-panel auth-art-pine">
          <AuthIllustration />
          <blockquote>Every great surprise starts with a guest list.</blockquote>
          <p>Your events stay organized and private.</p>
        </div>
      </div>
    </section>
  );
}
