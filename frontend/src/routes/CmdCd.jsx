import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

import commandRegistry from '../constants/command-registry';
import environmentHelpers from '../utils/environment-helpers';

function getCdResponse(rawUserEntry) {
    const rawInputArgs = rawUserEntry.split(' ')[1];
    let cdTarget = rawInputArgs;

    // cd into current directory is noop
    if (!cdTarget || cdTarget === '.' || cdTarget === './') {
        return undefined;
    }

    // remove trailing slash if it's on there
    if (cdTarget.charAt(cdTarget.length - 1) === '/') {
        cdTarget = cdTarget.substr(0, cdTarget.length - 1);
    }

    const responseDenied = `cd: ${cdTarget}/ ACCESS DENIED`;

    // deny access if they're trying to CD to root or home
    if (cdTarget.charAt(0) === '/' || cdTarget.charAt(0) === '~' || rawInputArgs === '/') {
        return responseDenied;
    }

    const matchedCmdDef = commandRegistry.registry.find(r => r.commandName === cdTarget);

    if (matchedCmdDef) {
        if (matchedCmdDef.isDir) {
            return responseDenied;
        }
        return `cd: ${cdTarget}: Not a directory`;
    } else {
        return `cd: ${cdTarget} No such file or directory`;
    }
}

export default function CmdCd() {
    const inputProcessor = useOutletContext();

    useEffect(() => {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: 'cmd-cd',
            response: [getCdResponse(inputProcessor.state.rawUserEntry)]
        });

        inputProcessor.setAppEnvironment(appEnvironment);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}
