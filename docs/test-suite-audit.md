# Test suite audit — 2026-08-06

The suite had grown to 606 tests across 71 files without a corresponding growth in confidence. This
audit pruned the tests that could only fail on an intentional design or refactor edit, de-coupled the
survivors from internal DOM structure, and split the Playwright projects so nothing is skipped at
runtime.

The rules that came out of it now live in `CLAUDE.md` under **Testing policy**. That is the source of
truth going forward; this document is the record of what was removed and why.

**Scope guarantee:** no production source file was changed. The diff is confined to `*.test.ts`,
`*.e2e.ts`, `src/test-support/`, `test/e2e/desktop-page.ts`, `playwright.config.ts`, the Vitest browser
viewport in `vite.config.ts`, the `test:smoke` script in `package.json`, `CLAUDE.md` and this file.

---

## 1. Summary

| Suite | Before | After | Wall time before → after |
|---|---|---|---|
| unit | 297 tests / 32 files | 290 tests / 31 files | 1.4s → 1.2s |
| browser (component) | 282 tests / 30 files | 261 tests / 29 files | 4.5s → 5.4s |
| e2e | **228 runs** (202 passed, **26 skipped**) | **55 runs** (55 passed, **0 skipped**) | 36.1s → **8.2s** |

- **e2e CPU time: 410s → 44s** (9x). The old suite ran all 57 specs in chromium, firefox, webkit *and*
  mobile; the mobile project then skipped 26 of them at runtime.
- **e2e spec bodies: 57 → 43.** Distribution now: chromium 41, firefox 6, webkit 6, mobile 2.
- **Vitest tests: 579 → 551.** 28 removed, plus 6 merged into parameterised `it.each` cases.
- **Internal-selector coupling: 203 → 75 `shadowRoot.querySelector` calls** in `src` tests. The 75 that
  remain are single-component tests reaching into their *own* shadow root (see §5).
- Zero skipped tests anywhere. Zero real `setTimeout` sleeps (that was already true and still is —
  timing is driven by `vi.useFakeTimers()`).

The component suite got marginally slower because its tests now perform **real pointer clicks** through
role-based locators instead of dispatching synthetic events. That is the cost of testing what a user
actually does, and it immediately paid for itself — see §6.

---

## 2. Ledger — deleted tests

Every removed test, with the surviving test that covers the behaviour, or an explicit statement that
the behaviour is not worth guarding.

### 2.1 Whole files deleted

| Deleted test | File | Why removed | Behaviour now covered by |
|---|---|---|---|
| `is a solid body rather than a thin outline` | `apps/settings/settings-icon.browser.test.ts` | Appearance — rasterized the SVG to a canvas and sampled a pixel ring | *Not guarded.* The gear's silhouette is a design choice. |
| `is punched out at the centre like the gnome gear` | same | Appearance | *Not guarded.* Same. |
| `carries eight teeth` | same | Appearance — counted inked runs around a sampled ring | *Not guarded.* Same. |
| `leaves the corners of the viewbox clear` | same | Appearance | *Not guarded.* Same. That the icon renders at all is still exercised: the Settings dock button is located by the `title` on the element the icon is appended to. |
| `styles the page around the article` | `content-pipeline/article-stylesheet.test.ts` | Asserted the emitted CSS string contains `#prerendered-article` | *Not guarded.* Appearance. |
| `styles the post body the same way the app does` | same | Asserted `.article-body pre` in CSS text | *Not guarded.* Appearance. |
| `carries the syntax colours, which the app and the page share` | same | Asserted `.hljs-keyword` in CSS text | *Not guarded.* Appearance. |
| `never needs an inline style, which the content security policy would block` | same | Asserted CSS text lacks `style=` | `writings.crossbrowser.e2e.ts` → `the post page provokes no content security policy violation`, which loads the real page under the real CSP in three engines. |

### 2.2 Appearance and structure tests removed from surviving files

