export default {

    getRoom(coords) {
        return this.rooms.filter((currRoom) => {
            if(currRoom.x === coords.x && currRoom.y === coords.y) {
                return true;
            }
        })[0];
    },

    rooms: [
        { id: 1,
        x:47,
        y:47,
        name: 'home',
        description: 'Having fallen asleep in the library, you realize it\'s quite late.',
        exits: {
            N: false,
            E: true,
            W: true,
            S: false
        },
        inventory: ['computer'],
        roomState: 0 }
    ]
}