import { useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';

import environmentHelpers from '../utils/environment-helpers';
import persistence from '../utils/persistence';
import type { InputProcessor } from '../types/terminal';

const ESC_TEXT = Object.freeze(['', 'ESC to quit']);
const SETTINGS_COMMAND_REGISTRY = Object.freeze(['username', 'fontsize', 'graphicsmode', 'qualitypreset']);

export default function CmdSettings() {
    const inputProcessor = useOutletContext<InputProcessor>();

    // Keep a fresh ref so scope methods always read the latest state/methods.
    const inputProcessorRef = useRef<InputProcessor | null>(null);
    inputProcessorRef.current = inputProcessor;

    useEffect(() => {
        function commonProcesses(
            argValue: string | undefined,
            hideEscText: boolean | undefined,
            functionName: string,
            appResponse: string[],
            persistenceSet: keyof typeof persistence,
            validSet: string[]
        ) {
            const newValue = argValue;
            const escTextLines = hideEscText ? [] : [...ESC_TEXT];
            const jumpIn = inputProcessorRef.current!.state.currentCommand === `settings ${functionName}`;

            // isBlank equivalent: null/undefined or empty-after-trim
            const isBlank = (x: string | undefined | null) => x == null || String(x).trim() === '';

            if (jumpIn || isBlank(newValue) ||
                (validSet.length && !validSet.includes(newValue!))) {
                inputProcessorRef.current!.handleFunctionFromApp(appResponse.concat(escTextLines));
                return;
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic method dispatch on persistence
            (persistence as any)[persistenceSet](newValue);
            inputProcessorRef.current!.handleFunctionFromApp(
                [`${functionName} changed to ${newValue}.`].concat(escTextLines)
            );
        }

        const scope = {
            settingsCommandRegistry: SETTINGS_COMMAND_REGISTRY,

            username(args: string[] = [], hideEscText?: boolean) {
                const appResponse = [
                    `Current username: ${persistence.getUsername()}`,
                    '',
                    `enter second parameter to set username - e.g.: 'username HAL9000'`
                ];
                commonProcesses(args[0], hideEscText, 'username', appResponse, 'setUsername', []);
            },

            fontsize(args: string[] = [], hideEscText?: boolean) {
                const appResponse = [
                    `Current fontsize: ${persistence.getFontSize()}`,
                    '',
                    `enter s, m, or l as second parameter to set fontsize - e.g.: 'fontsize s'`
                ];
                commonProcesses(args[0], hideEscText, 'fontsize', appResponse, 'setFontSize', ['s', 'm', 'l']);
            },

            graphicsmode(args: string[] = [], hideEscText?: boolean) {
                const appResponse = [
                    `Graphics mode is currently: ${persistence.getGraphicsMode()}`,
                    '',
                    `enter 'hi' or 'lo' as second parameter to toggle graphics - e.g.: 'graphicsmode hi'`,
                    'beware, hi graphicsmode can be processor intensive.'
                ];
                commonProcesses(args[0], hideEscText, 'graphicsmode', appResponse, 'setGraphicsMode', ['hi', 'lo']);
            },

            qualitypreset(args: string[] = [], hideEscText?: boolean) {
                const appResponse = [
                    `Current quality preset: ${persistence.getQualityPreset()}`,
                    '',
                    `Available options: high / normal / low`,
                    `enter one as second parameter to set - e.g.: 'qualitypreset high'`
                ];
                const preset = args[0];
                const validPresets = ['high', 'normal', 'low'];
                const isBlank = (x: string | undefined | null) => x == null || String(x).trim() === '';
                const jumpIn = inputProcessorRef.current!.state.currentCommand === 'settings qualitypreset';
                const isValid = !jumpIn && !isBlank(preset) && validPresets.includes(preset);
                commonProcesses(preset, hideEscText, 'qualitypreset', appResponse, 'setQualityPreset', validPresets);
                if (isValid) {
                    // Best-effort API sync — localStorage is source of truth; failure is non-critical
                    fetch('/api/preferences', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            username: persistence.getUsername(),
                            qualityPreset: preset
                        })
                    }).catch(() => {});
                }
            },

            commandComplete(fragment: string, s: { settingsCommandRegistry: readonly string[] }) {
                return environmentHelpers.handleTabComplete(fragment, [[...s.settingsCommandRegistry]]);
            }
        };

        // Handle overflow arguments — user typed e.g. "settings fontsize l" at base prompt
        const currentArgs = inputProcessor.state.currentArgs;
        if (currentArgs.length > 0) {
            const overflowCommand = currentArgs[0] as keyof typeof scope;
            if (SETTINGS_COMMAND_REGISTRY.includes(overflowCommand as string)) {
                const overflowArg = currentArgs[1];
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic dispatch
                (scope as any)[overflowCommand]([overflowArg], true);
                inputProcessor.quit();
                return;
            }
        }

        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: 'cmd-settings',
            displayAppNameInPrompt: true,
            interruptPrompt: true,
            overrideScope: scope,
            response: [
                'Available settings:',
                '  username',
                '  fontsize',
                '  graphicsmode',
                '  qualitypreset',
                ...ESC_TEXT
            ]
        });

        inputProcessor.setAppEnvironment(appEnvironment);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}
