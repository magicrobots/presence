interface LoadingIndicatorProps {
    isVisible: boolean;
}

export default function LoadingIndicator({ isVisible }: LoadingIndicatorProps) {
    if (!isVisible) return null;

    return (
        <img className="loading-indicator" src="assets/loadingIndicator.gif" alt="loading" />
    );
}
