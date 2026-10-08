import { isLocalMode } from "@/lib/features";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { googleSignInAction } from "@/actions/auth";
import { AuthIllustration, LoginForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    registered?: string;
    reset?: string;
    verified?: string;
    passwordChanged?: string;
    deleted?: string;
    error?: string;
  }>;
}) {
  if (isLocalMode()) redirect("/dashboard");
  if (await auth()) redirect("/dashboard");
  const query = await searchParams;
  const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

  return (
    <section className="auth-shell shell">
      <div className="auth-card">
        <div className="auth-form-panel">
          <span className="eyebrow">Welcome back</span>
          <h1>Open the workshop</h1>
          <p>Log in to manage your exchanges and keep the surprises moving.</p>
          {query.registered ? <div className="alert alert-success">Account created. You can log in now.</div> : null}
          {query.reset ? <div className="alert alert-success">Password updated. Log in with your new password.</div> : null}
          {query.verified ? <div className="alert alert-success">Email verified. You can log in now.</div> : null}
          {query.passwordChanged ? <div className="alert alert-success">Password changed. Log in again on this device.</div> : null}
          {query.deleted ? <div className="alert alert-success">Your account and owned exchange data were deleted.</div> : null}
          {query.error ? (
            <div className="alert alert-error" role="alert">
              {query.error === "OAuthAccountNotLinked"
                ? "That Google email is already registered but could not be linked. Please try Google again or log in with your password."
                : "Google sign-in could not be completed. Please try again."}
            </div>
          ) : null}
          {googleEnabled ? (
            <>
              <form action={googleSignInAction}>
                <button className="button button-google button-full" type="submit">
                  <span className="google-mark">G</span> Continue with Google
                </button>
              </form>
              <div className="divider"><span>or use email</span></div>
            </>
          ) : null}
          <LoginForm />
          <p className="auth-switch">New here? <Link className="text-link" href="/register">Create an account</Link></p>
        </div>
        <div className="auth-art-panel">
          <AuthIllustration />
          <blockquote>“The easiest Secret Santa we&apos;ve ever organized.”</blockquote>
          <p>One link. Fair matches. Real surprise.</p>
        </div>
      </div>
    </section>
  );
}
