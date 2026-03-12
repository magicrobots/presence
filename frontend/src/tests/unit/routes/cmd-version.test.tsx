import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import type { InputProcessor } from '../../../types/terminal';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('react-router-dom', () => ({
    useOutletContext: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeInputProcessor(version = '2.3.1'): InputProcessor {
    return {
        state: {
            currentCommand: '',
            currentArgs: [],
            rawUserEntry: '',
            maxCharsPerLine: 80,
            activeApp: undefined,
            bgImage: undefined,
            commandHistory: [],
            promptTimestamp: '',
            isPromptCursorVisible: true,
            cursorPosition: 0,
            currCommandIndex: 0,
            previousExecutionBlocks: [],
            forceDisplayCursor: false,
            displayAppNameInPrompt: undefined,
            interruptPrompt: undefined,
            keyOverrides: undefined,
            overrideScope: undefined,
            appContext: null,
        },
        promptLine1: '',
        promptLine2: '',
        currExecutionBlock: [],
        allDisplayLines: [],
        bgImageCallbackRef: { current: null },
        processKey: vi.fn(),
        handleScreenInput: vi.fn(),
        handleEsc: vi.fn(),
        handleDirection: vi.fn(),
        callArrow: vi.fn(),
        getOlderCommand: vi.fn(() => ''),
        getNewerCommand: vi.fn(() => ''),
        setAppEnvironment: vi.fn(),
        quit: vi.fn(),
        clear: vi.fn(),
        handleFunctionFromApp: vi.fn(),
        overrideArgs: vi.fn(),
        setBgImage: vi.fn(),
        getAppVersion: vi.fn(() => version),
        setMaxCharsPerLine: vi.fn(),
    };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CmdVersion', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls setAppEnvironment with activeAppName "cmd-version"', async () => {
        const mockIp = makeInputProcessor();
        const { useOutletContext } = await import('react-router-dom');
        vi.mocked(useOutletContext).mockReturnValue(mockIp);

        const { default: CmdVersion } = await import('../../../routes/CmdVersion');
        render(<CmdVersion />);

        expect(mockIp.setAppEnvironment).toHaveBeenCalledOnce();
        const env = vi.mocked(mockIp.setAppEnvironment).mock.calls[0][0];
        expect(env.activeAppName).toBe('cmd-version');
    });

    it('includes the app version string in the response', async () => {
        const mockIp = makeInputProcessor('4.2.0');
        const { useOutletContext } = await import('react-router-dom');
        vi.mocked(useOutletContext).mockReturnValue(mockIp);

        const { default: CmdVersion } = await import('../../../routes/CmdVersion');
        render(<CmdVersion />);

        const env = vi.mocked(mockIp.setAppEnvironment).mock.calls[0][0];
        expect(env.response).toEqual(['4.2.0']);
    });

    it('uses the version returned by getAppVersion at call time', async () => {
        const mockIp = makeInputProcessor('0.0.1-beta');
        const { useOutletContext } = await import('react-router-dom');
        vi.mocked(useOutletContext).mockReturnValue(mockIp);

        const { default: CmdVersion } = await import('../../../routes/CmdVersion');
        render(<CmdVersion />);

        expect(mockIp.getAppVersion).toHaveBeenCalled();
        const env = vi.mocked(mockIp.setAppEnvironment).mock.calls[0][0];
        expect(env.response[0]).toBe('0.0.1-beta');
    });

    it('renders null (no visible DOM output)', async () => {
        const mockIp = makeInputProcessor();
        const { useOutletContext } = await import('react-router-dom');
        vi.mocked(useOutletContext).mockReturnValue(mockIp);

        const { default: CmdVersion } = await import('../../../routes/CmdVersion');
        const { container } = render(<CmdVersion />);
        expect(container.firstChild).toBeNull();
    });
});
