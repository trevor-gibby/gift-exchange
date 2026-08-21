"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight, Mail, UserRound } from "lucide-react";
import {
  loginAction,
  registerAction,
  requestEmailVerificationAction,
  requestPasswordResetAction,
  resetPasswordAction,
  verifyEmailAction,
  type FormState,
} from "@/actions/auth";

const initialState: FormState = {};

function FormFeedback({ state }: { state: FormState }) {
  if (!state.error && !state.message) return null;
  return (
    <div className={state.error ? "alert alert-error" : "alert alert-success"} role="status">
      {state.error ?? state.message}
      {state.developmentResetUrl ? (
        <Link className="text-link alert-link" href={state.developmentResetUrl}>
          Open the local reset link
        </Link>
      ) : null}
      {state.developmentVerificationUrl ? (
        <Link className="text-link alert-link" href={state.developmentVerificationUrl}>
          Open the local verification link
        </Link>
      ) : null}
      {state.verificationRequired ? (
        <Link className="text-link alert-link" href="/verify-email">
          Resend verification email
        </Link>
      ) : null}
    </div>
  );
}

function SubmitButton({ label }: { label: string }) {
  return (
    <button className="button button-primary button-full" type="submit">
      {label} <ArrowRight size={17} aria-hidden="true" />
    </button>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);
  return (
    <form action={action} className="form-stack">
      <FormFeedback state={state} />
      <label className="field">
        <span>Email address</span>
        <input name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
      </label>
      <label className="field">
        <span>Password</span>
        <input name="password" type="password" autoComplete="current-password" required placeholder="Your password" />
      </label>
      <div className="form-aside">
        <Link className="text-link" href="/forgot-password">
          Forgot password?
        </Link>
      </div>
      <SubmitButton label={pending ? "Opening the workshop…" : "Log in"} />
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, initialState);

  if (state.message) {
    return (
      <div className="form-stack">
        <FormFeedback state={state} />
        <Link className="button button-secondary button-full" href="/login">Continue to login</Link>
      </div>
    );
  }

  return (
    <form action={action} className="form-stack">
      <FormFeedback state={state} />
      <label className="field">
        <span>Your name</span>
        <input name="name" type="text" autoComplete="name" required minLength={2} maxLength={80} placeholder="Taylor Claus" />
      </label>
      <label className="field">
        <span>Email address</span>
        <input name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
      </label>
      <label className="field">
        <span>Password</span>
        <input name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} placeholder="12+ characters" />
        <small>Use 12+ characters with upper and lowercase letters, a number, and a symbol.</small>
      </label>
      <SubmitButton label={pending ? "Making your account…" : "Create account"} />
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordResetAction, initialState);
  return (
    <form action={action} className="form-stack">
      <FormFeedback state={state} />
      <label className="field">
        <span>Email address</span>
        <input name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
      </label>
      <SubmitButton label={pending ? "Sending…" : "Send reset link"} />
    </form>
  );
}

export function VerificationRequestForm() {
  const [state, action, pending] = useActionState(requestEmailVerificationAction, initialState);
  return (
    <form action={action} className="form-stack">
      <FormFeedback state={state} />
      <label className="field">
        <span>Email address</span>
        <input name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
      </label>
      <SubmitButton label={pending ? "Sending…" : "Send verification link"} />
    </form>
  );
}

export function VerifyEmailForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(verifyEmailAction, initialState);
  return (
    <form action={action} className="form-stack">
      <input type="hidden" name="token" value={token} />
      <FormFeedback state={state} />
      <SubmitButton label={pending ? "Verifying…" : "Verify my email"} />
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, initialState);
  return (
    <form action={action} className="form-stack">
      <input type="hidden" name="token" value={token} />
      <FormFeedback state={state} />
      <label className="field">
        <span>New password</span>
        <input name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} placeholder="Your new password" />
        <small>Use 12+ characters with upper and lowercase letters, a number, and a symbol.</small>
      </label>
      <SubmitButton label={pending ? "Saving…" : "Set new password"} />
    </form>
  );
}

export function AuthIllustration() {
  return (
    <div className="auth-illustration" aria-hidden="true">
      <span className="orbit orbit-one" />
      <span className="orbit orbit-two" />
      <div className="auth-gift">
        <Mail size={42} />
      </div>
      <span className="auth-person auth-person-one"><UserRound size={22} /></span>
      <span className="auth-person auth-person-two"><UserRound size={22} /></span>
      <span className="auth-person auth-person-three"><UserRound size={22} /></span>
    </div>
  );
}
