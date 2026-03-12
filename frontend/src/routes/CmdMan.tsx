import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

import commandRegistry from '../constants/command-registry';
import environmentHelpers from '../utils/environment-helpers';
import type { InputProcessor } from '../types/terminal';

function getResponse(currentArgs: string[] | null): string[] {
    if (currentArgs != null && currentArgs.length > 0) {
        const helpAppName = currentArgs[0];
        const matchedCommand = commandRegistry.getMatchingCommand(helpAppName);

        if (matchedCommand != null) {
            let response = [`${helpAppName}: ${matchedCommand.helpText}`];

            if (matchedCommand.usage != null) {
                response = response.concat([` usage: ${matchedCommand.usage}`]);
            }

            return response;
        } else {
            return [`  ERROR: no help file found for ${helpAppName.toUpperCase()}`];
        }
    }

    return [
        'MAN (Manual):',
        '  Enter the LS command to view a list of available commands.',
        '  For manual on a specific command, enter \'man \' followed by the command name.',
        '  To quit any running application hit the ESC key to return to command prompt.'
    ];
}

export default function CmdMan() {
    const inputProcessor = useOutletContext<InputProcessor>();

    useEffect(() => {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: 'cmd-man',
            response: getResponse(inputProcessor.state.currentArgs)
        });

        inputProcessor.setAppEnvironment(appEnvironment);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}
