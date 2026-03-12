import environmentHelpers from '../utils/environment-helpers';
import persistence from '../utils/persistence';
import { useRouteInit } from './shared/useRouteInit';

export default function CmdHello() {
    useRouteInit((ip) => {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: 'cmd-hello',
            response: [`Hello ${persistence.getUsername() ?? ''}`]
        });

        ip.setAppEnvironment(appEnvironment);
    });

    return null;
}
