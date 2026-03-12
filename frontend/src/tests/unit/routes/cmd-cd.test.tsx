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
            if (name === 'v5DoR_dynamic_keys') return { commandName: 'v5DoR_dynamic_keys', isDir: true, helpText: '' };
            if (name === 'ls') return { commandName: 'ls', isDir: false, isExec: true, helpText: '' };
            return undefined;
        }),
        getIsDirectory: vi.fn((name: string) => name === 'v5DoR_dynamic_keys'),
        getIsInvisible: vi.fn(() => false),
        registry: [
            { commandName: 'v5DoR_dynamic_keys', isDir: true, helpText: '' },
            { commandName: 'ls', isDir: false, isExec: true, helpText: '' },
        ],
    },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeState(rawUserEntry: string): InputProcessorState {
    return {
        currentCommand: 'cd',
        currentArgs: [],
        rawUserEntry,
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
    };
}

function makeInputProcessor(rawUserEntry: string): InputProcessor {
    return {
        state: makeState(rawUserEntry),
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

async function renderCmdCd(rawUserEntry: string) {
    const mockIp = makeInputProcessor(rawUserEntry);
    const { useOutletContext } = await import('react-router-dom');
    vi.mocked(useOutletContext).mockReturnValue(mockIp);
    const { default: CmdCd } = await import('../../../routes/CmdCd');
    render(<CmdCd />);
    return mockIp;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CmdCd', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls setAppEnvironment with activeAppName "cmd-cd"', async () => {
        const mockIp = await renderCmdCd('cd somewhere');
        const env = vi.mocked(mockIp.setAppEnvironment).mock.calls[0][0];
        expect(env.activeAppName).toBe('cmd-cd');
    });

    it('returns an empty response when no argument is given (cd only)', async () => {
        const mockIp = await renderCmdCd('cd');
        const env = vi.mocked(mockIp.setAppEnvironment).mock.calls[0][0];
        expect(env.response).toEqual([]);
    });

    it('returns an empty response for "cd ." (current directory noop)', async () => {
        const mockIp = await renderCmdCd('cd .');
        const env = vi.mocked(mockIp.setAppEnvironment).mock.calls[0][0];
        expect(env.response).toEqual([]);
    });

    it('returns an empty response for "cd ./" (current directory noop)', async () => {
        const mockIp = await renderCmdCd('cd ./');
        const env = vi.mocked(mockIp.setAppEnvironment).mock.calls[0][0];
        expect(env.response).toEqual([]);
    });

    it('denies access when target starts with "/" (root path)', async () => {
        const mockIp = await renderCmdCd('cd /etc');
        const env = vi.mocked(mockIp.setAppEnvironment).mock.calls[0][0];
        expect(env.response[0]).toContain('ACCESS DENIED');
    });

    it('denies access when target starts with "~" (home path)', async () => {
        const mockIp = await renderCmdCd('cd ~');
        const env = vi.mocked(mockIp.setAppEnvironment).mock.calls[0][0];
        expect(env.response[0]).toContain('ACCESS DENIED');
    });

    it('denies access when target is a known directory entry', async () => {
        const mockIp = await renderCmdCd('cd v5DoR_dynamic_keys');
        const env = vi.mocked(mockIp.setAppEnvironment).mock.calls[0][0];
        expect(env.response[0]).toContain('ACCESS DENIED');
    });

    it('returns "Not a directory" when target is a known non-directory command', async () => {
        const mockIp = await renderCmdCd('cd ls');
        const env = vi.mocked(mockIp.setAppEnvironment).mock.calls[0][0];
        expect(env.response[0]).toContain('Not a directory');
    });

    it('returns "No such file or directory" for unknown targets', async () => {
        const mockIp = await renderCmdCd('cd doesnotexist');
        const env = vi.mocked(mockIp.setAppEnvironment).mock.calls[0][0];
        expect(env.response[0]).toContain('No such file or directory');
    });

    it('strips a trailing slash from the target before matching', async () => {
        // 'v5DoR_dynamic_keys/' → strips to 'v5DoR_dynamic_keys' → isDir → ACCESS DENIED
        const mockIp = await renderCmdCd('cd v5DoR_dynamic_keys/');
        const env = vi.mocked(mockIp.setAppEnvironment).mock.calls[0][0];
        expect(env.response[0]).toContain('ACCESS DENIED');
    });
});
