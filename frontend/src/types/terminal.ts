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
