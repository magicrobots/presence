import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { StatusBarProvider } from './context/StatusBarContext';
import { router } from './router';
import './styles/app.scss';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <StatusBarProvider>
            <RouterProvider router={router} />
        </StatusBarProvider>
    </React.StrictMode>
);
