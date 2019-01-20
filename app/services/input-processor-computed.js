import { computed } from '@ember/object';
import { isPresent } from '@ember/utils';
import processorBase from './input-processor-base';

export default processorBase.extend({
    PROMPT_LINE_1: computed({
        get() {
            // just some random nerdy stuff
            const ref = document.referrer.substr(document.referrer.indexOf('/'));
            const code = navigator.appCodeName;
            const plat = navigator.platform;
            const lang = navigator.language;

            return `source[${ref}] ${code} ${plat} ${lang} | magicrobots/ (unknown user)`;
        }
    }),

    PROMPT_LINE_2: computed('activeApp', 'displayAppNameInPrompt', {
        get() {
            // add name of app if there's an active app
            const timestamp = new Date().getTime().toString().substr(5);
            const context = isPresent(this.activeApp) ?
                ` ${this.activeApp}` :
                '';

            // only display context if it's requested
            const displayedContext = this.displayAppNameInPrompt ? context : '';

            const promptEnd = this.displayAppNameInPrompt && isPresent(this.activeApp) ? '>' : '$:';

            return `${timestamp}${displayedContext} ${promptEnd}`;
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

            return this.appResponse.concat(['', this.PROMPT_LINE_1, interactiveLine]);
        }
    }),

    allDisplayLines: computed('currExecutionBlock', {
        get() {
            return isPresent(this.previousExecutionBlocks) ?
                this.previousExecutionBlocks.concat(this.currExecutionBlock) :
                this.currExecutionBlock;
        }
    })
});
