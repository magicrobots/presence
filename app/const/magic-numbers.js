export default {
    VERSION_MAJOR: 1,
    VERSION_MINOR: 4,
    
    // iza-computer
    FONT_SIZE: 14,
    FONT_CHARACTER_WIDTH: 8.7,
    FONT_SIZE_M: 12,
    FONT_CHARACTER_WIDTH_M: 6.9,
    FONT_SIZE_S: 9,
    FONT_CHARACTER_WIDTH_S: 5.4,
    SPACE_BETWEEN_LINES: 2,
    ABSOLUTE_MAX_VIEWPORT_WIDTH: 1200,
    MIN_BORDER: 50,
    MIN_USEABLE_COLUMNS: 60,
    FRAME_RATE: 1000 / 60,
    MAX_MPF: 150, // milliseconds per frame performance
    SCREEN_BREAK: 768, // match media query max-width at app/styles/app.css
    PERFORMANCE_TEST_LENGTH: 30,

    // status-bar
    STATUS_FONT_SIZE: 16,
    STATUS_FONT_CHARACTER_WIDTH: 10,
    STATUS_BORDER: 75,
    
    // story-core
    XP_PER_MOVE: 1,
    XP_PER_UNLOCK: 2,
    XP_PER_COMPLETION_ITEM: 3,
    HOME_COORD_X: 47,
    HOME_COORD_Y: 47,
    MAX_THINGS_TO_LIST: 10,
    INIT_ROOM_ONE_INVENTORY: Object.freeze([1, 23, 25]),
    INIT_USER_INVENTORY: Object.freeze([3]),

    // input-processor-base
    CURSOR_CHAR: '█',
    COLORIZE_LINE_PREFIX: '<colorize>',
    COLORIZE_COLOR_LENGTH: 7,
    DEFAULT_PROMPT_COLOR: '#35dd59',
    STATIC_PROMPT_COLOR: '#e3ff16',
    DIRECTORY_LIST_COLOR: '#0fade1',
    EXEC_COLOR: '#86ff5e',
    INACTIVE_COLORIZED_COLOR: '#2a4959',
    INACTIVE_SCROLLED_COLOR: '#555555',
    DEFAULT_SCROLLED_COLOR: '#878787',
    DEFAULT_FEEDBACK_COLOR: '#FFFFFF',
    CURSOR_BLINK_LENGTH: 400 // in milliseconds
};
