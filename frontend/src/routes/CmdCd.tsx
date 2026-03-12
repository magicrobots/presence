import commandRegistry from '../constants/command-registry';
import environmentHelpers from '../utils/environment-helpers';
import { useRouteInit } from './shared/useRouteInit';

function getCdResponse(rawUserEntry: string): string | undefined {
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
    useRouteInit((ip) => {
        const cdResponse = getCdResponse(ip.state.rawUserEntry);
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: 'cmd-cd',
            response: cdResponse != null ? [cdResponse] : []
        });

        ip.setAppEnvironment(appEnvironment);
    });

    return null;
}
