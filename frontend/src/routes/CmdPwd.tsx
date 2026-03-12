import environmentHelpers from '../utils/environment-helpers';
import persistence from '../utils/persistence';
import { useRouteInit } from './shared/useRouteInit';

// Ember's @ember/string dasherize: trim, lowercase, replace underscores/spaces with dashes
function dasherize(str: string): string {
    return str.trim().toLowerCase().replace(/[_\s]+/g, '-');
}

export default function CmdPwd() {
    useRouteInit((ip) => {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: 'cmd-pwd',
            response: [`/home/${dasherize(persistence.getUsername() ?? 'user')}/`]
        });

        ip.setAppEnvironment(appEnvironment);
    });

    return null;
}
