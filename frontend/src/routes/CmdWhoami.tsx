import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

import environmentHelpers from '../utils/environment-helpers';
import persistence from '../utils/persistence';
import type { InputProcessor } from '../types/terminal';

export default function CmdWhoami() {
    const inputProcessor = useOutletContext<InputProcessor>();

    useEffect(() => {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: 'cmd-whoami',
            response: [persistence.getUsername() ?? '']
        });

        inputProcessor.setAppEnvironment(appEnvironment);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}
