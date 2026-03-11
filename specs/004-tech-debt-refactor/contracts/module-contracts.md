# Module Contracts: Tech Debt Refactor

**Branch**: `004-tech-debt-refactor` | **Date**: 2026-03-10

These are the public interface contracts for each new or refactored module. Implementations must export exactly these signatures. Internal helpers may be added freely; removing or changing any export here is a breaking change requiring this document to be updated first.

---

## `frontend/src/utils/deformers.ts`

**Refactored from**: `frontend/src/utils/deformers.js`

```typescript
import type { QualityLevel, PixelizeParams, ShiftParams, GlowParams } from '../types/canvas';

// Each pass is exported independently for unit testing (FR-026)
export function pixelizeBit(i: number, data: Uint8ClampedArray, params: PixelizeParams, baseIdx: number): void;
export function shiftPixel(i: number, data: Uint8ClampedArray, params: ShiftParams, baseIdx: number): void;
export function glowEdgesBit(i: number, data: Uint8ClampedArray, params: GlowParams, randomValue: number, baseIdx: number): void;

// Orchestrator — used by CanvasRenderer
export function applyAllDeformers(imageData: ImageData, qualityLevel: QualityLevel): ImageData | false;
```

---

## `frontend/src/components/canvas/qualityAdapter.ts`

**New module** (extracted from IzaComputer.jsx)

```typescript
import type { QualityLevel, QualityAdapterConfig, QualityAdapterState, FrameMetrics, QualityTransition } from '../../types/canvas';

/** Initialize adapter state from config */
export function createQualityAdapter(config: QualityAdapterConfig): QualityAdapterState;

/**
 * Evaluate whether a quality transition should occur given the latest frame metrics.
 * Returns the new level and the transition type. Pure function — no side effects.
 */
export function evaluateQuality(
  state: QualityAdapterState,
  metrics: FrameMetrics
): { nextLevel: QualityLevel; transition: QualityTransition; nextState: QualityAdapterState };
```

---

## `frontend/src/components/canvas/CanvasRenderer.ts`

**New module** (extracted from IzaComputer.jsx)

```typescript
import type { QualityLevel } from '../../types/canvas';

export interface CanvasRefs {
  /** Source canvas: receives fillText() rendering, provides getImageData() */
  source: HTMLCanvasElement;
  /** Altered canvas: receives putImageData() deformed output, shown to user */
  altered: HTMLCanvasElement;
}

export interface RenderConfig {
  width: number;
  height: number;
  fontSize: number;
  fontCharWidth: number;
}

/** Set up both canvas contexts with correct dimensions and imageSmoothingEnabled=false */
export function initCanvases(refs: CanvasRefs, config: RenderConfig): void;

/**
 * Execute one render frame:
 * 1. Read ImageData from source canvas
 * 2. Apply deformers at qualityLevel
 * 3. Write result to altered canvas
 * Returns false if source canvas has no content.
 */
export function renderFrame(refs: CanvasRefs, qualityLevel: QualityLevel): boolean;

/**
 * Reliable repaint trigger — replaces the setTimeout z-index hack (FR-018).
 * Uses requestAnimationFrame + double-rAF pattern to force layout flush.
 */
export function triggerRepaint(canvas: HTMLCanvasElement): void;
```

---

## `frontend/src/reducers/inputReducer.ts`

**New module** (extracted from useInputProcessor.js)

```typescript
// InputState and InputAction are defined in this file (see data-model.md §2).
// They are NOT imported from types/terminal.ts — that file defines only AppEnvironment.

export interface InputState { /* ...see data-model.md §2 for full shape... */ }

export type InputAction =
  | { type: 'SET_FIELDS'; payload: Partial<InputState> }
  | { type: 'SET_CURSOR'; payload: number }
  | { type: 'PUSH_HISTORY'; payload: string }
  | { type: 'CLEAR' }
  | { type: 'RESET' };

export const initialInputState: InputState;

/** Pure reducer — no side effects, no imports of React */
export function inputReducer(state: InputState, action: InputAction): InputState;
```

---

## `frontend/src/utils/persistence.ts`

**Renamed from**: `frontend/src/hooks/usePersistence.js`