| Deleted test | File | Why removed | Behaviour now covered by |
|---|---|---|---|
| `exposes the kali gnome design tokens on the document root` | `theme/tokens.browser.test.ts` | Asserted CSS custom-property names are non-empty | `src/test-support/desktop-driver.ts` loads `theme/tokens.css` into every composed-desktop test, so a missing layout token now surfaces as a broken interaction. Proven during this work: with tokens absent, `--top-bar-height` collapsed and the overview covered the Activities button, failing the toggle test. |
| `exposes the matrix terminal design tokens on the document root` | same | Same | *Not guarded.* Decorative colours. |
| `exposes the wallpaper design tokens on the document root` | same | Same | *Not guarded.* Decorative colours. |
| `exposes a destructive accent for the power off action` | same | Same | *Not guarded.* Colour choice. |
| `gives the two styles genuinely different backgrounds` | same | Appearance | `appearance.e2e.ts` → `repaints the page when the style changes`, which asserts the rendered background actually changes. |
| `keeps the terminal palette out of the light style` | same | Appearance | *Not guarded.* A deliberate design decision that the terminal stays dark; no behaviour depends on it. |
| `renders the decorative layers and stays out of the accessibility tree` | `desktop/wallpaper.browser.test.ts` | Split: the `.gradient` / `svg.motif` presence half was structure | The `aria-hidden` half survives as `stays out of the accessibility tree`. The structural half is *not guarded*. |
| `paints the motif from theme tokens rather than hardcoded colours` | same | Appearance — compared `getComputedStyle(...).stroke` to a resolved token | *Not guarded.* Which colour the motif is painted in is a design choice. |
| `renders consecutive lines without blank gaps, like a real terminal` | `apps/terminal/terminal-app.browser.test.ts` | Appearance — line-box geometry | *Not guarded.* Line spacing is a design choice. |
| `renders the prompt with the terminal green token` | same | Appearance | *Not guarded.* Prompt colour is a design choice. |
| `gives the post more room as the window grows` | `apps/writings/writings-app.browser.test.ts` | Appearance — responsive measure | *Not guarded.* Layout is a design choice. |
| `keeps the post header and body on the same measure` | same | Appearance | *Not guarded.* Same. |
| `composes the shell chrome` | `desktop/desktop-shell.browser.test.ts` | Structure only — asserted four custom elements exist | Behaviour throughout the same file: the dock launches apps, the Activities button toggles the overview, the wallpaper serves the desktop menu. None pass if an element is missing. |
| `mounts a context menu layer` | same | Structure only | `opens the menu layer when a surface requests a menu`, same file. |
| `lays out a two by two tile grid` | `desktop/quick-settings/quick-settings-model.test.ts` | Asserted the constant has four entries | *Not guarded.* Tile count is a design choice. |
| `offers two disabled sliders` | same | Restated the constant | Non-interactivity is covered by `disables the sliders natively so they cannot be dragged` in the panel test. The inventory itself is *not guarded*. |
| `shows a battery reading` | same | Asserted a hardcoded label matches `/^\d+%$/` | *Not guarded.* Fake battery text. |
| `renders four tiles, two sliders and three footer actions when open` | `desktop/quick-settings/quick-settings-panel.browser.test.ts` | Structure / element counts | *Not guarded.* Each control's behaviour is covered individually in the same file. |
| `renders an icon for every slider and every footer action` | same | Appearance | *Not guarded.* Icons are decorative; controls are reachable by their aria-labels regardless. |
| `renders each thumbnail as the real wallpaper surface` | `apps/settings/appearance-panel.browser.test.ts` | Appearance | *Not guarded.* Choosing a wallpaper is covered by `changes the wallpaper when a thumbnail is chosen`. |
| `offers four wallpapers, each with a label` | `preferences/wallpaper-catalog.test.ts` | Split: `toHaveLength(4)` coupled the test to the catalogue size | Survives as `gives every wallpaper a label`. The count is *not guarded*. Every allowlist and path-traversal rejection test was kept — that is security behaviour. |

### 2.3 e2e tests deleted as duplicates of component coverage

These cost a full site build and previously ran in three or four browsers each.

