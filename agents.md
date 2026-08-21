# Gift Exchange — Agent Source of Truth

## Authority

- `project.md` is the sole product specification for this rebuild.
- This file translates that specification into durable implementation guidance for agents.
- Do not use the previous app's UI, behavior, architecture, or code as a product/design signal. Existing files may only be inspected when needed to understand tooling or safely replace the implementation.
- If this file and `project.md` ever disagree, follow `project.md` and update this file.

## Product

Build a modern, responsive, holiday-themed gift exchange web app with polished animations and effects. Every exchange performs a randomized, exclusion-aware matching. A secret draw reveals only each participant's own recipient, while a public draw reveals the complete giver-to-recipient assignment list to the organizer and everyone with the event link.

## Required User Flows

1. A guest can create one exchange without an account and retain access through a session cookie.
2. A user can create an account with a unique email and sign in with either Google OAuth or email/password. New email/password accounts must verify their email before signing in.
   - When Google returns a verified email matching an existing normalized account email, link the Google identity to that account instead of creating or rejecting a duplicate.
3. Password authentication includes creation rules, validation, password changes for authenticated users, and password-reset support for existing password accounts.
4. An authenticated user can create and manage their exchanges, open account settings, and permanently delete their account and owned exchange data.
5. An organizer chooses a secret draw or public draw while an exchange is still a draft.
6. For either mode, an organizer can add participants, configure autosaving directional exclusions, and generate a randomized complete assignment in which every participant gives to exactly one other participant, receives from exactly one participant, never draws themself, and satisfies all exclusions.
7. An organizer can share an exchange through a unique link.
8. A participant opening a secret exchange link has a dedicated join experience and, once the exchange is finalized, can privately reveal their own match.
9. Anyone opening a public draw link sees a waiting state before finalization and the complete giver-to-recipient assignment list afterward, without entering or claiming identity information.
10. Accounts with no authenticated activity for five years are eligible for automatic permanent deletion through a secured scheduled-maintenance endpoint.

## Required Technology

- Next.js 16 with the App Router
- TypeScript
- PostgreSQL
- Prisma for schema, migrations, and database access
- NextAuth/Auth.js for authentication and authorization

## Domain and Security Rules

- An account email is unique after normalization.
- Automatic OAuth account linking is enabled only for Google profiles that explicitly report a verified email address.
- Passwords must be stored only as strong one-way hashes and never returned to clients.
- Email verification tokens must be random, single-use, expiring, and stored only as hashes. Existing accounts created before verification was introduced remain usable.
- Password reset tokens must be random, single-use, expiring, and stored as hashes.
- Password changes and resets invalidate existing authenticated sessions.
- Account deletion removes the user, linked identities, credentials, reset/verification tokens, and every exchange owned by that account.
- Record authenticated activity no more than once per day per account. A secured maintenance operation may delete accounts whose last activity is older than five years.
- Guest ownership is represented by an opaque, secure, HTTP-only session cookie; do not put event data or sensitive identity data in the cookie.
- Share links and participant access tokens must be unguessable.
- Organizers can only manage exchanges they own through either their authenticated account or the matching guest session.
- A participant may only reveal the assignment associated with their own private participant token after finalization.
- Public draws expose the complete assignment set, using participant names only and never participant emails, through the unguessable event link after finalization.
- Never expose the complete assignment set through secret-draw participant endpoints or page payloads.
- Finalization is atomic: either a complete valid assignment is stored or no assignments are changed.
- Once finalized, participant/exclusion mutation is locked unless an explicit future feature defines a safe reset flow.

## Matching Invariants

- For `n` participants, persist exactly `n` assignments.
- Every participant appears exactly once as a giver and exactly once as a recipient.
- No participant is assigned to themself.
- No stored exclusion may be violated.
- Use a randomized constraint-solving/backtracking algorithm, not repeated blind shuffling. Report clearly when the constraints make a complete matching impossible.

## Experience Direction

- The design should feel festive, contemporary, warm, and playful rather than borrowing from the previous app.
- Responsive behavior is required across mobile, tablet, and desktop.
- Motion must support the experience and respect `prefers-reduced-motion`.
- Core flows must remain keyboard accessible, legible, and usable without animation.
- Show useful empty, loading, validation, success, impossible-match, and error states.

## Engineering Expectations

- Keep server-only secrets, Prisma access, authorization checks, and matching logic out of client bundles.
- Validate all untrusted input on the server as well as in the UI.
- Prefer Server Components by default; use Client Components only for interaction.
- Add focused tests for matching correctness and important validation/authorization helpers.
- Run linting, type checking, tests, and a production build before handoff when the environment permits.
- Document required environment variables and local PostgreSQL setup in the README and `.env.example`; never commit real secrets.

## Current Roadmap

- [x] Completely rebuild the application according to all requirements above.
- [x] Add exchange visibility modes and in-place participant/exclusion editing.
- [x] Correct non-secret exchanges to perform matching with exclusions and reveal the complete assignment list publicly.
- [x] Securely link verified Google identities to existing accounts by normalized email.
- [x] Remove redundant instructional UI messaging.
- [x] Add permanent account deletion.
- [x] Automatically delete accounts after five years without authenticated activity.
- [x] Add authenticated password changes.
- [x] Require verification for new email/password accounts.
- [x] Preserve and verify password-reset support for existing password accounts.

When this rebuild is fully implemented and verified, mark the roadmap item complete here and in `project.md`.
