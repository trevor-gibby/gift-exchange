import Link from "next/link";
import { Gift, LogOut, Settings, Sparkles } from "lucide-react";
import { auth } from "@/auth";
import { signOutAction } from "@/actions/auth";

export async function Header() {
  const session = await auth();

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="brand" href="/" aria-label="Gift Exchange home">
          <span className="brand-mark" aria-hidden="true">
            <Gift size={21} strokeWidth={2.4} />
          </span>
          <span>Gift Exchange</span>
          <Sparkles className="brand-spark" size={14} aria-hidden="true" />
        </Link>

        <nav className="main-nav" aria-label="Main navigation">
          {session?.user ? (
            <>
              <Link className="nav-link" href="/dashboard">
                My exchanges
              </Link>
              <Link className="nav-link" href="/account">
                <Settings size={16} aria-hidden="true" />
                Account
              </Link>
              <form action={signOutAction}>
                <button className="nav-link nav-button" type="submit">
                  <LogOut size={16} aria-hidden="true" />
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link className="nav-link" href="/login">
                Log in
              </Link>
              <Link className="button button-small button-primary" href="/register">
                Create account
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
