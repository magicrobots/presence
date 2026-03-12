import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import type { InputProcessor, InputProcessorState } from '../../../types/terminal';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('react-router-dom', () => ({
    useOutletContext: vi.fn(),
}));

vi.mock('../../../constants/command-registry', () => ({
    default: {
        getMatchingCommand: vi.fn((name: string) => {
            if (name === 'ls') {
                return { commandName: 'ls', helpText: 'List directory contents.', usage: 'ls -la' };
            }
            if (name === 'pwd') {
                return { commandName: 'pwd', helpText: 'Print working directory.' };
            }
            return undefined;
        }),
        getIsDirectory: vi.fn(() => false),
        getIsInvisible: vi.fn(() => false),
        registry: [],
    },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeState(overrides: Partial<InputProcessorState> = {}): InputProcessorState {
    return {
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
        ...overrides,
    };
}

function makeInputProcessor(stateOverrides: Partial<InputProcessorState> = {}): InputProcessor {
    return {
        state: makeState(stateOverrides),
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

describe('CmdMan', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('no arguments', () => {
        it('calls setAppEnvironment with activeAppName "cmd-man"', async () => {
            const mockIp = makeInputProcessor({ currentArgs: [] });
            const { useOutletContext } = await import('react-router-dom');
            vi.mocked(useOutletContext).mockReturnValue(mockIp);

            const { default: CmdMan } = await import('../../../routes/CmdMan');
            render(<CmdMan />);

            expect(mockIp.setAppEnvironment).toHaveBeenCalledOnce();
            const env = vi.mocked(mockIp.setAppEnvironment).mock.calls[0][0];
            expect(env.activeAppName).toBe('cmd-man');
        });

        it('returns general help text when no args are given', async () => {
            const mockIp = makeInputProcessor({ currentArgs: [] });
            const { useOutletContext } = await import('react-router-dom');
            vi.mocked(useOutletContext).mockReturnValue(mockIp);

            const { default: CmdMan } = await import('../../../routes/CmdMan');
            render(<CmdMan />);

            const env = vi.mocked(mockIp.setAppEnvironment).mock.calls[0][0];
            expect(env.response[0]).toBe('MAN (Manual):');
            expect(env.response.length).toBeGreaterThan(1);
        });
    });

    describe('with a known command argument', () => {
        it('returns the help text for the matched command', async () => {
            const mockIp = makeInputProcessor({ currentArgs: ['ls'] });
            const { useOutletContext } = await import('react-router-dom');
            vi.mocked(useOutletContext).mockReturnValue(mockIp);

            const { default: CmdMan } = await import('../../../routes/CmdMan');
            render(<CmdMan />);

            const env = vi.mocked(mockIp.setAppEnvironment).mock.calls[0][0];
            expect(env.response[0]).toBe('ls: List directory contents.');
        });

        it('appends usage line when the matched command has a usage field', async () => {
            const mockIp = makeInputProcessor({ currentArgs: ['ls'] });
            const { useOutletContext } = await import('react-router-dom');
            vi.mocked(useOutletContext).mockReturnValue(mockIp);

            const { default: CmdMan } = await import('../../../routes/CmdMan');
            render(<CmdMan />);

            const env = vi.mocked(mockIp.setAppEnvironment).mock.calls[0][0];
            expect(env.response).toContain(' usage: ls -la');
        });

        it('omits usage line when the matched command has no usage field', async () => {
            const mockIp = makeInputProcessor({ currentArgs: ['pwd'] });
            const { useOutletContext } = await import('react-router-dom');
            vi.mocked(useOutletContext).mockReturnValue(mockIp);

            const { default: CmdMan } = await import('../../../routes/CmdMan');
            render(<CmdMan />);

            const env = vi.mocked(mockIp.setAppEnvironment).mock.calls[0][0];
            expect(env.response).toEqual(['pwd: Print working directory.']);
        });
    });

    describe('with an unknown command argument', () => {
        it('returns an error response for unrecognised commands', async () => {
            const mockIp = makeInputProcessor({ currentArgs: ['notacommand'] });
            const { useOutletContext } = await import('react-router-dom');
            vi.mocked(useOutletContext).mockReturnValue(mockIp);

            const { default: CmdMan } = await import('../../../routes/CmdMan');
            render(<CmdMan />);

            const env = vi.mocked(mockIp.setAppEnvironment).mock.calls[0][0];
            expect(env.response[0]).toContain('NOTACOMMAND');
            expect(env.response[0]).toContain('ERROR');
        });
    });
});
