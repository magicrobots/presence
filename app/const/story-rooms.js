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
            name: 'home',
            description: 'Having fallen asleep in the library, you realize it\'s quite late.',
            exits: {
                N: null,
                E: 'There is a stairway leading off to the east, ascending into darkness.',
                W: 'A bright hallway stretches westward, artwork illuminated along the walls.',
                S: null
            },
            inventory: ['computer'],
            roomState: 0
        },
        {
            id: 2,
            x:46,
            y:47,
            name: 'library-entrance',
            description: 'The sun warms your face as your foot falls softly on the cut grass outside the entrance to the library.  The street runs north south beyond the lawn.  There is a mailbox on the corner.',
            exits: {
                N: null,
                E: 'To the east, the library door is unlocked.  The flowers flanking the entrance are well cultivated.',
                W: null,
                S: 'Next to the pond to the south there is a walkway with benches and a trash can.  It has recently been swept.'
            },
            inventory: ['sandwich'],
            roomState: 0
        }
    ]
}