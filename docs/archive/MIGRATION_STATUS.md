# Migration Status: Ember → React

Tracking conversion progress. Update this file after each conversion.

**Legend:** ✅ Done | 🔄 In Progress | ⬜ Not Started | ⏭ Skip (no Ember deps, copy as-is)

---

## Phase 0: Pre-Migration Artifacts
| Artifact | Status | Notes |
|---|---|---|
| `EMBER_REACT_PATTERNS.md` | ✅ Done | Reference guide for all conversions |
| `/migrate-to-react` Claude skill | ✅ Done | `.claude/commands/migrate-to-react.md` |
| Vite + React scaffold | ✅ Done | `src/`, `index.html`, `vite.config.js`, `src/styles/app.scss` |
| `MIGRATION_STATUS.md` (this file) | ✅ Done | |

---

## Phase 1: Constants (Copy As-Is — No Ember Dependencies)
| Source File | React Destination | Status | Notes |
|---|---|---|---|
| `app/const/command-registry.js` | `src/constants/command-registry.js` | ✅ Done | Removed `isPresent` → `!= null` |
| `app/const/story-items.js` | `src/constants/story-items.js` | ✅ Done | Updated import path |
| `app/const/story-rooms.js` | `src/constants/story-rooms.js` | ✅ Done | `findBy` → `.find()` |
| `app/const/environment-values.js` | `src/constants/environment-values.js` | ✅ Done | Copied as-is |
| `app/const/magic-numbers.js` | `src/constants/magic-numbers.js` | ✅ Done | Copied as-is |
| `app/mixins/deformers.js` | `src/utils/deformers.js` | ✅ Done | Mixin → named exports; imports `rngeezus` (migrated next) |

---

## Phase 2: Services → Hooks / Context
| Source File | React Destination | Status | Notes |
|---|---|---|---|
| `app/services/rngeezus.js` | `src/utils/rngeezus.js` | ✅ Done | Plain singleton module; pools built at module load time |
| `app/services/persistence-handler.js` | `src/hooks/usePersistence.js` | ✅ Done | Plain module (no React state); `isPresent` → `!= null`, `findBy` → `.find()` |
| `app/services/status-bar.js` | `src/context/StatusBarContext.jsx` | ✅ Done | `useState` for statusMessage; `isPresent` → `!= null` |
| `app/services/input-processor-base.js` | ↓ merged into useInputProcessor | ✅ Done | |
| `app/services/input-processor-computed.js` | ↓ merged into useInputProcessor | ✅ Done | `computed()` → pure helper fns outside hook |
| `app/services/input-processor-key-functions.js` | ↓ merged into useInputProcessor | ✅ Done | |
| `app/services/input-processor.js` | `src/hooks/useInputProcessor.js` | ✅ Done | `useReducer` + `stateRef` pattern; `normalizeEvent` dropped; `mapBy` → `.map(r => r.commandName)`; `ENV.aws.buildNumber` → `import.meta.env.VITE_BUILD_NUMBER` |
| `app/services/story-core.js` | `src/utils/storyCore.js` | ✅ Done | Plain module — all state in localStorage; `currentRoom`/`xp`/`maxXp` computed → plain functions; `inputProcessor.currentArgs` → param on `useItem(id, currentArgs)` |

---

## Phase 3: Components → React Components
| Source File | Template | React Destination | Status | Notes |
|---|---|---|---|---|
| `app/components/iza-computer/component.js` | `app/components/iza-computer/template.hbs` | `src/components/IzaComputer.jsx` | ✅ Done | `animFnRef` pattern for rAF loop; computed props → pure fns; `this.$()` → refs; `window.animationScope` → `animFnRef`; accepts `inputProcessor` prop |
| `app/components/screen-input/component.js` | `app/components/screen-input/template.hbs` | `src/components/ScreenInput.jsx` | ✅ Done | Local `inputValue` state; delegates to `inputProcessor` prop |
| `app/components/iza-computer/loading-indicator/component.js` | `app/components/iza-computer/loading-indicator/template.hbs` | `src/components/LoadingIndicator.jsx` | ✅ Done | Trivial — conditional img |
| `app/components/iza-computer/mpf-indicator/component.js` | `app/components/iza-computer/mpf-indicator/template.hbs` | `src/components/MpfIndicator.jsx` | ✅ Done | Trivial — conditional div |
| `app/application/template.hbs` (root layout) | — | `src/App.jsx` | ✅ Done | Calls `useInputProcessor()`, passes to both children; replaces `<Outlet />` with `<IzaComputer>` (which owns outlet) |

---

