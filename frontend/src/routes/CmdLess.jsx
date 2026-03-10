import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

import commandRegistry from '../constants/command-registry';
import environmentHelpers from '../utils/environment-helpers';

function showItemContent(currentArgs) {
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

    return matchedItem != null ? matchedItem.content : [`${itemArg}: No such file or directory`];
}

export default function CmdLess() {
    const inputProcessor = useOutletContext();

    useEffect(() => {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: 'cmd-less',
            response: showItemContent(inputProcessor.state.currentArgs)
        });

        inputProcessor.setAppEnvironment(appEnvironment);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}
