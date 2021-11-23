import EmberRouter from '@ember/routing/router';
import { isPresent } from '@ember/utils';

import config from './config/environment';
import commandRegistry from './const/command-registry';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  const uniqueRoutnames = [...new Set(commandRegistry.registry.map(cmd => cmd.routeName))];
  const scope = this;
  
  uniqueRoutnames.forEach((currRouteName) => {
    if (isPresent(currRouteName)) {
      scope.route(currRouteName, { path: currRouteName});
    }
  });
});

export default Router;