| Deleted test | File | Behaviour now covered by |
|---|---|---|
| `right-clicking the desktop opens the desktop menu` | `context-menu.e2e.ts` | `desktop/wallpaper.browser.test.ts` → `offers the desktop actions in gnome order` + `greys out the actions that have no implementation yet` |
| `closes a window from the title bar menu` | same | `windowing/desktop-window.browser.test.ts` → `closes through the menu` |
| `escape dismisses the menu` | same | `desktop/context-menu/context-menu-layer.browser.test.ts` → `closes on Escape and returns focus to the originating element` |
| `a disabled entry does nothing and leaves the menu open` | same | `context-menu-layer.browser.test.ts` → `marks disabled entries with aria-disabled and does not perform them` |
| `the hovered item is the only highlighted one` | same | *Not guarded.* Asserted live `:hover`/`:focus` state — the suite's only genuine flake risk, and hover styling is appearance. Pointer-driven focus movement is still covered by `moves focus to the item under the pointer`. |
| `right-clicking a dock icon offers the app menu` | same | `desktop/context-menu/app-icon-menu.test.ts` → `greys out the app actions that have no implementation yet` |
| `boots straight to the desktop with the terminal window open` | `shell.e2e.ts` | `desktop/desktop-shell.browser.test.ts` → `boots with the terminal window already open`, plus `smoke.crossbrowser.e2e.ts` |
| `launches the terminal from the dock` | same | `desktop-shell.browser.test.ts` → `opens a window with the app content when an app is activated` + `re-activating a running app focuses it instead of opening a duplicate` |
| `the terminal executes typed commands` | same | `apps/terminal/terminal-shell.test.ts` (25 tests on the command layer) + `terminal-app.browser.test.ts` → `executes a typed command and appends its output` |
| `toggles the style from quick settings and repaints the page` | `appearance.e2e.ts` | Split: the interaction is covered by `quick-settings-panel.browser.test.ts` → `switches to the light style when the style tile is clicked`; the repaint half survives as `repaints the page when the style changes`, which needs a real page. |
| `changes the wallpaper from the settings app` | same | `apps/settings/appearance-panel.browser.test.ts` → `changes the wallpaper when a thumbnail is chosen` |
| `closes quick settings on escape and restores focus` | same | `quick-settings-panel.browser.test.ts` → `closes on escape, returns focus and announces the dismissal` |
| `opens settings from the desktop context menu change background action` | same | `wallpaper.browser.test.ts` → `opens settings from change background`, and `desktop-shell.browser.test.ts` → `opens the settings app from the quick settings gear` |
| `the post body in the app is painted with the desktop tokens` | `writings.e2e.ts` | *Not guarded.* Appearance. |
| `the standalone page ships the styles the post body needs` | same | *Not guarded.* Appearance — asserted the CSS text contains selectors. |

---

## 3. Rewritten, not deleted

### Literal values → invariants (`windowing/window-manager.test.ts`)

| Was | Now guards |
|---|---|
| `geometry` equals `{x:640, y:316, width:640, height:480}` | Equal gaps left and right; top below the top bar; bottom inside the viewport |
| `cascades subsequent windows by 24px` | A second window opens down and to the right of the first, without encoding 24 |
| `geometry.x === -544` / `=== 1824` | At least 96px of the window stays inside the viewport on either edge |
| `geometry.y === 32` / `=== 1040` | `y >= TOP_BAR_HEIGHT` and `y <= viewport.height - TITLE_BAR_HEIGHT`, using the exported constants |
| `width === 1920`, `height === 1048` | Maximized geometry derived from the viewport and `TOP_BAR_HEIGHT` |
| `enforces the minimum size` (320×240) | `never resizes below the requested minimum size`, using an explicit `minSize` so it no longer depends on an unexported default |

### Internal selectors → accessible names

`#close`, `#minimize`, `#maximize`, `#cancel`, `#confirm`, `#status`, `#activities`, `#title`,
`#title-bar`, `#content`, `[data-tile-id]`, `[data-action-id]`, `[data-style-id]`,
`[data-wallpaper-id]`, `[data-item-id]`, `[data-app-id]`, `.post-entry[data-slug]` are all now reached
by role and accessible name, in both the component suite and e2e. Renaming any of those ids is now a
pure refactor that the suite tolerates — verified in §4.

### Renamed — same behaviour, clearer or less coupled name

No coverage changed here; the old title simply no longer exists, so it is recorded for traceability.

