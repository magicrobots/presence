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
            description: 'On a nearby table sits a bulky CRT monitor. Its screen is dark, save for a single blinking cursor in the corner. A tangle of wires snakes behind the desk and collects in a dusty old CPU case on the floor. Its green LED glows steadily.',
            state: 0
        },
        {
            id: 2,
            name: 'sandwich',
            description: 'Somebody discarded a half eaten sandwich and it lies accumulating filth on a greasy paper plate.',
            state: 0
        },
        {
            id: 3,
            name: 'pencil',
            description: 'An old number 2 pencil that could use sharpening but is still useable.  It has that sour painted wood smell that pencils have.  The eraser is missing.',
            state: 0
        }
    ]
}