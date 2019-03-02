import { computed } from '@ember/object';

export default {
    badWords: [
        'shit',
        'shitty',
        'shittier',
        'bullshit',
        'ass',
        'fuck',
        'fucked',
        'motherfucker',
        'motherfuckin',
        'motherfucking',
        'bitch',
        'bitches',
        'cunt',
        'twat',
        'pussy',
        'pussies',
        'dick',
        'cock'
    ],

    DIRECTION_N: computed({
        get() {
            return this.exitPossibilities[0].abbr;
        }
    }),

    DIRECTION_E: computed({
        get() {
            return this.exitPossibilities[1].abbr;
        }
    }),

    DIRECTION_W: computed({
        get() {
            return this.exitPossibilities[2].abbr;
        }
    }),

    DIRECTION_S: computed({
        get() {
            return this.exitPossibilities[3].abbr;
        }
    }),

    exitPossibilities: [
        {abbr:'N', word: 'NORTH', coordModifier: {direction: 'Y', amount: -1}},
        {abbr:'E', word: 'EAST', coordModifier: {direction: 'X', amount: 1}},
        {abbr:'W', word: 'WEST', coordModifier: {direction: 'X', amount: -1}},
        {abbr:'S', word: 'SOUTH', coordModifier: {direction: 'Y', amount: 1}}
    ]
}
