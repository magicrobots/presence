import environmentHelpers from '../utils/environment-helpers';
import { showItemContent } from './shared/showItemContent';
import { useRouteInit } from './shared/useRouteInit';

export default function CmdLess() {
    useRouteInit((ip) => {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: 'cmd-less',
            response: showItemContent(ip.state.currentArgs)
        });

        ip.setAppEnvironment(appEnvironment);
    });

    return null;
}
