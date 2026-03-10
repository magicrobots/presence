import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

export default function CmdClear() {
    const inputProcessor = useOutletContext();

    useEffect(() => {
        inputProcessor.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}
