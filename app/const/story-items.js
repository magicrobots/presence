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
            detailsUsed: 'The monitor glows green with the stack of commands you entered.  You\'re fairly sure what you did wasn\'t illegal.',
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
            type: environmentValues.ITEM_TYPE_THING,
            name: 'sandwich',
            description: 'There\'s a sandwich on the ground.',
            details: 'It\'s half eaten.  There is some unidentifiable meat, or meat substitute along with some wilted undescernible vegetables.  The paper plate it sits on is transparent with grease.',
            use: null,
            isKey: null,
            weight: 3
        },
        {
            id: 3,
            type: environmentValues.ITEM_TYPE_THING,
            name: 'pencil',
            description: 'Hey look a pencil!',
            details: 'An old number 2 pencil that could use sharpening but is still useable.  It has that sour painted wood smell that pencils have.  The eraser is missing.',
            use: null,
            isKey: null,
            weight: 1
        },
        {
            id: 4,
            type: environmentValues.ITEM_TYPE_DOC,
            name: 'papers',
            description: 'You almost step on some papers.',
            details: 'The loose stack of papers is stapled together at the corner, the first page curled over itself.  Written there is the title: "A HACKER\'S MANUAL"',
            detailsUsed: 'The manual flops over in your hand like a Dali painting.  Seemed like there was way more information in there than there are pages.',
            use: {
                unlocks: {item: 1},
                response: {
                    first: 'As you turn the pages, you can feel your mind expanding.  You are engrossed.  You begin not to need the reference section in the back as you absorb the terms and details.  You almost feel like a physical gust of wind spirals around you as your understanding clicks into place.  You are a hacker now.',
                    subsequent: 'You thumb through the pages again, but no further knowledge is found there.'
                }
            },
            isKey: null,
            weight: 12
        },
        {
            id: 5,
            type: environmentValues.ITEM_TYPE_THING,
            name: 'dollar',
            description: 'Looks like someone dropped a dollar.',
            details: 'There doesn\'t seem to be anything special about this dollar bill. It\'s creased down the middle and wrinkled and soft from years of circulation.  Serial Number F42748580A.',
            use: null,
            isKey: {item: 6},
            weight: 1
        },
        {
            id: 6,
            type: environmentValues.ITEM_TYPE_THING,
            name: 'vending-machine',
            description: 'There\'s a vending-machine humming in the corner.',
            details: 'Behind the glass stands in formation an army of Snickers, Milky Way, Zagnut, O\'Henry, M&Ms, Almond Joy,  Reese\'s Pieces, Zero, 100 Grand, Hershey\'s, Butterfinger, Kit Kat, Baby Ruth, 3 Musketeers, Twix, Nestle Crunch, Charleston Chew, Clark, and Watchamacallit bars.',
            use: {
                unlocks: {room: environmentValues.ROOM_NULL(), direction: environmentValues.DIRECTION_NULL()},
                response: {
                    first: 'You insert the dollar bill into the tray and mechanism pulls it in powerfully with an electronic whine. It ejects the bill immediately. You try again. Nope. Third time? Sorry. Your excited anticipation of a tasty treat is converted into frustration and you clonk the machine on its side. You are rewarded with nothing more than a hollow clang and a sore hand.',
                    subsequent: 'You feed the bill into the tray again.  Zeep zoop.  Annoyed.'
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
            details: 'It\'s a fist thick police style black knurled metal flashlight.  Probably powered by a box full of D cell batteries, this thing looks like it could weather the apocalypse. It is heavy.',
            use: null,
            isKey: null,
            weight: 15
        },
        {
            id: 8,
            type: environmentValues.ITEM_TYPE_THING,
            name: 'badge',
            description: 'In the corner, face down on the floor is what looks like an employee\'s badge.',
            details: 'It has no photo but it says "LAB" on it in big black letters, beneath which stretches a broad barcode.  The card itself is thick and plastic, probably containing an RFID antennae.',
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
            description: 'Towering high above you is what can only be described as a giant robot.  It turns and stares at you with an unearthly whine, leaning heavy against a building.  It beeps, a deep physical tone like a fog horn but digital. ¯|_|¯|_|¯|_|¯|_|¯|_',
            details: 'The machine is almost humanoid in form, broad steel chest and arms like enormous bright excavators. It doesn\'t have a head but one broad glowing rectangular eye on the top half of its body. You can feel its gaze analyzing your very being.',
            use: {
                unlocks: {room: 10, direction: environmentValues.DIRECTION_S()},
                response: {
                    first: 'With a series of syncopated mechanical crunches, a door opens from the robots side.  A segmented arm extends with snake like precision and reaches out to you.  You hold out the matrix and it grasps it clumsily. You are surprised when it drops a device at your feet. You don\'t know why but you know it\'s a translator.',
                    subsequent: 'The robot stares through you, waiting. It beeps.'
                }
            },
            isKey: null,
            weight: 10000
        }
    ]
}