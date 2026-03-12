import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import type { InputProcessor } from '../../../types/terminal';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('react-router-dom', () => ({
    useOutletContext: vi.fn(),
}));

vi.mock('../../../utils/persistence', () => ({
    default: {
        getUsername: vi.fn(() => 'testuser'),
    },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeInputProcessor(): InputProcessor {
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
        getAppVersion: vi.fn(() => '1.0.0'),
        setMaxCharsPerLine: vi.fn(),
    };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CmdHello', () => {
    let mockInputProcessor: InputProcessor;

    beforeEach(async () => {
        vi.clearAllMocks();
        mockInputProcessor = makeInputProcessor();
        const { useOutletContext } = await import('react-router-dom');
        vi.mocked(useOutletContext).mockReturnValue(mockInputProcessor);
    });

    it('calls setAppEnvironment with activeAppName "cmd-hello"', async () => {
        const { default: CmdHello } = await import('../../../routes/CmdHello');
        render(<CmdHello />);

        expect(mockInputProcessor.setAppEnvironment).toHaveBeenCalledOnce();
        const env = vi.mocked(mockInputProcessor.setAppEnvironment).mock.calls[0][0];
        expect(env.activeAppName).toBe('cmd-hello');
    });

    it('includes the username in the response', async () => {
        const { default: CmdHello } = await import('../../../routes/CmdHello');
        render(<CmdHello />);

        const env = vi.mocked(mockInputProcessor.setAppEnvironment).mock.calls[0][0];
        expect(env.response).toEqual(['Hello testuser']);
    });

    it('falls back gracefully when getUsername returns null', async () => {
        const persistence = await import('../../../utils/persistence');
        vi.mocked(persistence.default.getUsername).mockReturnValueOnce(null);

        const { default: CmdHello } = await import('../../../routes/CmdHello');
        render(<CmdHello />);

        const env = vi.mocked(mockInputProcessor.setAppEnvironment).mock.calls[0][0];
        expect(env.response).toEqual(['Hello ']);
    });

    it('renders null (no visible DOM output)', async () => {
        const { default: CmdHello } = await import('../../../routes/CmdHello');
        const { container } = render(<CmdHello />);
        expect(container.firstChild).toBeNull();
    });
});
