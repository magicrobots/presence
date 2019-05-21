import environmentValues from '../const/environment-values';

export default {

    getItemById(itemId) {
        return this.items.filter((currItem) => {
            return currItem.id === itemId;
        })[0];
    },

    getItemByName(itemName) {
        return this.items.filter((currItem) => {
            return currItem.name === itemName;
        })[0];
    },

    items: [
        {
            id: 1,
            type: environmentValues.ITEM_TYPE_THING,
            name: 'computer',
            description: 'On a nearby table sits an old computer.',
            details: 'Its bulky CRT monitor is dark, save for a single blinking cursor in the corner. A tangle of wires snakes behind the desk and collects in a dusty old CPU case on the floor. Its green LED glows steadily.',
            detailsUsed: 'The monitor glows green with the stack of commands you entered. You\'re fairly sure what you did wasn\'t illegal.',
            use: {
                unlocks: {room: 1, direction: environmentValues.DIRECTION_E()},
                response: {
                    first: 'You are familiar with this system. You find the security settings and out of pure curiosity, you set everything to off. After the walls stop echoing with the sounds of the clicking keyboard, you hear an electronic hum, and a distant hollow click that seems to come from the HVAC vents. The light that was red on the door to the east now glows green.',
                    subsequent: 'You open up irc and browse #hottub for a few minutes. Nothing holds your interest.'
                }
            },
            isKey: null,
            weight: 100
        },
        {
            id: 2,
            type: environmentValues.ITEM_TYPE_FOOD,
            name: 'sandwich',
            description: 'There\'s a sandwich on a paper plate on the ground.',
            details: 'It\'s half eaten. There is some unidentifiable meat, or meat substitute along with some wilted undescernible vegetables. The paper plate it sits on is transparent with grease.',
            onEat: 'You eat the sandwich. You aren\'t sure if that was a good idea or not.',
            use: null,
            isKey: null,
            weight: 2
        },
        {
            id: 3,
            type: environmentValues.ITEM_TYPE_THING,
            name: 'pencil',
            description: 'Hey look a pencil!',
            details: 'An old number 2 pencil that could use sharpening but is still useable. It has that sour painted wood smell that pencils have. The eraser is missing.',
            use: null,
            isKey: null,
            weight: 1
        },
        {
            id: 4,
            type: environmentValues.ITEM_TYPE_DOC,
            name: 'papers',
            description: 'You almost step on some papers.',
            details: 'The loose stack of papers is stapled together at the corner, the first page curled over itself. Written there is the title: "A HACKER\'S MANUAL"',
            detailsUsed: 'The manual flops over in your hand like a Dali painting. Seemed like there was way more information in there than there are pages.',
            use: {
                unlocks: {item: 1},
                response: {
                    first: 'A HACKER\'S MANUAL: As you turn the pages, you can feel your mind expanding. You are engrossed. You begin not to need the reference section in the back as you absorb the terms and details. You almost feel like a physical gust of wind spirals around you as your understanding clicks into place. You are a hacker now.',
                    subsequent: 'You thumb through the pages again, but no further knowledge is found there.'
                }
            },
            isKey: null,
            weight: 3
        },
        {
            id: 5,
            type: environmentValues.ITEM_TYPE_THING,
            name: 'dollar',
            description: 'Looks like someone dropped a dollar.',
            details: 'There doesn\'t seem to be anything special about this dollar bill. It\'s creased down the middle and wrinkled and soft from years of circulation. Serial Number F42748580A.',
            use: null,
            isKey: {item: 6},
            weight: 1
        },
        {
            id: 6,
            type: environmentValues.ITEM_TYPE_THING,
            name: 'vending-machine',
            description: 'There\'s a vending-machine humming in the corner.',
            details: 'Behind the glass stands in formation an army of Snickers, Milky Way, Zagnut, O\'Henry, M&Ms, Almond Joy, Reese\'s Pieces, Zero, 100 Grand, Hershey\'s, Butterfinger, Kit Kat, Baby Ruth, 3 Musketeers, Twix, Nestle Crunch, Charleston Chew, Clark, and Watchamacallit bars.',
            detailsUsed: 'Taunting you from behind the glass stands in formation an army of Snickers, Milky Way, Zagnut, O\'Henry, M&Ms, Almond Joy, Reese\'s Pieces, Zero, 100 Grand, Hershey\'s, Butterfinger, Kit Kat, Baby Ruth, 3 Musketeers, Twix, Nestle Crunch, Charleston Chew, Clark, and Watchamacallit bars.',
            use: {
                unlocks: {room: environmentValues.ROOM_NULL(), direction: environmentValues.DIRECTION_NULL()},
                response: {
                    first: 'You insert the dollar bill into the tray and the mechanism pulls it in powerfully with an electronic whine. It ejects the bill immediately. You try again. Nope. Third time? Sorry. Your excited anticipation of a tasty treat is converted into frustration. You ball up your fist and clonk the machine on its side. You are rewarded with nothing more than a hollow clang and a sore hand.',
                    subsequent: 'You feed the bill into the tray again. Zeep zoop. Nothing. You are annoyed.'
                }
            },
            isKey: null,
            weight: 100
        },
        {
            id: 7,
            type: environmentValues.ITEM_TYPE_THING,
            name: 'flashlight',
            description: 'Standing on it\'s lens like a steel totem is a large flashlight.',
            details: 'It\'s a fist thick police style black knurled metal flashlight. Probably powered by a box full of D cell batteries, this thing looks like it could weather the apocalypse. It is heavy.',
            use: null,
            isKey: null,
            weight: 9
        },
        {
            id: 8,
            type: environmentValues.ITEM_TYPE_THING,
            name: 'badge',
            description: 'In the corner, face down on the floor is what looks like an employee\'s badge.',
            details: 'It has no photo but it says "LAB" on it in big black letters, beneath which stretches a broad barcode. There\'s a logo that looks like a square with an X in it that looks familiar to you. The card itself is thick and plastic, probably containing an RFID antenna.',
            use: null,
            isKey: [{room: 7, direction: environmentValues.DIRECTION_E()},
                    {room: 8, direction: environmentValues.DIRECTION_W()}],
            weight: 1
        },
        {
            id: 9,
            type: environmentValues.ITEM_TYPE_THING,
            name: 'wrench',
            description: 'Leaning against the wall is a massive wrench.',
            details: 'It tells its age in years and use through its worn edges and surface patina. There are wear marks that make you think it was used in ways a wrench is not necessarily intended.',
            use: null,
            isKey: null,
            weight: 10
        },
        {
            id: 10,
            type: environmentValues.ITEM_TYPE_THING,
            name: 'robot',
            description: 'Towering high above you is what can only be described as a giant robot. It turns and stares at you with an unearthly whine, leaning heavy against a building. It beeps, a deep physical tone like a fog horn but digital. ¯|_|¯|_|¯|_|¯|_|¯|_',
            details: 'The machine is almost humanoid in form, broad steel chest and arms like enormous bright excavators. It doesn\'t have a head but one thick glowing rectangular eye across the top half of its body. You can feel its gaze analyzing your very being. It also seems tired, despite clearly being enormously powerful.',
            detailsUsed: 'The machine is almost humanoid in form, broad steel chest and arms like enormous bright excavators. It doesn\'t have a head but one thick glowing rectangular eye across the top half of its body. You can feel its gaze analyzing your very being. It also seems tired, despite clearly being enormously powerful.',
            use: {
                unlocks: {room: 10, direction: environmentValues.DIRECTION_S()},
                response: {
                    first: '"Hello!" you yell up toward it. You wave awkwardly trying to be friendly and non-threatening. A piercing light from somewhere on it immediately sweeps your body and you freeze in place. Resonating inside your mind, the voice of the robot somehow speaks: "I see you brought cake. You are therefore trustworthy..." It places a small metal thing on the ground beside you. "This is a translator for the alien creature\'s language," it continues. "I need you to use it to bring me three stolen components so I can repair myself and rid your planet of these destructive monsters. A nav-card will repair my instruments. A hypercore will restore my full power. A human computer disk contains mapped locations of their hives. Bring me these things and we can end this. Disk. Nav-Card. Hypercore. GO!" You can\'t believe this is happening. Earlier today your greatest challenge was finding an open coffee shop.',
                    subsequent: environmentValues.ROBOT_RESPONSE_USED
                }
            },
            isKey: null,
            weight: 100000
        },
        {
            id: 11,
            type: environmentValues.ITEM_TYPE_THING,
            name: 'cake',
            description: 'Weirdly there is a slice of cake under glass on a small pedestal.',
            details: 'It\'s the kind of display you\'d see in a diner; a short pedestal with a broad base, topped by a fat cylindrical glass cover with an integrated glass sphere as a handle on top. Inside on the tray is a delicious looking slice of cake. Chocolate. You try to lift the cover and find that you can\'t.',
            use: null,
            isKey: {item: 10},
            weight: 6
        },
        {
            id: 12,
            type: environmentValues.ITEM_TYPE_DOC,
            name: 'translator',
            description: 'The translator the robot gave you hums quietly by the wall.',
            details: 'You feel a strange connection to this thing. It\'s not something you use; it seems to have a magical pathway to your mind\'s language center. You are excited and scared.',
            use: null,
            isKey: [{room: 16, direction: environmentValues.DIRECTION_S()},
                    {room: 17, direction: environmentValues.DIRECTION_N()}],
            weight: 4
        },
        {
            id: 13,
            type: environmentValues.ITEM_TYPE_THING,
            name: 'disk',
            description: 'A 3.5" High Density floppy disk sits on a shelf.',
            details: 'It\'s just a normal floppy disk, with average physical wear. It\'s unlocked, and scrawled across the lines of the label in hurried sharpie is a big black question mark. High Density 1.44 MB',
            use: null,
            isKey: null,
            isTrophy: true,
            weight: 1
        },
        {
            id: 14,
            type: environmentValues.ITEM_TYPE_THING,
            name: 'artifact',
            description: 'Hovering a few inches above the ground nearby is some sort of alien artifact.',
            details: 'It looks like a cube of metallic crystals spinning an mid-air. The artifact almost looks man-made, but somehow you know that it is something naturally occuring, and extremely rare in the universe. Just being in its presence you feel an expanding sense of awareness. You poke it. Nothing happens - you don\'t think it\'s alive.',
            use: null,
            isKey: [{room: 17, direction: environmentValues.DIRECTION_E()},
                    {room: 20, direction: environmentValues.DIRECTION_W()}],
            weight: 1
        },
        {
            id: 15,
            type: environmentValues.ITEM_TYPE_THING,
            name: 'helmet',
            description: 'Hanging on a hook is a pretty sweet looking full face helmet.',
            details: 'It\'s got a mirrored face mask and looks to be made of carbon fiber. There\'s a bit of bulk on the back that may hold batteries or something.',
            use: null,
            isKey: null,
            weight: 5
        },
        {
            id: 16,
            type: environmentValues.ITEM_TYPE_THING,
            name: 'vial',
            description: 'A vial of purple fizzy liquid sits on a table.',
            details: 'Looks like grape soda, but sparkles - just holding the container makes your fingers tingle like the feeling of pop rocks.',
            onDrink: 'You pop the top off of the vial of fluid, and it goes flying like a champagne cork. It smells like joy. It is fizzing like fireworks, its surface dancing in the tiny container. You can\'t help but toss your head back and pour the whole thing down your throat. YUM! It is delicious. Except your insides immediately explode and you crumple to the floor in a heap.',
            use: null,
            isKey: null,
            weight: 1
        },
        {
            id: 17,
            type: environmentValues.ITEM_TYPE_THING,
            name: 'controls',
            description: 'The space ship controls blink their lights at you.',
            details: 'Three stalks extend from the console, each a different thickness with a lever or two branching off them. You wonder if it is weaponized and if perhaps you could try to pilot it against the alien force.',
            use: null,
            isKey: null,
            weight: 1000
        },
        {
            id: 18,
            type: environmentValues.ITEM_TYPE_THING,
            name: 'nav-card',
            description: 'The nav-card is magnetically attached to the wall. You assume it\'s magnetism anyway, this is crazy alien technology.',
            details: 'It reminds you of a densely packed arrangement of legos, if they were made of unearthly metals. It\'s about the size of your forearm, but flat.',
            use: null,
            isKey: null,
            weight: 3
        },
        {
            id: 19,
            type: environmentValues.ITEM_TYPE_THING,
            name: 'hypercore',
            description: 'What could only be a brightly glowing hypercore is floating and rotating in the center of everything.',
            details: 'It\'s a constantly self-igniting nuclear explosion, contained by the gravity of its own mass. It would be infinitely heavy but there is some clever stuff going on with the containment unit allowing it to be portable. It\'s about the size of a basketball.  A basketball made of churning pulsing plasma and flame.',
            use: null,
            isKey: null,
            weight: 7
        },
        {
            id: 20,
            type: environmentValues.ITEM_TYPE_DRINK,
            name: 'water',
            description: 'A bottle of water stands upright on a table.',
            details: 'Upon close inspection it looks like your every day normal plastic bottle of water. Clear, full, tamper proof seal intact.',
            onDrink: 'You unscrew the cap and it clicks as it releases the plastic ring attached to the bottle. You take some glugs. It\'s fresh and clean and delicious. You slam the whole thing before you know it, you didn\'t realize how thirsty you were.',
            use: null,
            isKey: null,
            weight: 2
        },
        {
            id: 21,
            type: environmentValues.ITEM_TYPE_DRINK,
            name: 'coffee',
            description: 'Nearby sits a mug filled with what looks like coffee.',
            details: 'You sniff it. Yup, it\'s coffee. Black. There doesn\'t appear to be any mold growing on it. You wonder how long it has been here, and who made it. It is cold.',
            onDrink: 'Ah screw it, what could possibly go wrong. You grab the mug around the outer edge, not by the handle, and take a sip. It\'s fine. You pour the rest down your throat and look forward to being caffeinated. It\'s been a long ass day.',
            use: null,
            isKey: null,
            weight: 2
        },
        {
            id: 22,
            type: environmentValues.ITEM_TYPE_FOOD,
            name: 'pretzel',
            description: 'There\'s a napkin on one of the few clean flat surfaces upon which sits a big soft looking pretzel.',
            details: 'No mustard or anything, just some nice large perfect cubes of salt clinging to the shiny dark surface of the dough. It actually looks pretty good. Probably not fresh. But who knows.',
            onEat: 'You pick it up and take a bite. Nothing special, but it\'s not bad. You realize you\'re kinda hungry so you just mow through the whole thing. You wish this was like Alice\'s wonderland and you would grow to a towering 30 feet tall. Unfortunately this is reality of course.',
            use: null,
            isKey: null,
            weight: 1
        },
        {
            id: 23,
            type: environmentValues.ITEM_TYPE_FOOD,
            name: 'butterfinger',
            description: 'Your Butterfinger sits on the desk. Half eaten.',
            details: 'The wrapper is still complete, just split and rolled expertly back to allow access to the remaining portion of your favorite candy bar ever.',
            onEat: 'You aren\'t new to this. You cram the rest of the bar into your mouth in one bite. HOMPTH. God damn that was good. You pocket the wrapper till you find a trash can.',
            use: null,
            isKey: null,
            weight: 1
        },
        {
            id: 24,
            type: environmentValues.ITEM_TYPE_DOC,
            name: 'sign',
            description: 'Secured prominently to the wall for all to see is a strangely worded sign.',
            details: 'It seems more like something you\'d see in a dangerous machine filled factory workplace rather than a room filled with desks and computers. It is screwed to the wall with large rusty bolts, the paint on the sign old and flaking. Large spot lights on the ceiling illuminate it generously.',
            content: ['DEPARTMENT OF ROBOTICS CODE OF CONDUCT:',
                ' - Do not write down dynamic passwords.',
                ' - They are right. You are wrong.',
                '',
                'DEPARTMENT OF ROBOTICS SAFETY POLICY:',
                ' - Carry secured cake on your person at all times.',
                ' - Shut all Rune doors behind you.',
                ' - Adhere strictly to Buddy policy (SP - A47p33).',
                '',
                'DEPARTMENT OF ROBOTICS EVACUATION PROCEDURE:',
                ' - This one is here just to make sure you\'re paying attention. Remember, failure to adhere to CoC and SP protocols could result in collapse or crossing over, both of which result in events from which there is no evacuation.',
                '',
                'DAYS SINCE LAST INCEDENT:',
                ' - 0',
                '',
                'V.5.'],
            use: null,
            isKey: null,
            weight: 1000
        },
        {
            id: 25,
            type: environmentValues.ITEM_TYPE_DOC,
            name: 'magazine',
            description: 'Half open splayed across the table lies a well worn magazine.',
            details: 'You flip over the glossy cover to read it\'s titled "Astronomy". The cover stories are about a "Puzzling Supernova in M81" and a "New U.S. Mission to the Moon".',
            content: ['... a bunch of stuff you don\'t understand and mostly you learn that you don\'t really have any interest in astronomy.'],
            use: null,
            isKey: null,
            weight: 2
        },
        {
            id: 26,
            type: environmentValues.ITEM_TYPE_DOC,
            name: 'newspaper',
            description: 'You see a newspaper, or what\'s left of it, crumpled up on the floor just out of reach.',
            details: 'It\'s actually just a single article torn out of a newspaper and folded. You can\'t tell what newspaper it comes from or what the date of publication is. There are ads for shitty used cars on the back.',
            content: ['EVALUATION OF WIRELESS TECHNOLOGY',
                '',
                'A study released today shows that more than 30% of people in the US could be using wireless communications in the next decade.',
                '',
                'Marcus Franklin, vice president of Mercer Management Consulting said "Prices are going to drop like a stone, In the process, there are going to be a number of companies that will not make it."',
                '',
                'The wireless sphere will operate mostly via new personal communications services that operate on a wide spectrum of radio frequencies.',
                '',
                'Almost half the experts interviewed by Mercer projected wireless service would become "a viable substitute" for current wire-line service within 10 years.',
                '',
                'Wireless devices and services will initally be used for voice communications, then fax and data communications will emerge "very slowly and becoming more important over the next decade."'],
            use: null,
            isKey: null,
            weight: 2
        },
        {
            id: 27,
            type: environmentValues.ITEM_TYPE_DOC,
            name: 'book',
            description: 'There\'s a book.',
            details: '',
            content: ['book things.', '', 'line two.'],
            use: null,
            isKey: null,
            weight: 2
        }
    ]
}