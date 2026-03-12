import environmentHelpers from '../utils/environment-helpers';
import { showItemContent } from './shared/showItemContent';
import { useRouteInit } from './shared/useRouteInit';

export default function CmdCat() {
    useRouteInit((ip) => {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: 'cmd-cat',
            response: showItemContent(ip.state.currentArgs)
        });

        ip.setAppEnvironment(appEnvironment);
    });

    return null;
}