```typescript
// All localStorage key names preserved verbatim (FR-014)

// App-level
export function getUsername(): string | null;
export function setUsername(value: string): void;
export function getFontSize(): string | null;
export function setFontSize(value: string): void;
export function getShowKeyboard(): boolean;
export function setShowKeyboard(value: boolean): void;
export function getGraphicsMode(): string | null;
export function setGraphicsMode(value: string): void;
export function getQualityPreset(): string | null;
export function setQualityPreset(value: string): void;

// Fling
export function getFlingRecord(): number;
export function setFlingRecord(value: number): void;

// Story — position
export function getStoryPosX(): number;
export function setStoryPosX(value: number): void;
export function getStoryPosY(): number;
export function setStoryPosY(value: number): void;

// Story — inventory / rooms
export function getStoryInventoryItems(): number[];
export function addStoryInventoryItem(itemId: number): void;
export function removeStoryInventoryItem(itemId: number): void;
export function getStoryRoomInventories(): Record<string, number[]>;
export function addItemToRoom(roomId: string, itemId: number): void;
export function removeItemFromRoom(roomId: string, itemId: number): void;

// Story — progression
export function getStoryVisitedRooms(): string[];
export function addStoryVisitedRoom(roomId: string): void;
export function getStoryDeaths(): number;
export function setStoryDeaths(value: number): void;
export function getStoryCompletionItemsCollected(): string[];
export function addStoryCompletionItemCollected(itemId: string): void;

// Story — unlocks
export function getAllUnlockedItems(): number[];
export function unlockItem(itemId: number): void;
export function getIsUnlockedDirectionFromRoom(roomId: string, direction: string): boolean;
export function setIsUnlockedDirectionInRoom(roomId: string, direction: string): void;

// Flashlight / story flags
export function getFlashlightStatus(): string | null;
export function setFlashlightStatus(value: string): void;
export function getCakeStatus(): string | null;
export function setCakeStatus(value: string): void;
export function getStoryIsInitialVisit(): boolean;
export function setStoryIsInitialVisit(value: boolean): void;
```

---

## `frontend/src/utils/game/gameState.ts`

**New module** (from storyCore.js)

```typescript
export function initGameState(): void;
export function reportGameState(): string[];
export function handleCompletionEvent(itemId: number): string[];
export function getXp(): number;
export function getMaxXp(): number;
export function getIsNewGame(): boolean;
export function getIsGameCompleted(): boolean;
```

---

## `frontend/src/utils/game/inventoryManager.ts`

**New module** (from storyCore.js)

```typescript
import type { StoryItem, RoomInventory } from '../../types/game';

export function getItemById(id: number): StoryItem | undefined;
export function getItemByName(name: string): StoryItem | undefined;
export function getWeightOfUserInventory(): number;
export function canTakeItem(itemId: number): { allowed: boolean; reason?: string };
export function getRoomInventory(roomId: string): RoomInventory;
export function getItemIsLocked(itemId: number): boolean;
export function useItem(itemId: number): string[];
```

---

## `frontend/src/utils/game/roomNavigator.ts`

**New module** (from storyCore.js)

```typescript
import type { Room, ExitDirection } from '../../types/game';

export function getCurrentRoom(): Room;
export function getCurrentRoomId(): string;
export function getCurrentRoomDescription(): string[];
export function getFullRoomDescription(): string[];
export function getExitDescriptions(): string[];
export function getIsExitUnlocked(direction: ExitDirection): boolean;
export function isValidDirection(direction: string): direction is ExitDirection;
export function handlePositionChange(direction: ExitDirection): string[];
export function whereAmI(): string[];
export function getIsRoomInSpace(roomId: string): boolean;
```

---

## `frontend/src/utils/game/flashlightManager.ts`

**New module** (from storyCore.js)

```typescript
export function hasFlashlight(): boolean;
export function turnOffFlashlight(): void;
export function useFlashlight(): string[];
export function getUserCanSeeInTheDark(): boolean;
export function getIsFlashlightWorking(): boolean;
```

---

## `frontend/src/routes/shared/galleryNavigator.ts`

**New module** (shared by CmdViewer, CmdShop)

```typescript
import type { AppEnvironment } from '../../types/terminal';

// GalleryImage, ShopImage, GalleryConfig are defined and exported from this file
// (per data-model.md §5 and tasks.md T010 — these are route-layer types, NOT in types/terminal.ts)
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

export function createGalleryEnvironment<T extends GalleryImage>(
  config: GalleryConfig<T>
): AppEnvironment;
```

---

## `frontend/src/routes/shared/showItemContent.ts`

**New module** (shared by CmdCat, CmdLess)

```typescript
/** Returns display lines for a file-system item lookup (used by both cat and less) */
export function showItemContent(args: string[] | null): string[];
```
