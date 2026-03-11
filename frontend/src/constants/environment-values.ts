export interface ExitPossibility {
    abbr: string;
    word: string;
    coordModifier: { direction: string; amount: number };
}

export interface RoomReset {
    roomId: number;
    itemId: number;
}

export interface ExitUnlock {
    room: number;
    direction: string;
}

const environmentValues = {

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
    ] as string[],

    DIRECTION_N(): string {
        return this.exitPossibilities[0].abbr;
    },

    DIRECTION_E(): string {
        return this.exitPossibilities[1].abbr;
    },

    DIRECTION_W(): string {
        return this.exitPossibilities[2].abbr;
    },

    DIRECTION_S(): string {
        return this.exitPossibilities[3].abbr;
    },

    DIRECTION_NULL(): string {
        return 'Z';
    },

    ROOM_NULL(): number {
        return 474747;
    },

    exitPossibilities: [
        {abbr:'N', word: 'NORTH', coordModifier: {direction: 'Y', amount: -1}},
        {abbr:'E', word: 'EAST', coordModifier: {direction: 'X', amount: 1}},
        {abbr:'W', word: 'WEST', coordModifier: {direction: 'X', amount: -1}},
        {abbr:'S', word: 'SOUTH', coordModifier: {direction: 'Y', amount: 1}}
    ] as ExitPossibility[],

    ITEM_TYPE_THING: 'thing' as const,
    ITEM_TYPE_DOC: 'document' as const,
    ITEM_TYPE_FOOD: 'food' as const,
    ITEM_TYPE_DRINK: 'drink' as const,

    RESPAWN_COORDS: {x:45, y:48},
    COMPLETION_ITEM_IDS: [13, 18, 19] as number[],

    ROOM_RESET_BADGE: {roomId: 5, itemId: 8} as RoomReset,
    ROOM_RESET_HELMET: {roomId: 16, itemId: 15} as RoomReset,
    ROOM_RESET_TRANSLATOR: {roomId: 10, itemId: 12} as RoomReset,

    ROBOT_RESPONSE_USED: 'robot-response-used' as const,

    FLASHLIGHT_BATTERY_FULL: 10
};

export default environmentValues;
