# Feature Specification: Tech Debt Resolution & Codebase Refactor

**Feature Branch**: `004-tech-debt-refactor`
**Created**: 2026-03-10
**Status**: Draft
**Input**: User description: "Tech Debt: refactors and performance improvements. When this application was initially converted to react it was an ember app. Refactors were ignored to get it up and running with the new technology. Let's go over the codebase with a fine toothed comb and make sure there is no code duplication, that typescript is everywhere, that there is no code smell, let's make this thing the most maintainable, beautiful set of code we've ever seen. Part of this will also be going over the graphics processing (canvas) and updating it / improving it / refactoring it as it was written by hand by me about 10 years ago and I had no idea what I was doing."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Establish Type Safety Across the Codebase (Priority: P1)

A developer opening the project for the first time can navigate any file and immediately understand data shapes, function signatures, and expected inputs/outputs — without needing to trace runtime behavior or read adjacent files for context. The frontend, which was left in plain JavaScript after the Ember→React migration, is fully typed to match the strict TypeScript standards already present in the API and shared types package.

**Why this priority**: TypeScript is the single highest-leverage improvement because it surfaces bugs during authoring, enables confident refactoring, and makes every other refactoring task safer. Without it, all downstream refactors carry higher risk.

**Independent Test**: Can be verified by running the TypeScript type-checker across the entire monorepo and observing zero errors. Any developer can open any source file and get autocomplete and inline type errors in their editor.

**Acceptance Scenarios**:

1. **Given** the frontend source directory, **When** the TypeScript compiler checks it, **Then** zero type errors are reported with strict mode enabled.
2. **Given** a developer adds a new route component, **When** they use a prop or context value that does not exist, **Then** the editor shows a type error before they run the code.
3. **Given** the shared types package defines a data shape, **When** that shape is used in a frontend component, **Then** the component automatically gets type coverage without manual re-declaration.
4. **Given** any utility function or hook, **When** it is called with incorrect argument types, **Then** a compile-time error is surfaced.

---

### User Story 2 - Eliminate Code Duplication (Priority: P2)

A developer working on one terminal command or feature area can find a single, authoritative implementation — never two files that do the same thing with slightly different variable names. Shared behaviors (gallery navigation, content display, command initialization, text layout) live in one place and are composed into each consumer rather than copy-pasted.

**Why this priority**: Duplication is the root cause of subtle bugs (fixing one copy but not the other) and exponential maintenance cost. Identified duplicate pairs include: `CmdCat`/`CmdLess` (100% identical logic), `CmdViewer`/`CmdShop` (95% identical gallery behavior), and the ~20 route command files that each repeat the same 5-line initialization pattern.

**Independent Test**: Can be verified by a code-similarity check showing no two source files share more than trivial boilerplate. Each extracted abstraction has its own test coverage, confirming it works in isolation.

**Acceptance Scenarios**:

1. **Given** the `CmdCat` and `CmdLess` commands, **When** their shared display logic needs updating, **Then** a developer changes exactly one place and both commands reflect the update.
2. **Given** the `CmdViewer` and `CmdShop` gallery navigation, **When** a bug is found in arrow-key wrapping, **Then** fixing it in one shared location fixes both commands.
3. **Given** the ~20 route command files, **When** the command initialization pattern needs changing, **Then** a developer changes one shared utility or base component and all routes inherit the change.
4. **Given** text layout / line-wrapping logic, **When** it needs updating, **Then** there is a single utility function to modify.

---

### User Story 3 - Decompose Monolithic Files into Focused Modules (Priority: P3)

A developer looking for a specific behavior (canvas rendering, quality adaptation, game state, input processing) can navigate directly to a small, focused file rather than searching through hundreds of lines of unrelated logic. Each file has a clear, single responsibility that can be read and understood in under 10 minutes.

**Why this priority**: The most complex parts of this codebase — `IzaComputer.jsx` (700+ lines), `useInputProcessor.js` (818 lines), `storyCore.js` (1035 lines), `CmdOrigin.jsx` (781 lines) — are so large that a change in one area risks unintentionally affecting another. Decomposition is foundational to safe future work.

**Independent Test**: Each decomposed module can be imported and used independently; the full application behavior is unchanged after decomposition.

**Acceptance Scenarios**:

