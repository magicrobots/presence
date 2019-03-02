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
        'bitch',
        'cunt',
        'twat',
        'pussy',
        'pussies',
        'dick',
        'cock'
    ],

    exitPossibilities: [
        {abbr:'N', word: 'NORTH', coordModifier: {direction: 'Y', amount: -1}},
        {abbr:'E', word: 'EAST', coordModifier: {direction: 'X', amount: 1}},
        {abbr:'W', word: 'WEST', coordModifier: {direction: 'X', amount: -1}},
        {abbr:'S', word: 'SOUTH', coordModifier: {direction: 'Y', amount: 1}}
    ]
}
