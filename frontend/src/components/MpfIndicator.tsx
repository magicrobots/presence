interface MpfIndicatorProps {
    mpf: string;
    isVisible: boolean;
}

export default function MpfIndicator({ mpf, isVisible }: MpfIndicatorProps) {
    if (!isVisible) return null;

    return (
        <div className="fps-indicator">fps: {mpf}</div>
    );
}