1. **Given** the CRT display component, **When** a developer needs to change the quality adaptation behavior, **Then** they find a focused quality adapter module with no canvas drawing code in it.
2. **Given** the CRT display component, **When** a developer needs to modify the pixel deformation pipeline, **Then** they work in a dedicated rendering module without touching input handling or quality logic.
3. **Given** the game engine (`storyCore`), **When** a developer needs to change inventory logic, **Then** they modify a focused inventory module that does not contain room navigation or XP tracking.
4. **Given** the input processor, **When** a developer reads it, **Then** they can understand the complete state machine within 10 minutes.

---

### User Story 4 - Modernize & Improve the Canvas Graphics Pipeline (Priority: P4)

The pixel-level CRT deformation pipeline — originally written without awareness of modern canvas optimization techniques — is refactored to use current best practices. The visual output is equivalent or improved, the code is readable and documented, and performance on low-to-mid-range hardware is measurably better or equal.

**Why this priority**: The canvas rendering is the centerpiece visual feature of the application. Because it was written without expertise, it likely contains inefficient pixel loops, missed optimization opportunities, and patterns that are brittle under different display densities or frame rates. Improving it directly improves user experience and code longevity.

**Independent Test**: The CRT visual effect renders correctly before and after refactor; frame rates on equivalent hardware are equal or better; the rendering code is readable by a developer unfamiliar with the original.

**Acceptance Scenarios**:

1. **Given** the pixel deformation pipeline, **When** a developer reads it, **Then** each transformation pass (pixelization, shift, glow) is an independently named, documented function.
2. **Given** a device running the application, **When** the quality adapter selects a rendering level, **Then** the visual output is indistinguishable from the pre-refactor output at that quality level.
3. **Given** the canvas rendering on the same hardware before and after refactor, **When** measured at equivalent quality settings, **Then** frame time is equal or improved.
4. **Given** the quality adaptation system, **When** a developer needs to add a new quality level, **Then** they add one entry to a configuration object and the system uses it automatically.

---

### User Story 5 - Remove Ember.js Artifacts and Normalize Build Configuration (Priority: P5)

Opening the project repository shows a clean, React-native codebase with no confusing leftover files from the previous Ember framework. Build scripts run the actual current toolchain. A new developer does not need to read migration documentation to understand how to run or build the project.

**Why this priority**: Ember artifacts (obsolete build scripts, dead config files, outdated package.json commands, a lone QUnit test) create confusion for any developer unfamiliar with the migration history. They also cause false failures when running commands like `npm test` or `npm start`.

**Independent Test**: Running all documented scripts from the README produces expected behavior; no files from the Ember ecosystem are present in the repository root.

**Acceptance Scenarios**:

1. **Given** the root `package.json`, **When** a developer runs the start command, **Then** the React development server starts without errors.
2. **Given** the repository root, **When** a developer lists all config files, **Then** no Ember-specific files (`ember-cli-build.js`, `.ember-cli`, `testem.js`, `.template-lintrc.js`) are present.
3. **Given** the project README, **When** a new developer follows its instructions, **Then** they successfully run the application without needing to consult migration documentation.
4. **Given** the test directory, **When** a developer runs the test suite, **Then** only React-appropriate tests execute.

---

### User Story 6 - Establish a Test Suite with Coverage of Critical Paths (Priority: P6)

A developer making a change to the codebase can run the test suite and get meaningful signal about whether they broke something important — particularly in the quality adaptation system, canvas rendering pipeline, terminal command logic, and game state management, which currently have zero test coverage.

**Why this priority**: Zero tests means every refactor in this feature is done without a safety net. Tests are listed last because they are best established alongside the refactors (testing the refactored code rather than the original), but they must be in place before the feature is considered complete.

**Independent Test**: Running the test command produces a results report showing passing tests in each critical area; no Ember-era test infrastructure is involved.

**Acceptance Scenarios**:

1. **Given** the test suite, **When** a developer runs it, **Then** tests for quality ladder transitions pass, covering at least upgrade and downgrade scenarios.
2. **Given** the test suite, **When** it runs, **Then** the pixel deformation pipeline functions are tested with known inputs and expected outputs.
3. **Given** the test suite, **When** it runs, **Then** the terminal command routing and initialization pattern is tested for at least 8 representative commands.
4. **Given** the test suite, **When** it runs, **Then** the persistence module and game state management are tested for save, load, and default fallback scenarios.

---

### Edge Cases

