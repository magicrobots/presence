import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

import type { InputProcessor } from '../types/terminal';

export default function CmdClear() {
    const inputProcessor = useOutletContext<InputProcessor>();

    useEffect(() => {
        inputProcessor.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}
