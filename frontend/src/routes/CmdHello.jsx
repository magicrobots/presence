import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

import environmentHelpers from '../utils/environment-helpers';
import persistence from '../utils/persistence';

export default function CmdHello() {
    const inputProcessor = useOutletContext();

    useEffect(() => {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: 'cmd-hello',
            response: [`Hello ${persistence.getUsername()}`]
        });

        inputProcessor.setAppEnvironment(appEnvironment);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}
