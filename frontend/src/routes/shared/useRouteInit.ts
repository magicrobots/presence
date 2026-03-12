/**
 * useRouteInit — shared route command initialization hook (US2 / T030).
 *
 * Encapsulates the two-step boilerplate repeated across all ~20 route commands:
 *   1. Retrieve the InputProcessor via useOutletContext.
 *   2. Run a one-shot useEffect that calls inputProcessor.setAppEnvironment().
 *
 * Usage:
 *   export default function CmdFoo() {
 *     const inputProcessor = useRouteInit((ip) => {
 *       const env = environmentHelpers.generateEnvironmentWithDefaults({ ... });
 *       ip.setAppEnvironment(env);
 *     });
 *     return null;
 *   }
 *
 * The setup function receives the InputProcessor and is responsible for
 * calling ip.setAppEnvironment() (and any pre-setup logic) exactly once on
 * mount. The eslint react-hooks/exhaustive-deps suppression is applied once
 * here rather than at every call site.
 *
 * Returns the InputProcessor so callers that also need refs or state
 * (e.g. CmdFling, CmdSettings) can continue to use it directly.
 */

import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

import type { InputProcessor } from '../../types/terminal';

export function useRouteInit(
    setup: (inputProcessor: InputProcessor) => void
): InputProcessor {
    const inputProcessor = useOutletContext<InputProcessor>();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { setup(inputProcessor); }, []);

    return inputProcessor;
}