| Old title | New title | File |
|---|---|---|
| `renders the window title` | `names itself with the window title` | `desktop-window.browser.test.ts` |
| `keeps the window partially visible while a drag is still in progress` | `keeps the window on screen while a drag is still in progress` | same |
| `hides itself and stops throwing after its window is closed` | `hides itself and stops responding after its window is closed` | same |
| `keeps at least 96px visible when dragged off the left edge` | `keeps a grabbable edge on screen when dragged off the left` | `window-manager.test.ts` |
| `keeps at least 96px visible when dragged off the right edge` | `keeps a grabbable edge on screen when dragged off the right` | same |
| `cascades subsequent windows by 24px` | `cascades a second window down and to the right of the first` | same |
| `enforces the minimum size` | `never resizes below the requested minimum size` | same |
| `closing a window removes its element` | `closing a window removes it from the desktop` | `desktop-shell.browser.test.ts` |
| `activities-toggle toggles the overview` | `the activities button toggles the overview` (now clicks the real button instead of dispatching a synthetic `CustomEvent` at `sc-top-bar`) | same |
| `opens the layer when a surface requests a menu` | `opens the menu layer when a surface requests a menu` | same |
| `closes the layer when the window manager notifies a change` | `closes the menu when the window manager notifies a change` | same |
| `closes the layer when a window it describes is closed` | `closes the menu when a window it describes is closed` | same |
| `is invisible while the session is running` | `stays out of sight while the session is running` | `session-screen.browser.test.ts` |
| `becomes visible while shutting down` | `takes over the screen while shutting down` | same |
| `reflects the current style on the dark style tile` | `reflects the current style on the style tile` | `quick-settings-panel.browser.test.ts` |
| `switches to the light style when the dark style tile is clicked` | `switches to the light style when the style tile is clicked` | same |
| `offers the two styles as a radio group` | `offers every style as a radio in a labelled group` | `appearance-panel.browser.test.ts` |
| `offers four wallpapers, each with a label` | `gives every wallpaper a label` (count assertion dropped — see §2.2) | `wallpaper-catalog.test.ts` |
| `renders the decorative layers and stays out of the accessibility tree` | `stays out of the accessibility tree` (structural half dropped — see §2.2) | `wallpaper.browser.test.ts` |
| `toggles the style from quick settings and repaints the page` | `repaints the page when the style changes` (interaction half dropped — see §2.3) | `appearance.e2e.ts` |

### Merged into parameterised `it.each` cases (6 tests → 3)

| Old titles | Merged into | File |
|---|---|---|
| `synthesises a contextmenu event on the focused element for Shift+F10` + `synthesises a contextmenu event on the focused element for the ContextMenu key` | `synthesises a contextmenu event on the focused element for %s` | `desktop-shell.browser.test.ts` |
| `ignores a secondary-button press on the title bar` + `ignores a secondary-button press on a resize handle` | `ignores a secondary-button press on %s` | `desktop-window.browser.test.ts` |
| `maximizing a minimized maximized window un-minimizes it` + `maximizing a minimized window un-minimizes it` | `maximizing a minimized window un-minimizes it (maximized first: %s)` | `window-manager.test.ts` |

`titles the window with the requested title` was also merged away: `opens separate windows for different
params` now asserts the exact list of open window titles, which covers it.

`opens and closes the quick settings panel from the status button` became `opens the quick settings
panel from the status button`. The close half asserted behaviour the product does not have — see §6.1.

### Moved to another project's spec file — behaviour unchanged

| Test | From | To | Now runs on |
|---|---|---|---|
| `compact viewports get maximized immovable windows` | `window-physics.e2e.ts` | `window-physics.mobile.e2e.ts` | mobile |
| `long-pressing the desktop opens the desktop menu` | `context-menu.e2e.ts` | `context-menu.mobile.e2e.ts` | mobile |
| `dragging the south-east handle resizes the window` | `window-physics.e2e.ts` | `window-physics.crossbrowser.e2e.ts` | chromium, firefox, webkit |
| `the post is still readable` | `writings.e2e.ts` | `writings.crossbrowser.e2e.ts` | chromium, firefox, webkit |
| `the archive lists the published posts` | same | same | chromium, firefox, webkit |
| `drafts stay out of the published site` | same | same | chromium, firefox, webkit |
| `the post page provokes no content security policy violation` | same | same | chromium, firefox, webkit |
| `the desktop boots without errors` | `smoke.e2e.ts` | `smoke.crossbrowser.e2e.ts` | chromium, firefox, webkit |

