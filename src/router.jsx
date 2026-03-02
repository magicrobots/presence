import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from './App';

// Routes will be added here as each cmd-* route is migrated (Phase 4).
// The command registry drives route generation — see constants/command-registry.js.

export const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        children: [
            // cmd routes are added here during Phase 4
        ]
    }
]);
