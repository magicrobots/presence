import { computed } from '@ember/object';
import { isPresent } from '@ember/utils';
import { inject as service } from '@ember/service';

import processorBase from './input-processor-base';

export default processorBase.extend({
    persistenceHandler: service(),

    PROMPT_LINE_1: computed('persistenceHandler.updateTrigger', {
        get() {
            // just some random nerdy stuff
            const code = navigator.appCodeName;
            const plat = navigator.platform;
            const lang = navigator.language;
            const username = this.persistenceHandler.getUsername() || 'unknown user';

            return `${code} ${plat} ${lang} | magicrobots/ (${username})`;
        }
    }),

    PROMPT_LINE_2: computed('activeApp', 'displayAppNameInPrompt', 'interruptPrompt', {
        get() {
            // add name of app if there's an active app
            const timestamp = new Date().getTime().toString().substr(5);
            const context = isPresent(this.activeApp) ?
                `${this.activeApp} ` :
                '';

            // only display context if it's requested
            const displayedContext = this.displayAppNameInPrompt ? context : '';

            // prompt is different based on context
            const promptEnd = this.displayAppNameInPrompt && isPresent(this.activeApp) ? '>' : '$:';

            // if interrupted, don't show preprompt
            const prePrompt = isPresent(this.interruptPrompt) ? '' : `${timestamp} `;

            return `${prePrompt}${displayedContext}${promptEnd}`;
        }
    }),

    currExecutionBlock: computed('PROMPT_LINE_1',
        'PROMPT_LINE_2',
        'isPromptCursorVisible',
        'appResponse.[]',
        'currentCommand',
        'forceDisplayCursor', {

        get() {
            // duplicate command string
            let commandDisplay = this.currentCommand.slice(0);

            // display cursor in position
            if (this.isPromptCursorVisible || this.forceDisplayCursor) {
                commandDisplay = this.currentCommand.substr(0, this.cursorPosition) +
                    this.CURSOR_CHAR +
                    this.currentCommand.substr(this.cursorPosition + 1);
            }

            const interactiveLine = `${this.PROMPT_LINE_2}${commandDisplay}`;

            const fullBlock = isPresent(this.interruptPrompt) ?
                ['', interactiveLine] :
                ['', this.PROMPT_LINE_1, interactiveLine];

            return this.appResponse.concat(fullBlock);
        }
    }),

    allDisplayLines: computed('currExecutionBlock', 'previousExecutionBlocks.[]', {
        get() {
            return isPresent(this.previousExecutionBlocks) ?
                this.previousExecutionBlocks.concat(this.currExecutionBlock) :
                this.currExecutionBlock;
        }
    })
});
