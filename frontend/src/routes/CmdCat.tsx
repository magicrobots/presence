import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

import commandRegistry from '../constants/command-registry';
import environmentHelpers from '../utils/environment-helpers';
import type { InputProcessor } from '../types/terminal';

// Identical logic to cmd-less (cat and less both show file content in this OS)
function showItemContent(currentArgs: string[] | null): string[] {
    const itemArg = currentArgs != null ? currentArgs[0] : null;

    if (itemArg == null) {
        return ['Missing filename'];
    }

    const matchedItem = commandRegistry.registry.find(r => r.commandName === itemArg);

    if (matchedItem == null) {
        return [`${itemArg}: No such file or directory`];
    }

    if (matchedItem.isDir) {
        return [`${itemArg} is a directory`];
    }

    if (matchedItem.isExec) {
        return [`${itemArg} is an executable`];
    }

    return matchedItem.content ?? [`${itemArg}: No such file or directory`];
}

export default function CmdCat() {
    const inputProcessor = useOutletContext<InputProcessor>();

    useEffect(() => {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: 'cmd-cat',
            response: showItemContent(inputProcessor.state.currentArgs)
        });

        inputProcessor.setAppEnvironment(appEnvironment);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}