### Other rewrites

- `window-physics.e2e.ts`: `expect(after.y).toBeGreaterThanOrEqual(32)` → measured from the top bar's
  own bounding box.
- `session-screen.browser.test.ts`: `getComputedStyle(...).display === 'none'` → `expect.element(...)
  .not.toBeVisible()`.

### New shared test support (`src/test-support/`)

- `desktop-driver.ts` — `mountDesktop()` returns intent-level actions (`launch`, `window(title).close()`,
  `openSystemMenu`, `chooseMenuItem`, `confirmShutdown`, …) built on `page.getByRole`.
- `mount.ts` — one `mount(tag, props)` with automatic teardown, replacing ~20 local helpers and their
  hand-rolled `afterEach` loops.
- `fake-preference-storage.ts` — replaces five copy-pasted `fakeStorage()` helpers.
- `test/e2e/desktop-page.ts` — the e2e equivalent. Not matched by `testMatch`, so it is not collected
  as a spec.

### Configuration

- `vite.config.ts`: the Vitest browser viewport is now **1280×800**. It previously defaulted to a
  phone-sized viewport, which put the desktop in **compact mode** — where `#minimize` and `#maximize`
  are `display: none`. The old tests clicked those buttons via `querySelector`, so they were asserting
  minimize/maximize behaviour in a mode where the buttons are not shown to anyone.
- `playwright.config.ts`: per-project `testMatch` / `testIgnore` (see §7).
- `package.json`: `test:smoke` follows the renamed smoke spec.

---

## 4. Verification performed

1. `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e` — all green.
2. Playwright list reporter reports **0 skipped** across all four projects.
3. **Coverage not silently lost.** Three behaviours whose tests were deleted or rewritten were broken
   deliberately in production code; each turned the suite red, and each was reverted. See §8.
4. **De-coupling works.** `#close` was renamed to `#dismiss` in `desktop-window.ts`, keeping
   `aria-label="Close"`. The suite stayed green. Reverted. See §8.
5. **Ledger completeness.** Every test title removed in `git diff` appears in §2 with either a named
   surviving test or an explicit *Not guarded* justification.

---

## 5. Known limitations

- **75 `shadowRoot.querySelector` calls remain**, in single-component tests reaching into their own
  shadow root: `context-menu-layer` (12), `terminal-app` (10), `case-study-app` (8), `dock` (7),
  `writings-app` (7), `top-bar` (6), `activities-overview` (5), `settings-app` (5), and others. These
  are far less brittle than the cross-component reaches that were removed — a component test is allowed
  to know its own internals — but they are still ids and class names. Worth a follow-up pass.
- Drag and resize surfaces (`header`, `[data-direction]`) have no accessible name and are addressed
  semantically from within `desktop-window`'s own test. That is deliberate, not an oversight.

---

## 6. Defects found by this work

De-coupling the tests from synthetic events surfaced two real problems that the old tests were hiding.
**Neither is fixed here** — this pass changed no production code.

### 6.1 The system menu cannot be closed by clicking its own button

Clicking the top-bar status button while the system menu is open **re-opens it** instead of closing it.
Event order, captured in a real browser:

```
pointerdown → popover-dismissal closes the panel → quick-settings-dismissed
click       → system-menu-toggle → shell sees isOpen === false → opens it again
```

`observePopoverDismissal` (`src/desktop/popover/popover-dismissal.ts`) listens for `pointerdown` on
anything outside the panel, and the anchor button is outside the panel. The old test passed because
`statusButton.click()` dispatches a `click` with no preceding `pointerdown`.

Escape and outside-clicks still close the menu, so the menu is not trapped — but the standard GNOME
toggle does not work. The likely fix is to exclude the anchor element from the dismissal listener.

`desktop-shell.browser.test.ts` now tests only `opens the quick settings panel from the status button`.
The close-by-second-click assertion was removed rather than rewritten to assert the broken behaviour,
which would have cemented the defect.

