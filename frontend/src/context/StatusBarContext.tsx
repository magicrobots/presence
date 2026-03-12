import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

import MagicNumbers from '../constants/magic-numbers';

interface ViewportMeasurements {
    width: number;
    height: number;
}

interface StatusBarContextValue {
    statusMessage: string | null;
    drawStatusBar: (ctx: CanvasRenderingContext2D, viewportMeasurements: ViewportMeasurements) => void;
    clearStatusMessage: () => void;
    setStatusMessage: (newMessage: string | null) => void;
}

const StatusBarContext = createContext<StatusBarContextValue | null>(null);

interface StatusBarProviderProps {
    children: ReactNode;
}

export function StatusBarProvider({ children }: StatusBarProviderProps) {
    const [statusMessage, setStatusMessageState] = useState<string | null>(null);

    function drawStatusBar(ctx: CanvasRenderingContext2D, viewportMeasurements: ViewportMeasurements) {
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

    function setStatusMessage(newMessage: string | null) {
        setStatusMessageState(newMessage);
    }

    return (
        <StatusBarContext.Provider value={{ statusMessage, drawStatusBar, clearStatusMessage, setStatusMessage }}>
            {children}
        </StatusBarContext.Provider>
    );
}

export function useStatusBar(): StatusBarContextValue {
    const ctx = useContext(StatusBarContext);
    if (ctx === null) {
        throw new Error('useStatusBar must be used within a StatusBarProvider');
    }
    return ctx;
}

export default StatusBarContext;
