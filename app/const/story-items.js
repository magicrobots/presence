export default {

    getItem(itemName) {
        return this.items.filter((currItem) => {
            return currItem.name === itemName;
        })[0];
    },

    items: [
        { id: 1,
        name: 'computer',
        state: 0 }
    ]
}