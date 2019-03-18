
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
            description: 'The sun warms your face as your foot falls softly on the cut grass outside the entrance to the library.  The street runs east west beyond the lawn.',
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
                W: {
                    closed: null,
                    opened: 'Weaving through the trees is a dirt path heading west towards a break in the trees.'
                   },
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
            summary: 'in a large kitchen',
            description: 'Clearly a catering or restaurant kitchen, the room is large enough to accommodate dozens of preparation stations at rows of steel tables. To the north through the windows you recognize your city\'s skyline but something is different. Through the floor you feel occasional deep rumbling noises that rattle the stacked pots like a jazz percussionists brush on a snare drum.  Maybe it\'s the subway.',
            exits: {
                N: null,
                E: {
                    closed: null,
                    opened: 'There is a large service doorway leading east.'
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
            summary: 'three stories up in a covered connection between two buildings',
            description: 'You are in an enclosed, raised walkway connecting two buildings. The street far below you is empty. To the south you see through the windows the building eastward is billowing smoke from a number of large chimneys. Some of the smoke is thicker and darker than the rest. To the north there are unnaturally growing shadows darkening your view of the area. You hear thunder, but you see no clouds.',
            exits: {
                N: null,
                E: {
                    closed: 'To the east is a solid metal door with a red light glowing above it.',
                    opened: 'There is a door connecting the bridge to the eastern building.'
                   },
                W: {
                    closed: null,
                    opened: 'A plain service doorway is open to the west.'
                   },
                S: null
            }
        },
        {
            id: 8,
            x: 50,
            y: 46,
            summary: 'among a sea of dusty computer workstations',
            description: 'In every direction stretches an endless grid of computer monitors on small desks - each paired with a thick tan keyboard.  Not a single screen is on, everything is dusty and dark. The room is not quiet, however. There is a pulsing rhythmic industrial pounding the source of which you cannot identify accompanied by an electrical whining hum that seems to have the resonant frequency of your brain.',
            exits: {
                N: {
                    closed: null,
                    opened: 'To the north is a set of double doors flanked by fake plants, each door marked with a big blue H.'
                   },
                E: {
                    closed: null,
                    opened: 'Eastward is an open security door.  To the right of the door on the wall is a small corporate identifier that reads "LABORATORY".'
                   },
                W: {
                    closed: 'To the west is a solid metal door with a red light glowing above it.',
                    opened: 'To the west there is a door to the bridge.'
                   },
                S: {
                    closed: null,
                    opened: 'The southern face of the room is a massive floor to ceiling sliding wall set on heavy duty steel tracks in the floor. There is a sliver of darknes at its edge, the space beyond an inky void.'
                   }
            }
        },
        {
            id: 9,
            x: 50,
            y: 47,
            summary: 'in a giant machine room.  Maybe a factory',
            description: 'You are on a network of steel catwalks suspended above massive unidentifiable machines hundreds of feet below you.  The floor of the room is below street level, barely visible beneath snaking fingers of enclosed shafts, hoses, and more levels of catwalk. Steam and dripping water cloud your view and add to the quiet symphony of unidentifiable noises.',
            exits: {
                N: {
                    closed: null,
                    opened: 'The northern sliding wall is cracked open. You notice that its mobile bulk goes far below you, each floor supporting a railed extension. This thing is no joke.'
                   },
                E: {
                    closed: 'The catwalk leads east and terminates at what looks like a bank vault.',
                    opened: 'The catwalk leads east and terminates at an open bank vault.'
                   },
                W: null,
                S: null
            }
        },
        {
            id: 10,
            x: 50,
            y: 45,
            summary: 'on the helipad.  The robot stares at you expectantly',
            description: 'The cold wind rips through you as you step out onto a helipad.  Mind crushing sounds you have never heard reverberate off the nearby building roof structures and unsettle your stance.',
            exits: {
                N: null,
                E: null,
                W: null,
                S: {
                    closed: null,
                    opened: 'To the south is the only safety, the doorway through which you emerged.'
                   }
            }
        },
        {
            id: 11,
            x: 49,
            y: 48,
            summary: 'in the sewers',
            description: 'The first thing you notice is the smell. It\'s bad in a lot of ways.  You\'re not thrilled about the ankle deep ... whatever it is you\'re sloshing through either. It is dark here. Bare bulbs strung along the low arched ceiling illumniate the sewer line just enough for you to decide that you\'d rather not linger.',
            exits: {
                N: null,
                E: {
                    closed: null,
                    opened: 'The eastern wall is old hand stacked stone. Embedded awkwardly is a more modern doorway marked "MAINTENANCE".'
                   },
                W: {
                    closed: null,
                    opened: 'To the west the drain tunnel snakes up into the darkness.'
                   },
                S: null,
            }
        },
        {
            id: 12,
            x: 50,
            y: 48,
            summary: 'in the subway',
            description: 'The flickering overhead flourescent lights illumnate a subway tunnel.  The rail comes from the north and curves sharply to the east. There is a stopped train blocking the northern direction, and the absence of rats makes you happy and concerned at the same time.',
            exits: {
                N: null,
                E: {
                    closed: null,
                    opened: 'To the east, the rail stretches into darkness, the lights failing less than fifty meters away.'
                   },
                W: {
                    closed: null,
                    opened: 'The "MAINTENANCE" door to the west marks the beginning of the tracks\' turn.'
                   },
                S: {
                    closed: null,
                    opened: 'On the southern wall under the platform there is what looks like a cave, edged by markings that look almost like mayan writing, or at least what you think that would look like since you don\'t really have any idea.'
                   }
            }
        },
        {
            id: 13,
            x: 50,
            y: 49,
            summary: 'in a cave',
            description: 'You crawl down the tunnel, and it gets tighter and tighter. You are just about to turn around when you hear something scrambling towards you. There\'s no space to turn around and you can\'t back up quickly enough. The clawing foot falls get closer in the dark, and you can hear it breathing loudly. You see a glint of a great number of eyes and a wall of teeth and then you are eaten by an alien.',
            exits: {
                N: null,
                E: null,
                W: null,
                S: null
            }
        },
        {
            id: 14,
            x: 45,
            y: 48,
            summary: 'in the meadow',
            description: 'The sun is shining, the birds are chirping, the soft grass is delicate underfoot. You are in an open meadow, wildflowers bending in the gentle breeze.',
            exits: {
                N: null,
                E: {
                    closed: null,
                    opened: 'You can see a narrow path winding through the trees to the east.'
                   },
                W: null,
                S: null
            }
        },
        {
            id: 15,
            x: 51,
            y: 48,
            summary: 'at the crash site',
            description: 'You can\'t really believe what you\'re seeing. The subway line is perforated by something that has crashed through the ceiling into a massive crater.  Sunlight beams down fighting through the billowing smoke and rent steel girders and rebar above. In the center of it all is ... something. It could be a craft, a munition, or maybe a massive meteorite. It\'s impossible to know how long it has been here.',
            exits: {
                N: null,
                E: {
                    closed: null,
                    opened: 'To the east the subway has been blocked completely by debris.  However you notice some of the rubble has been organized into a sort of doorway, with more symbols you can\'t identify scratched into the rock.'
                   },
                W: {
                    closed: null,
                    opened: 'The subway tunnel yawns to the west, the twisted track unfurling like a tongue into the crash zone.'
                   },
                S: null
            }
        }

    ]
}