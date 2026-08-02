# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

This is Salva's personal website. Its purpose is to build his personal brand, showcase a "Resume++" (a richer, more expressive version of a traditional resume), share a bit about who he is, and eventually host a blog and/or references to his public knowledge-sharing (talks, articles, etc.).

Professional path to reflect in the resume/bio content:
1. Backend developer
2. Fullstack developer
3. Tech lead on a delivery team (several years)
4. Trainer for new graduate developers (one year)
5. Returned to tech leadership, delivering to clients
6. Switched to cyber security engineer (2.5 years ago)
7. Currently leading the engineering team within the cyber security team (since a few months ago)

## UX/UI direction (VERY IMPORTANT)

The website must look and feel like a Kali Linux desktop running Gnome — not like a traditional website. This is a hard constraint, not a style suggestion.

- The UI is a simulated desktop environment: think desktop background, top/bottom bar, app launcher, windows, icons — the visual language of Kali/Gnome, not of a marketing site or blog template.
- Content lives inside interactive "applications" and "elements" the visitor opens and manipulates (e.g. windows you can open, drag, close), not inside scrolling pages/sections.
- Reject conventional website patterns (hero section, navbar, scrolling landing page, card grids used as the primary navigation) in favor of desktop-metaphor interactions.
- When in doubt about a UI decision, default to "what would this look like on a real Kali/Gnome desktop" over "what would this look like on a normal website."

## Tech stack

- **Zero runtime dependencies — hard rule.** The production `dependencies` block in package.json must stay empty. Every byte shipped to the browser is first-party code; this is part of the site's security story.
- **Vanilla TypeScript + native Web Components** (Custom Elements + Shadow DOM). No React or any other UI framework. Each "application" is a self-contained Custom Element with Shadow DOM isolation.
- **Dev-only tooling:** Vite (build/dev server), Vitest (unit/component tests, browser mode for Shadow DOM fidelity), Playwright (real-browser E2E for window dragging, focus, z-order).
- **Content pipeline:** authored as markdown files in `content/`; a build step parses and sanitizes them into static HTML/JSON. The markdown parser is a devDependency only — no parsing or sanitizing happens in the browser.
- **Architecture:** a small `WindowManager` module owns z-order/focus/drag state behind a testable interface; apps register in a manifest the desktop reads, so new apps require no core changes. Kali/Gnome theming is centralized in CSS custom properties.
- **Hosting/deploy:** GitHub Actions → GitHub Pages under the custom domain, DNS proxied through Cloudflare for real security headers (CSP, HSTS, Permissions-Policy); a `<meta>` CSP ships in the page as defense-in-depth.
- **Security posture:** strict CSP with no `unsafe-inline` and no external origins; CI enforces dependency audit, lockfile pinning, CodeQL SAST, and GitHub Actions pinned by SHA.

## Project structure and conventions

- **Domain-oriented folder organization.** Do NOT organize folders by technical role (`components/`, `services/`, `repositories/`, etc.). Group code by domain concept instead (e.g. `desktop/`, `window-manager/`, `apps/resume/`, `apps/terminal/`, `content-pipeline/`).
- **Unit and component tests live next to the code they test.** No dedicated `tests/`/`__tests__/` folders — a module's test file sits beside it (e.g. `window-manager.ts` next to `window-manager.test.ts`).
- **E2E tests live in a dedicated `test/e2e/` folder.** Playwright specs (`*.e2e.ts`) are not colocated with source — they exercise the app as a whole across module boundaries, so they live together under `test/e2e/`.

## Development workflow

- Follow strict TDD: write a failing test first, implement the minimum code to make it pass, then look for refactoring opportunities to apply clean code practices. Do not write implementation code before a failing test exists for it.
- In tests, never assert literal style values copied from a stylesheet (exact hex colors, pixel sizes) — they only fail on intentional edits. Assert the contract or invariant instead: a token is defined, a computed style equals the runtime-resolved token, a layout relationship holds. Asserting a single property that encodes a deliberate UX decision (e.g. `outline: none` on focused windows) is fine.

## Code style

- Follow SOLID principles.
- Do not write comments in the code; use self-explanatory naming for variables, functions, and classes instead.
- Apply clean code best practices (small functions, single responsibility, minimal duplication).

## Git operations

- Never perform Git operations: no commits, branches, PRs, pushes, or any other Git action. The user handles all Git operations themselves.

## GitHub Actions security (required for every workflow)

- Push-only triggers: never `pull_request`, `pull_request_target`, or `workflow_run`.
- Pin actions to full commit SHAs with a `# vX.Y.Z` comment; verify with `git ls-remote <repo-url> 'refs/tags/vX.Y.Z*'` (use the peeled `^{}` commit). `gh` is not installed — use git or curl.
- `permissions: contents: read` at workflow level; elevate scopes only at job level. Privileged jobs (e.g. deploy) keep their own `if:` ref guard and run no project code.
- Every checkout sets `persist-credentials: false`; every job sets `timeout-minutes` and starts with `step-security/harden-runner` (`egress-policy: audit` until audit data enables `block` + `allowed-endpoints`).
- `npm ci --ignore-scripts` always; a dependency that genuinely needs install scripts gets an explicit `npm rebuild <pkg>`.
- `npm audit` runs before `npm ci` (needs only the lockfile); `npm audit signatures` after (needs node_modules).
- No `npx` in workflows — only `npm run <script>` declared in package.json.
- `${{ github.event.* }}` only in `with:` inputs, never in `run:` lines.
- Dependency review in push mode: `base-ref: main` on branches, `github.event.before` on main (guarded against the all-zeros SHA).

## Git workflow (trunk-based)

- The user practices trunk-based development: work goes directly to `main`, with only very short-lived branches when necessary.
- Pull requests are NOT part of the workflow. Do not design CI, tooling, or automation around PR events — CI must run on pushes to any branch, and anything gating `main` must work without PRs (e.g. Renovate merges via branch automerge, dependency review runs in push mode).
