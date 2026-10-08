# Gift Exchange

A modern, responsive gift exchange app built with Next.js 16, Auth.js/NextAuth, Prisma, and PostgreSQL.

## What it does

- Creates and manages gift exchanges with dates, budgets, and descriptions
- Supports both private secret draws and public draws
- Supports one cookie-owned guest exchange without an account
- Supports unique email/password accounts and Google OAuth
- Links a verified Google identity to an existing password account with the same normalized email
- Requires email verification for new password accounts
- Supports authenticated password changes and expiring, single-use password resets
- Supports permanent account deletion, including every exchange owned by the account
- Tracks authenticated activity and provides secured automatic cleanup after five inactive years
- Adds participants directly or lets them claim/join through one private event link
- Configures directional exclusions for every participant
- Produces a randomized complete matching with a constraint-solving backtracking algorithm
- Locks an exchange atomically after finalization
- Reveals only the current participant's match through an opaque, HTTP-only device cookie
- Lets anyone with a public draw link see the complete giver-to-recipient assignment list without entering personal information
- Respects reduced-motion preferences and supports responsive keyboard-friendly flows

## Stack

- Next.js 16 App Router and React 19
- TypeScript
- PostgreSQL
- Prisma 7 with the PostgreSQL driver adapter
- Auth.js / NextAuth 5
- Zod validation and bcrypt password hashing
- Vitest

## Local setup

### Browser-only deployment (no database or login)

Set just one environment variable:

```text
GIFT_EXCHANGE_MODE=local
```

Then run `npm install` and `npm run dev`, or `npm run build` followed by `npm start`. No PostgreSQL instance, `DATABASE_URL`, authentication secret, Google credentials, or email service is required. Prisma Client generation during installation also works without a database URL.

In this mode, exchanges are saved in versioned local storage in the current browser. You can create exchanges, edit names and event details, configure directional exclusions, and finalize a complete randomized draw. All matches are visible to the organizer on that device. Finalized participants and exclusions stay locked. Names are the only participant information collected.

There are no shared invitations, secret draws, cross-device access, or account features. Clearing browser/site data deletes the local exchanges. Local saves are not encrypted and are accessible to anyone using the same browser profile. Storage failures show an error without silently discarding existing saves.

To deploy on Vercel Hobby, import `trevor-gibby/gift-exchange` as a Next.js project, use the repository root and the default install/build commands, and set `GIFT_EXCHANGE_MODE=local` for Production, Preview, and Development before the first deployment. Git pushes to `main` then deploy production automatically.

To restore the full app, provision PostgreSQL, configure the variables below, apply migrations with `npm run db:deploy`, set `GIFT_EXCHANGE_MODE=database` (or remove it), and redeploy. Browser-only exchanges are not automatically imported into PostgreSQL.

### Full application with PostgreSQL

Prerequisites: Node.js 22.12 or later and a running PostgreSQL instance.

1. Copy `.env.example` to `.env` and update `DATABASE_URL` and `AUTH_SECRET`.

   Generate a secret with:

   ```bash
   openssl rand -base64 32
   ```

2. Install dependencies (the postinstall hook generates Prisma Client):

   ```bash
   npm install
   ```

3. Create the database and apply the checked-in migration:

   ```bash
   npm run db:deploy
   ```

4. Start the app:

   ```bash
   npm run dev
   ```

The app is available at [http://localhost:3000](http://localhost:3000).

## Authentication configuration

Email/password login works once `DATABASE_URL` and `AUTH_SECRET` are set.

To enable Google OAuth, create Google OAuth web credentials and set:

```text
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
```

Add this authorized callback URL in Google Cloud for local development:

```text
http://localhost:3000/api/auth/callback/google
```

Use the deployed app origin in production.

## Account email

Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM` to deliver email-verification and password-reset links. Verification links expire after 24 hours; reset links expire after one hour. When SMTP is omitted in development, the relevant form displays a local link so both flows remain testable. Production intentionally does not expose either link.

## Inactive-account retention

Authenticated activity updates `User.lastActiveAt` at most once per day. The secured maintenance endpoint permanently deletes accounts whose last authenticated activity is more than five years old. Owned exchanges and related data are deleted through database cascades.

Set a separate random maintenance secret:

```text
CRON_SECRET=...
```

Configure your hosting scheduler to send a daily `GET` or `POST` request to:

```text
https://your-domain.com/api/maintenance/accounts
```

Include this header, using the same secret stored in the deployment environment:

```text
Authorization: Bearer <CRON_SECRET>
```

The endpoint returns `{"deletedAccounts": number}` and returns `401` without the correct secret.

## Commands

```bash
npm run dev          # development server
npm run build        # production build
npm run lint         # ESLint
npm run typecheck    # strict TypeScript check
npm test             # matcher and invariant tests
npm run db:generate  # regenerate Prisma Client
npm run db:migrate   # create/apply a development migration
npm run db:deploy    # apply checked-in migrations
npm run db:studio    # inspect the database
```

## Security model

- Guest and participant cookies contain random opaque tokens, never event or identity data. Only SHA-256 token hashes are stored in PostgreSQL.
- Organizer mutations verify either the authenticated owner ID or the guest-owner token hash on every request.
- Automatic OAuth account linking is limited to Google profiles that explicitly report a verified email address.
- New password accounts cannot log in until a random, hashed, single-use, 24-hour verification token is confirmed.
- Secret participant pages query only the current participant and their own recipient; they never serialize the complete assignment set.
- Public draw pages intentionally expose all giver and recipient names to anyone with the unguessable event link after finalization, but never expose participant emails.
- Password reset tokens are random, hashed at rest, expire after one hour, and are consumed atomically.
- Password changes and resets increment an authorization version so existing JWT sessions are rejected.
- Account deletion removes the user and all owned exchange data through database cascades.
- Finalization stores every assignment and changes the event state in one serializable transaction. Secret draws reveal assignments individually; public draws publish the complete matching.
- Participant and exclusion changes are unavailable after finalization.

See `project.md` for the product specification and `agents.md` for the durable implementation rules used by coding agents.