- What happens to the canvas rendering if the quality adapter refactor changes the timing of quality-level evaluations by even a few milliseconds?
- How does the decomposed input processor handle commands that were previously relying on the temporary `stateRef` direct mutation workaround?
- When Ember config files are removed, the AppVeyor CI/CD config MUST be updated: any stale Ember build/test/deploy commands are replaced with React/Vite equivalents (per FR-023a).
- After TypeScript conversion, do any dynamic patterns (property access by string key, context values typed as `any`) require explicit type assertions that could mask real problems?
- If the persistence module is renamed and restructured, are there any implicit dependencies on its module identity (e.g., module-level singletons that must only initialize once)?
- Does the game state in `CmdOrigin` remain correct after `storyCore` is decomposed into separate modules?
- localStorage key names are preserved across the persistence module rename; no key migration is required (FR-014). FR-027a remains as a safety net test for corrupt/invalid data recovery only.

## Requirements *(mandatory)*

### Functional Requirements

**TypeScript Migration**

- **FR-001**: All frontend source files MUST be converted from `.js`/`.jsx` to `.ts`/`.tsx` with no remaining plain JavaScript source files in `frontend/src/`.
- **FR-002**: The frontend TypeScript configuration MUST enable strict mode consistent with the existing API TypeScript configuration.
- **FR-002a**: `any` is strictly forbidden per the project constitution (§4). Where a genuinely un-typeable dynamic pattern cannot be resolved without disproportionate effort, the developer MUST: (1) use `unknown` with a narrowing type guard as the first alternative; (2) document the specific reason strict typing is not achievable at that site with an inline comment; and (3) track the occurrence as a known exception in the PR description. Unresolved `any` usages that lack an inline comment MUST be treated as type errors and block merge.
- **FR-003**: All frontend components, hooks, utilities, and constants MUST have explicit type annotations for all exported values, function parameters, and return types.
- **FR-004**: Types defined in the `@presence/types` shared package MUST be used by the frontend wherever they apply, with no redundant re-declaration of identical shapes.

**Code Duplication Elimination**

- **FR-005**: `CmdCat` and `CmdLess` MUST share a single content-display implementation, with each file only specifying what makes it unique (its command name).
- **FR-006**: `CmdViewer` and `CmdShop` MUST share a single gallery navigation implementation, composed into each command.
- **FR-007**: The common route command initialization pattern (context retrieval, environment setup) MUST be extracted into a single shared utility used by all route commands.
- **FR-008**: The text layout / line-wrapping logic MUST exist in exactly one location and be imported wherever needed.

**Monolith Decomposition**

- **FR-009**: `IzaComputer` MUST be decomposed into at minimum: a canvas rendering module, a quality adaptation module, and a top-level orchestrating component.
- **FR-010**: The pixel deformation pipeline MUST be refactored so each transformation pass (pixelization, pixel shift, edge glow) is an independently testable, named function with documented parameters.
- **FR-011**: The quality ladder configuration MUST be entirely data-driven, with no hardcoded quality-level behavior embedded in the rendering loop.
- **FR-012**: `storyCore.js` MUST be decomposed into at minimum: game state management, inventory management, and room/navigation logic as separate modules.
- **FR-013**: The game state mutation workaround in `useInputProcessor` (temporary `stateRef` direct mutation) MUST be eliminated by refactoring to `useReducer` with typed action dispatch. All state transitions MUST go through a pure reducer function; event handlers MUST dispatch typed actions rather than mutating refs directly.
- **FR-014**: `usePersistence` MUST be renamed to accurately reflect that it is a plain module, not a React hook, and all references updated accordingly. localStorage key names MUST remain unchanged — the rename is module-internal only; FR-027a is a safety net only, not a required migration path.

**Canvas Graphics Pipeline Modernization**

- **FR-015**: The canvas rendering pipeline MUST be modernized using GPU-accelerated 2D context APIs, replacing manual pixel-loop implementations wherever the native API achieves equivalent or better output:
  - `ctx.filter` MUST be used for blur, contrast, and brightness effects in place of any manual per-pixel "ghosting" or glow calculations, **except** for the three proprietary CRT deformer passes (`pixelizeBit`, `shiftPixel`, `glowEdgesBit`) — research (see research.md §1) confirms that `ctx.filter` cannot achieve equivalent output for these passes, so their pixel loops are retained.
  - `imageSmoothingEnabled = false` MUST be set wherever pixel-art sharpness is required, eliminating manual pixelation math.
  - Workers and OffscreenCanvas are explicitly out of scope; all rendering remains on the main thread.
  - Standard loop optimizations apply: minimize redundant state changes, avoid unnecessary pixel reads, batch operations where possible.
