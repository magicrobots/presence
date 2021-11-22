import Component from '@ember/component';
import { set } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({
    inputProcessor: service(),

    onScreenInput() {
        this.inputProcessor.handleScreenInput(this.inputValue);
        set(this, 'inputValue', '');
    },

    onEsc() {
        this.inputProcessor.handleEsc();
    },

    onUp() {
        set(this, 'inputValue', this.inputProcessor.getOlderCommand());
    },

    onDown() {
        set(this, 'inputValue', this.inputProcessor.getNewerCommand());
    },

    onLeft() {
        this.inputProcessor.callArrow('ARROWLEFT');
    },

    onRight() {
        this.inputProcessor.callArrow('ARROWRIGHT');
    }
});
