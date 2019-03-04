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
            weight: 100
        },
        {
            id: 2,
            name: 'sandwich',
            description: 'There\'s a sandwich on the ground.',
            details: 'It\'s half eaten.  There is some unidentifiable meat, or meat substitute along with some wilted undescernible vegetables.  The paper plate it sits on is transparent with grease.',
            use: null,
            weight: 3
        },
        {
            id: 3,
            name: 'pencil',
            description: 'Hey look a pencil!',
            details: 'An old number 2 pencil that could use sharpening but is still useable.  It has that sour painted wood smell that pencils have.  The eraser is missing.',
            use: null,
            weight: 1
        }
    ]
}