### 6.2 Dock buttons announce their glyph, not the app name

Dock buttons render `button.textContent = app.iconGlyph` with `button.title = app.name`. Because
content wins over `title` in the accessible-name calculation, screen readers announce **`>_`**, **`CV`**
and **`✎`** instead of *Terminal*, *Resume++* and *Writings*. Settings is the exception — it uses an
SVG icon, so its name correctly falls back to the `title`.

Measured directly: `getByRole('button', { name: 'Terminal' })` matches **0** elements;
`getByRole('button', { name: '>_' })` matches 1.

The test drivers locate dock buttons by `title` (`getByTitle`) as a result. That is still a user-facing
affordance rather than an internal hook, so the tests are honest — but the underlying accessibility
defect should be fixed, most simply with an `aria-label` on each dock button.

---

## 7. Playwright project layout

No test is skipped at runtime. Specs are selected by filename:

| Project | Selector | Runs |
|---|---|---|
| chromium | `testIgnore: '**/*.mobile.e2e.ts'` | 41 — the full behavioural suite, once |
| firefox | `testMatch: '**/*.crossbrowser.e2e.ts'` | 6 |
| webkit | `testMatch: '**/*.crossbrowser.e2e.ts'` | 6 |
| mobile | `testMatch: '**/*.mobile.e2e.ts'` | 2 |

`*.crossbrowser.e2e.ts` is reserved for scenarios where engines genuinely differ: the boot smoke test,
window resize physics, no-JS prerendering, and CSP enforcement.

---

## 8. Deliberate coverage gaps

Every *Not guarded* row from §2, collected so the accepted risk is visible in one place. Nothing below
is covered by any test, by choice:

- The settings gear glyph's shape — solid body, punched centre, eight teeth, clear corners.
- The article stylesheet's contents (which selectors and syntax colours it carries).
- The terminal, wallpaper and destructive-accent colour tokens being defined.
- The terminal palette staying dark in the light style.
- The wallpaper motif's stroke and fill colours, and the presence of its decorative gradient layers.
- Terminal line spacing.
- The post body's responsive measure, and header/body sharing a measure.
- Quick-settings inventory: tile count, slider count, footer action count, per-control icons.
- The fake battery percentage label.
- Appearance-panel thumbnails rendering the real wallpaper surface.
- The wallpaper catalogue's size (its labels and allowlist behaviour *are* guarded).
- Context-menu hover highlighting.
- The post body being painted with desktop tokens, in the app and on the standalone page.

These are all design choices. If any becomes load-bearing — for instance if the gear glyph were ever
generated rather than authored — it should get a test at that point.

---

## 9. Resume content migration — the legacy career-stage model removed (2026-08-14)

The Resume app carried two parallel career models for the length of the resume-content migration: the
flat `CareerStage[]` (`ResumeContent.stages`) that shipped the original placeholder content, and the
`Tenure[]`/`Occupation[]` model (`ResumeContent.tenures`) that replaced it. The flat model was kept
alive deliberately so every step of the migration left the suite green; this entry closes it out. The
`CareerStage` interface, `ResumeContent.stages`, the `stages` placeholder array and its `LOREM` filler
constant are deleted from `src/apps/resume/resume-model.ts` and `src/apps/resume/resume-content.ts`.
The two remaining `stages: []` fixture stubs — in `printable-resume.browser.test.ts` and
`resume-app.browser.test.ts` — existed only because the type required the field; they are removed with
the field.

No behavioural test titled against `stages` or `details.stage` exists in the suite as of this task —
the describe blocks and renderer assertions that once exercised the flat model were already replaced,
task by task, by their tenure/occupation equivalents. This entry names, for the record, which surviving
test now guards each behaviour the old model exercised.

