import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { StatusBarProvider } from './context/StatusBarContext';
import { router } from './router';
import './styles/app.scss';

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error('Root element #root not found in document');
}

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <StatusBarProvider>
            <RouterProvider router={router} />
        </StatusBarProvider>
    </React.StrictMode>
);
