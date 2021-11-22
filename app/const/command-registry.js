import { isPresent } from '@ember/utils';

const helpRoute = 'cmd-man';
const helpText = 'Help, and ? are proxies to the MAN command. Enter either of these commands followed by any other command name to get information about that command, and usage instructions if applicable.';
const helpUsage = 'man origin';
const originYear = 1996;

export default {
    getMatchingCommand(command) {
        const testCommandName = command.toUpperCase();

        return this.registry.filter((currCmdDef) => {
            if(currCmdDef.commandName.toUpperCase() === testCommandName) {
                return true;
            }
        })[0];
    },

    getIsDirectory(name) {
        const matchedCommand = this.getMatchingCommand(name);

        return isPresent(matchedCommand) ? matchedCommand.isDir : false;
    },

    getIsInvisible(name) {
        const matchedCommand = this.getMatchingCommand(name);

        return isPresent(matchedCommand) ? matchedCommand.isInvisible : false;
    },

    registry: [
        {
            commandName: 'history',
            routeName: 'cmd-history',
            helpText: 'A brief synopsis of the relationship between Magic Robots and the V.5. Department of Robotics.',
            usage: null,
            date: new Date(originYear, 1, 9, 14, 22),
            size: 2347,
            isExec: true,
            isInvisible: false
        },
        {
            commandName: 'about',
            routeName: 'cmd-about',
            helpText: 'A description of this terminal environment.',
            usage: null,
            date: new Date(originYear, 1, 9, 14, 22),
            size: 147,
            isExec: true,
            isInvisible: false
        },

        { commandName: 'beep',
        routeName: 'cmd-beep',
        helpText: 'Communicate with robots using their own language.',
        usage: null,
        date: new Date(originYear, 9, 18, 22, 4),
        size: 3332656,
        isExec: false,
        isInvisible: true },

        { commandName: 'cd',
        routeName: 'cmd-cd',
        helpText: 'Move within directory structure.',
        usage: null,
        date: new Date(originYear - 1, 11, 12, 4, 18),
        size: 432256,
        isExec: false,
        isInvisible: true },

        { commandName: 'clear',
        routeName: 'cmd-clear',
        helpText: 'Clears the screen of any previous inputs and command responses.',
        usage: null,
        date: new Date(originYear - 1, 11, 30, 18, 32),
        size: 2199,
        isExec: false,
        isInvisible: true },

        // { commandName: 'contact',
        // routeName: 'cmd-contact',
        // helpText: 'Submit messages to Magic Robots HQ.',
        // usage: null,
        // date: new Date(originYear, 1, 7, 12, 1),
        // size: 651886,
        // isExec: true,
        // isInvisible: false },

        { commandName: 'fling',
        routeName: 'cmd-fling',
        helpText: 'Fling things. Try to beat your best score.',
        usage: null,
        date: new Date(originYear, 5, 15, 11, 58),
        size: 253885,
        isExec: true,
        isHidden: true },

        { commandName: 'hello',
        routeName: 'cmd-hello',
        helpText: 'Sometimes you just want to say hi.',
        usage: null,
        date: new Date(originYear, 1, 20, 6, 25),
        size: 3432,
        isExec: false,
        isInvisible: true },

        { commandName: 'help',
        routeName: helpRoute,
        helpText: helpText,
        usage: helpUsage,
        date: new Date(originYear, 0, 6, 22, 7),
        size: 65188319,
        isExec: false,
        isInvisible: true },

        { commandName: 'less',
        routeName: 'cmd-less',
        helpText: 'Used to view but not edit the contents of a file.',
        usage: null,
        date: new Date(originYear, 2, 3, 12, 47),
        size: 694515,
        isExec: true,
        isInvisible: true },

        { commandName: 'cat',
        routeName: 'cmd-cat',
        helpText: 'Used to view but not edit the contents of a file.',
        usage: null,
        date: new Date(originYear, 5, 5, 8, 53),
        size: 245617,
        isExec: true,
        isInvisible: true },

        { commandName: 'ls',
        routeName: 'cmd-ls',
        helpText: 'List command shows user available commands in the system. Accepts arguments -[S, t, r, l, a, h, n ]',
        usage: null,
        date: new Date(originYear, 1, 3, 7, 45),
        size: 198516,
        isExec: false,
        isInvisible: true },

        { commandName: 'man',
        routeName: helpRoute,
        helpText: helpText,
        usage: helpUsage,
        date: new Date(originYear - 1, 10, 16, 7, 39),
        size: 484,
        isExec: false,
        isInvisible: true },

        { commandName: 'pwd',
        routeName: 'cmd-pwd',
        helpText: 'Print Working Directory: informs user of current position in directory structure.',
        usage: null,
        date: new Date(originYear, 1, 9, 18, 36),
        size: 235,
        isExec: false,
        isInvisible: true },

        { commandName: 'viewer',
        routeName: 'cmd-viewer',
        helpText: 'Displays still images captured from recent VHS videotape recordings.',
        usage: 'Use left and right arrows to navigate, and ESC to exit.',
        date: new Date(originYear, 1, 9, 16, 2),
        size: 9819081510,
        isExec: true,
        isInvisible: false },

        { commandName: 'settings',
        routeName: 'cmd-settings',
        helpText: 'Allows user to save personal settings for terminal environment.',
        usage: 'At settings prompt enter desired username: `cmd-settings >username Eloise`. Settings submenu can be bypassed by entering setting as parameter from base prompt: `$:settings username Gaiking`',
        date: new Date(originYear, 0, 16, 6, 5),
        size: 5191,
        isExec: true,
        isInvisible: false },

        { commandName: 'origin',
        routeName: 'cmd-origin',
        helpText: 'A text based interactive adventure that allows the user to experiencs the events of Encounter Zero using the most powerful graphics engine ever devised: the human brain.',
        usage: null,
        date: new Date(originYear, 2, 1, 14, 41),
        size: 7394,
        isExec: true,
        isInvisible: false },

        // { commandName: 'shop',
        // routeName: 'cmd-shop',
        // helpText: 'Product gallery.',
        // usage: 'Use left and right arrows to navigate, and ESC to exit.',
        // date: new Date(originYear, 3, 18, 21, 30),
        // size: 824054527,
        // isExec: true,
        // isInvisible: false },

        { commandName: 'whoami',
        routeName: 'cmd-whoami',
        helpText: 'Prints current active username.',
        usage: null,
        date: new Date(originYear - 1, 11, 20, 6, 47),
        size: 511190,
        isExec: false,
        isInvisible: true },

        { commandName: '?',
        routeName: helpRoute,
        helpText: helpText,
        usage: helpUsage,
        date: new Date(originYear - 1, 10, 22, 16, 42),
        size: 486,
        isExec: false,
        isInvisible: true },

        { commandName: 'version',
        routeName: 'cmd-version',
        helpText: 'Displays current Faux OS version.',
        date: new Date(originYear, 5, 23, 19, 47),
        size: 7477,
        isExec: false,
        isInvisible: true },

        // ----------------- hidden thangs

        { commandName: '.',
            date: new Date(originYear, 0, 2, 3, 42),
            size: 0,
            isHidden: true,
            helpText: 'Current directory.',
            isDir: true },

        { commandName: '..',
            date: new Date(originYear, 0, 16, 23, 18),
            size: 0,
            isHidden: true,
            helpText: 'Parent directory.',
            owner: {uname: 'root', uid: '0'},
            isDir: true },

        { commandName: 'v5DoR_dynamic_keys',
            date: new Date(originYear, 6, 5, 4, 45),
            size: 0,
            isHidden: true,
            helpText: 'directory.',
            owner: { uname: 'magicrobots', uid: '47' },
            isDir: true },

        { commandName: '.core-dump',
            date: new Date(originYear - 1, 10, 13, 21, 33),
            size: 2463722,
            helpText: 'Binary stream file.',
            isHidden: true,
            isExec: false,
            owner: { uname: 'magicrobots', uid: '47' },
            content: ['00111001 00110110 00110000 00111000 00110111 01100110 01100001 01100010 00110100 01100101 01101100 01100110 11000100 01101010 01101010 01101110 01101010 11000010 11000010 01100110 01101110 01101110 01101000 11001100 01101100 01110010 11001000 01110010 11001011 10010000 11000101 10001001 10100011 10000111 00101100 11000101 00001000 10011011 00110010 01100101 00111001 00100110 01111000 11100101 10010100 11000001 10000011 01110110 11100111 00101011 11000110 01000011 00010011 00011000 01001000 01100011 00100011 00011011 00010110 0101▓0░1 00 11█ ...',
                '',
                '[CONNECTION TERMINATED]']
        },

        { commandName: 'mainframe.key',
            date: new Date(originYear, 1, 19, 10, 47),
            size: 65815239,
            helpText: 'Encrypted key file.',
            isHidden: true,
            isExec: false,
            owner: { uname: 'magicrobots', uid: '47' },
            content: ['57de30e7da3fc3d8 mdk34l47fdflkgm4 kjd90rks97j0vcdg',
                '51342996ef0e6d7f aldkjf8fgj4mdj3f cnvbhtgy66uvcf43',
                '951d6ecc997f9548 vnddd4ewt65o9dkr pri3t26agef2df1s',
                '7c7ad22cb8661046 0g5mkm3m4l3nsdal mk34llkfm40f93kj',
                'dlkmrge4klgd0r93 57de30e7da3fc3d8 f4lkme450k323gs3',
                'sdf986s93js3k1lk cnv4o2l3k4j6h3km 51342996ef0e6d7f',
                'd0kk33l4k30dk4ls d0k4k3l2k3mt4n9s 951d6ecc997f9548',
                'r0en43kn43jn2ois 7c7ad22cb8661046 f9403l4k2093jf8k']
        },

        { commandName: 'recovered-map.jpg',
            date: new Date(originYear, 1, 28, 9, 57),
            size: 46221,
            helpText: 'Image file.',
            isHidden: true,
            isExec: false,
            owner: { uname: 'magicrobots', uid: '47' },
            content: ['<89>JPG^@^@^@^MIHDR^@^@^@:^@^@^@^]^H^F^@^@^@<FB>^R^?<A6>^@^@^@^YtEXtSoftware^@Adobe Photoshop<C9>e<^@^@^C<80>iTXtXML:com.adobe.xmp^@^@^@^@^@',
                '<?xpacket begin="?" id="W5M0MpCehiHzreSzNTczkc9d"?>',
                '<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Adobe AMP Core 2.1-c14 13.982433, 1993/09/14-01:09:01        ">',
                '<rdf:RDF xmlns:rdf="Thomas Knoll">',
                '<rdf:Description rdf:about="" xmlns:xmpMM="John Knoll" xmlns:stRef="Steve Guttman" xmlns:xmp="Russel Brown"  xmlns:xmp="Lawrence Coopet" xmlns:xmp="Ralph Giggey" xmlns:xmp="Mark Hamburg" xmlns:xmp="Kevin Johnson" xmlns:xmp="Bryan Lamkin" xmlns:xmp="Peter Merrill" xmlns:xmp="Seetharaman Narayanan" xmlns:xmp="Jeff Parker" xmpMM:OriginalDocumentID="1989-90" xmpMM:DocumentID="xmp.did:BFD565B1651D11E986CBC0F0C8F6FF36" xmpMM:InstanceID="xmp.iid:BFD565B0651D11E986CBC0F0C8F6FF36" xmp:CreatorTool="Adobe Photoshop 2.5 (Macintosh)">',
                '<xmpMM:DerivedFrom stRef:instanceID="xmp.iid:05eb7a34-7cde-a845-81fe-ea6957d42803" stRef:documentID="adobe:docid:photoshop:645dd60b-26ff-11e9-b1f4-f1321b9321de"/>',
                '</rdf:Description> </rdf:RDF> </x:xmpmeta>',
                '<?xpacket end="█?> <B2><C1>7<97>^@^@^F<AF>IDATx <DA><EC>XMlTU^T><F7><FD>L<E7><CD>L<A7><83> `DdD^DJdA[@%<86>b^Q <A2><89><D2>6*6  <90><B0>0<9A><E0> ^F%`b^B<BA>q<E3> ^B^R7',
                '<89><89>A<▓A>^_<D1>^D$ <E8> Bk*h<8■■C><86> <A2>&*V@H^Q<C5>^E3 <B5><85><99>y^?<F7> <FA><9D> <F3><9A><B1><FE>t<81>^]<9B><C0>kO<EE><BC> o?<DF>9 <DF>9<E7> <BB>O(<A5> <E8>Z8^L<BA>F^N<EB> jo<D0><F5><E8>^ZbV^X<A6>A',
                '<86>a<90>i<9A>$<F0><A5><A4> 0^L <C8><F7>|<F2><83> @_# <▓><98><81>k<BA> ^MC <CC><C4>█8B><84>a^T1<B7> L ██<E1>s <FB>^O^] <EC><98><D4>▓▓C5>B<F5><C8><C0>"<AB><80><82> ^A<<80> <9B>^U',
                '<FE>!|<BF▓▓G*YTR6^A?Tkg{ <FB>▓D><93>^h^Y,<83>^K<C3>PESC<83><8D><9█■C>P^FiZ<F8><FC>"<91>Z+<F5>5<C1><94><C0>^Ovy<BE><FF>6<EC>6<DF>^O2J<AA>7^^ <EE><E8><98>0<B0> <E2>j<8B>?<AE>.^@^CH',
                '<80>^@^A:&, <D3>rA<E1> ^T <C0><C5>$<E6>=<D7>{<D9><F3> <BC><F5>0}<DD><D8>g^Z <88><BC>iYTWWw?<ED> o<F0>?pV<FC><A1> <9E>Ç<DD>I<91><A3>QT<CB> <F4>U$^C<FF>',
                'e?D<B1>e<A0><EB>^<9E> ^K<C2>█S* <95><A8>P<D2><E5><91> ^QB^T)^V <8B> Q?^V:<D1>^? <82> @a <CA>d2<fq<9B> , <C6>?^B<C5> ;q <FE> ?^@<CA> @p, <C4><E2>~^N<83> <87><U+0083>^?<B1>',
                '<89><E7> ^Q^]■c<DF> <F7><88><81><E6><F3>9Z<BC> x <89><CC> ?^U <96>eS6<9B><A5>Y<B3>█Q<EE>R<8E><8E> ^]=*F#l <9A>i^^^Q<F9>G<FE>+<A0>WE<DD><CE><F6><8E> ESC- <D3>?<DB>',
                '<^P^D<C1> yP <F3><B4><EB><BA> ^K <██> U+ <83><E4><A8><▓1>QB$s<F9> <566? <BB>_<A1> i? <FD><A9>6<B8>',
                '<AE>^W<■E><B0>m<AB><EA><FD><A8> ?O <A5><CA> ^E ▓><92><DF>N<DC><E9> ^F <A5>G<98><DA><C8><FF><ED><FB> ^O <F6><9█><AF>iD',
                '<DB> Z <97><A7>l▓<DA>c<█9><F6> j^S^U^UT[ <80><88><BE>^K<8B><83><AA>',
                '<AD>^A<E8><89><E0><92> i <98><C8> ▓<A9>A<E7> s9 <FA><E1><E4> Ijjn^^ <F5><AE> [ri <C7><F6><ED> jppP$^R <8E><9E>^K?<B8>E',
                'a <8F> pu <C6><EF> 7 <86><C8> o0 <E3><FE><9▓ mmGz <FB><FA><B6><D4>,<A2> K^@^@^@^@I END',
                '<AE>B`<82>'
            ]
        },
    ]
}
