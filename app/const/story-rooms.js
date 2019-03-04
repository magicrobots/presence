
export default {

    getRoom(coords) {
        return this.rooms.filter((currRoom) => {
            if(currRoom.x === coords.x && currRoom.y === coords.y) {
                return true;
            }
        })[0];
    },

    getRoomById(roomId) {
        return this.rooms.findBy('id', roomId);
    },

    rooms: [
        {
            id: 1,
            x: 47,
            y: 47,
            summary: 'in the library',
            description: 'Smells like books.  You\'re in the library surrounded by vacant desks, everything tidy but clearly there has been plenty of recent activity.',
            exits: {
                N: null,
                E: {
                    closed: 'There is a locked industrial doorway leading to the east. Looks like you need an RFID badge or something to gain access.',
                    opened: 'There is an industrial doorway leading to the east.'
                    },
                W: {
                    closed: null,
                    opened: 'A bright hallway stretches westward, artwork illuminated along the walls.'
                    },
                S: null
            },
            roomState: 0
        },
        {
            id: 2,
            x: 46,
            y: 47,
            summary: 'next to the pond outside the library',
            description: 'The sun warms your face as your foot falls softly on the cut grass outside the entrance to the library.  The street runs north south beyond the lawn.  There is a mailbox on the corner.',
            exits: {
                N: null,
                E: {
                    closed: null,
                    opened: 'To the east, the library door is unlocked.  The flowers flanking the entrance are well cultivated.'
                   },
                W: null,
                S: {
                    closed: null,
                    opened: 'Next to the pond heading south there is a walkway with benches.  It has recently been swept.'
                   }
            },
            roomState: 0
        },
        {
            id: 3,
            x: 46,
            y: 48,
            summary: 'in the forest',
            description: 'Deep creaks resonate around you as the breeze gently bends the network of branches sprawling above you. Moss clings to the rolling earth in every direction, softening every sound and beckoning your touch.',
            exits: {
                N: {
                    closed: null,
                    opened: 'There is a gently worn track to the north that dissolves into the mossy forest floor around you.'
                   },
                E: null,
                W: null,
                S: null
            },
            roomState: 0
        }
    ]
}