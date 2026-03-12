// frontend/src/types/terminal.ts
import type React from 'react';

/** Config object passed to inputProcessor.setAppEnvironment() by route commands */
export interface AppEnvironment {
  activeAppName: string;
  response: string[];
  displayAppNameInPrompt?: boolean;
  interruptPrompt?: boolean;
  keyOverrides?: Record<string, () => void>;
  overrideScope?: Record<string, unknown>;
  bgImage?: string;
  appContext?: string;
}

/** Shape of the state slice exposed by useInputProcessor, accessible in route commands */
export interface InputProcessorState {
  currentCommand: string;
  currentArgs: string[];
  rawUserEntry: string;
  maxCharsPerLine: number;
  activeApp: string | undefined;
  bgImage: string | undefined;
  commandHistory: string[];
  promptTimestamp: string;
  isPromptCursorVisible: boolean;
  cursorPosition: number;
  currCommandIndex: number;
  previousExecutionBlocks: unknown[];
  forceDisplayCursor: boolean;
  displayAppNameInPrompt: boolean | undefined;
  interruptPrompt: boolean | undefined;
  keyOverrides: Record<string, () => void> | undefined;
  overrideScope: Record<string, unknown> | undefined;
  appContext: string | null;
}

/** Public API returned by useInputProcessor and passed via Outlet context to route commands */
export interface InputProcessor {
  state: InputProcessorState;
  promptLine1: string;
  promptLine2: string;
  currExecutionBlock: string[];
  allDisplayLines: string[];
  bgImageCallbackRef: React.MutableRefObject<((img: string | null) => void) | null>;
  processKey: (keyEvent: { key: string; preventDefault: () => void }) => void;
  handleScreenInput: (input: string) => void;
  handleEsc: () => void;
  handleDirection: (dir: string) => void;
  callArrow: (dir: string) => void;
  getOlderCommand: () => string;
  getNewerCommand: () => string;
  setAppEnvironment: (env: AppEnvironment) => void;
  quit: () => void;
  clear: () => void;
  handleFunctionFromApp: (response: string[]) => void;
  overrideArgs: (newArgs: string[]) => void;
  setBgImage: (imgPath: string | null) => void;
  getAppVersion: () => string;
  setMaxCharsPerLine: (n: number) => void;
}
