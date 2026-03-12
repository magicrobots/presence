import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

import environmentHelpers from '../utils/environment-helpers';
import type { InputProcessor } from '../types/terminal';

export default function CmdBeep() {
    const inputProcessor = useOutletContext<InputProcessor>();

    useEffect(() => {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: 'cmd-beep',
            response: [
                '<3',
                '',
                '                          ##     (,',
                '                        &@@@    @@/',
                '                      @@@@@@@@@@@@@@@',
                '                    *@@@@@@@@@@@@@@@@@@,',
                '              @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@',
                '      /((@### @@@@@@@@@@@%(        ./@@@@@@@@@ ###(',
                '     @@@@@@%@@@@@@@@@@@@@@@       @@@@@@@@@@@& @@@@@@',
                '    @@@@@@@@@ @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@',
                '     @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@',
                '     @@@@@@%  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@',
                '     @@@@@@@  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ @@@@@',
                '     @,             @@@@@@@@@@@@@@@@@@@@@@@@       @',
                '    @.    @*          .@@@@@@@@@@@@@@@@            @@',
                '    @     @*           @@@@@@@@@@@@@@@             @@',
                '    @                  @@@@@@@@@@@@%               @@',
                '   @@                   @@@@@@@@@@@%                @',
                '@@@@@@@@             ,@@@@@@@@@@@@@@@               @@@@@',
                ',@@@@@@@       &&&&&@@@@@@@@@@@@@@@@@@             &@@@@@',
                '@@@@@@,        @@@@@@@@@@@@@@@@@@@@@@@@@@@         @@@@@@'
            ]
        });

        inputProcessor.setAppEnvironment(appEnvironment);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}
