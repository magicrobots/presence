/**
 * flashlightManager.ts — Flashlight state query and mutation logic.
 *
 * Extracted from storyCore.js as part of the US3 decomposition.
 * Covers: flashlight possession check, on/off toggling, battery drain,
 * darkness visibility, and working-state detection.
 * All persistence I/O goes through persistence.ts named exports.
 */

import type { FlashlightState } from '../../types/game';
import * as persistence from '../persistence';

// Flashlight item ID — item #7 in story-items is the flashlight.
const FLASHLIGHT_ITEM_ID = 7;

// --------------------------------------------------------------------------
// Private helpers
// --------------------------------------------------------------------------

function _getFlashlightStatus(): FlashlightState {
  // getFlashlightStatus returns null when the key is absent (uninitialized game).
  // Fall back to a safe default: off, full battery.
  return persistence.getFlashlightStatus() ?? { isOn: false, batteryLevel: 0 };
}

function _getFlashlightDyingMessage(): string | undefined {
  switch (_getFlashlightStatus().batteryLevel) {
    case 3:
      return 'The light coming from the flashlight appears to get dimmer. Might just be your imagination.';
    case 2:
      return 'The flashlight flickers off. You smash the back of it with your hand and it comes back on, but now it\'s much dimmer.';
    case 1:
      return 'The flashlight blinks on and off. You shake it. The dim beam steadies as the batteries rattle inside.';
    case 0:
      return 'With an almost silent click, the flashlight goes off. Nothing you do can turn it back on.';
    default:
      return undefined;
  }
}

// --------------------------------------------------------------------------
// Public exports
// --------------------------------------------------------------------------

/**
 * Return true if the player currently has the flashlight in their inventory.
 * Equivalent to storyCore.hasFlashlight().
 */
export function hasFlashlight(): boolean {
  return persistence.getStoryInventoryItems().includes(FLASHLIGHT_ITEM_ID);
}

/**
 * Force the flashlight off (e.g. on room entry / death reset).
 * Does not alter the battery level.
 * Equivalent to storyCore.turnOffFlashlight().
 */
export function turnOffFlashlight(): void {
  const currStatus = _getFlashlightStatus();
  persistence.setFlashlightStatus({
    isOn: false,
    batteryLevel: currStatus.batteryLevel,
  });
}

/**
 * Toggle (or set) the flashlight power and return display lines.
 *
 * Accepts an optional args array that may contain 'on' or 'off' to force a
 * specific power state rather than toggling. Mirrors the _useFlashlight()
 * helper in storyCore.js; callers that need to append a room description
 * should do so after inspecting getUserCanSeeInTheDark().
 *
 * Equivalent to storyCore._useFlashlight() promoted to a public export.
 */
export function useFlashlight(currentArgs?: string[]): string[] {
  if (!hasFlashlight()) {
    return ["You don't have a flashlight."];
  }

  if (!getIsFlashlightWorking()) {
    return [
      "You click the flashlight's button, but nothing happens. The batteries must be dead. You don't like this. You click it again just in case. Nothing.",
    ];
  }

  const currStatus = _getFlashlightStatus();
  let newPowerSetting = !currStatus.isOn;

  if (currentArgs && currentArgs.length > 1) {
    if (currentArgs.includes('on')) {
      if (currStatus.isOn) {
        return ['The flashlight is already on.'];
      }
      newPowerSetting = true;
    } else if (currentArgs.includes('off')) {
      if (!currStatus.isOn) {
        return ['The flashlight is already off.'];
      }
      newPowerSetting = false;
    }
  }

  persistence.setFlashlightStatus({
    isOn: newPowerSetting,
    batteryLevel: currStatus.batteryLevel,
  });

  return ['You click the rubber domed power button on the flashlight.'];
}

/**
 * Return true if the player can see in dark rooms — requires the flashlight
 * to be possessed, switched on, and have remaining battery.
 * Equivalent to storyCore._getUserCanSeeInTheDark().
 */
export function getUserCanSeeInTheDark(): boolean {
  const status = _getFlashlightStatus();
  return hasFlashlight() && status.isOn && getIsFlashlightWorking();
}

/**
 * Return true if the flashlight has remaining battery charge (batteryLevel > 0).
 * Equivalent to storyCore._getIsFlashlightWorking().
 */
export function getIsFlashlightWorking(): boolean {
  return _getFlashlightStatus().batteryLevel > 0;
}

/**
 * Drain one unit of flashlight battery (called on each room entry when the
 * flashlight is on). Appends a low-battery warning line when the level
 * crosses a threshold. Returns any warning messages, or an empty array.
 *
 * Extracted from storyCore._handleFlashlightBatteryDrain(); kept internal to
 * this module and exposed here because roomNavigator.ts calls it on movement.
 */
export function drainFlashlightBattery(): string[] {
  const lightStatus = _getFlashlightStatus();

  if (!lightStatus.isOn) {
    return [];
  }

  persistence.setFlashlightStatus({
    isOn: lightStatus.isOn,
    batteryLevel: lightStatus.batteryLevel - 1,
  });

  const dyingMessage = _getFlashlightDyingMessage();
  return dyingMessage != null ? [dyingMessage] : [];
}
