// InputState and InputAction are defined in this file (see data-model.md §2).
// They are NOT imported from types/terminal.ts — that file defines only AppEnvironment.

export interface InputState {
  // Command input
  currentCommand: string;
  currentArgs: string[];
  rawUserEntry: string;
  cursorPosition: number;

  // Execution history
  commandHistory: string[];
  currCommandIndex: number; // -1 = live input; 0+ = history position
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

export const initialInputState: InputState = {
  currentCommand: '',
  currentArgs: [],
  rawUserEntry: '',
  cursorPosition: 0,
  commandHistory: [],
  currCommandIndex: -1,
  previousExecutionBlocks: [],
  promptTimestamp: new Date().getTime().toString().substring(5),
  isPromptCursorVisible: true,
  forceDisplayCursor: false,
  activeApp: undefined,
  displayAppNameInPrompt: undefined,
  interruptPrompt: undefined,
  appResponse: [],
  appContext: null,
  keyOverrides: undefined,
  overrideScope: undefined,
  maxCharsPerLine: 60,
  bgImage: undefined,
};

/** Pure reducer — no side effects, no imports of React */
export function inputReducer(state: InputState, action: InputAction): InputState {
  switch (action.type) {
    case 'SET_FIELDS':
      return { ...state, ...action.payload };

    case 'SET_CURSOR':
      return { ...state, cursorPosition: action.payload };

    case 'PUSH_HISTORY': {
      const entry = action.payload;
      // Avoid consecutive duplicate entries
      const alreadyTop = state.commandHistory[0] === entry;
      const newHistory = alreadyTop ? state.commandHistory : [entry, ...state.commandHistory];
      return {
        ...state,
        commandHistory: newHistory,
        currCommandIndex: -1,
      };
    }

    case 'CLEAR':
      return {
        ...state,
        currentCommand: '',
        currentArgs: [],
        rawUserEntry: '',
        cursorPosition: 0,
        currCommandIndex: -1,
      };

    case 'RESET':
      return { ...initialInputState, promptTimestamp: new Date().getTime().toString().substring(5) };

    default:
      return state;
  }
}