| Old behaviour (flat `CareerStage[]`) | Surviving test | File |
|---|---|---|
| Stage ids are unique | `have unique ids` (describe `tenures`) | `resume-content.test.ts` |
| Stages are ordered oldest first | `are ordered oldest first` (describe `tenures`) | `resume-content.test.ts` |
| Stages do not overlap in time | `never overlap each other` (describe `tenures`) | `resume-content.test.ts` |
| — (the flat model had no sub-role concept) | `have unique ids across every tenure`, `fall inside the tenure that holds them`, `are ordered oldest first within a tenure`, `always carry a summary` (describe `occupations`) | `resume-content.test.ts` |
| — (the flat model had no seniority-grade concept) | `never overlap within a tenure`, `fall inside the tenure that holds them` (describe `grade spans`) | `resume-content.test.ts` |
| Gaps between stages are called out and explained | `never overlap a tenure`, `always explain themselves` (describe `career gaps`) | `resume-content.test.ts` |
| `details.stage` renders one collapsed disclosure per stage, oldest first | `nests occupations inside their tenure, collapsed, in order` | `career-timeline.browser.test.ts` |
| The stage summary/period show without expanding the disclosure | `shows the occupation title and period without expanding` | `career-timeline.browser.test.ts` |
| The stage narrative sits in the disclosure body and is omitted when unwritten | `keeps the narrative in the disclosure body, and omits it when unwritten` | `career-timeline.browser.test.ts` |
| A stage always shows a summary or narrative | `always shows the summary, narrative or not` | `career-timeline.browser.test.ts` |
| One chip renders per stack entry | `renders one chip per stack entry, and none when the stack is unknown` | `career-timeline.browser.test.ts` |
| Content renders as text, never as markup | `renders content as text, never as markup` | `career-timeline.browser.test.ts` |
| Evidence chips resolved against `stage` ids and navigated to `details.stage[data-stage-id]` | Evidence-chip navigation now resolves `details.occupation[data-occupation-id]` — `an evidence chip navigates to its occupation and expands it` | `resume-app.browser.test.ts` |

No coverage gap results from this deletion: every invariant and every renderer behaviour the flat model
had is exercised, by name, above. The only things removed outright are the placeholder `LOREM` prose
and the `isPlaceholder` stage entries themselves, which described no real behaviour to guard.

---

## 10. Resume content migration — final pass, redundant coverage removed (2026-08-14)

The whole-branch review that closed out the resume content migration flagged three places where a
behaviour was proven more than once, at more than one level, against the same source — the exact
pattern §2.3 and the **Testing policy** in `CLAUDE.md` already rule out. This entry records what was
removed and, per that policy, which surviving test now guards each behaviour.

| Deleted test | File | Why removed | Behaviour now covered by |
|---|---|---|---|
| `an evidence chip jumps to the occupation it cites` | `test/e2e/resume.e2e.ts` | Re-proved, against a real built page, exactly what a component test already proves against the real element and real content. Needs nothing the built site provides — no navigation, no cross-origin asset, no browser-specific rendering. | `an evidence chip navigates to its occupation and expands it` (`resume-app.browser.test.ts`) |
| `cat resume.txt previews the career path` | `apps/terminal/terminal-shell.test.ts` | Asserted only that the current headline reaches `cat resume.txt`'s output — a fact already proven directly against the generated file, and the fact that `cat` can read a real file was already proven with synthetic content. | `carries the current headline` (`apps/terminal/home-directory.test.ts`) for the headline; `cat prints a file line by line` (`terminal-shell.test.ts`) for `cat` itself |
| the headline assertion inside `boots with the motd scrollback and a live prompt` | `apps/terminal/terminal-app.browser.test.ts` | The boot sequence runs `whoami` as one of its `BOOT_COMMANDS`, so this assertion re-proved `whoami`'s greeting format one level above the shell that owns it. The test itself was not deleted — it still proves the prompt renders, the motd banner appears and the input exists, none of which is redundant — only the headline-specific line was narrowed away. | `whoami introduces Salva` (`terminal-shell.test.ts`) |
| `offers a reachable contact address` | `apps/resume/resume-content.test.ts` | Checked only that `profile.email` contains `@`. That string can fail only if the email itself is deleted or replaced with something absurd — not a case a legitimate content edit would produce, and not a behaviour a visitor could observe breaking. | *Not guarded.* Its sibling `links out over https only` remains — that one guards a real invariant (no insecure link ships), which this one did not. |

No coverage gap results from any of these four removals: each behaviour worth guarding is still exercised,
by name, above, at the level closest to where it is produced.
