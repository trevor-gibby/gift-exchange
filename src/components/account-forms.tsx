"use client";

import { useActionState } from "react";
import { KeyRound, Trash2 } from "lucide-react";
import { changePasswordAction, deleteAccountAction, type FormState } from "@/actions/auth";
import { ConfirmSubmit } from "@/components/confirm-submit";

const initialState: FormState = {};

function AccountFormFeedback({ state }: { state: FormState }) {
  if (!state.error && !state.message) return null;
  return (
    <div className={state.error ? "alert alert-error" : "alert alert-success"} role="status">
      {state.error ?? state.message}
    </div>
  );
}

export function ChangePasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, action, pending] = useActionState(changePasswordAction, initialState);

  return (
    <form action={action} className="form-stack">
      <AccountFormFeedback state={state} />
      {hasPassword ? (
        <label className="field">
          <span>Current password</span>
          <input name="currentPassword" type="password" autoComplete="current-password" required />
        </label>
      ) : null}
      <label className="field">
        <span>New password</span>
        <input name="newPassword" type="password" autoComplete="new-password" required minLength={12} maxLength={128} />
        <small>Use 12+ characters with upper and lowercase letters, a number, and a symbol.</small>
      </label>
      <label className="field">
        <span>Confirm new password</span>
        <input name="confirmPassword" type="password" autoComplete="new-password" required minLength={12} maxLength={128} />
      </label>
      <button className="button button-primary" type="submit" disabled={pending}>
        <KeyRound size={17} /> {pending ? "Updating…" : hasPassword ? "Change password" : "Set password"}
      </button>
    </form>
  );
}

export function DeleteAccountForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, action, pending] = useActionState(deleteAccountAction, initialState);

  return (
    <form action={action} className="form-stack">
      <AccountFormFeedback state={state} />
      {hasPassword ? (
        <label className="field">
          <span>Current password</span>
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
      ) : null}
      <label className="field">
        <span>Type DELETE to confirm</span>
        <input name="confirmation" required autoComplete="off" pattern="DELETE" placeholder="DELETE" />
      </label>
      <ConfirmSubmit
        className="button button-danger"
        type="submit"
        disabled={pending}
        confirmation="Permanently delete your account and every exchange you own? This cannot be undone."
      >
        <Trash2 size={17} /> {pending ? "Deleting…" : "Delete my account"}
      </ConfirmSubmit>
    </form>
  );
}
