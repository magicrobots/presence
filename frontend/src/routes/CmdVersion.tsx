import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

import environmentHelpers from '../utils/environment-helpers';
import type { InputProcessor } from '../types/terminal';

export default function CmdVersion() {
    const inputProcessor = useOutletContext<InputProcessor>();

    useEffect(() => {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: 'cmd-version',
            response: [`${inputProcessor.getAppVersion()}`]
        });

        inputProcessor.setAppEnvironment(appEnvironment);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}
