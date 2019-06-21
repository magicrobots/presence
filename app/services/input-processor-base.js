import Service from '@ember/service';
import { inject as service } from '@ember/service';
import { set } from '@ember/object';

import MagicNumbers from '../const/magic-numbers';

export default Service.extend({
    platformAnalyzer: service(),
    statusBar: service(),

    currentCommand: '',
    currentArgs: undefined,
    activeApp: undefined,
    isPromptCursorVisible: true,
    relevantMarkup: undefined,
    cursorLoopContainer: undefined,
    cursorPosition: 0,
    currCommandIndex: -1,
    bgImage: undefined,

    currentBlockDemarcation() {
        return MagicNumbers.COLORIZE_LINE_PREFIX.concat(MagicNumbers.DEFAULT_FEEDBACK_COLOR);
    },

    init() {
        this._super(...arguments);

        const appVersion = '0.1.4234265';
        const welcomeBase = [`Welcome to Faux OS v${appVersion} ©1996`, '? for help'];
        let welcomeMessage = this.platformAnalyzer.getIsSafari() ?
            welcomeBase.concat([
                '',
                'SAFARI USER:',
                'Experience limited: enhanced graphics disabled.',
                'For full experience switch to Chrome or Firefox browsers.'
            ]) :
            welcomeBase;

        if (this.platformAnalyzer.getIsMobileDevice()) {
            welcomeMessage = welcomeMessage.concat([
                '',
                'KEYBOARD REQUIRED.'
            ]);
        }

        // set defaults
        set(this, 'commandHistory', []),
        set(this, 'appResponse', welcomeMessage);
        set(this, 'previousExecutionBlocks', []),

        this._startPromptCursorLoop();
    },
    
    destroy() {
        clearInterval(this.cursorLoopContainer);
        this._super(...arguments);
    }
});