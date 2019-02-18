export default {

    getRoom(coords) {
        return this.rooms.filter((currRoom) => {
            if(currRoom.x === coords.x && currRoom.y === coords.y) {
                return true;
            }
        })[0];
    },

    rooms: [
        {
            id: 1,
            x:47,
            y:47,
            summary: 'in the library',
            description: 'Smells like books.  You\'re in the library surrounded by vacant desks, everything tidy but clearly there has been plenty of recent activity. You realize It\'s quite late.',
            exits: {
                N: null,
                E: 'There is a closed industrial doorway leading to the east.',
                W: 'A bright hallway stretches westward, artwork illuminated along the walls.',
                S: null
            },
            inventory: [1],
            roomState: 0
        },
        {
            id: 2,
            x:46,
            y:47,
            summary: 'next to the pond outside the library',
            description: 'The sun warms your face as your foot falls softly on the cut grass outside the entrance to the library.  The street runs north south beyond the lawn.  There is a mailbox on the corner.',
            exits: {
                N: null,
                E: 'To the east, the library door is unlocked.  The flowers flanking the entrance are well cultivated.',
                W: null,
                S: 'Next to the pond heading south there is a walkway with benches.  It has recently been swept.'
            },
            inventory: [2],
            roomState: 0
        }
    ]
}