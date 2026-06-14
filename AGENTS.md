# Project Guidance

## User Preferences

[No preferences yet]

## Verified Commands

- **typecheck**: `cd src/frontend && pnpm typecheck`
- **fix**: `cd src/frontend && pnpm fix`
- **build**: `cd src/backend && caffeine build`

## Known Gotchas / Do Not Change

- PortalQuestionnaireFormPage: submitQuestionnaire returns Promise<bigint> (confirmed backend.d.ts line 1085). The correct failure check is if (result === 0n). NEVER replace this with if ('err' in result) — in JavaScript, 'err' in bigint always evaluates to false and would silently swallow every backend error.
- AdminClientDetailPage: markQuestionnaireReviewed returns Promise<void> (confirmed backend.d.ts). The correct pattern is try/catch — do NOT attempt to capture a result and check 'ok' in result or 'okAlreadyAdvanced' in result, as there is no result object to check. The state update running after a successful await is correct behavior.

## Security Notes

- **Stripe HMAC-SHA256 webhook signature verification is NOT implemented** — Motoko lacks a native crypto library. The platform mitigates this with a 300-second timestamp freshness check and a shared secret query parameter. When a Motoko crypto library becomes available, full HMAC-SHA256 verification should be implemented. Until then, rotate the shared secret immediately on any suspected leak.

## Platform Fee / Stripe Connect Notes

- The platform fee setter function is named `updateClientPlatformFee(clientId, feePercent)`, NOT `setApplicationFeePercent`
- It is admin-gated (`isAdmin` check) and validates 0–100%
- The fee is stored as `platformFeePercentage : Float` on the `CrmClient` record in stable memory (`_stableClientsV3`)

## Learnings

- mo:core 2.2.0 with --implicit-package=core (set in mops.toml) enables dot-notation on arrays: arr.concat(other), arr.filter(func), arr.map(func), Time.now().toText(). Both dot-notation and module-style (Array.concat(arr, other)) are valid. The -E=M0236 flag in mops.toml promotes M0236 to a hard error when module-style is used where dot-notation is available — so dot-notation is required in this project.
- mops build succeeds with exit 0 using the current dot-notation syntax in main.mo. Do not attempt to replace dot-notation with Array.append/Array.filter/Array.map module-style calls — they trigger M0236 compile errors in this project.
- caffeine build (not mops build directly) is the correct top-level build command. mops build can fail due to DID path resolution outside the mops.toml context.

## Sort Direction Convention

In JavaScript Array.sort((a, b) => ...), returning negative places a before b; returning positive places b before a. To sort NEWEST-FIRST (descending) by a field: use b.field > a.field ? 1 : b.field < a.field ? -1 : 0. To sort OLDEST-FIRST (ascending): use b.field > a.field ? -1 : b.field < a.field ? 1 : 0. Never use b > a ? -1 for newest-first — that is oldest-first.
