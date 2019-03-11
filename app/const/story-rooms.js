
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
            }
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
            }
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
            }
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
            }
        },
        {
            id: 5,
            x: 48,
            y: 48,
            summary: 'inside a server room',
            description: 'Columns of floor to ceiling rack servers surround you.  Dense clusters of tiny blinking lights busy the space like an active beehive.  Most towers have well routed cables, organized in careful angled tributaries flowing into large gathered bundles that disappear into the ceiling.',
            exits: {
                N: {
                    closed: null,
                    opened: 'There is a single windowless access door to the north.'
                   },
                E: {
                    closed: null,
                    opened: 'A floor level vent cover looks like it has been unscrewed.  Beyond is a narrow downward sloping tunnel, stretching eastward into blackness.'
                   },
                W: null,
                S: null
            }
        },
        {
            id: 6,
            x: 48,
            y: 46,
            summary: 'in a kitchen',
            description: 'industrial kitchen, lots of steel, blah blah. Starting to hear weird noises.',
            exits: {
                N: null,
                E: {
                    closed: null,
                    opened: 'A service doorway leading east.'
                   },
                W: null,
                S: {
                    closed: null,
                    opened: 'Double swinging doors with circular windows open to the south.'
                   }
            }
        },
        {
            id: 7,
            x: 49,
            y: 46,
            summary: 'in a covered bridge',
            description: 'Street below you, not sure you should keep going.',
            exits: {
                N: null,
                E: {
                    closed: 'To the east is a solid metal door with a red light glowing above it.',
                    opened: 'A solid metal door on the east side of the bridge.'
                   },
                W: {
                    closed: null,
                    opened: 'A service doorway to the west.'
                   },
                S: null
            }
        },
        {
            id: 8,
            x: 50,
            y: 46,
            summary: 'among a sea of dusty computer stations',
            description: 'So many computers, all off.  Lots of empty cans of tab soda and 1.25" floppy disks lying around. Scary noises.',
            exits: {
                N: {
                    closed: null,
                    opened: 'helipad access?!'
                   },
                E: {
                    closed: null,
                    opened: 'Clean room access to lab.'
                   },
                W: {
                    closed: null,
                    opened: 'A doorway to the bridge.'
                   },
                S: {
                    closed: null,
                    opened: 'Massive steel sliding door.'
                   }
            }
        }
    ]
}