# Data Model: Tech Debt Resolution & Codebase Refactor

**Branch**: `004-tech-debt-refactor` | **Date**: 2026-03-10

This document defines the TypeScript types and interfaces that will be introduced or formalized during this refactor. These are the canonical shapes; implementations must match exactly.

---

## 1. Canvas Pipeline Types

### QualityLevelConfig

```typescript
// frontend/src/types/canvas.ts

export interface GlowParams {
  enabled: boolean;
  useRandom: boolean;
  maxContrast: number | null;
  distance: number | null;
  falloff: {
    near: number | null;
    mid: number | null;
    far: number | null;
  };
}

export interface ShiftParams {
  enabled: boolean;
  positionFactor: number;
  factor: number;
  brightnessThreshold: number;
}

export interface PixelizeParams {
  adjustmentLarge: number;
  adjustmentSmall: number;
}

export interface DisplacementParams {
  bandCount: number;
  travelPixelsPerCycle: number;
}

export interface QualityLevelConfig {
  stride: 1 | 2 | 4;
  glow: GlowParams;
  shift: ShiftParams;
  pixelize: PixelizeParams;
  displacement: DisplacementParams;
}

// Quality ladder is readonly tuple of 8 entries (levels 0–7)
export type QualityLadder = readonly [
  QualityLevelConfig, QualityLevelConfig, QualityLevelConfig, QualityLevelConfig,
  QualityLevelConfig, QualityLevelConfig, QualityLevelConfig, QualityLevelConfig,
];

export type QualityLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
```

### DeformerPass Signatures

Each pass is independently testable and named. The pixel loop orchestrator (`applyAllDeformers`) calls them in fixed order.

```typescript
// frontend/src/utils/deformers.ts

/**
 * Pixelize pass: applies CRT phosphor triad emulation via per-pixel RGB channel
 * modulation based on pixel index parity (red triad / blue triad / brightness triad).
 * Runs on every sampled pixel regardless of quality level.
 */
export function pixelizeBit(
  i: number,
  data: Uint8ClampedArray,
  params: PixelizeParams,
  baseIdx: number
): void;

/**
 * Shift pass: chromatic aberration. Reads from `i * positionFactor` offset and
 * blends weighted RGB delta. Only activates on pixels exceeding brightnessThreshold.
 */
export function shiftPixel(
  i: number,
  data: Uint8ClampedArray,
  params: ShiftParams,
  baseIdx: number
): void;

/**
 * Glow pass: contrast-based edge detection with additive falloff glow (near/mid/far).
 * Most expensive pass. Disabled at quality levels 4–7.
 * @param randomValue - Pre-hoisted random value from rngeezus (hoisted per frame, not per pixel)
 */
export function glowEdgesBit(
  i: number,
  data: Uint8ClampedArray,
  params: GlowParams,
  randomValue: number,
  baseIdx: number
): void;

/**
 * Orchestrator: applies all three passes across the full ImageData at the stride
 * defined by the quality level. Block-fills skipped pixels.
 */
export function applyAllDeformers(
  imageData: ImageData,
  qualityLevel: QualityLevel
): ImageData | false;
```

### QualityAdapterState

```typescript
// frontend/src/components/canvas/qualityAdapter.ts

export interface QualityAdapterState {
  currentLevel: QualityLevel;
  lastTransitionMs: number;       // Timestamp of last level change (for debounce)
  debounceMs: number;             // Min ms between consecutive transitions (default: 500)
}

export interface QualityAdapterConfig {
  targetFps: number;
  headroomFps: number;
  stallThresholdMs: number;
  debounceMs: number;
}

export interface FrameMetrics {
  deltaMs: number;
  timestamp: number;
}

export type QualityTransition = 'upgrade' | 'downgrade' | 'emergency' | 'none';
```

---

## 2. Input Processor Types

### InputState

```typescript
// frontend/src/reducers/inputReducer.ts

export interface InputState {
  // Command input
  currentCommand: string;
  currentArgs: string[];
  rawUserEntry: string;
  cursorPosition: number;

  // Execution history
  commandHistory: string[];
  currCommandIndex: number;          // -1 = live input; 0+ = history position
  previousExecutionBlocks: string[][];

  // Prompt rendering
  promptTimestamp: string;
  isPromptCursorVisible: boolean;
  forceDisplayCursor: boolean;

  // App / command context
  activeApp: string | undefined;
  displayAppNameInPrompt: boolean | undefined;
  interruptPrompt: boolean | undefined;
  appResponse: string[];
  appContext: string | null;

  // Command overrides (installed by route commands via setAppEnvironment)
  keyOverrides: Record<string, () => void> | undefined;
  overrideScope: Record<string, () => string[]> | undefined;

  // Display configuration
  maxCharsPerLine: number;
  bgImage: string | undefined;
}

export type InputAction =
  | { type: 'SET_FIELDS'; payload: Partial<InputState> }
  | { type: 'SET_CURSOR'; payload: number }
  | { type: 'PUSH_HISTORY'; payload: string }
  | { type: 'CLEAR' }
  | { type: 'RESET' };
```

### AppEnvironment

