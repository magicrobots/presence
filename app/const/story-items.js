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
            description: 'On a nearby table sits a bulky CRT monitor.',
            details: 'Its screen is dark, save for a single blinking cursor in the corner. A tangle of wires snakes behind the desk and collects in a dusty old CPU case on the floor. Its green LED glows steadily.',
            state: 0,
            weight: 100
        },
        {
            id: 2,
            name: 'sandwich',
            description: 'There\'s a sandwich on the ground.',
            details: 'It\'s half eaten.  There is some unidentifiable meat, or meat substitute along with some wilted undescernible vegetables.  The paper plate it sits on is transparent with grease.',
            state: 0,
            weight: 3
        },
        {
            id: 3,
            name: 'pencil',
            description: 'Hey look a pencil!',
            details: 'An old number 2 pencil that could use sharpening but is still useable.  It has that sour painted wood smell that pencils have.  The eraser is missing.',
            state: 0,
            weight: 1
        }
    ]
}