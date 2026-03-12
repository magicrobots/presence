import environmentHelpers from '../utils/environment-helpers';
import { useRouteInit } from './shared/useRouteInit';

export default function CmdAbout() {
    useRouteInit((ip) => {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: 'cmd-about',
            response: [
                `Welcome to Faux OS ${ip.getAppVersion()} ©1996`,
                '',
                'You are connected to an updated Univac Mainframe running a preproduction IBM developed build of Linux.',
                'This is an expanded VT102 terminal, color feature added retroactively in 1992 via updated protocol standards and millimeter-wave modification of internal CRT.'
            ]
        });

        ip.setAppEnvironment(appEnvironment);
    });

    return null;
}
