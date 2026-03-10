import { useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';

import environmentHelpers from '../utils/environment-helpers';
import persistence from '../hooks/usePersistence';

const ESC_TEXT = Object.freeze(['', 'ESC to quit']);
const SETTINGS_COMMAND_REGISTRY = Object.freeze(['username', 'fontsize', 'graphicsmode']);

export default function CmdSettings() {
    const inputProcessor = useOutletContext();

    // Keep a fresh ref so scope methods always read the latest state/methods.
    const inputProcessorRef = useRef(null);
    inputProcessorRef.current = inputProcessor;

    useEffect(() => {
        function commonProcesses(argValue, hideEscText, functionName, appResponse, persistenceSet, validSet) {
            const newValue = argValue;
            const escTextLines = hideEscText ? [] : [...ESC_TEXT];
            const jumpIn = inputProcessorRef.current.state.currentCommand === `settings ${functionName}`;

            // isBlank equivalent: null/undefined or empty-after-trim
            const isBlank = (x) => x == null || String(x).trim() === '';

            if (jumpIn || isBlank(newValue) ||
                (validSet.length && !validSet.includes(newValue))) {
                inputProcessorRef.current.handleFunctionFromApp(appResponse.concat(escTextLines));
                return;
            }

            persistence[persistenceSet](newValue);
            inputProcessorRef.current.handleFunctionFromApp(
                [`${functionName} changed to ${newValue}.`].concat(escTextLines)
            );
        }

        const scope = {
            settingsCommandRegistry: SETTINGS_COMMAND_REGISTRY,

            username(args = [], hideEscText) {
                const appResponse = [
                    `Current username: ${persistence.getUsername()}`,
                    '',
                    `enter second parameter to set username - e.g.: 'username HAL9000'`
                ];
                commonProcesses(args[0], hideEscText, 'username', appResponse, 'setUsername', []);
            },

            fontsize(args = [], hideEscText) {
                const appResponse = [
                    `Current fontsize: ${persistence.getFontSize()}`,
                    '',
                    `enter s, m, or l as second parameter to set fontsize - e.g.: 'fontsize s'`
                ];
                commonProcesses(args[0], hideEscText, 'fontsize', appResponse, 'setFontSize', ['s', 'm', 'l']);
            },

            graphicsmode(args = [], hideEscText) {
                const appResponse = [
                    `Graphics mode is currently: ${persistence.getGraphicsMode()}`,
                    '',
                    `enter 'hi' or 'lo' as second parameter to toggle graphics - e.g.: 'graphicsmode hi'`,
                    'beware, hi graphicsmode can be processor intensive.'
                ];
                commonProcesses(args[0], hideEscText, 'graphicsmode', appResponse, 'setGraphicsMode', ['hi', 'lo']);
            },

            commandComplete(fragment, s) {
                return environmentHelpers.handleTabComplete(fragment, [s.settingsCommandRegistry]);
            }
        };

        // Handle overflow arguments — user typed e.g. "settings fontsize l" at base prompt
        const currentArgs = inputProcessor.state.currentArgs;
        if (currentArgs.length > 0) {
            const overflowCommand = currentArgs[0];
            if (SETTINGS_COMMAND_REGISTRY.includes(overflowCommand)) {
                const overflowArg = currentArgs[1];
                scope[overflowCommand]([overflowArg], true);
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
                ...ESC_TEXT
            ]
        });

        inputProcessor.setAppEnvironment(appEnvironment);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}
