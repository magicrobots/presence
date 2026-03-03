import { createContext, useContext, useState } from 'react';

import MagicNumbers from '../constants/magic-numbers';

const StatusBarContext = createContext(null);

export function StatusBarProvider({ children }) {
    const [statusMessage, setStatusMessageState] = useState(null);

    function drawStatusBar(ctx, viewportMeasurements) {
        if (statusMessage != null) {
            // draw rect
            const rectHeight = 30;
            const textY = viewportMeasurements.height - 15;
            ctx.fillStyle = '#4ba0ff';
            ctx.fillRect(0, viewportMeasurements.height - rectHeight, viewportMeasurements.width, rectHeight);

            // Draw text
            const textX = viewportMeasurements.width -
                statusMessage.length * MagicNumbers.STATUS_FONT_CHARACTER_WIDTH -
                MagicNumbers.STATUS_BORDER;

            ctx.font = `700 ${MagicNumbers.STATUS_FONT_SIZE}px courier-std`;
            ctx.fillStyle = '#000000';
            ctx.fillText(statusMessage, textX, textY);
            ctx.fillText(statusMessage, textX - 1, textY);
            ctx.fillText(statusMessage, textX - 2, textY);
        }
    }

    function clearStatusMessage() {
        setStatusMessageState(null);
    }

    function setStatusMessage(newMessage) {
        setStatusMessageState(newMessage);
    }

    return (
        <StatusBarContext.Provider value={{ statusMessage, drawStatusBar, clearStatusMessage, setStatusMessage }}>
            {children}
        </StatusBarContext.Provider>
    );
}

export function useStatusBar() {
    return useContext(StatusBarContext);
}

export default StatusBarContext;
