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
| `app/components/iza-computer/component.js` | `app/templates/components/iza-computer.hbs` | `src/components/IzaComputer.jsx` | ⬜ Not Started | Canvas, resize listener |
| `app/components/screen-input/component.js` | `app/templates/components/screen-input.hbs` | `src/components/ScreenInput.jsx` | ⬜ Not Started | |
| `app/components/iza-computer/loading-indicator/component.js` | (template TBD) | `src/components/LoadingIndicator.jsx` | ⬜ Not Started | |
| `app/components/iza-computer/mpf-indicator/component.js` | (template TBD) | `src/components/MpfIndicator.jsx` | ⬜ Not Started | |

---

## Phase 4: Routes → React Components
| Source File | Template | React Destination | Status | Notes |
|---|---|---|---|---|
| `app/routes/application.js` | `app/templates/application.hbs` | `src/App.jsx` | ⬜ Not Started | Root layout |
| `app/routes/cmd-about.js` | (template TBD) | `src/routes/CmdAbout.jsx` | ⬜ Not Started | |
| `app/routes/cmd-beep.js` | (template TBD) | `src/routes/CmdBeep.jsx` | ⬜ Not Started | |
| `app/routes/cmd-cd.js` | (template TBD) | `src/routes/CmdCd.jsx` | ⬜ Not Started | |
| `app/routes/cmd-clear.js` | (template TBD) | `src/routes/CmdClear.jsx` | ⬜ Not Started | |
| `app/routes/cmd-contact.js` | (template TBD) | `src/routes/CmdContact.jsx` | ⬜ Not Started | Commented out in registry |
| `app/routes/cmd-fling.js` | (template TBD) | `src/routes/CmdFling.jsx` | ⬜ Not Started | |
| `app/routes/cmd-hello.js` | (template TBD) | `src/routes/CmdHello.jsx` | ⬜ Not Started | |
| `app/routes/cmd-history.js` | (template TBD) | `src/routes/CmdHistory.jsx` | ⬜ Not Started | |
| `app/routes/cmd-less.js` | (template TBD) | `src/routes/CmdLess.jsx` | ⬜ Not Started | |
| `app/routes/cmd-cat.js` | (template TBD) | `src/routes/CmdCat.jsx` | ⬜ Not Started | |
| `app/routes/cmd-ls.js` | (template TBD) | `src/routes/CmdLs.jsx` | ⬜ Not Started | Complex flags |
| `app/routes/cmd-man.js` | (template TBD) | `src/routes/CmdMan.jsx` | ⬜ Not Started | |
| `app/routes/cmd-origin.js` | (template TBD) | `src/routes/CmdOrigin.jsx` | ⬜ Not Started | Uses fun-ctionality mixin |
| `app/routes/cmd-pwd.js` | (template TBD) | `src/routes/CmdPwd.jsx` | ⬜ Not Started | |
| `app/routes/cmd-settings.js` | (template TBD) | `src/routes/CmdSettings.jsx` | ⬜ Not Started | |
| `app/routes/cmd-shop.js` | (template TBD) | `src/routes/CmdShop.jsx` | ⬜ Not Started | Commented out in registry |
| `app/routes/cmd-version.js` | (template TBD) | `src/routes/CmdVersion.jsx` | ⬜ Not Started | |
| `app/routes/cmd-viewer.js` | (template TBD) | `src/routes/CmdViewer.jsx` | ⬜ Not Started | |
| `app/routes/cmd-whoami.js` | (template TBD) | `src/routes/CmdWhoami.jsx` | ⬜ Not Started | |
| `app/mixins/fun-ctionality.js` | — | merged into `src/routes/CmdOrigin.jsx` | ⬜ Not Started | |

---

## Phase 5: Router
| Source File | React Destination | Status | Notes |
|---|---|---|---|
| `app/router.js` | `src/router.jsx` | ⬜ Not Started | Dynamic route gen from command-registry |

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
