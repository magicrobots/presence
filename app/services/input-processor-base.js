import Service from '@ember/service';
import { set } from '@ember/object';

export default Service.extend({
    CURSOR_CHAR: '█',
    COLORIZE_LINE_PREFIX: '<colorize>',
    COLORIZE_COLOR_LENGTH: 7,
    DEFAULT_PROMPT_COLOR: '#35dd59',
    STATIC_PROMPT_COLOR: '#e3ff16',
    DIRECTORY_LIST_COLOR: '#18def4',
    INACTIVE_COLORIZED_COLOR: '#2a4959',
    INACTIVE_SCROLLED_COLOR: '#555555',
    DEFAULT_SCROLLED_COLOR: '#878787',
    DEFAULT_FEEDBACK_COLOR: '#FFFFFF',
    CURSOR_BLINK_LENGTH: 400, // in milliseconds

    currentCommand: '',
    currentArgs: undefined,
    activeApp: undefined,
    isPromptCursorVisible: true,
    relevantMarkup: undefined,
    cursorLoopContainer: undefined,
    cursorPosition: 0,
    currCommandIndex: -1,
    bgImage: undefined,

    CURRENT_BLOCK_DEMARCATION() {
        return this.COLORIZE_LINE_PREFIX.concat(this.DEFAULT_FEEDBACK_COLOR);
    },

    init() {
        this._super(...arguments);

        // set defaults
        set(this, 'commandHistory', []),
        set(this, 'appResponse', ['Welcome to Faux OS v0.1.4234265 ©2019', '? for help']);
        set(this, 'previousExecutionBlocks', []),

        this._startPromptCursorLoop();
    },
    
    destroy() {
        clearInterval(this.cursorLoopContainer);
        this._super(...arguments);
    }
});