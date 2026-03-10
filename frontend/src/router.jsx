import React from 'react';
import { createBrowserRouter } from 'react-router-dom';

import App from './App';

// cmd-* routes — all render null (output goes through inputProcessor.setAppEnvironment)
import CmdAbout    from './routes/CmdAbout';
import CmdBeep     from './routes/CmdBeep';
import CmdCat      from './routes/CmdCat';
import CmdCd       from './routes/CmdCd';
import CmdClear    from './routes/CmdClear';
import CmdContact  from './routes/CmdContact';
import CmdFling    from './routes/CmdFling';
import CmdHello    from './routes/CmdHello';
import CmdHistory  from './routes/CmdHistory';
import CmdLess     from './routes/CmdLess';
import CmdLs       from './routes/CmdLs';
import CmdMan      from './routes/CmdMan';
import CmdOrigin   from './routes/CmdOrigin';
import CmdPwd      from './routes/CmdPwd';
import CmdSettings from './routes/CmdSettings';
import CmdShop     from './routes/CmdShop';
import CmdVersion  from './routes/CmdVersion';
import CmdViewer   from './routes/CmdViewer';
import CmdWhoami   from './routes/CmdWhoami';

// Route names match the routeName values in constants/command-registry.js.
// help, man, and ? all resolve to 'cmd-man' (see helpRoute in command-registry.js).
// contact and shop are commented out in the registry but registered here so they
// can be restored without a router change.

export const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        children: [
            { path: 'cmd-about',    element: <CmdAbout />    },
            { path: 'cmd-beep',     element: <CmdBeep />     },
            { path: 'cmd-cat',      element: <CmdCat />      },
            { path: 'cmd-cd',       element: <CmdCd />       },
            { path: 'cmd-clear',    element: <CmdClear />    },
            { path: 'cmd-contact',  element: <CmdContact />  },
            { path: 'cmd-fling',    element: <CmdFling />    },
            { path: 'cmd-hello',    element: <CmdHello />    },
            { path: 'cmd-history',  element: <CmdHistory />  },
            { path: 'cmd-less',     element: <CmdLess />     },
            { path: 'cmd-ls',       element: <CmdLs />       },
            { path: 'cmd-man',      element: <CmdMan />      },
            { path: 'cmd-origin',   element: <CmdOrigin />   },
            { path: 'cmd-pwd',      element: <CmdPwd />      },
            { path: 'cmd-settings', element: <CmdSettings /> },
            { path: 'cmd-shop',     element: <CmdShop />     },
            { path: 'cmd-version',  element: <CmdVersion />  },
            { path: 'cmd-viewer',   element: <CmdViewer />   },
            { path: 'cmd-whoami',   element: <CmdWhoami />   },
        ]
    }
]);
