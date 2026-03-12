import { useRouteInit } from './shared/useRouteInit';

export default function CmdClear() {
    useRouteInit((ip) => {
        ip.clear();
    });

    return null;
}
