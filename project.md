# Gift Exchange App
This is a gift exchange web application built with **Next.js 16** (App Router). It allows users to create gift exchange events, manage participants, and perform randomized matching while respecting participant exclusions.

## Features
- Create and manage gift exchange events
- Add participants
- Choose between a secret draw or a public draw
- Specify exclusions (participants who cannot be matched together)
- Perform randomized matching with a perfect matching algorithm
- For public draws, publish the complete giver-to-recipient assignment list through the event link without requiring participants to identify themselves
- Responsive design
- Fun holiday-themed UI with lots of animations and effects
- Ability for users to create an account and log in to manage their events or just create a single event and save it in a session cookie
- Oauth login with Google for account creation as well as email/password login
  - A verified Google identity automatically links to an existing account with the same normalized email address
  - Rules for password creation and validation
  - Password reset functionality
  - Limited to 1 account per email address
- Ability to share the event with a unique link for participants to join
  - Specific screen for shared events where participants can join and see their match after the event is finalized

## Roadmap
 [x] Completely rebuild app using codex with specified features above and a more modern design. I just want to start from scratch because I know there were some UI bugs but don't remember what they were and I also want to completely remake the design. I don't care about what CSS libraries are used. Install prisma for database management and use PostgreSQL as the database. Use NextAuth for authentication and authorization.
 [x] Add exchange visibility modes and make participant/exclusion editing update in place with exclusion autosave.
 [x] Correct non-secret exchanges to run the full constrained draw and reveal all assignments publicly.
 [x] Link verified Google identities to existing email/password accounts with the same normalized email.
 [x] Remove unnecessary messaging in UI like "This saves automatically" or "This magic link is all you need—there is no identity step."
 [x] Ability to delete account
 [x] Automatically delete unused accounts after 5 years of inactivity
 [x] Add ability to change account password
 [x] Require email verification for new accounts
 [x] Add ability to reset password for existing accounts
 
 
