import Service from '@ember/service';
import { set } from '@ember/object';

export default Service.extend({

    KEY_USERNAME: 'username',
    KEY_PROMPT_COLOR: 'prompt-color',
    updateTrigger: 0,

    init() {
        this._super(...arguments);

        set(this, 'storage', window.localStorage);
    },
    
    setUsername(newName) {
        this.storage.setItem(this.KEY_USERNAME, newName);
        set(this, 'updateTrigger', Math.random());
    },

    getUsername() {
        return this.storage.getItem(this.KEY_USERNAME);
    },
    
    setPromptColor(newColor) {
        this.storage.setItem(this.KEY_PROMPT_COLOR, newColor);
        set(this, 'updateTrigger', Math.random());
    },

    getPromptColor() {
        return this.storage.getItem(this.KEY_PROMPT_COLOR);
    }
});