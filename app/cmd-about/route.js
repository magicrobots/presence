import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

import environmentHelpers from '../utils/environment-helpers';

export default Route.extend({
    inputProcessor: service(),

    afterModel() {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: this.routeName,
            response: [`Welcome to Faux OS ${this.inputProcessor.getAppVersion()} ©1996`,
                '',
                'You are connected to an updated Univac Mainframe running a preproduction IBM produced build of Linux.',
                'This is an expanded VT102 terminal, color feature added retroactively in 1992 via updated protocol standards and millimeter-wave modification of internal CRT.'
                ]
        });

        this.inputProcessor.setAppEnvironment(appEnvironment);
    }
});
