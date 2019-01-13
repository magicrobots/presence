import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

// about images help | search?
Router.map(function() {
  this.route('about');
  this.route('robots');
  this.route('contact');
  this.route('help');
});

export default Router;
