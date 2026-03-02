import React from 'react';
import { Outlet } from 'react-router-dom';

// TODO Phase 3: import IzaComputer from './components/IzaComputer';
// TODO Phase 3: import ScreenInput from './components/ScreenInput';

export default function App() {
    return (
        <div id="application-root">
            <main>
                {/* IzaComputer renders here — added in Phase 3 */}
            </main>
            <div id="small-content">
                {/* ScreenInput renders here — added in Phase 3 */}
            </div>
            <Outlet />
        </div>
    );
}
