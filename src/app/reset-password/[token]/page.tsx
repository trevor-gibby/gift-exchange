import type { Metadata } from "next";
import { LockKeyhole } from "lucide-react";
import { ResetPasswordForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  return (
    <section className="narrow-page shell">
      <div className="form-card centered-card">
        <span className="round-icon"><LockKeyhole /></span>
        <span className="eyebrow">Almost there</span>
        <h1>Choose a new password</h1>
        <p>A strong, unique password keeps every secret under wraps.</p>
        <ResetPasswordForm token={token} />
      </div>
    </section>
  );
}
