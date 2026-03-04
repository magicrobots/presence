import React, { useState } from 'react';

export default function ScreenInput({ inputProcessor }) {
    const [inputValue, setInputValue] = useState('');

    const {
        handleScreenInput,
        handleEsc,
        callArrow,
        getOlderCommand,
        getNewerCommand,
    } = inputProcessor;

    function onScreenInput() {
        handleScreenInput(inputValue);
        setInputValue('');
    }

    function onEsc() {
        handleEsc();
    }

    function onUp() {
        setInputValue(getOlderCommand());
    }

    function onDown() {
        setInputValue(getNewerCommand());
    }

    function onLeft() {
        callArrow('ARROWLEFT');
    }

    function onRight() {
        callArrow('ARROWRIGHT');
    }

    return (
        <div className="input-container">
            <div className="key-row_upper">
                <button onClick={onEsc}>
                    <img id="key-esc" alt="esc" src="assets/key_esc.gif" />
                </button>
                <input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    type="text"
                    placeholder="ENTER COMMAND..."
                />
                <button onClick={onScreenInput}>
                    <img id="key-return" alt="return" src="assets/key_return.gif" />
                </button>
                <button onClick={onUp}>
                    <img id="key-arrow_up" alt="arrow_up" src="assets/key_up.gif" />
                </button>
            </div>
            <div className="key-row_lower">
                <button onClick={onLeft}>
                    <img id="key-arrow_left" alt="arrow_left" src="assets/key_left.gif" />
                </button>
                <button onClick={onDown}>
                    <img id="key-arrow_down" alt="arrow_down" src="assets/key_down.gif" />
                </button>
                <button onClick={onRight}>
                    <img id="key-arrow_right" alt="arrow_right" src="assets/key_right.gif" />
                </button>
            </div>
        </div>
    );
}