```typescript
// frontend/src/types/terminal.ts

/** Config object passed to inputProcessor.setAppEnvironment() by route commands */
export interface AppEnvironment {
  activeAppName: string;
  response: string[];
  displayAppNameInPrompt?: boolean;
  interruptPrompt?: boolean;
  keyOverrides?: Record<string, () => void>;
  overrideScope?: Record<string, () => string[]>;
  bgImage?: string;
  appContext?: string;
}
```

---

## 3. Game State Types

### GameState (managed by gameState.ts)

```typescript
// frontend/src/types/game.ts

export interface GameState {
  posX: number;
  posY: number;
  visitedRooms: string[];
  deaths: number;
  completionItems: string[];
  isInitialVisit: boolean;
}
```

### InventoryItem (managed by inventoryManager.ts)

```typescript
export interface StoryItem {
  id: number;
  name: string;
  type: 'key' | 'passive' | 'document' | 'consumable' | 'tool' | 'misc';
  weight: number;
  description: string;
  isLocked?: boolean;
  passiveKeyFor?: number[];   // Room exit IDs this item passively unlocks
}

export interface RoomInventory {
  roomId: string;
  itemIds: number[];
}
```

### Room (managed by roomNavigator.ts)

```typescript
export type ExitDirection = 'n' | 's' | 'e' | 'w' | 'u' | 'd';

export interface RoomExit {
  direction: ExitDirection;
  targetRoomId: string;
  lockKeyId?: number | number[];   // Item(s) required to unlock
  isUnlockedByDefault?: boolean;
}

export interface Room {
  id: string;
  x: number;
  y: number;
  name: string;
  description: string;
  exits: RoomExit[];
  isDarkTrap?: boolean;
  isAirlock?: boolean;
  isInSpace?: boolean;
}
```

### FlashlightState (managed by flashlightManager.ts)

```typescript
export type FlashlightStatus = 'on' | 'off' | 'dead';

export interface FlashlightState {
  status: FlashlightStatus;
  batteryLevel: number;   // 0–100
}
```

---

## 4. Persistence Module Types

```typescript
// frontend/src/utils/persistence.ts

/** localStorage key names — these MUST NOT change (see FR-014, FR-027) */
export type PersistenceKey =
  | 'magic-robots-data'
  | 'username'
  | 'font-size'
  | 'show-keyboard'
  | 'graphics-mode'
  | 'quality-preset'
  | 'fling-record'
  | 'story-pos-x'
  | 'story-pos-y'
  | 'story-visited-rooms'
  | 'story-inventory-items'
  | 'story-room-inventories'
  | 'story-room-unlocked-directions'
  | 'story-unlocked-items'
  | 'story-death-counter'
  | 'story-completion-items'
  | 'story-flashlight-status'
  | 'story-cake-status'
  | 'story-is-initial-visit';
```

---

## 5. Route / Gallery Types

```typescript
// frontend/src/routes/shared/galleryNavigator.ts

export interface GalleryImage {
  path: string;
}

export interface ShopImage extends GalleryImage {
  itemMapId: number;
}

export interface GalleryConfig<T extends GalleryImage> {
  images: readonly T[];
  getImagePath: (item: T, index: number) => string;
  initialResponse: string[];
  additionalCommands?: Record<string, () => string[]>;
}
```

---

## 6. Entity Relationship Summary

```
QualityLadder (readonly, 8 entries)
  └── QualityLevelConfig
        ├── GlowParams
        ├── ShiftParams
        ├── PixelizeParams
        └── DisplacementParams

useInputProcessor (hook)
  ├── InputState (managed by inputReducer)
  ├── InputAction (discriminated union)
  └── AppEnvironment (installed by route commands)

storyCore → decomposed into:
  ├── gameState.ts      → GameState
  ├── inventoryManager.ts → StoryItem, RoomInventory
  ├── roomNavigator.ts  → Room, RoomExit, ExitDirection
  └── flashlightManager.ts → FlashlightState, FlashlightStatus

persistence.ts
  └── PersistenceKey (all localStorage keys — frozen)
```

---

## 7. State Transitions

### Quality Level Lifecycle

```
[level N]
  ├── frame deltaMs > stallThresholdMs  → emergency jump to level 7
  ├── fps < targetFps AND debounce elapsed → downgrade to level N+1 (max 7)
  ├── fps > targetFps + headroomFps AND debounce elapsed → upgrade to level N-1 (min 0)
  └── (otherwise) → stay at level N
```

### Input State — Command Execution Flow

```
[idle] → addKeyToCommand → [typing]
[typing] → Enter key → _execute()
  ├── valid command → navigate(route) + SET_FIELDS → [route active]
  ├── invalid command → SET_FIELDS (error response) → [idle]
  └── profanity → SET_FIELDS (rejection message) → [idle]
[route active] → setAppEnvironment() installs keyOverrides + overrideScope
[route active] → quit() → clears overrides → [idle]
```

### Flashlight Battery Lifecycle

```
[charged: 100] → useFlashlight() per room entry → [draining]
[draining: N] → N <= 0 → [dead]
[dead] → turnOffFlashlight() (no-op on dead) → [dead]
[dead] → hasFlashlight() returns false → player cannot see in dark rooms
```
