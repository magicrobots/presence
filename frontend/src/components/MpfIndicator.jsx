import React from 'react';

export default function MpfIndicator({ mpf, isVisible }) {
    if (!isVisible) return null;

    return (
        <div className="fps-indicator">testing performance: {mpf}</div>
    );
}
