import environmentValues from '../const/environment-values';

export default {

    getItemById(itemId) {
        return this.items.filter((currItem) => {
            return currItem.id === itemId;
        })[0];
    },

    getItemByName(itemName) {
        return this.items.filter((currItem) => {
            return currItem.name === itemName;
        })[0];
    },

    items: [
        {
            id: 1,
            type: environmentValues.ITEM_TYPE_THING,
            name: 'computer',
            description: 'On a nearby table sits an old computer.',
            details: 'Its bulky CRT monitor is dark, save for a single blinking cursor in the corner. A tangle of wires snakes behind the desk and collects in a dusty old CPU case on the floor. Its green LED glows steadily.',
            detailsUsed: 'The monitor glows green with the stack of commands you entered. You\'re fairly sure what you did wasn\'t illegal.',
            use: {
                unlocks: {room: 1, direction: environmentValues.DIRECTION_E()},
                response: {
                    first: 'You are familiar with this system. You find the security settings and out of pure curiosity, you set everything to off. After the walls stop echoing with the sounds of the clicking keyboard, you hear an electronic hum, and a distant hollow click that seems to come from the HVAC vents. The light that was red on the door to the east now glows green.',
                    subsequent: 'You open up lynx and browse reddit for a few minutes. Nothing holds your interest.'
                }
            },
            isKey: null,
            weight: 100
        },
        {
            id: 2,
            type: environmentValues.ITEM_TYPE_FOOD,
            name: 'sandwich',
            description: 'There\'s a sandwich on a paper plate on the ground.',
            details: 'It\'s half eaten. There is some unidentifiable meat, or meat substitute along with some wilted undescernible vegetables. The paper plate it sits on is transparent with grease.',
            onEat: 'You eat the sandwich. You aren\'t sure if that was a good idea or not.',
            use: null,
            isKey: null,
            weight: 4
        },
        {
            id: 3,
            type: environmentValues.ITEM_TYPE_THING,
            name: 'pencil',
            description: 'Hey look a pencil!',
            details: 'An old number 2 pencil that could use sharpening but is still useable. It has that sour painted wood smell that pencils have. The eraser is missing.',
            use: null,
            isKey: null,
            weight: 1
        },
        {
            id: 4,
            type: environmentValues.ITEM_TYPE_DOC,
            name: 'papers',
            description: 'You almost step on some papers.',
            details: 'The loose stack of papers is stapled together at the corner, the first page curled over itself. Written there is the title: "A HACKER\'S MANUAL"',
            detailsUsed: 'The manual flops over in your hand like a Dali painting. Seemed like there was way more information in there than there are pages.',
            use: {
                unlocks: {item: 1},
                response: {
                    first: 'A HACKER\'S MANUAL: As you turn the pages, you can feel your mind expanding. You are engrossed. You begin not to need the reference section in the back as you absorb the terms and details. You almost feel like a physical gust of wind spirals around you as your understanding clicks into place. You are a hacker now.',
                    subsequent: 'You thumb through the pages again, but no further knowledge is found there.'
                }
            },
            isKey: null,
            weight: 3
        },
        {
            id: 5,
            type: environmentValues.ITEM_TYPE_THING,
            name: 'dollar',
            description: 'Looks like someone dropped a dollar.',
            details: 'There doesn\'t seem to be anything special about this dollar bill. It\'s creased down the middle and wrinkled and soft from years of circulation. Serial Number F42748580A.',
            use: null,
            isKey: {item: 6},
            weight: 1
        },
        {
            id: 6,
            type: environmentValues.ITEM_TYPE_THING,
            name: 'vending-machine',
            description: 'There\'s a vending-machine humming in the corner.',
            details: 'Behind the glass stands in formation an army of Snickers, Milky Way, Zagnut, O\'Henry, M&Ms, Almond Joy, Reese\'s Pieces, Zero, 100 Grand, Hershey\'s, Butterfinger, Kit Kat, Baby Ruth, 3 Musketeers, Twix, Nestle Crunch, Charleston Chew, Clark, and Watchamacallit bars.',
            detailsUsed: 'Taunting you from behind the glass stands in formation an army of Snickers, Milky Way, Zagnut, O\'Henry, M&Ms, Almond Joy, Reese\'s Pieces, Zero, 100 Grand, Hershey\'s, Butterfinger, Kit Kat, Baby Ruth, 3 Musketeers, Twix, Nestle Crunch, Charleston Chew, Clark, and Watchamacallit bars.',
            use: {
                unlocks: {room: environmentValues.ROOM_NULL(), direction: environmentValues.DIRECTION_NULL()},
                response: {
                    first: 'You insert the dollar bill into the tray and the mechanism pulls it in powerfully with an electronic whine. It ejects the bill immediately. You try again. Nope. Third time? Sorry. Your excited anticipation of a tasty treat is converted into frustration and you clonk the machine on its side. You are rewarded with nothing more than a hollow clang and a sore hand.',
                    subsequent: 'You feed the bill into the tray again. Zeep zoop. Nothing. You are annoyed.'
                }
            },
            isKey: null,
            weight: 100
        },
        {
            id: 7,
            type: environmentValues.ITEM_TYPE_THING,
            name: 'flashlight',
            description: 'Standing on it\'s lens like a miniature steel totem is a large flashlight.',
            details: 'It\'s a fist thick police style black knurled metal flashlight. Probably powered by a box full of D cell batteries, this thing looks like it could weather the apocalypse. It is heavy.',
            use: null,
            isKey: null,
            weight: 9
        },
        {
            id: 8,
            type: environmentValues.ITEM_TYPE_THING,
            name: 'badge',
            description: 'In the corner, face down on the floor is what looks like an employee\'s badge.',
            details: 'It has no photo but it says "LAB" on it in big black letters, beneath which stretches a broad barcode. The card itself is thick and plastic, probably containing an RFID antennae.',
            use: null,
            isKey: [{room: 7, direction: environmentValues.DIRECTION_E()},
                    {room: 8, direction: environmentValues.DIRECTION_W()}],
            weight: 1
        },
        {
            id: 9,
            type: environmentValues.ITEM_TYPE_THING,
            name: 'wrench',
            description: 'Leaning against the wall is a massive wrench.',
            details: 'It tells its age in years and use through its worn edges and surface patina. There are wear marks that make you think it was used in ways a wrench is not necessarily intended.',
            use: null,
            isKey: null,
            weight: 10
        },
        {
            id: 10,
            type: environmentValues.ITEM_TYPE_THING,
            name: 'robot',
            description: 'Towering high above you is what can only be described as a giant robot. It turns and stares at you with an unearthly whine, leaning heavy against a building. It beeps, a deep physical tone like a fog horn but digital. ¯|_|¯|_|¯|_|¯|_|¯|_',
            details: 'The machine is almost humanoid in form, broad steel chest and arms like enormous bright excavators. It doesn\'t have a head but one thick glowing rectangular eye across the top half of its body. You can feel its gaze analyzing your very being. It also seems tired, despite clearly being enormously powerful.',
            detailsUsed: 'The machine is almost humanoid in form, broad steel chest and arms like enormous bright excavators. It doesn\'t have a head but one thick glowing rectangular eye across the top half of its body. You can feel its gaze analyzing your very being. It also seems tired, despite clearly being enormously powerful.',
            use: {
                unlocks: {room: 10, direction: environmentValues.DIRECTION_S()},
                response: {
                    first: '"Hello!" you yell up toward it. You wave awkwardly trying to be friendly and non-threatening. A piercing light from somewhere on it immediately sweeps your body and you freeze in place. Resonating inside your mind, the voice of the robot somehow speaks: "I see you brought cake. You are therefore trustworthy..." It places a small metal thing on the ground beside you. "This is a translator for the alien creature\'s language," it continues. "I need you to use it to bring me three stolen components so I can repair myself and rid your planet of these destructive monsters. A nav-card will repair my instruments. A hypercore will restore my full power. A human computer disk contains mapped locations of their hives. Bring me these things and we can end this. Disk. Nav-Card. Hypercore. GO!" You can\'t believe this is happening. Earlier today your greatest challenge was finding an open coffee shop.',
                    subsequent: environmentValues.ROBOT_RESPONSE_USED
                }
            },
            isKey: null,
            weight: 100000
        },
        {
            id: 11,
            type: environmentValues.ITEM_TYPE_THING,
            name: 'cake',
            description: 'Weirdly there is a slice of cake under glass on a small pedestal.',
            details: 'It\'s the kind of display you\'d see in a diner; a short pedestal with a broad base, topped by a fat cylindrical glass cover with an integrated glass sphere as a handle on top. Inside on the tray is a delicious looking slice of cake. Chocolate. You try to lift the cover and find that you can\'t.',
            use: null,
            isKey: {item: 10},
            weight: 6
        },
        {
            id: 12,
            type: environmentValues.ITEM_TYPE_DOC,
            name: 'translator',
            description: 'The translator the robot gave you hums quietly by the wall.',
            details: 'You feel a strange connection to this thing. It\'s not something you use; it seems to have a magical pathway to your mind\'s language center. You are excited and scared.',
            use: null,
            isKey: [{room: 16, direction: environmentValues.DIRECTION_S()},
                    {room: 17, direction: environmentValues.DIRECTION_N()}],
            weight: 4
        },
        {
            id: 13,
            type: environmentValues.ITEM_TYPE_THING,
            name: 'disk',
            description: 'A 3.5" High Density floppy disk sits on a shelf. Its label reads: "?"',
            details: 'It\'s just a normal floppy disk, with average physical wear. It\'s unlocked, and scrawled across the lines of the label in hurried sharpie is a big black question mark. High Density 1.44 MB',
            use: null,
            isKey: null,
            isTrophy: true,
            weight: 1
        },
        {
            id: 14,
            type: environmentValues.ITEM_TYPE_THING,
            name: 'artifact',
            description: 'Hovering a few inches above the ground nearby is some sort of alien artifact.',
            details: 'It looks like a cube of metallic crystals spinning an mid-air. The artifact almost looks man-made, but somehow you know that it is something naturally occuring, and extremely rare in the universe. Just being in its presence you feel an expanding sense of awareness. You poke it. Nothing happens - you don\'t think it\'s alive.',
            use: null,
            isKey: [{room: 17, direction: environmentValues.DIRECTION_E()},
                    {room: 20, direction: environmentValues.DIRECTION_W()}],
            weight: 1
        },
        {
            id: 15,
            type: environmentValues.ITEM_TYPE_THING,
            name: 'helmet',
            description: 'Hanging on a hook is a pretty sweet looking full face helmet.',
            details: 'It\'s got a mirrored face mask and looks to be made of carbon fiber. There\'s a bit of bulk on the back that may hold batteries or something.',
            use: null,
            isKey: null,
            weight: 5
        },
        {
            id: 16,
            type: environmentValues.ITEM_TYPE_THING,
            name: 'vial',
            description: 'A vial of purple fizzy liquid sits on a table.',
            details: 'Looks like grape soda, but sparkles - just holding the container makes your fingers tingle like the feeling of pop rocks.',
            use: null,
            isKey: null,
            weight: 1
        },
        {
            id: 17,
            type: environmentValues.ITEM_TYPE_THING,
            name: 'controls',
            description: 'The space ship controls blink their lights at you.',
            details: 'Three stalks extend from the console, each a different thickness with a lever or two branching off them. You wonder if it is weaponized and if perhaps you could try to pilot it against the alien force.',
            use: null,
            isKey: null,
            weight: 1000
        },
        {
            id: 18,
            type: environmentValues.ITEM_TYPE_THING,
            name: 'nav-card',
            description: 'The nav-card is magnetically attached to the wall. You assume it\'s magnetism anyway, this is crazy alien technology.',
            details: 'It reminds you of a densely packed arrangement of legos, if they were made of unearthly metals. It\'s about the size of your forearm, but flat.',
            use: null,
            isKey: null,
            weight: 3
        },
        {
            id: 19,
            type: environmentValues.ITEM_TYPE_THING,
            name: 'hypercore',
            description: 'What could only be a brightly glowing hypercore is floating and rotating in the center of everything.',
            details: 'It\'s a constantly self-igniting nuclear explosion, contained by the gravity of its own mass. It would be infinitely heavy but there is some clever stuff going on with the containment unit allowing it to be portable. It\'s about the size of a basketball.  A basketball made of churning pulsing plasma and flame.',
            use: null,
            isKey: null,
            weight: 7
        }
    ]
}