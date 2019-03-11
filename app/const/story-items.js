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
            name: 'money',
            description: 'Looks like someone dropped a dollar bill.',
            details: 'There doesn\'t seem to be anything special about this dollar bill.',
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
            description: 'It is a flashlight.',
            details: 'Looks like a flashlight.',
            use: null,
            isKey: null,
            weight: 10
        },
        {
            id: 8,
            type: environmentValues.ITEM_TYPE_THING,
            name: 'badge',
            description: 'An employees RFID badge.',
            details: 'It is flat and rectangular.',
            use: null,
            isKey: {room: 7, direction: environmentValues.DIRECTION_E()},
            weight: 1
        }
    ]
}