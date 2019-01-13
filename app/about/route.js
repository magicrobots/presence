import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
    inputProcessor: service(),

    afterModel() {
        this.inputProcessor.setActiveApp(this.routeName);
        this.inputProcessor.setAppResponse(['This is a computer.', 'Type stuff.']);
    }
});