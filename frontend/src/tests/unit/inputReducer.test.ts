import { describe, it, expect } from 'vitest';
import { inputReducer, initialInputState } from '../../reducers/inputReducer';
import type { InputState } from '../../reducers/inputReducer';

describe('inputReducer', () => {
  describe('SET_FIELDS', () => {
    it('merges partial fields into state', () => {
      const result = inputReducer(initialInputState, {
        type: 'SET_FIELDS',
        payload: { currentCommand: 'ls', rawUserEntry: 'ls' },
      });
      expect(result.currentCommand).toBe('ls');
      expect(result.rawUserEntry).toBe('ls');
    });

    it('preserves unchanged fields', () => {
      const state: InputState = {
        ...initialInputState,
        commandHistory: ['help', 'ls'],
        cursorPosition: 5,
      };
      const result = inputReducer(state, {
        type: 'SET_FIELDS',
        payload: { currentCommand: 'pwd' },
      });
      expect(result.commandHistory).toEqual(['help', 'ls']);
      expect(result.cursorPosition).toBe(5);
      expect(result.currentCommand).toBe('pwd');
    });

    it('allows setting activeApp', () => {
      const result = inputReducer(initialInputState, {
        type: 'SET_FIELDS',
        payload: { activeApp: 'viewer' },
      });
      expect(result.activeApp).toBe('viewer');
    });

    it('allows setting appResponse to an array of strings', () => {
      const result = inputReducer(initialInputState, {
        type: 'SET_FIELDS',
        payload: { appResponse: ['output line 1', 'output line 2'] },
      });
      expect(result.appResponse).toEqual(['output line 1', 'output line 2']);
    });
  });

  describe('SET_CURSOR', () => {
    it('sets cursorPosition to the given value', () => {
      const result = inputReducer(initialInputState, {
        type: 'SET_CURSOR',
        payload: 7,
      });
      expect(result.cursorPosition).toBe(7);
    });

    it('sets cursorPosition to 0', () => {
      const state: InputState = { ...initialInputState, cursorPosition: 12 };
      const result = inputReducer(state, { type: 'SET_CURSOR', payload: 0 });
      expect(result.cursorPosition).toBe(0);
    });

    it('preserves all other fields', () => {
      const state: InputState = {
        ...initialInputState,
        currentCommand: 'cd',
        commandHistory: ['ls'],
      };
      const result = inputReducer(state, { type: 'SET_CURSOR', payload: 2 });
      expect(result.currentCommand).toBe('cd');
      expect(result.commandHistory).toEqual(['ls']);
    });
  });

  describe('PUSH_HISTORY', () => {
    it('prepends a new entry to commandHistory', () => {
      const state: InputState = {
        ...initialInputState,
        commandHistory: ['ls', 'help'],
      };
      const result = inputReducer(state, { type: 'PUSH_HISTORY', payload: 'cd /' });
      expect(result.commandHistory[0]).toBe('cd /');
      expect(result.commandHistory).toEqual(['cd /', 'ls', 'help']);
    });

    it('resets currCommandIndex to -1', () => {
      const state: InputState = { ...initialInputState, currCommandIndex: 2 };
      const result = inputReducer(state, { type: 'PUSH_HISTORY', payload: 'pwd' });
      expect(result.currCommandIndex).toBe(-1);
    });

    it('skips duplicate consecutive entry', () => {
      const state: InputState = {
        ...initialInputState,
        commandHistory: ['ls', 'help'],
      };
      const result = inputReducer(state, { type: 'PUSH_HISTORY', payload: 'ls' });
      // 'ls' is already at index 0 — should not duplicate
      expect(result.commandHistory).toEqual(['ls', 'help']);
    });

    it('allows the same entry if it is not at the top', () => {
      const state: InputState = {
        ...initialInputState,
        commandHistory: ['help', 'ls'],
      };
      const result = inputReducer(state, { type: 'PUSH_HISTORY', payload: 'ls' });
      expect(result.commandHistory[0]).toBe('ls');
      expect(result.commandHistory).toEqual(['ls', 'help', 'ls']);
    });

    it('works on an empty commandHistory', () => {
      const result = inputReducer(initialInputState, { type: 'PUSH_HISTORY', payload: 'help' });
      expect(result.commandHistory).toEqual(['help']);
    });
  });

  describe('CLEAR', () => {
    it('resets input-related fields to empty defaults', () => {
      const state: InputState = {
        ...initialInputState,
        currentCommand: 'look',
        currentArgs: ['around'],
        rawUserEntry: 'look around',
        cursorPosition: 11,
        currCommandIndex: 3,
      };
      const result = inputReducer(state, { type: 'CLEAR' });
      expect(result.currentCommand).toBe('');
      expect(result.currentArgs).toEqual([]);
      expect(result.rawUserEntry).toBe('');
      expect(result.cursorPosition).toBe(0);
      expect(result.currCommandIndex).toBe(-1);
    });

    it('preserves commandHistory after CLEAR', () => {
      const state: InputState = {
        ...initialInputState,
        commandHistory: ['help', 'ls'],
        currentCommand: 'cd',
      };
      const result = inputReducer(state, { type: 'CLEAR' });
      expect(result.commandHistory).toEqual(['help', 'ls']);
    });

    it('preserves activeApp after CLEAR', () => {
      const state: InputState = { ...initialInputState, activeApp: 'shop' };
      const result = inputReducer(state, { type: 'CLEAR' });
      expect(result.activeApp).toBe('shop');
    });
  });

  describe('RESET', () => {
    it('returns a fresh state matching initialInputState shape', () => {
      const state: InputState = {
        ...initialInputState,
        currentCommand: 'cd',
        commandHistory: ['ls', 'help'],
        activeApp: 'viewer',
        cursorPosition: 5,
      };
      const result = inputReducer(state, { type: 'RESET' });
      expect(result.currentCommand).toBe('');
      expect(result.commandHistory).toEqual([]);
      expect(result.activeApp).toBeUndefined();
      expect(result.cursorPosition).toBe(0);
    });

    it('generates a fresh promptTimestamp on RESET', () => {
      const result1 = inputReducer(initialInputState, { type: 'RESET' });
      // promptTimestamp is a string derived from Date.now()
      expect(typeof result1.promptTimestamp).toBe('string');
      expect(result1.promptTimestamp.length).toBeGreaterThan(0);
    });

    it('resets appResponse to empty array', () => {
      const state: InputState = {
        ...initialInputState,
        appResponse: ['some', 'output'],
      };
      const result = inputReducer(state, { type: 'RESET' });
      expect(result.appResponse).toEqual([]);
    });
  });

  describe('unknown action', () => {
    it('returns state unchanged for an unrecognized action type', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = inputReducer(initialInputState, { type: 'UNKNOWN_ACTION' } as any);
      expect(result).toEqual(initialInputState);
    });
  });
});
