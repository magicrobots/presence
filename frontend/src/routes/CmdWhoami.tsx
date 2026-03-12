import environmentHelpers from '../utils/environment-helpers';
import persistence from '../utils/persistence';
import { useRouteInit } from './shared/useRouteInit';

export default function CmdWhoami() {
    useRouteInit((ip) => {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: 'cmd-whoami',
            response: [persistence.getUsername() ?? '']
        });

        ip.setAppEnvironment(appEnvironment);
    });

    return null;
}