- **FR-016**: The dual-canvas architecture MUST be documented inline with a clear explanation of the source-canvas / altered-canvas roles and data flow.
- **FR-017**: The quality adapter MUST include transition debounce logic so rapid quality oscillation between adjacent levels is dampened.
- **FR-018**: The "redraw hack" (arbitrary timeout used to cycle z-index to force a repaint) MUST be replaced with a reliable repaint trigger that does not depend on a hardcoded delay.

**Ember Artifact Removal**

- **FR-019**: All Ember-specific files MUST be removed: `ember-cli-build.js`, `.ember-cli`, `.template-lintrc.js`, `testem.js`, the `/config/` Ember environment directory, and the `/vendor/` directory.
- **FR-020**: The root `package.json` scripts MUST be updated to remove all Ember commands and reflect only the current React/Vite toolchain.
- **FR-021**: The `.eslintrc.js` configuration MUST be updated to remove Ember plugin references and apply React-appropriate linting rules.
- **FR-022**: The legacy Ember QUnit test MUST be removed and replaced with an equivalent assertion in the new test framework.
- **FR-023**: `MIGRATION_STATUS.md` and `EMBER_REACT_PATTERNS.md` MUST be archived (moved to `docs/archive/`) rather than deleted, to preserve historical context.
- **FR-023a**: The AppVeyor CI/CD configuration MUST be audited for any Ember-specific build, test, or deploy steps; each stale reference MUST be replaced with the equivalent React/Vite toolchain command. No Ember commands or artifact paths may remain in any AppVeyor config file.

**Test Coverage**

- **FR-024**: A test framework MUST be configured in the frontend workspace with scripts wired into the monorepo. If the TypeScript migration reveals gaps in the `@presence/types` shared package (missing type guards, incorrect shapes, untested serialization), tests MUST be added there as well.
- **FR-025**: The quality ladder transition logic MUST have test coverage for at minimum: upgrade on sustained high frame rate, downgrade on sustained low frame rate, and prevention of oscillation between adjacent levels.
- **FR-026**: Each deformer pipeline function MUST have at least one unit test verifying correct output for a known input pixel array.
- **FR-027**: The persistence module MUST have tests covering: save, load, missing key fallback, corrupt/invalid data recovery, and a regression smoke test confirming that data written under the old module name is still readable after the rename (no shape migration required — this is a read-compatibility guard only).
- **FR-027a**: The persistence module MUST have a test covering corrupt/invalid data recovery (e.g., a malformed JSON value stored under a known key is handled gracefully without crashing). This is a safety-net test only — not a migration path. localStorage key names are preserved unchanged (see FR-014 and clarification 2026-03-10), so no first-load migration is required or permitted.
- **FR-028**: At least 8 terminal route commands MUST have tests covering their initialization and output generation.

**Zero Warnings & Errors**

- **FR-029**: Starting the frontend development server MUST produce zero deprecation warnings, framework warnings, and console errors.
- **FR-030**: Starting the API server MUST produce zero deprecation warnings and startup errors.
- **FR-031**: The browser console MUST be free of errors and warnings during normal application use, including initial load, navigation between commands, and canvas rendering.
- **FR-032**: Running the production build for any workspace MUST complete with zero warnings or errors.

### Key Entities

