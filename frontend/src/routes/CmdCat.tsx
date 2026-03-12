import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

import environmentHelpers from '../utils/environment-helpers';
import { showItemContent } from './shared/showItemContent';
import type { InputProcessor } from '../types/terminal';

export default function CmdCat() {
    const inputProcessor = useOutletContext<InputProcessor>();

    useEffect(() => {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: 'cmd-cat',
            response: showItemContent(inputProcessor.state.currentArgs)
        });

        inputProcessor.setAppEnvironment(appEnvironment);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}
