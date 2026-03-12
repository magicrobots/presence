import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

import environmentHelpers from '../utils/environment-helpers';
import type { InputProcessor } from '../types/terminal';

export default function CmdAbout() {
    const inputProcessor = useOutletContext<InputProcessor>();

    useEffect(() => {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: 'cmd-about',
            response: [
                `Welcome to Faux OS ${inputProcessor.getAppVersion()} ©1996`,
                '',
                'You are connected to an updated Univac Mainframe running a preproduction IBM developed build of Linux.',
                'This is an expanded VT102 terminal, color feature added retroactively in 1992 via updated protocol standards and millimeter-wave modification of internal CRT.'
            ]
        });

        inputProcessor.setAppEnvironment(appEnvironment);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}
