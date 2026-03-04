import React from 'react';

export default function LoadingIndicator({ isVisible }) {
    if (!isVisible) return null;

    return (
        <img className="loading-indicator" src="assets/loadingIndicator.gif" alt="loading" />
    );
}
