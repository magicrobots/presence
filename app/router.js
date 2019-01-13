import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

// about images help | search?
Router.map(function() {
  this.route('cmd-about');
  this.route('cmd-clear');
  this.route('cmd-contact');
  this.route('cmd-help');
  this.route('cmd-ls');
  this.route('cmd-q');
  this.route('cmd-robots');
  this.route('cmd-settings');
});

export default Router;
