/**
 * text-layout.ts — Variable text resolution utility.
 *
 * Resolves "variable text" values used throughout story-rooms and story-items:
 * text that may differ based on player state (inventory, light conditions).
 *
 * This module is the single canonical location for this logic (extracted from
 * storyCore.js during the 004-tech-debt-refactor).
 */

import persistence from './persistence';

/** Text that varies based on whether the player holds the translator item (ID 12). */
export interface TranslatedText {
    unknown: string;
    translated: string;
}

/** Text that varies based on whether the player can see in the dark. */
export interface DarkSensitiveText {
    dark: string;
    illuminated: string;
}

/**
 * Union of all variable-text shapes used in story data.
 * A VariableText value resolves to a plain string at render time.
 */
export type VariableText = string | TranslatedText | DarkSensitiveText;

/**
 * Returns true if the player can currently see in dark rooms.
 * Requires: flashlight in inventory, flashlight switched on, battery > 0.
 *
 * Note: flashlight item ID (7) and translator item ID (12) are game constants
 * inlined here until flashlightManager.ts is extracted in T037.
 */
function _getUserCanSeeInTheDark(): boolean {
    const FLASHLIGHT_ITEM_ID = 7;
    const inventoryItems: number[] = persistence.getStoryInventoryItems();
    const hasFlashlight = inventoryItems.includes(FLASHLIGHT_ITEM_ID);
    if (!hasFlashlight) return false;

    const flashlightStatus = persistence.getFlashlightStatus() as { isOn: boolean; batteryLevel: number } | null;
    if (flashlightStatus == null) return false;

    return flashlightStatus.isOn && flashlightStatus.batteryLevel > 0;
}

/**
 * Resolves a VariableText value to a plain string based on current player state.
 *
 * - TranslatedText: returns `translated` if player holds the translator (item 12),
 *   otherwise `unknown`.
 * - DarkSensitiveText: returns `illuminated` if player can see in the dark,
 *   otherwise `dark`.
 * - string: returned as-is.
 */
export function processVariableText(text: VariableText): string {
    const TRANSLATOR_ITEM_ID = 12;

    if (typeof text === 'object' && 'translated' in text) {
        const inventoryItems: number[] = persistence.getStoryInventoryItems();
        return inventoryItems.includes(TRANSLATOR_ITEM_ID)
            ? text.translated
            : text.unknown;
    }

    if (typeof text === 'object' && 'dark' in text) {
        return _getUserCanSeeInTheDark() ? text.illuminated : text.dark;
    }

    return text;
}
