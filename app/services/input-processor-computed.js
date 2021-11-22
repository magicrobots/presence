import { computed } from '@ember/object';
import { isPresent } from '@ember/utils';
import { inject as service } from '@ember/service';

import processorBase from './input-processor-base';
import MagicNumbers from '../const/magic-numbers';

export default processorBase.extend({
    persistenceHandler: service(),

    promptLine1: computed('persistenceHandler.magicRobotsData.username', {
        get() {
            // just some random nerdy stuff
            const code = navigator.appCodeName;
            const plat = navigator.platform;
            const lang = navigator.language;
            const username = this.persistenceHandler.getUsername();

            return `${username} | ${code} ${plat} ${lang} | magicrobots/`;
        }
    }),

    promptLine2: computed('activeApp', 'displayAppNameInPrompt', 'interruptPrompt', {
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

    currExecutionBlock: computed('promptLine1',
        'promptLine2',
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
                    MagicNumbers.CURSOR_CHAR +
                    this.currentCommand.substr(this.cursorPosition + 1);
            }

            const interactiveLine = `${this.promptLine2}${commandDisplay}`;
            const promptColor = MagicNumbers.DEFAULT_PROMPT_COLOR;

            const fullBlock = isPresent(this.interruptPrompt) ?
                ['', `${MagicNumbers.COLORIZE_LINE_PREFIX}${promptColor}${interactiveLine}`] :
                ['', `${MagicNumbers.COLORIZE_LINE_PREFIX}${MagicNumbers.STATIC_PROMPT_COLOR}${this.promptLine1}`,
                    `${MagicNumbers.COLORIZE_LINE_PREFIX}${promptColor}${interactiveLine}`];

            const appResponseMarked = [];
            this.appResponse.forEach((currLine) => {
                if (typeof (currLine) === 'string') {
                    appResponseMarked.push(this.currentBlockDemarcation().concat(currLine));
                } else if (Array.isArray(currLine)) {

                    // handle arrays as responses.
                    currLine.forEach((currArrayLine) => {
                        appResponseMarked.push(this.currentBlockDemarcation().concat(currArrayLine));
                    });
                }
            });

            return appResponseMarked.concat(fullBlock);
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
