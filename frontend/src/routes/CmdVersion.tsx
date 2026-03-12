import environmentHelpers from '../utils/environment-helpers';
import { useRouteInit } from './shared/useRouteInit';

export default function CmdVersion() {
    useRouteInit((ip) => {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: 'cmd-version',
            response: [`${ip.getAppVersion()}`]
        });

        ip.setAppEnvironment(appEnvironment);
    });

    return null;
}
