import Service from '@ember/service';
import { set } from '@ember/object';

export default Service.extend({
    CURSOR_CHAR: '█',
    COLORIZE_LINE_PREFIX: '<colorize>',
    COLORIZE_COLOR_LENGTH: 7,
    DEFAULT_PROMPT_COLOR: '#35dd59',
    STATIC_PROMPT_COLOR: '#e3ff16',
    DIRECTORY_LIST_COLOR: '#18def4',

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
        set(this, 'appResponse', ['Faux OS v0.1.4234265', 'Author: Adam Hilliker, ©2019', '? for help']);
        set(this, 'previousExecutionBlocks', []),

        this._startPromptCursorLoop();
    },
    
    destroy() {
        clearInterval(this.cursorLoopContainer);
        this._super(...arguments);
    }
});