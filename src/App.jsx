import React from 'react';

import useInputProcessor from './hooks/useInputProcessor';
import IzaComputer from './components/IzaComputer';
import ScreenInput from './components/ScreenInput';

// App is the root layout rendered by the router.
// useInputProcessor() is the React equivalent of the Ember inputProcessor service —
// lifted here so both IzaComputer and ScreenInput share the same instance.
// IzaComputer renders <Outlet context={inputProcessor} /> so cmd routes can access it.
export default function App() {
    const inputProcessor = useInputProcessor();

    return (
        <div id="application-root">
            <main>
                <IzaComputer inputProcessor={inputProcessor} />
            </main>
            <div id="small-content">
                <ScreenInput inputProcessor={inputProcessor} />
            </div>
        </div>
    );
}
