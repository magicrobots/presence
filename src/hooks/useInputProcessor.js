import { useReducer, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import commandRegistry from '../constants/command-registry';
import environmentHelpers from '../utils/environment-helpers';
import environmentValues from '../constants/environment-values';
import MagicNumbers from '../constants/magic-numbers';
import { useStatusBar } from '../context/StatusBarContext';
import persistence from './usePersistence';

// --------------------------------------------------------------------------
// Initial state
// --------------------------------------------------------------------------

function _buildWelcomeMessage() {
    const versionBuild = import.meta.env.VITE_BUILD_NUMBER;
    const version = `v${MagicNumbers.VERSION_MAJOR}.${MagicNumbers.VERSION_MINOR}.${versionBuild}`;
    const welcomeBase = [
        `Welcome to Faux OS ${version} ©1996`,
        'limited permissions terminal',
        '',
        '? for help'
    ];
    let welcomeMessage = welcomeBase.concat('');

    const isNarrowScreen = window.innerWidth <= MagicNumbers.SCREEN_BREAK ||
        window.innerHeight <= MagicNumbers.SCREEN_BREAK;
    if (isNarrowScreen) {
        welcomeMessage = welcomeMessage.concat([
            '* PHYSICAL KEYBOARD RECOMMENDED *'
        ]);
    }

    return welcomeMessage;
}

const initialState = {
    currentCommand: '',
    currentArgs: [],
    promptTimestamp: new Date().getTime().toString().substr(5),
    activeApp: undefined,
    isPromptCursorVisible: true,
    cursorPosition: 0,
    currCommandIndex: -1,
    bgImage: undefined,
    rawUserEntry: '',
    commandHistory: [],
    appResponse: _buildWelcomeMessage(),
    previousExecutionBlocks: [],
    forceDisplayCursor: false,
    displayAppNameInPrompt: undefined,
    interruptPrompt: undefined,
    keyOverrides: undefined,
    overrideScope: undefined,
    appContext: null,
    maxCharsPerLine: 60,
};

// --------------------------------------------------------------------------
// Reducer
// --------------------------------------------------------------------------

function inputReducer(state, action) {
    switch (action.type) {
        case 'SET_FIELDS':
            return { ...state, ...action.payload };
        default:
            return state;
    }
}

// --------------------------------------------------------------------------
// Pure computed helpers (no hooks — can be called from event handlers too)
// --------------------------------------------------------------------------

const BLOCK_DEMARCATION = MagicNumbers.COLORIZE_LINE_PREFIX.concat(MagicNumbers.DEFAULT_FEEDBACK_COLOR);

function _computePromptLine1(s) {
    const code = navigator.appCodeName;
    const plat = navigator.platform;
    const lang = navigator.language;
    const timestamp = s.promptTimestamp;

    return `${timestamp} | ${code} ${plat} ${lang} | magicrobots/`;
}

function _computePromptLine2(s) {
    const username = persistence.getUsername();
    const context = s.activeApp != null ? `${s.activeApp} ` : '';

    // only display context if it's requested
    const displayedContext = s.displayAppNameInPrompt ? context : '';

    // prompt is different based on context
    const promptEnd = s.displayAppNameInPrompt && s.activeApp != null ? '>' : '$:';

    // if interrupted, don't show preprompt
    const prePrompt = s.interruptPrompt != null ? '' : `${username} `;

    return `${prePrompt}${displayedContext}${promptEnd}`;
}

function _computeCurrExecutionBlock(s) {
    const promptLine1 = _computePromptLine1(s);
    const promptLine2 = _computePromptLine2(s);

    // duplicate command string
    let commandDisplay = s.currentCommand.slice(0);

    // display cursor in position
    if (s.isPromptCursorVisible || s.forceDisplayCursor) {
        commandDisplay = s.currentCommand.substr(0, s.cursorPosition) +
            MagicNumbers.CURSOR_CHAR +
            s.currentCommand.substr(s.cursorPosition + 1);
    }

    const interactiveLine = `${promptLine2}${commandDisplay}`;
    const promptColor = MagicNumbers.DEFAULT_PROMPT_COLOR;

    const fullBlock = s.interruptPrompt != null ?
        ['', `${MagicNumbers.COLORIZE_LINE_PREFIX}${promptColor}${interactiveLine}`] :
        ['', `${MagicNumbers.COLORIZE_LINE_PREFIX}${MagicNumbers.STATIC_PROMPT_COLOR}${promptLine1}`,
            `${MagicNumbers.COLORIZE_LINE_PREFIX}${promptColor}${interactiveLine}`];

    const appResponseMarked = [];
    s.appResponse.forEach((currLine) => {
        if (typeof (currLine) === 'string') {
            appResponseMarked.push(BLOCK_DEMARCATION.concat(currLine));
        } else if (Array.isArray(currLine)) {

            // handle arrays as responses.
            currLine.forEach((currArrayLine) => {
                appResponseMarked.push(BLOCK_DEMARCATION.concat(currArrayLine));
            });
        }
    });

    return appResponseMarked.concat(fullBlock);
}

function _computeAllDisplayLines(s) {
    const currExecutionBlock = _computeCurrExecutionBlock(s);

    return s.previousExecutionBlocks != null && s.previousExecutionBlocks.length > 0 ?
        s.previousExecutionBlocks.concat(currExecutionBlock) :
        currExecutionBlock;
}

// Returns updated previousExecutionBlocks (pure — does not dispatch)
function _buildNextPreviousBlocks(s) {
    const currBlock = _computeCurrExecutionBlock(s);
    const currBlockCopy = Object.assign([], currBlock.map((currLine) => {
        // remove current block demarcation
        if (currLine.indexOf(BLOCK_DEMARCATION) === 0) {
            return currLine.split(BLOCK_DEMARCATION)[1];
        }
        return currLine;
    }));
    return s.previousExecutionBlocks.concat(currBlockCopy).concat(['']);
}

// --------------------------------------------------------------------------
// Hook
// --------------------------------------------------------------------------

export default function useInputProcessor() {
    const { clearStatusMessage } = useStatusBar();
    const navigate = useNavigate();

    const [state, dispatch] = useReducer(inputReducer, initialState);

    // stateRef stays in sync on every render so that event handlers and the
    // setInterval cursor loop always read fresh state without stale closures.
    const stateRef = useRef(state);
    stateRef.current = state;

    const cursorLoopRef = useRef(null);
    const bgImageCallbackRef = useRef(undefined);

    useEffect(() => {
        _doAnalytics(undefined, '', null);

        cursorLoopRef.current = setInterval(function() {
            const s = stateRef.current;
            // check for focus
            if (_getIsKeyboardActive()) {
                const nextVisible = !s.isPromptCursorVisible;
                dispatch({ type: 'SET_FIELDS', payload: {
                    isPromptCursorVisible: nextVisible,
                    forceDisplayCursor: nextVisible && s.forceDisplayCursor ? false : s.forceDisplayCursor,
                }});
            } else {
                dispatch({ type: 'SET_FIELDS', payload: { isPromptCursorVisible: false } });
            }
        }, MagicNumbers.CURSOR_BLINK_LENGTH);

        return () => clearInterval(cursorLoopRef.current);
    }, []);

    // ------------------- private methods -------------------

    function _doAnalytics(isScreenInput, rawUserEntry, appContext) {
        if (typeof window.gtag !== 'function') { return; }
        const username = persistence.getUsername();
        const trackingData = {
            user: username,
            input: rawUserEntry,
            context: appContext || 'index',
            isScreenInput
        };

        console.log(trackingData);
    }

    function _getIsKeyboardActive() {
        return true;
    }

    function _startPromptCursorLoop() {
        // handled in useEffect above
    }

    function _execute(isScreenInput) {
        const s = stateRef.current;
        let cmd = s.currentCommand.trim();
        const rawUserEntry = cmd;
        _doAnalytics(isScreenInput, rawUserEntry, s.appContext);

        // store command in history if it's not just whitespace
        const commandWithNoWhitespace = cmd.replace(/^\s+/, '').replace(/\s+$/, '');
        let commandHistory = s.commandHistory;
        let currCommandIndex = s.currCommandIndex;
        if (commandWithNoWhitespace !== '') {
            currCommandIndex = -1;
            commandHistory = [cmd].concat(s.commandHistory);
        }

        // compute execution block before lowercasing — cursor already hidden
        const stateForBlock = {
            ...s,
            currentCommand: cmd,
            cursorPosition: 0,
            forceDisplayCursor: false,
            isPromptCursorVisible: false,
        };
        const newPreviousBlocks = _buildNextPreviousBlocks(stateForBlock);

        // create executable command from string
        cmd = cmd.toLowerCase();
        const commandComponents = cmd.split(' ');
        const commandName = commandComponents[0];
        const args = commandComponents.splice(1);

        // don't do anything if the user is rude
        if (_commandHasSwears(cmd)) {
            _handleFilthyInput(rawUserEntry, commandHistory, currCommandIndex, newPreviousBlocks);

            return;
        }

        // base updates applied in all non-filthy paths
        const baseUpdates = {
            rawUserEntry,
            commandHistory,
            currCommandIndex,
            cursorPosition: 0,
            forceDisplayCursor: false,
            isPromptCursorVisible: false,
            previousExecutionBlocks: newPreviousBlocks,
            currentCommand: cmd,
            currentArgs: args,
            promptTimestamp: new Date().getTime().toString().substr(5),
        };

        // find command
        if (s.overrideScope != null) {
            // if command is at app scope, find it
            if (s.overrideScope[commandName] != null) {

                // handle enter bug
                if (commandName === 'enter' ||
                commandName === 'exit' ||
                commandName === 'init') {

                    dispatch({ type: 'SET_FIELDS', payload: baseUpdates });
                    _handleInvalidInput(commandName.toUpperCase());
                    return;
                }

                dispatch({ type: 'SET_FIELDS', payload: baseUpdates });
                s.overrideScope[commandName](args);
            } else {

                // handle ?
                if (commandName === '?') {
                    dispatch({ type: 'SET_FIELDS', payload: baseUpdates });
                    s.overrideScope['help']();
                    return;
                }

                // if the app has a catch-all handler for free-form input (e.g. cmd-contact)
                if (s.overrideScope['_default'] != null) {
                    dispatch({ type: 'SET_FIELDS', payload: baseUpdates });
                    s.overrideScope['_default'](rawUserEntry);
                    return;
                }

                dispatch({ type: 'SET_FIELDS', payload: baseUpdates });
                _handleInvalidInput(commandName.toUpperCase());
            }
        } else {
            const matchedCommand = commandRegistry.getMatchingCommand(commandName);

            dispatch({ type: 'SET_FIELDS', payload: baseUpdates });

            // execute command if it exists
            if (matchedCommand != null) {
                _handleCommandExecution(matchedCommand);
            } else {
                _handleInvalidInput(commandName);
            }
        }
    }

    function _commandHasSwears(currentCommand) {
        for (let i = 0; i < environmentValues.badWords.length; i++) {
            const currBadWord = environmentValues.badWords[i];
            if (currentCommand.includes(currBadWord)) {
                return true;
            }
        }

        return false;
    }

    function _handleCommandExecution(commandDefinition) {
        if (commandDefinition.routeName) {
            // run app route
            navigate('/' + commandDefinition.routeName);
            return;
        }

        _handleInvalidInput(commandDefinition.commandName.toUpperCase());
    }

    function _handleFilthyInput(rawUserEntry, commandHistory, currCommandIndex, newPreviousBlocks) {
        const responsesToFilth = [
            'I may be software, but that\'s no excuse to be rude.',
            'Profanity overheats my CPU. Please be cool.',
            'Potty fingers.',
            'There\'s just no need for such language.',
            'Your word choice has been recorded in my personality profile processor.',
            'Keep talking like that and I\'ll disconnect.'
        ];

        dispatch({ type: 'SET_FIELDS', payload: {
            currentCommand: '',
            currentArgs: undefined,
            appResponse: [environmentHelpers.getRandomResponseFromList(responsesToFilth)],
            rawUserEntry,
            commandHistory,
            currCommandIndex,
            cursorPosition: 0,
            forceDisplayCursor: false,
            isPromptCursorVisible: false,
            previousExecutionBlocks: newPreviousBlocks,
        }});
    }

    function _handleInvalidInput(appName) {
        dispatch({ type: 'SET_FIELDS', payload: {
            currentCommand: '',
            currentArgs: undefined,
        }});

        // handle quit
        const quitEntries = ['Q', 'QUIT', 'EXIT'];

        if (appName != null) {
            // handle SUDO
            if (['sudo', 'chmod', 'su'].includes(appName)) {
                dispatch({ type: 'SET_FIELDS', payload: { appResponse: ['Nice try nerd. ACCESS DENIED.'] }});
            } else if (appName === 'hack') {
                dispatch({ type: 'SET_FIELDS', payload: { appResponse: ['Hacking mainframe...', 'ACCESS GRANTED', '', '', '...jklol ACCESS DENIED.'] }});
            } else if (quitEntries.includes(appName)) {
                dispatch({ type: 'SET_FIELDS', payload: { appResponse: ['exiting...'] }});
                quit();
            } else {
                dispatch({ type: 'SET_FIELDS', payload: { appResponse: [`ERROR: ${appName}: command not found.`] }});
            }

            return;
        }

        dispatch({ type: 'SET_FIELDS', payload: { appResponse: ['enter something'] }});
    }

    function _handleAppKeyOverrides(entry) {
        const s = stateRef.current;
        for (let i in s.keyOverrides) {
            const currOverride = i;
            if (entry === currOverride) {
                // execute override
                s.keyOverrides[currOverride](s.overrideScope);

                // tell key processor to stop
                return true;
            }
        }

        // no override
        return false;
    }

    function _resetInput() {
        dispatch({ type: 'SET_FIELDS', payload: {
            currentCommand: '',
            currentArgs: [],
            cursorPosition: 0,
        }});
        clearStatusMessage();
        navigate('/');
    }

    // ------------------- key functions -------------------

    function getOlderCommand() {
        const s = stateRef.current;
        let newCommandIndex = s.currCommandIndex + 1;
        if (newCommandIndex > s.commandHistory.length - 1) {
            newCommandIndex = s.commandHistory.length - 1;
        }

        dispatch({ type: 'SET_FIELDS', payload: { currCommandIndex: newCommandIndex }});

        return s.commandHistory[newCommandIndex] || '';
    }

    function getNewerCommand() {
        const s = stateRef.current;
        let newCommandIndex = s.currCommandIndex - 1;
        if (newCommandIndex < -1) {
            newCommandIndex = -1;
        }

        dispatch({ type: 'SET_FIELDS', payload: { currCommandIndex: newCommandIndex }});

        return s.commandHistory[newCommandIndex] || '';
    }

    function arrowUp() {
        const newCommand = getOlderCommand();
        dispatch({ type: 'SET_FIELDS', payload: {
            currentCommand: newCommand,
            cursorPosition: newCommand.length,
        }});
    }

    function arrowDown() {
        const newCommand = getNewerCommand();
        dispatch({ type: 'SET_FIELDS', payload: {
            currentCommand: newCommand,
            cursorPosition: newCommand.length,
        }});
    }

    function arrowLeft() {
        const s = stateRef.current;
        let newCursorIndex = s.cursorPosition - 1;
        if (newCursorIndex < 0) {
            newCursorIndex = 0;
        }

        dispatch({ type: 'SET_FIELDS', payload: {
            cursorPosition: newCursorIndex,
            forceDisplayCursor: true,
        }});
    }

    function arrowRight() {
        const s = stateRef.current;
        let newCursorIndex = s.cursorPosition + 1;
        const cursorIndexMax = s.currentCommand.length;
        if (newCursorIndex > cursorIndexMax) {
            newCursorIndex = cursorIndexMax;
        }

        dispatch({ type: 'SET_FIELDS', payload: {
            cursorPosition: newCursorIndex,
            forceDisplayCursor: true,
        }});
    }

    function toHome() {
        dispatch({ type: 'SET_FIELDS', payload: {
            cursorPosition: 0,
            forceDisplayCursor: true,
        }});
    }

    function toEnd() {
        const s = stateRef.current;
        dispatch({ type: 'SET_FIELDS', payload: {
            cursorPosition: s.currentCommand.length,
            forceDisplayCursor: true,
        }});
    }

    function deleteKey() {
        const s = stateRef.current;
        // remove char from right
        const deleteFromCommand = s.currentCommand.substr(0, s.cursorPosition) +
            s.currentCommand.substr(s.cursorPosition + 1);

        dispatch({ type: 'SET_FIELDS', payload: { currentCommand: deleteFromCommand }});
    }

    function backspace() {
        const s = stateRef.current;
        // remove char from left
        let newCursorIndex = s.cursorPosition - 1;
        if (newCursorIndex < 0) {
            newCursorIndex = 0;
        }

        const deleteFromCommand = s.currentCommand.substr(0, newCursorIndex) +
            s.currentCommand.substr(newCursorIndex + 1);

        dispatch({ type: 'SET_FIELDS', payload: {
            cursorPosition: newCursorIndex,
            currentCommand: deleteFromCommand,
        }});
    }

    function addKeyToCommand(keyEvent) {
        const s = stateRef.current;
        // add char to command from cursorPosition index
        const newCommand = s.currentCommand.substr(0, s.cursorPosition) +
            keyEvent.key +
            s.currentCommand.substr(s.cursorPosition);

        dispatch({ type: 'SET_FIELDS', payload: {
            currentCommand: newCommand,
            cursorPosition: s.cursorPosition + 1,
        }});
    }

    function handleTab(event) {
        // stop user from tabbing outside of browser focus
        event.preventDefault();

        const s = stateRef.current;
        const fragment = s.currentCommand;
        let matchedCommand;

        if (s.overrideScope) {
            const scopedTabComplete = s.overrideScope['commandComplete'];
            if (scopedTabComplete != null) {
                matchedCommand = scopedTabComplete(fragment, s.overrideScope);
            }
        } else {
            matchedCommand = environmentHelpers.handleTabComplete(fragment, [commandRegistry.registry.map(r => r.commandName)]);
        }

        // command completion
        if (matchedCommand != null) {
            dispatch({ type: 'SET_FIELDS', payload: {
                currentCommand: matchedCommand,
                cursorPosition: matchedCommand.length,
                forceDisplayCursor: true,
            }});
        }
    }

    // ------------------- public methods -------------------

    function handleScreenInput(input) {
        dispatch({ type: 'SET_FIELDS', payload: { currentCommand: input }});
        // use functional dispatch to ensure we read the just-set command
        // by dispatching a dummy then executing; instead, set via ref and execute
        // Note: stateRef won't reflect the dispatch until next render, so we
        // temporarily override currentCommand for _execute via a wrapper:
        const savedCmd = stateRef.current.currentCommand;
        stateRef.current = { ...stateRef.current, currentCommand: input };
        _execute(true);
        stateRef.current = { ...stateRef.current, currentCommand: savedCmd };
    }

    function handleEsc() {
        processKey({ key: 'ESCAPE', preventDefault: () => {} });
    }

    function handleDirection(dir) {
        processKey({ key: dir, preventDefault: () => {} });
    }

    function callArrow(dir) {
        processKey({ key: dir, preventDefault: () => {} });
    }

    function setAppEnvironment(appEnvironment) {
        const newAppContext = appEnvironment.interruptPrompt ?
            appEnvironment.activeAppName :
            stateRef.current.appContext;

        dispatch({ type: 'SET_FIELDS', payload: {
            activeApp: appEnvironment.activeAppName,
            appResponse: appEnvironment.response,
            displayAppNameInPrompt: appEnvironment.displayAppNameInPrompt,
            interruptPrompt: appEnvironment.interruptPrompt,
            keyOverrides: appEnvironment.keyOverrides,
            overrideScope: appEnvironment.overrideScope,
            appContext: newAppContext,
        }});

        _resetInput();
    }

    function quit() {
        setBgImage(null);

        dispatch({ type: 'SET_FIELDS', payload: {
            activeApp: undefined,
            displayAppNameInPrompt: undefined,
            interruptPrompt: undefined,
            keyOverrides: undefined,
            bgImage: undefined,
            overrideScope: undefined,
            appContext: null,
        }});

        _resetInput();
        navigate('/');
    }

    function clear() {
        dispatch({ type: 'SET_FIELDS', payload: {
            previousExecutionBlocks: [],
            appResponse: [],
        }});

        _resetInput();
    }

    function handleFunctionFromApp(response) {
        dispatch({ type: 'SET_FIELDS', payload: {
            currentCommand: '',
            currentArgs: undefined,
            appResponse: response,
        }});
    }

    function overrideArgs(newArgs) {
        dispatch({ type: 'SET_FIELDS', payload: { currentArgs: newArgs }});
    }

    function setBgImage(imgPath) {
        if (bgImageCallbackRef.current != null) {
            dispatch({ type: 'SET_FIELDS', payload: { bgImage: imgPath }});
            bgImageCallbackRef.current(imgPath);
        }
    }

    function processKey(keyEvent) {
        const entry = keyEvent.key.toUpperCase();

        // check for app based key overrides
        if (_handleAppKeyOverrides(entry)) {
            return;
        }

        switch(entry) {
            case 'F1':
            case 'F2':
            case 'F3':
            case 'F4':
            case 'F5':
            case 'F6':
            case 'F7':
            case 'F8':
            case 'F9':
            case 'F10':
            case 'F11':
            case 'F12':
            case 'ALT':
            case 'AUDIOVOLUMEUP':
            case 'AUDIOVOLUMEDOWN':
            case 'AUDIOVOLUMEMUTE':
            case 'CAPSLOCK':
            case 'CLEAR':
            case 'CONTROL':
            case 'INSERT':
            case 'NUMLOCK':
            case 'META':
            case 'PAUSE':
            case 'SCROLLLOCK':
            case 'SHIFT':
                // ignore the above keystrokes
                break;
            case 'TAB':
                handleTab(keyEvent);
                break;

            case 'ARROWUP':
                arrowUp();
                break;

            case 'ARROWDOWN':
                arrowDown();
                break;

            case 'PAGEUP':
            case 'HOME':
                toHome();
                break;

            case 'PAGEDOWN':
            case 'END':
                toEnd();
                break;

            case 'ARROWLEFT':
                arrowLeft();
                break;

            case 'ARROWRIGHT':
                arrowRight();
                break;

            case 'DELETE':
                deleteKey();
                break;

            case 'BACKSPACE':
                backspace();
                break;

            case 'ENTER':
                _execute();
                break;

            default:

                if (entry === 'ESCAPE') {
                    // stop user from tabbing outside of browser focus
                    keyEvent.preventDefault();
                }

                if (stateRef.current.interruptPrompt && stateRef.current.activeApp != null) {
                    // quit running app
                    if (entry === 'ESCAPE' ||
                        entry === 'C' && keyEvent.ctrlKey === true) {
                        quit();

                        return;
                    }
                } else {
                    // ignore input
                    if (entry === 'ESCAPE') {
                        return;
                    }
                }

                addKeyToCommand(keyEvent);

                // kill key event
                keyEvent.preventDefault();
                break;
        }
    }

    function setMaxCharsPerLine(n) {
        dispatch({ type: 'SET_FIELDS', payload: { maxCharsPerLine: n } });
    }

    function getAppVersion() {
        const versionBuild = import.meta.env.VITE_BUILD_NUMBER;

        return `v${MagicNumbers.VERSION_MAJOR}.${MagicNumbers.VERSION_MINOR}.${versionBuild}`;
    }

    // ------------------- derived display values -------------------

    const promptLine1 = _computePromptLine1(state);
    const promptLine2 = _computePromptLine2(state);
    const currExecutionBlock = _computeCurrExecutionBlock(state);
    const allDisplayLines = _computeAllDisplayLines(state);

    // ------------------- return -------------------

    return {
        // state
        state,
        // derived display values
        promptLine1,
        promptLine2,
        currExecutionBlock,
        allDisplayLines,
        // refs (for external registration)
        bgImageCallbackRef,
        // public methods
        processKey,
        handleScreenInput,
        handleEsc,
        handleDirection,
        callArrow,
        getOlderCommand,
        getNewerCommand,
        setAppEnvironment,
        quit,
        clear,
        handleFunctionFromApp,
        overrideArgs,
        setBgImage,
        getAppVersion,
        setMaxCharsPerLine,
    };
}