## Phase 4: Routes → React Components
| Source File | Template | React Destination | Status | Notes |
|---|---|---|---|---|
| `app/routes/application.js` | `app/templates/application.hbs` | `src/App.jsx` | ✅ Done | Root layout (done in Phase 3) |
| `app/routes/cmd-about.js` | (empty) | `src/routes/CmdAbout.jsx` | ✅ Done | Fire-and-forget |
| `app/routes/cmd-beep.js` | (empty) | `src/routes/CmdBeep.jsx` | ✅ Done | Fire-and-forget; ASCII heart art |
| `app/routes/cmd-cd.js` | (empty) | `src/routes/CmdCd.jsx` | ✅ Done | Parses rawUserEntry directly |
| `app/routes/cmd-clear.js` | (empty) | `src/routes/CmdClear.jsx` | ✅ Done | Calls inputProcessor.clear() only |
| `app/routes/cmd-contact.js` | (empty) | `src/routes/CmdContact.jsx` | ✅ Done | `_default` handler enables free-form input; Vite env vars for AWS |
| `app/routes/cmd-fling.js` | (empty) | `src/routes/CmdFling.jsx` | ✅ Done | Game state in useRef; `new` as method name valid ES6+ |
| `app/routes/cmd-hello.js` | (empty) | `src/routes/CmdHello.jsx` | ✅ Done | Fire-and-forget |
| `app/routes/cmd-history.js` | (empty) | `src/routes/CmdHistory.jsx` | ✅ Done | Fire-and-forget; static lore text |
| `app/routes/cmd-less.js` | (empty) | `src/routes/CmdLess.jsx` | ✅ Done | `findBy` → `.find()` |
| `app/routes/cmd-cat.js` | (empty) | `src/routes/CmdCat.jsx` | ✅ Done | Identical logic to cmd-less |
| `app/routes/cmd-ls.js` | (empty) | `src/routes/CmdLs.jsx` | ✅ Done | Full flag support; `sortBy` → `.sort()`; `rejectBy` → `.filter()` |
| `app/routes/cmd-man.js` | (empty) | `src/routes/CmdMan.jsx` | ✅ Done | Serves help + man + ? routes |
| `app/routes/cmd-origin.js` | (empty) | `src/routes/CmdOrigin.jsx` | ✅ Done | FunCtionality mixin merged in; `_take`/`_use` helpers avoid state mutation; `storyCore.getXp()`/`getMaxXp()` function calls; `storyCore._getIsGameCompleted` added to exports |
| `app/routes/cmd-pwd.js` | (empty) | `src/routes/CmdPwd.jsx` | ✅ Done | Inline `dasherize()` replaces `@ember/string` |
| `app/routes/cmd-settings.js` | (empty) | `src/routes/CmdSettings.jsx` | ✅ Done | Overflow args + interactive scope; `isBlank` inlined |
| `app/routes/cmd-shop.js` | (empty) | `src/routes/CmdShop.jsx` | ✅ Done | Image gallery; arrow key overrides; currentShopIndexRef |
| `app/routes/cmd-version.js` | (empty) | `src/routes/CmdVersion.jsx` | ✅ Done | Fire-and-forget |
| `app/routes/cmd-viewer.js` | (empty) | `src/routes/CmdViewer.jsx` | ✅ Done | Image gallery; arrow key overrides; currentImgIndexRef |
| `app/routes/cmd-whoami.js` | (empty) | `src/routes/CmdWhoami.jsx` | ✅ Done | Fire-and-forget |
| `app/mixins/fun-ctionality.js` | — | merged into `src/routes/CmdOrigin.jsx` | ✅ Done | Mixin methods inlined as scope object methods |

---

## Phase 5: Router
| Source File | React Destination | Status | Notes |
|---|---|---|---|
| `app/router.js` | `src/router.jsx` | ✅ Done | 19 cmd-* child routes registered; contact+shop included even though commented out in registry |

---

## Phase 6: Integration
| Task | Status | Notes |
|---|---|---|
| Wire all providers in App.jsx | ⬜ Not Started | |
| Verify all 20 commands functional | ⬜ Not Started | |
| Verify canvas rendering | ⬜ Not Started | |
| Verify localStorage persistence | ⬜ Not Started | |
| Verify AWS SDK integration | ⬜ Not Started | |
| Remove old Ember source | ⬜ Not Started | Final step |

---

## Issues & Decisions Log
_Record any conversion decisions or ambiguities here as they come up._

