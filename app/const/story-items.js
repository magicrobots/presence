export default {

    getItem(itemName) {
        return this.items.filter((currItem) => {
            return currItem.name === itemName;
        })[0];
    },

    items: [
        {
            id: 1,
            name: 'computer',
            description: 'On a nearby table sits a bulky CRT monitor. Its screen is dark, save for a single blinking cursor in the corner. A tangle of wires snakes behind the desk and collects in a dusty old CPU case. Its green LED glows steadily.',
            state: 0
        },
        {
            id: 2,
            name: 'sandwich',
            description: 'somebody discarded a half eaten sandwich and it lies accumulating filth on a paper plate dissolving slowly in grease.',
            state: 0
        }
    ]
}