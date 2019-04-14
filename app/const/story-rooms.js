
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
            description: 'Smells like old paper and leather bindings. You\'re in the library surrounded by vacant desks, everything tidy but clearly there has been plenty of recent activity.',
            completed: 'Back in the library',
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
            completed: 'Out by the pond.  It\'s pretty',
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
            description: 'Deep creaks resonate around you as the breeze gently bends the network of branches sprawling above you. Moss clings to the rolling earth in every direction, softening sound and beckoning your touch.',
            completed: 'Back in the pretty forest',
            exits: {
                N: {
                    closed: null,
                    opened: 'There is a gently worn track to the north that dissolves into the mossy forest floor around you.'
                   },
                E: null,
                W: {
                    closed: null,
                    opened: 'Weaving through the trees is a dirt path heading west towards a small clearing.'
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
            completed: 'All you can think of is the vending-machine.',
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
                    opened: 'To the south is a barely noticeable closet door showing a bold red lettered sign: \'No Admittance\'.'
                   }
            }
        },
        {
            id: 5,
            x: 48,
            y: 48,
            summary: 'inside a server room',
            description: 'Columns of floor to ceiling rack servers surround you.  Dense clusters of tiny blinking lights busy the space like an active beehive.  Most towers have well routed cables, organized in careful angled tributaries flowing into large gathered bundles that disappear into the ceiling.',
            completed: 'Back among the humming servers.',
            exits: {
                N: {
                    closed: null,
                    opened: 'There is a single windowless access door to the north.'
                   },
                E: {
                    closed: null,
                    opened: 'On the eastern wall, a floor level vent cover looks like it has been unscrewed.'
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
            completed: 'Here you are in the kitchen. Maybe make yourself a sammich.',
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
            completed: 'In the bridge, you see a butterfly.',
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
            completed: 'Surrounded by desks. You think about booting up one of the machines and playing zork.',
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
            description: 'You are on a network of steel catwalks suspended above massive factory machines hundreds of feet below you.  The floor of the room is below street level, barely visible beneath snaking fingers of enclosed shafts, hoses, and more levels of catwalk. Steam and dripping water cloud your view and add to the quiet symphony of unidentifiable noises.',
            completed: 'This place still feels creepy. You imagine maybe this is what it is like inside that magical robot.',
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
            completed: 'The view from the helipad is a bit of a disaster, but at least the only sound now is the quiet breeze and some chirping birds.',
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
            completed: 'Sewers still stinky.',
            exits: {
                N: null,
                E: {
                    closed: null,
                    opened: 'The eastern wall is old hand stacked stone. Embedded awkwardly is a more modern doorway marked "MAINTENANCE".'
                   },
                W: {
                    closed: null,
                    opened: 'To the west the vent tunnel snakes up into the darkness.'
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
            completed: 'Subway still creepy.',
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
                    opened: {
                        unknown: 'On the southern wall under the platform there is what looks like a cave, edged by markings that look almost like mayan writing, or at least what you think that would look like since you don\'t really have any idea.',
                        translated: 'On the southern wall under the platform there is what looks like a cave. The runes carved into the stone above it read "NOT WELCOME".'
                        }
                   }
            }
        },
        {
            id: 13,
            x: 50,
            y: 49,
            summary: 'in a cave',
            completed: 'You get stuck and starve to death sorry.',
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
            completed: 'The meadow is pretty.',
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
            description: 'You can\'t really believe what you\'re seeing. The subway line is perforated by something that has crashed through the ceiling into a massive crater.  Sunlight beams down fighting through the billowing smoke and rent steel girders and twisted fingers of rebar above. In the center of it all is ... something. It could be a craft, a munition, or maybe a massive meteorite. There is rubble and ruin everywhere.',
            completed: 'Crash site still a disaster. You wonder what the news crews will make of this madness.',
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
        },
        {
            id: 16,
            x: 51,
            y: 46,
            summary: 'in the laboratory',
            description: 'Suspended chaos. The room is not large, and the density of objects contained within contributes to the feeling of claustrophobic disarray. It\'s as if a hoarder lived here, and they accumulated only objects of scientific nature. And then a bomb went off. It actually looks like there was an explosion on the south side of the room. There are stacks of papers and beakers on almost every surface.',
            completed: 'You see a rubik\'s cube. You solve it in a minute and a half using rudimentary CFOP.',
            exits: {
                N: null,
                E: null,
                W: {
                    closed: null,
                    opened: 'To the west is an open security door.'
                   },
                S: {
                    closed: 'The southern door is operated by a control panel with unidentifiable runes on each button. You are too scared to touch any of them.',
                    opened: 'Beside the southern door is a control panel covered with switches and buttons labeled with alien runes. One button just says "OPEN".'
                   }
            }
        },
        {
            id: 17,
            x: 51,
            y: 47,
            summary: 'in the cube shaped room',
            description: 'So this is crazy. The room is basically a giant perfect grey cube. The walls, ceiling and floor are all identically constructed of what looks like thin steel cables packed tightly against themselves. The room feels larger than it is.',
            completed: 'The cube room still blows your mind. You take a minute and just look around. It makes you a little uncomfortable, like standing too close to the edge of a cliff.',
            exits: {
                N: {
                    closed: 'You don\'t remember which button on the control panel is the right one.  You\'re pretty sure if you hit the wrong button you could implode the universe.',
                    opened: 'To the north is a door controlled by a complicated control panel. One button is marked "OPEN".'
                   },
                E: {
                    closed: 'A bunch of lights shine on a single blank point of the eastern wall.',
                    opened: 'There is seriously a video-game style floating portal glowing blue in front of the eastern wall. Through it you see some things you can\'t quite describe.'
                   },
                W: null,
                S: null
            }
        },
        {
            id: 18,
            x: 52,
            y: 48,
            summary: 'in a creepy dark tunnel',
            description: 'It is dark in here. You really need to find a working flashlight.',
            completed: 'Still dark.',
            exits: {
                N: null,
                E: {
                    closed: null,
                    opened: 'You can\'t see anything in any direction.'
                   },
                W: {
                    closed: null,
                    opened: 'It\'s so dark you can\'t even see your own hand in front of your face.'
                   },
                S: {
                    closed: null,
                    opened: 'Smells like earth.'
                   }
            }
        },
        {
            id: 19,
            x: 53,
            y: 48,
            summary: 'in the cave with the weird machines hooked up to each other',
            description: 'You find yourself in some sort of underground workspace. There doesn\'t seem to be anyone, or anyTHING around. There\'s a perfect glowing orb providing dim light and casting long shadows up the walls. There are a number of machines sitting heavy in the earth connected to each other by strings of wiring and thick cords running along the ground. These are things you have never seen before in any context. There are what look like computer parts strewn about.',
            completed: 'You still don\'t get what is going on here.',
            exits: {
                N: null,
                E: null,
                W: {
                    closed: null,
                    opened: 'To the west is a rocky hill of rubble: up at the top is the cave you came in from.'
                   },
                S: null
            }
        },
        {
            id: 20,
            x: 52,
            y: 47,
            summary: 'in ... a space garage',
            description: 'You just about lose your mind as you absorb your surroundings. You must be on some alien space ship. The architecture is not built to your scale, it\'s all just a little bit too big.  You feel like Alice in Wonderland. This area is very well organized; everywhere you look are grids of shelves holding different sized containers, each filled with strange items. The walls are adorned with strange tools or weapons arranged in a perfectly balanced layout. No area is empty, but it is not cluttered. The ceiling glows a bright green, and there are bars of brilliant but flat light along each shelves edge. Weirdly, You have lost all sense of direction.',
            isInSpace: true,
            completed: 'You take your time and look around. Everything in this garage is ridiculous.',
            exits: {
                N: {
                    closed: null,
                    opened: 'A hallway snakes into the distance, lit both by the floor and the ceiling.'
                   },
                E: {
                    closed: null,
                    opened: {
                        unknown: 'A circular door is inset into the wall, labeled by mysterious alien runes.',
                        translated: 'A circular door is inset into the wall, it is labeled "Engine Room".'
                    }
                   },
                W: {
                    closed: 'Incredibly complicated looking tools are hung elegantly on the wall.',
                    opened: 'The portal hovers in mid air, illuminating nearby stacks of coiled space chain.'
                   },
                S: null
            }
        },
        {
            id: 21,
            x: 52,
            y: 46,
            summary: 'in ... a space kitchen',
            description: 'Lots of closed storage, and formless voids in the walls. There is a large table in the center of the room. Seems like a kitchen for horrible deadly monsters.',
            isInSpace: true,
            completed: 'You try to open every enclosure. You are unable to open anything. You are no longer convinced this is a kitchen.',
            exits: {
                N: null,
                E: {
                    closed: null,
                    opened: 'There\'s a grand square hallway lined with flags going off in one direction.'
                   },
                W: null,
                S: {
                    closed: null,
                    opened: 'A doorway sits between two counters; it opens on its own when you approach.'
                   }
            }
        },
        {
            id: 22,
            x: 53,
            y: 46,
            summary: 'on the command deck',
            description: 'The room is wide open and spacious - there are what look like orbital maps and star charts projected dimensionally into the center of the room. There are buttons and screens everywhere.',
            isInSpace: true,
            completed: 'In the command deck, you pretend you\'re in Star Trek for a minute. It would be more fun with some friends.',
            exits: {
                N: {
                    closed: null,
                    opened: {
                        unknown: 'There is a small, windowless, very secure looking hatch in the wall, labeled with mysterious alien runes.',
                        translated: 'There is a small, windowless, very secure looking hatch in the wall labeled "PILOT".'
                    }
                   },
                E: {
                    closed: null,
                    opened: 'One face of the room houses a big blue door.'
                   },
                W: {
                    closed: null,
                    opened: 'There\'s a grand square hallway lined with flags going off in one direction.'
                   },
                S: {
                    closed: null,
                    opened: {
                        unknown: 'A circular door is inset into the wall, labeled with mysterious alien runes.',
                        translated: 'A circular door is inset into the wall, it is labeled "Engine Room".'
                    }
                   }
            }
        },
        {
            id: 23,
            x: 54,
            y: 46,
            summary: 'in ... a space bedroom',
            description: 'If you slept in hammocks made of slimy razorwire you\'d be right at home here.',
            isInSpace: true,
            completed: 'These barracks are just awful.',
            exits: {
                N: null,
                E: null,
                W: {
                    closed: null,
                    opened: 'One face of the room houses a big blue door.'
                   },
                S: {
                    closed: null,
                    opened: {
                        unknown: 'There\'s a giant steel angled door with a big red button on it, adorned with alien runes.',
                        translated: 'There\'s a giant steel angled door with a big red button on it, labeled: "DANGER: AIRLOCK".'
                    }
                   }
            }
        },
        {
            id: 24,
            x: 54,
            y: 47,
            summary: 'in the airlock',
            description: 'The door opens and in a split second you realize you have made a grave error. You, and everything around you are sucked into the void of space. It is quick, but a cold and lonely death.',
            completed: 'You open the airlock like a n00b. SHLOOP! Out into space you go. Sorry you died.',
            exits: {
                N: null,
                E: null,
                W: null,
                S: null
            }
        },
        {
            id: 25,
            x: 53,
            y: 47,
            summary: 'in the engine room',
            description: 'This room is pretty incredible.  Every surface is packed tightly with weaving cables and tubes, each feeding fuel or power to one of the dozens of indecipherable structures uniformly filling the space. In the center of the floor is a single massive object that you\'re guessing, with your extensive knowledge of alien warcraft, is the main thruster.',
            isInSpace: true,
            completed: 'Everything in here is so cool. You admire some glowing lines and excquisitely architected cable routing.',
            exits: {
                N: {
                    closed: null,
                    opened: 'Behind a floor to ceiling column of cables there is a round door.'
                   },
                E: {
                    closed: null,
                    opened: {
                        unknown: 'A giant steel angled door with a big red button on it, adorned with alien runes.',
                        translated: 'A giant steel angled door with a big red button on it, labeled: "DANGER: AIRLOCK".'
                    }
                   },
                W: {
                    closed: null,
                    opened: 'Another round door is inset into the wall on the other side of the room.'
                   },
                S: null
            }
        },
        {
            id: 26,
            x: 53,
            y: 45,
            summary: 'in the cockpit',
            description: 'You are looking out into the blackness of space through two large rectangular windows. Like the stars, which from here are indescribably beautiful, the points of light from the buttons and illuminated switches on the controls shine from every direction. This must be the ship\'s cockpit.',
            isInSpace: true,
            completed: 'This room makes you a little sad. You want to see other worlds. You want to explore the limits of this ships capability. But every time you push a button you are killed.',
            exits: {
                N: null,
                E: null,
                W: null,
                S: {
                    closed: null,
                    opened: 'Behind you is the small hatch you emerged from.'
                   }
            }
        },
        {
            id: 27,
            x: 52,
            y: 49,
            summary: 'in a cave',
            description: 'You wave your hands in front of you as you proceed into the darkness. You hear something coming towards you.  Quickly. You slip as you turn to run. The clawing foot falls get closer in the dark, and you can hear it breathing loudly as you scramble to get up. You see a glint of a great number of eyes and a wall of teeth and then you are eaten by an alien.',
            completed: 'It is so dark you fail to see the 500 foot crevasse and you fall for about 15 seconds and black out before you are killed by the impact.',
            exits: {
                N: null,
                E: null,
                W: null,
                S: null
            }
        }
    ]
}