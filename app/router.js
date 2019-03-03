import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

// about images help | search?
Router.map(function() {
  this.route('cmd-about');
  this.route('cmd-beep');
  this.route('cmd-cd');
  this.route('cmd-clear');
  this.route('cmd-contact');
  this.route('cmd-hello');
  this.route('cmd-man');
  this.route('cmd-ls');
  this.route('cmd-pwd');
  this.route('cmd-robots');
  this.route('cmd-settings');
  this.route('cmd-story');
  this.route('cmd-whoami');
});

export default Router;
