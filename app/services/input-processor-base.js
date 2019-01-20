import Service from '@ember/service';
import { set } from '@ember/object';

export default Service.extend({
    CURSOR_CHAR: '█',

    currentCommand: '',
    currentArgs: undefined,
    activeApp: undefined,
    isPromptCursorVisible: true,
    relevantMarkup: undefined,
    cursorLoopContainer: undefined,
    cursorPosition: 0,
    currCommandIndex: -1,
    bgImage: undefined,

    init() {
        this._super(...arguments);

        // set defaults
        set(this, 'commandHistory', []),
        set(this, 'appResponse', []),
        set(this, 'previousExecutionBlocks', []),

        this._startPromptCursorLoop();
    },
    
    destroy() {
        clearInterval(this.cursorLoopContainer);
        this._super(...arguments);
    }
});