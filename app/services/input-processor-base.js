import Service from '@ember/service';
import { inject as service } from '@ember/service';
import { set } from '@ember/object';
import { isPresent } from '@ember/utils';

import ENV from '../config/environment';
import MagicNumbers from '../const/magic-numbers';

export default Service.extend({
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

        const welcomeBase = [`Welcome to Faux OS ${this.getAppVersion()} ©1996`, '? for help'];
        let welcomeMessage = '';

        welcomeMessage = welcomeBase.concat(welcomeMessage);

        const isNarrowScreen = true;
        if (isNarrowScreen) {
            welcomeMessage = welcomeMessage.concat([
                '* PHYSICAL KEYBOARD RECOMMENDED *'
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
    },

    getAppVersion() {
        const versionBuild = ENV.aws.buildNumber;

        return `v${MagicNumbers.VERSION_MAJOR}.${MagicNumbers.VERSION_MINOR}.${versionBuild}`;
    },

    setBgImage(imgPath) {
        if(isPresent(this.bgImageCallback)) {
            set(this, 'bgImage', imgPath);
            this.bgImageCallback();
        }
    }
});
