import type { Metadata } from "next";
import { BadgeCheck, KeyRound, ShieldAlert, UserRound } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ChangePasswordForm, DeleteAccountForm } from "@/components/account-forms";
import { getPrisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Account settings" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user.id) redirect("/login");

  const user = await getPrisma().user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      emailVerified: true,
      passwordHash: true,
      accounts: { select: { provider: true } },
    },
  });
  if (!user) redirect("/login");

  const hasPassword = Boolean(user.passwordHash);
  const hasGoogle = user.accounts.some(({ provider }) => provider === "google");

  return (
    <section className="account-page shell page-section">
      <div className="page-heading account-heading">
        <span className="eyebrow"><UserRound size={14} /> Account settings</span>
        <h1>{user.name ? `${user.name}'s account` : "Your account"}</h1>
        <p>Manage how you sign in and control the data connected to your account.</p>
      </div>

      <div className="account-grid">
        <section className="panel account-panel account-summary-panel">
          <span className="side-icon"><BadgeCheck /></span>
          <span className="eyebrow">Profile</span>
          <h2>{user.email}</h2>
          <div className="account-status-list">
            <span><BadgeCheck size={16} /> {user.emailVerified ? "Email verified" : "Email verification pending"}</span>
            <span><KeyRound size={16} /> {hasPassword ? "Password enabled" : "Password not set"}</span>
            {hasGoogle ? <span><span className="google-mark google-mark-small">G</span> Google connected</span> : null}
          </div>
        </section>

        <section className="panel account-panel">
          <span className="side-icon"><KeyRound /></span>
          <span className="eyebrow">Password</span>
          <h2>{hasPassword ? "Change your password" : "Add password login"}</h2>
          <p>{hasPassword ? "Changing your password signs out every active session." : "Set a password so you can sign in with either Google or email."}</p>
          <ChangePasswordForm hasPassword={hasPassword} />
        </section>

        <section className="panel account-panel account-danger-panel">
          <span className="side-icon"><ShieldAlert /></span>
          <span className="eyebrow">Danger zone</span>
          <h2>Delete account permanently</h2>
          <p>This deletes your profile, sign-in methods, tokens, participants, assignments, and every exchange you own. It cannot be undone.</p>
          <DeleteAccountForm hasPassword={hasPassword} />
        </section>
      </div>
    </section>
  );
}