| File | Decision | Rationale |
|---|---|---|
| All constants | Source dir is `app/const/` not `app/constants/` | Discovered during Phase 1 |
| `deformers.js` | Imports `./rngeezus` directly (not injected) | rngeezus becomes a plain module in Phase 2; deformers calls it as a singleton |
| `app/utils/environment-helpers.js` | Migrated to `src/utils/environment-helpers.js` alongside input-processor | Unlisted dep of input-processor; `isPresent` → `!= null` |
| `useInputProcessor.js` | `handleScreenInput` temporarily mutates `stateRef.current` to make the just-set command available to `_execute` | Workaround for dispatch being async; only lasts for the duration of the call |
| `IzaComputer.jsx` | `animFnRef` pattern: `animFnRef.current = recursiveAnimationFunction` each render; rAF calls `() => animFnRef.current()` | Prevents stale closures over `visibleDisplayLines`, `fontSize`, `viewportMeasurements` in the animation loop |
| `IzaComputer.jsx` | `_setBgImageRef`, `_setContainerSizeRef`, `_doRedrawHackRef` stable refs updated each render | Allows one-time `useEffect` and resize listener to always call the latest version of these functions |
| `IzaComputer.jsx` | `useInputProcessor()` lifted to `App.jsx` and passed as prop | `IzaComputer` and `ScreenInput` are siblings — both need same inputProcessor instance; lifting avoids Context overhead |
| `IzaComputer.jsx` | `_getIsKeyboardActive()` → hardcoded `true` (always active) | Private method in hook always returns `true`; simplified in component |
| `IzaComputer.jsx` | Initial bg image load explicit in `useEffect` | Ember initialized via `_setContainerSize` (container size was undefined initially); React pre-initializes state to `window.innerWidth/Height` so explicit call needed |
| `useInputProcessor.js` | Added `_default` handler in `_execute` | When `overrideScope._default` exists, unrecognized commands call it with `rawUserEntry` (pre-lowercase). Enables cmd-contact's free-form multi-step form. |
| `useInputProcessor.js` | Added `maxCharsPerLine: 60` to initialState + `setMaxCharsPerLine()` | cmd-origin's `_makeAsciiProgressBar` reads this value. IzaComputer pushes the computed value on every viewport/font change. |
| `IzaComputer.jsx` | Added `maxCharsPerLine` computed value + `useEffect` to sync to inputProcessor | Computed from `(viewportMeasurements.width - 2 * textEdgeBuffer) / fontCharacterWidth`; effect fires when that value changes. |
| All cmd-* routes | All render `null` — "side-effect routes" | The Ember templates were all empty placeholders. Real output goes through `inputProcessor.setAppEnvironment()`. Pattern: `useEffect(fn, [])` = Ember's `afterModel()`. |
| cmd-* routes | `useOutletContext()` provides `inputProcessor` | Set in `IzaComputer.jsx` via `<Outlet context={inputProcessor} />`. |
| Interactive routes (settings, fling, contact, origin) | `inputProcessorRef` updated every render, used inside scope methods | Prevents stale closures — scope object created once in `useEffect` but always reads fresh state/methods via ref. |
| `CmdPwd.jsx` | Inline `dasherize()` replaces Ember's `@ember/string` | `str.trim().toLowerCase().replace(/[_\s]+/g, '-')` |
| `CmdSettings.jsx` | `isBlank()` inlined | `x == null \|\| String(x).trim() === ''` |
| `CmdOrigin.jsx` | `_take(args)` and `_use(args)` internal helpers | Ember's `pick()` mutated `currentArgs` via `.shift()` before calling `take()`. React state can't be mutated. `_take(args.slice(1))` and `_use(modifiedArgs)` pass args directly. |
| `CmdOrigin.jsx` | `storyCore.getXp()` / `storyCore.getMaxXp()` | Ember's `this.storyCore.xp` / `this.storyCore.maxXp` were computed properties. In the plain module they're functions. |
| `CmdOrigin.jsx` | `storyCore._getIsGameCompleted` added to storyCore exports | Called from `status()` in cmd-origin. Was a private function in the module but needed externally. |
| `CmdOrigin.jsx` | `format()` welcome message fixed | Original had `this.welcomeMessage` (undefined — a bug). Fixed to `'Welcome to Origin ${username}'`. |
| `CmdViewer.jsx` / `CmdShop.jsx` | `currentImgIndexRef` / `currentShopIndexRef` — mutable state in refs | Arrow key overrides need to read/write index without triggering re-renders. Key handlers are closures over refs created once in `useEffect`. |
| `CmdContact.jsx` | `_default` scope handler receives `rawUserEntry` | Contact form needs original capitalization preserved. `rawUserEntry` is stored pre-lowercase by `_execute`. |
| `CmdFling.jsx` | Ember `init()` hook equivalent | `scope.new()` called at top of `useEffect` before `setAppEnvironment()`, matching Ember's `init()` → `new()` call order. |
