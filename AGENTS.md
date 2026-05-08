# Project Guidance

## User Preferences

[No preferences yet]

## Verified Commands

- **typecheck**: `cd src/frontend && pnpm typecheck`
- **fix**: `cd src/frontend && pnpm fix`
- **build**: `cd src/backend && caffeine build`

## Learnings

- mo:core 2.2.0 with --implicit-package=core (set in mops.toml) enables dot-notation on arrays: arr.concat(other), arr.filter(func), arr.map(func), Time.now().toText(). Both dot-notation and module-style (Array.concat(arr, other)) are valid. The -E=M0236 flag in mops.toml promotes M0236 to a hard error when module-style is used where dot-notation is available — so dot-notation is required in this project.
- mops build succeeds with exit 0 using the current dot-notation syntax in main.mo. Do not attempt to replace dot-notation with Array.append/Array.filter/Array.map module-style calls — they trigger M0236 compile errors in this project.
- caffeine build (not mops build directly) is the correct top-level build command. mops build can fail due to DID path resolution outside the mops.toml context.
