import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
    inputProcessor: service(),

    afterModel() {
        this.inputProcessor.clear();
    }
});