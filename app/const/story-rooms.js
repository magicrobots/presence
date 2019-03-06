
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
        },
        {
            id: 4,
            x: 48,
            y: 47,
            summary: 'in the reception area',
            description: 'You are in what looks like a reception area for a long defunct corporation.  There is an empty desk in the center with a shadow where the logo signage used to be.  Each step you take disturbs a noticeably thick layer of dust on the industrial floor, sending lazy floating particles into the sunbeams cascading through the skylight.  You start to feel strangely alone.',
            exits: {
                N: {
                    closed: null,
                    opened: 'Double swinging doors with circular windows hint at a bright hallway leading north.'
                   },
                E: null,
                W: {
                    closed: null,
                    opened: 'A heavy industrial doorway leads to the west.'
                   },
                S: {
                    closed: null,
                    opened: 'To the south is a half open door showing a bold red lettered sign: \'No Admittance\'.'
                   }
            },
            roomState: 0
        }
    ]
}