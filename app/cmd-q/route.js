import Route from '@ember/routing/route';
import { isPresent } from '@ember/utils';
import { inject as service } from '@ember/service';

export default Route.extend({
    inputProcessor: service(),

    afterModel() {
        if (isPresent(this.inputProcessor.interruptPrompt) &&
            this.inputProcessor.interruptPrompt === true) {
            this.inputProcessor.clear();
        }
    }
});