- **Quality Level**: A named configuration entry defining rendering parameters (stride, glow intensity, shift amount, displacement). Lives in a single data structure; selected at runtime by the quality adapter.
- **Deformer Pass**: A single, named transformation applied to pixel data (pixelize, shift, glow). Each pass is an independent, testable function with typed inputs and outputs.
- **Route Command**: A terminal command implemented as a React route. Shares a common initialization contract; implements only command-specific behavior.
- **Game State**: The persisted record of player progression — current room, inventory, completed events, experience. Managed by a dedicated module, not embedded in a multi-purpose hook.
- **Canvas Pipeline**: The ordered sequence of operations from source text content to rendered canvas pixels to deformed CRT canvas output.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The TypeScript compiler reports zero errors across the entire monorepo when run in strict mode.
- **SC-002**: No two source files share more than 10 lines of logically identical code (excluding imports and trivial scaffolding).
- **SC-004**: The CRT visual output is perceptually identical before and after the canvas refactor, verified by manual developer side-by-side screenshot comparison at each of the 8 quality levels, documented as a checklist step.
- **SC-005**: Frame time on equivalent hardware at equivalent quality settings is unchanged or improved after the canvas pipeline refactor.
- **SC-006**: The repository root contains zero files with "ember" in their filename or whose content references the Ember CLI framework.
- **SC-007**: Running the documented development and build commands from the README succeeds without errors on a clean checkout.
- **SC-008**: The test suite reports passing tests for quality ladder transitions, each deformer function, the persistence module, and at least 8 terminal commands.
- **SC-009**: A developer unfamiliar with the codebase can identify the location of any described behavior (quality adaptation, inventory management, gallery navigation) within 2 minutes by reading the file/directory structure alone.
- **SC-010**: No `setTimeout` with a hardcoded delay exists in the rendering pipeline; the "redraw hack" is fully eliminated.
- **SC-011**: Starting the frontend dev server, API server, and production build each produce zero warnings or errors in the terminal output.
- **SC-012**: The browser console is clean — zero errors and zero warnings — during a full session of normal application use.

## Clarifications

### Session 2026-03-10

- Q: If a user has saved game progress before this refactor ships, should that data continue to work after the restructure — or is wiping/resetting saved state acceptable? → A: Preserve — existing localStorage data MUST be migrated or remain readable after restructuring.
- Q: If a specific area genuinely cannot be strictly typed without disproportionate effort, is a documented `any`/`unknown` acceptable as a last resort? → A: Permitted sparingly — `any`/`unknown` allowed only with a required inline comment explaining why it cannot be avoided.
- Q: How should canvas visual fidelity be verified after the pipeline refactor — manual inspection or automated pixel-diff? → A: Manual — developer compares screenshots at each quality level before and after; documented as a checklist step.
- Q: What is the scope of canvas optimization — simple in-thread batching, OffscreenCanvas, or Workers? → A: Modern GPU-accelerated 2D API — stay on the main thread with no OffscreenCanvas or Worker; replace manual pixel loops with hardware-accelerated `ctx.filter` (blur, contrast, brightness) and `imageSmoothingEnabled = false` for pixel-art sharpness. Workers are explicitly out of scope; shaders via the 2D context API are the target.
- Q: Does a CI/CD pipeline exist that may reference Ember artifacts? → A: AppVeyor — CI/CD runs on AppVeyor; any stale Ember references in AppVeyor config MUST be replaced with equivalent entries using the current React/Vite toolchain.
- Q: Should tests be scoped to the frontend workspace only, or also cover the shared types package if gaps are found? → A: Both — if the TypeScript migration exposes gaps in `@presence/types`, tests MUST be added to that package as well.
- Q: Should localStorage key names change when `usePersistence` is renamed, or stay as-is to avoid mandating a migration? → A: Preserve — localStorage key names MUST remain unchanged; the rename is module-internal only.
- Q: What architectural pattern should replace the `stateRef` direct mutation in `useInputProcessor` (FR-013)? → A: `useReducer` with typed action dispatch — all transitions through a pure reducer; event handlers dispatch typed actions.
- Q: Should the "migration of data written by the previous module structure" clause in FR-027 be removed (keys unchanged = no migration) or retained as a defensive regression test? → A: Retain — kept as a read-compatibility smoke test confirming the renamed module still reads data written under the old module name; no shape migration required.

## Assumptions

- The visual CRT effect and quality adaptation behavior are correct and desirable as-is; the refactor improves the code without changing the intended visual output.
- The Ember QUnit test does not contain logic worth preserving beyond its assertion concept, which will be ported to the new framework.
- Vitest is preferred over Jest as the test framework due to its native Vite integration and zero-config setup in this stack.
- The unused `StatusBarContext` will be evaluated during decomposition — if it serves no current purpose after refactoring, it will be removed.
- Migration documentation files (`MIGRATION_STATUS.md`, `EMBER_REACT_PATTERNS.md`) are archived rather than deleted, as they may have historical or onboarding value.
- The backend (`/api`) is out of scope. The shared types package (`/packages/types`) is out of scope for structural refactoring, but tests MUST be added there if the TypeScript migration exposes missing type guards, incorrect shapes, or untested serialization.
