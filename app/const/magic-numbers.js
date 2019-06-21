export default {
    
    WEIGHT_CAPACITY: 20,

    badWords: [
        'shit',
        'asshole',
        'fuck',
        'bitch',
        'cunt',
        'twat',
        'pussy',
        'pussies',
        'dick',
        'cock'
    ],

    DIRECTION_N() {
        return this.exitPossibilities[0].abbr;
    },

    DIRECTION_E() {
        return this.exitPossibilities[1].abbr;
    },

    DIRECTION_W() {
        return this.exitPossibilities[2].abbr;
    },

    DIRECTION_S() {
        return this.exitPossibilities[3].abbr;
    },

    DIRECTION_NULL() {
        return 'Z';
    },

    ROOM_NULL() {
        return 474747;
    },

    exitPossibilities: [
        {abbr:'N', word: 'NORTH', coordModifier: {direction: 'Y', amount: -1}},
        {abbr:'E', word: 'EAST', coordModifier: {direction: 'X', amount: 1}},
        {abbr:'W', word: 'WEST', coordModifier: {direction: 'X', amount: -1}},
        {abbr:'S', word: 'SOUTH', coordModifier: {direction: 'Y', amount: 1}}
    ],

    ITEM_TYPE_THING: 'thing',
    ITEM_TYPE_DOC: 'document',
    ITEM_TYPE_FOOD: 'food',
    ITEM_TYPE_DRINK: 'drink',

    RESPAWN_COORDS: {x:45, y:48},
    COMPLETION_ITEM_IDS: [13, 18, 19],

    ROOM_RESET_BADGE: {roomId: 5, itemId: 8},
    ROOM_RESET_HELMET: {roomId: 16, itemId: 15},
    ROOM_RESET_TRANSLATOR: {roomId: 10, itemId: 12},

    ROBOT_RESPONSE_USED: 'robot-response-used',

    FLASHLIGHT_BATTERY_FULL: 10
}
