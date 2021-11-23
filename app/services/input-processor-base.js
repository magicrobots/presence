import Service from '@ember/service';
import { inject as service } from '@ember/service';
import { set } from '@ember/object';
import { isPresent } from '@ember/utils';

import ENV from '../config/environment';
import MagicNumbers from '../const/magic-numbers';

export default Service.extend({
    statusBar: service(),
    persistenceHandler: service(),

    currentCommand: '',
    currentArgs: undefined,
    activeApp: undefined,
    isPromptCursorVisible: true,
    relevantMarkup: undefined,
    cursorLoopContainer: undefined,
    cursorPosition: 0,
    currCommandIndex: -1,
    bgImage: undefined,
    rawUserEntry: '',

    currentBlockDemarcation() {
        return MagicNumbers.COLORIZE_LINE_PREFIX.concat(MagicNumbers.DEFAULT_FEEDBACK_COLOR);
    },

    _doAnalytics(isScreenInput) {
        if (typeof window.gtag !== 'function') { return; }
        const username = this.persistenceHandler.getUsername();
        const trackingData = {
            user: username,
            input: this.rawUserEntry,
            context: this.appContext || 'index',
            isScreenInput
        };
        
        console.log(trackingData);
    },

    init() {
        this._super(...arguments);

        const welcomeBase = [
            `Welcome to Faux OS ${this.getAppVersion()} ©1996`,
            '- limited shell -',
            '? for help'];
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
        set(this, 'currentArgs', []),

        this._startPromptCursorLoop();

        this._doAnalytics();
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
