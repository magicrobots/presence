import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

import environmentHelpers from '../utils/environment-helpers';

export default function CmdVersion() {
    const inputProcessor = useOutletContext();

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
