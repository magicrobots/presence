import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

import environmentHelpers from '../utils/environment-helpers';
import persistence from '../utils/persistence';
import type { InputProcessor } from '../types/terminal';

// Ember's @ember/string dasherize: trim, lowercase, replace underscores/spaces with dashes
function dasherize(str: string): string {
    return str.trim().toLowerCase().replace(/[_\s]+/g, '-');
}

export default function CmdPwd() {
    const inputProcessor = useOutletContext<InputProcessor>();

    useEffect(() => {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: 'cmd-pwd',
            response: [`/home/${dasherize(persistence.getUsername() ?? 'user')}/`]
        });

        inputProcessor.setAppEnvironment(appEnvironment);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}
