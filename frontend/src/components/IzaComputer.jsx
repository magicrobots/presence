import React, { useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';

import persistence from '../hooks/usePersistence';
import rngeezus from '../utils/rngeezus';
import { applyAllDeformers } from '../utils/deformers';
import MagicNumbers, { QUALITY_LADDER } from '../constants/magic-numbers';
import LoadingIndicator from './LoadingIndicator';
import MpfIndicator from './MpfIndicator';
// import { useStatusBar } from '../context/StatusBarContext';  // commented out as in original

// --------------------------------------------------------------------------
// Pure computed helpers (no React deps — safe outside component)
// --------------------------------------------------------------------------

// Map a quality preset string to its TARGET_FPS value.
// Used on mount and whenever the preset changes (T025).
function _presetToFps(preset) {
    switch (preset) {
        case 'high':   return MagicNumbers.TARGET_FPS_HIGH;
        case 'low':    return MagicNumbers.TARGET_FPS_LOW;
        case 'normal': // fall through
        default:       return MagicNumbers.TARGET_FPS;
    }
}

function _computeIsSmallViewport(containerWidth, containerHeight) {
    return containerWidth <= MagicNumbers.SCREEN_BREAK ||
        containerHeight <= MagicNumbers.SCREEN_BREAK;
}

function _computeFontSize(isSmallViewport) {
    const userSize = persistence.getFontSize();
    if (userSize) {
        switch (userSize) {
            case 's': return MagicNumbers.FONT_SIZE_S;
            case 'm': return MagicNumbers.FONT_SIZE_M;
            case 'l': return MagicNumbers.FONT_SIZE;
        }
    }
    return isSmallViewport ? MagicNumbers.FONT_SIZE_S : MagicNumbers.FONT_SIZE;
}

function _computeFontCharacterWidth(fontSize) {
    switch (fontSize) {
        case MagicNumbers.FONT_SIZE_S: return MagicNumbers.FONT_CHARACTER_WIDTH_S;
        case MagicNumbers.FONT_SIZE_M: return MagicNumbers.FONT_CHARACTER_WIDTH_M;
        case MagicNumbers.FONT_SIZE: return MagicNumbers.FONT_CHARACTER_WIDTH;
    }
    return MagicNumbers.FONT_CHARACTER_WIDTH;
}

function _computeViewportMeasurements() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    let canvasWidth, canvasHeight;

    if (w / h >= MagicNumbers.CANVAS_ASPECT_RATIO) {
        canvasWidth = h * MagicNumbers.CANVAS_ASPECT_RATIO;
        canvasHeight = h;
    } else {
        canvasWidth = w;
        canvasHeight = w / MagicNumbers.CANVAS_ASPECT_RATIO;
    }

    // Guard against degenerate inputs: clamp to minimum of 1 so the canvas
    // does not break at extreme small window sizes (SC-004: down to 320×240).
    if (!isFinite(canvasWidth) || isNaN(canvasWidth) || canvasWidth <= 0) {
        canvasWidth = 1;
    }
    if (!isFinite(canvasHeight) || isNaN(canvasHeight) || canvasHeight <= 0) {
        canvasHeight = 1;
    }

    return { width: canvasWidth, height: canvasHeight };
}

function _fitDisplayLinesInContainerWidth(allDisplayLines, maxCharsPerLine) {
    const blockDemarcation = MagicNumbers.COLORIZE_LINE_PREFIX + MagicNumbers.DEFAULT_FEEDBACK_COLOR;
    let modifiedLines = [];

    allDisplayLines.forEach((currLine) => {
        let undemarcatedLine;
        // remove current block demarcation if it's there in addition to custom color
        if (currLine.indexOf(blockDemarcation) === 0) {
            undemarcatedLine = currLine.split(blockDemarcation)[1];
        }

        const colorizePrefix = MagicNumbers.COLORIZE_LINE_PREFIX;
        const testLine = undemarcatedLine != null ? undemarcatedLine : currLine;
        const isColorizedLine = testLine.substr(0, colorizePrefix.length) === colorizePrefix;
        const extractColorIndex = colorizePrefix.length + MagicNumbers.COLORIZE_COLOR_LENGTH;
        let savedLineColor = '';
        let workingLine = currLine;

        // remove color tag
        if (isColorizedLine) {
            savedLineColor = testLine.substr(0, extractColorIndex);
            workingLine = testLine.substr(extractColorIndex);
        } else if (undemarcatedLine != null) {
            savedLineColor = currLine.substr(0, extractColorIndex);
            workingLine = undemarcatedLine;
        }

        if (workingLine.length > maxCharsPerLine) {
            // break line into chunks that fit in the width of the viewport
            let segments = [];
            let currLastSegment = workingLine;

            while (currLastSegment.length > maxCharsPerLine) {
                // if there are no spaces it's either a graph or user wrote something with no spaces
                if (currLastSegment.indexOf(' ') === -1) {
                    const safeLine = currLastSegment.substring(0, maxCharsPerLine);
                    currLastSegment = currLastSegment.substring(maxCharsPerLine - 1);
                    segments.push(safeLine);
                    break;
                }

                // find space closest to maxChars
                let lastSpace = currLastSegment.lastIndexOf(' ', maxCharsPerLine);

                if (lastSpace === -1) {
                    // then it's a command that's longer than max chars
                    lastSpace = maxCharsPerLine;
                }

                const safeLine = currLastSegment.substring(0, lastSpace);
                segments.push(safeLine);

                // modify target string
                const remainder = currLastSegment.substring(lastSpace);
                const firstNonSpaceIndex = remainder.search(/\S|$/);
                currLastSegment = remainder.substring(firstNonSpaceIndex);
            }

            // add orphan
            segments.push(currLastSegment);

            // if it's a colorized line, add colorizer to each line
            if (isColorizedLine || undemarcatedLine != null) {
                segments = segments.map((currSubLine) => savedLineColor.concat(currSubLine));
            }

            // add segments to return set
            modifiedLines = modifiedLines.concat(segments);
        } else {
            // just add the raw line
            modifiedLines.push(savedLineColor.concat(workingLine));
        }
    });

    return modifiedLines;
}

function _computeVisibleDisplayLines(allDisplayLines, viewportMeasurements, textEdgeBuffer, fontSize, fontCharacterWidth) {
    // compute maxCharsPerLine here (mirrors Ember's didRender → inputProcessor.maxCharsPerLine)
    const textAreaWidth = viewportMeasurements.width - (2 * textEdgeBuffer);
    const maxCharsPerLine = Math.floor(textAreaWidth / fontCharacterWidth);

    const lineHeightInPixels = MagicNumbers.SPACE_BETWEEN_LINES + fontSize;
    const maxLineHeight = viewportMeasurements.height - (2 * textEdgeBuffer);
    const maxLines = Math.ceil(maxLineHeight / lineHeightInPixels);
    const returnSet = [];

    const allLinesWidthHandled = _fitDisplayLinesInContainerWidth(allDisplayLines, maxCharsPerLine);
    const initIndex = allLinesWidthHandled.length >= maxLines
        ? allLinesWidthHandled.length - maxLines
        : 0;

    let yCounter = 0;
    for (let i = initIndex; i < allLinesWidthHandled.length; i++) {
        const currLine = allLinesWidthHandled[i];
        const currY = lineHeightInPixels * yCounter;

        let workingLine = currLine;
        let customColor = null;
        const colorizePrefix = MagicNumbers.COLORIZE_LINE_PREFIX;
        const colorCodeLength = MagicNumbers.COLORIZE_COLOR_LENGTH;
        const isColorizedLine = currLine.substr(0, colorizePrefix.length) === colorizePrefix;

        if (isColorizedLine) {
            const extractColorIndex = colorizePrefix.length + colorCodeLength;
            customColor = currLine.substr(colorizePrefix.length, colorCodeLength);
            workingLine = currLine.substr(extractColorIndex);
        }

        yCounter++;

        returnSet.push({
            text: workingLine,
            x: textEdgeBuffer,
            y: textEdgeBuffer + currY,
            customColor
        });
    }

    return returnSet;
}

// --------------------------------------------------------------------------
// Component
// --------------------------------------------------------------------------

export default function IzaComputer({ inputProcessor }) {
    // const { drawStatusBar } = useStatusBar();  // commented out as in original

    // ---- state (drives JSX re-renders) ----
    const [containerWidth, setContainerWidth] = useState(window.innerWidth);
    const [containerHeight, setContainerHeight] = useState(window.innerHeight);
    const [isMpfVisible, setIsMpfVisible] = useState(true);
    const [mpf, setMpf] = useState('');
    const [isLoadingSomething, setIsLoadingSomething] = useState(false);

    // ---- refs (DOM elements) ----
    const containerRef = useRef(null);
    const sourceCanvasRef = useRef(null);
    const alteredCanvasRef = useRef(null);

    // ---- refs (canvas contexts) ----
    const ctxRef = useRef(null);
    const ctx2Ref = useRef(null);

    // ---- refs (animation loop mutable values — not JSX) ----
    const bgImageDataRef = useRef(null);
    const originalScreenBitmapRef = useRef(null);
    const displacementCounterRef = useRef(null);
    // qualityLevelRef: integer 0–7 where 0 = maximum quality, 7 = minimum quality.
    // The bidirectional adaptation loop steps this up/down based on measured FPS.
    const qualityLevelRef = useRef(0);
    const rafRef = useRef(null);

    // ---- refs (bidirectional quality evaluation loop) ----
    // targetFpsRef: FPS goal for the current quality preset.
    // Initialized from the persisted quality preset on mount (T025).
    // Updated immediately when the user changes the preset in cmd-settings.
    const targetFpsRef = useRef(_presetToFps(persistence.getQualityPreset()));
    // evalWindowStartTimeRef: performance.now() timestamp when the current 3s eval window began.
    const evalWindowStartTimeRef = useRef(null);
    // frameTimesRef: array of rAF frame deltas (ms) collected within the current eval window.
    const frameTimesRef = useRef([]);
    // lastFrameTimeRef: performance.now() at the end of the previous rAF frame, used to compute deltas.
    const lastFrameTimeRef = useRef(null);
    // lastEvalAreaRef: canvas area (width * height) at the time the current eval window began.
    // Used by the resize handler to detect when the canvas grows — if the new area is larger,
    // the eval window is restarted (without resetting qualityLevelRef) so the adapter can
    // reassess quality at the new larger canvas size (T030, FR-007).
    const lastEvalAreaRef = useRef(0);

    // animFnRef always points to the latest render's recursiveAnimationFunction
    // so the rAF loop never has stale closures over component state.
    const animFnRef = useRef(null);

    // Stable wrappers for functions called from the one-time useEffect or resize listener.
    // Updated every render so the listener always calls the latest version.
    const _setBgImageRef = useRef(null);
    const _setContainerSizeRef = useRef(null);
    const _doRedrawHackRef = useRef(null);

    // ---- computed values (fresh every render) ----
    const isSmallViewport = _computeIsSmallViewport(containerWidth, containerHeight);
    const fontSize = _computeFontSize(isSmallViewport);
    const fontCharacterWidth = _computeFontCharacterWidth(fontSize);
    const viewportMeasurements = _computeViewportMeasurements();
    const textEdgeBuffer = Math.max(viewportMeasurements.width, viewportMeasurements.height) * 0.06;
    const maxCharsPerLine = Math.floor((viewportMeasurements.width - 2 * textEdgeBuffer) / fontCharacterWidth);
    const bgImagePath = inputProcessor.state.bgImage || 'emptyScreen.jpg';
    const visibleDisplayLines = _computeVisibleDisplayLines(
        inputProcessor.allDisplayLines,
        viewportMeasurements,
        textEdgeBuffer,
        fontSize,
        fontCharacterWidth
    );

    const canvasWrapperStyle = {
        height: `${viewportMeasurements.height}px`,
        width: `${viewportMeasurements.width}px`,
    };

    // Push maxCharsPerLine into the processor whenever viewport or font changes.
    // cmd-origin's _makeAsciiProgressBar reads inputProcessor.state.maxCharsPerLine.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { inputProcessor.setMaxCharsPerLine(maxCharsPerLine); }, [maxCharsPerLine]);

    // ---- private functions ----
    // (redefined each render; the rAF loop calls them via animFnRef so always fresh)

    function _initCanvas() {
        const canvasSource = sourceCanvasRef.current;
        const ctx = canvasSource.getContext('2d', { willReadFrequently: true });
        const canvasAltered = alteredCanvasRef.current;
        const ctx2 = canvasAltered.getContext('2d');

        ctx.imageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
        ctx2.imageSmoothingEnabled = false;
        ctx2.mozImageSmoothingEnabled = false;
        ctx2.webkitImageSmoothingEnabled = false;
        ctx2.msImageSmoothingEnabled = false;

        // store reference to ctx for render loop access
        ctxRef.current = ctx;
        ctx2Ref.current = ctx2;

        // canvas to put interaction items into
        ctx.fillStyle = 'blue';
        ctx.fillRect(0, 0, viewportMeasurements.width, viewportMeasurements.height);

        // canvas to put modified image onto
        ctx2.fillStyle = 'rgba(0,0,0,0)';
    }

    function _setBgImage(imgPath) {
        const imageObj = new Image();
        setIsLoadingSomething(true);

        // load BG image
        imageObj.onload = function() {
            bgImageDataRef.current = this;
            setIsLoadingSomething(false);
        };

        imageObj.src = `assets/${imgPath || 'emptyScreen.jpg'}`;
    }
    _setBgImageRef.current = _setBgImage;

    function _setContainerSize() {
        const newW = window.innerWidth;
        const newH = window.innerHeight;

        if (containerHeight === newH && containerWidth === newW) {
            return;
        }

        setContainerWidth(newW);
        setContainerHeight(newH);

        // re-fill canvases using newly computed viewport (state update is async,
        // so we compute the new viewport directly from window dimensions)
        const newViewport = _computeViewportMeasurements();

        // Synchronously update both canvas width/height attributes so source-canvas
        // and altered-canvas resize in sync on every viewport measurement update (T015).
        if (sourceCanvasRef.current) {
            sourceCanvasRef.current.width = newViewport.width;
            sourceCanvasRef.current.height = newViewport.height;
        }
        if (alteredCanvasRef.current) {
            alteredCanvasRef.current.width = newViewport.width;
            alteredCanvasRef.current.height = newViewport.height;
        }

        if (ctxRef.current) {
            ctxRef.current.fillRect(0, 0, newViewport.width, newViewport.height);
            ctx2Ref.current.fillRect(0, 0, newViewport.width, newViewport.height);
        }

        // Canvas area tracking (T030, FR-007):
        // If the new canvas area is larger than the area at the start of the last
        // eval window, restart the evaluation window so the adapter can reassess
        // quality at the larger canvas size.  qualityLevelRef is intentionally NOT
        // reset here — we preserve the current quality level and let the adapter
        // decide whether it needs to degrade from there.
        const newArea = newViewport.width * newViewport.height;
        if (newArea > lastEvalAreaRef.current) {
            evalWindowStartTimeRef.current = performance.now();
            frameTimesRef.current = [];
            lastEvalAreaRef.current = newArea;
        }

        _setBgImageRef.current(inputProcessor.state.bgImage);
    }
    _setContainerSizeRef.current = _setContainerSize;

    function _doRedrawHack() {
        window.scrollTo(0, 0);
        const tickleMe = sourceCanvasRef.current;
        const vignette = document.getElementById('vignette');

        setTimeout(function() {
            tickleMe.click();
            tickleMe.style.zIndex = '1';
            vignette.style.zIndex = '2';
            tickleMe.style.display = 'block';
        }, 740);
    }
    _doRedrawHackRef.current = _doRedrawHack;

    function _setDomFocusToSelf() {
        if (containerRef.current) {
            containerRef.current.setAttribute('tabindex', 1);
            containerRef.current.focus();
            _setContainerSizeRef.current();
        }
    }

    function _drawText(ctx) {
        ctx.font = `${fontSize}px courier-std`;

        visibleDisplayLines.forEach((currLine) => {
            // _getIsKeyboardActive() always returns true in migrated hook
            if (currLine.customColor != null) {
                ctx.fillStyle = currLine.customColor;
            } else {
                ctx.fillStyle = MagicNumbers.DEFAULT_SCROLLED_COLOR;
            }

            ctx.fillText(currLine.text, currLine.x, currLine.y);
        });
    }

    function _doDisplacementCounter() {
        if (displacementCounterRef.current == null) {
            displacementCounterRef.current = 0;
        }

        if (displacementCounterRef.current > viewportMeasurements.height * 3) {
            displacementCounterRef.current = 0;
        }

        const travelPixelsPerCycle = 3;
        displacementCounterRef.current = displacementCounterRef.current + travelPixelsPerCycle;
    }

    function _createDisplacement(ctx2, deformedImage, dHeight, offset, displacement) {
        // if offset is beyond scope of screen just return
        if (offset > viewportMeasurements.height) {
            return;
        }

        let newImageData1 = ctx2.createImageData(viewportMeasurements.width, dHeight);

        for (let i = 0; i < newImageData1.data.length; i++) {
            const deformedPixel = i + (offset * viewportMeasurements.width * 4);
            newImageData1.data[i] = deformedImage.data[deformedPixel];
        }

        ctx2.putImageData(newImageData1, displacement, offset);
    }

    function _deform(ctx2) {
        if (!originalScreenBitmapRef.current) {
            return;
        }

        let deformedImage = originalScreenBitmapRef.current;

        // chain pixel modifications — pass current quality level so applyAllDeformers
        // selects the correct QUALITY_LADDER entry (T022).
        deformedImage = applyAllDeformers(deformedImage, qualityLevelRef.current);

        // make new image for display using contents of deformed image data
        let newImageData = ctx2.createImageData(viewportMeasurements.width, viewportMeasurements.height);
        for (let i = 0; i < newImageData.data.length; i++) {
            newImageData.data[i] = deformedImage.data[i];
        }

        // draw deformed image
        ctx2.putImageData(newImageData, 0, 0);

        // Use QUALITY_LADDER bandCount for displacement bands — 0 means skip displacement
        // entirely (levels 6–7), reducing cost at low quality settings (T022).
        const bandCount = QUALITY_LADDER[qualityLevelRef.current].displacement.bandCount;
        if (bandCount > 0) {
            _doDisplacementCounter();
            const largeDisplacement = rngeezus.getRandomValue('largeDisplacementPool');
            if (bandCount >= 3) {
                _createDisplacement(ctx2, deformedImage, 5, displacementCounterRef.current + 2, 4);
            }
            if (bandCount >= 2) {
                _createDisplacement(ctx2, deformedImage, 4, displacementCounterRef.current + 1, largeDisplacement);
            }
            _createDisplacement(ctx2, deformedImage, 2, displacementCounterRef.current, 1);
        }
    }

    // The animation loop — redefined each render so it always closes over fresh
    // computed values. animFnRef.current is updated below so rAF always calls
    // the latest version (no stale closures on visibleDisplayLines etc.)
    function recursiveAnimationFunction() {
        // -----------------------------------------------------------------------
        // Bidirectional quality evaluation loop
        //
        // Algorithm:
        //   1. On each rAF tick, compute the frame delta (ms since last frame).
        //   2. Emergency stall: if delta > STALL_THRESHOLD_MS (3000ms), immediately
        //      jump qualityLevelRef to 7 (minimum quality) and restart the eval window.
        //      This handles tab-hidden, CPU spike, or GC pause scenarios.
        //   3. Normal path: accumulate delta into frameTimesRef array.
        //   4. Every EVAL_WINDOW_MS (3000ms), compute average FPS from collected deltas:
        //        avgFps = frameCount / (totalMs / 1000)
        //   5. Compare avgFps to targetFpsRef.current (default TARGET_FPS=30):
        //        - FPS < target          → step quality DOWN by 1 (level++ up to 7=minimum)
        //        - FPS > target + HEADROOM_FPS (5fps) → step quality UP by 1 (level-- down to 0=maximum)
        //        - Otherwise             → hold current level
        //   6. After any adjustment, restart the eval window (clear frameTimesRef, reset start).
        //   7. qualityLevelRef is clamped to [0, 7] at all times.
        //
        // Area re-evaluation on resize (FR-007):
        //   Each routine eval window restart (step 6) also updates lastEvalAreaRef.current
        //   to the current canvas area. The resize handler (_setContainerSize) compares
        //   the new canvas area against lastEvalAreaRef after a debounced resize event:
        //   if the new area is larger, it restarts the eval window WITHOUT resetting
        //   qualityLevelRef, so the adapter can reassess quality at the bigger canvas
        //   without forcing the user back to maximum quality. Keeping lastEvalAreaRef
        //   in sync with every routine window restart prevents false re-triggers on
        //   subsequent resize events that do not actually grow the canvas.
        //
        // Notes:
        //   - qualityLevelRef.current is wired into the render calls by T022.
        //   - targetFpsRef.current is updated by the quality preset selector (T025).
        //   - lastEvalAreaRef.current is updated here (every window reset) and in
        //     _setContainerSize (on area-increase resize) per T030 / FR-007.
        // -----------------------------------------------------------------------
        const now = performance.now();
        const lastTime = lastFrameTimeRef.current;

        if (lastTime !== null) {
            const delta = now - lastTime;

            // Emergency stall: single frame delta exceeds STALL_THRESHOLD_MS
            if (delta > MagicNumbers.STALL_THRESHOLD_MS) {
                // Jump to minimum quality and restart eval window
                qualityLevelRef.current = 7;
                evalWindowStartTimeRef.current = now;
                frameTimesRef.current = [];
            } else {
                // Accumulate this frame's delta into the eval window
                frameTimesRef.current.push(delta);

                // Check whether the eval window has elapsed
                const windowStart = evalWindowStartTimeRef.current;
                const windowElapsed = windowStart !== null ? now - windowStart : 0;

                if (windowStart !== null && windowElapsed >= MagicNumbers.EVAL_WINDOW_MS) {
                    // Compute average FPS over the evaluation window
                    const frameTimes = frameTimesRef.current;
                    const frameCount = frameTimes.length;

                    if (frameCount > 0) {
                        const totalMs = frameTimes.reduce((sum, t) => sum + t, 0);
                        const avgFps = frameCount / (totalMs / 1000);
                        const target = targetFpsRef.current;

                        if (avgFps < target) {
                            // FPS below target: reduce quality (step level up, max 7)
                            qualityLevelRef.current = Math.min(7, qualityLevelRef.current + 1);
                        } else if (avgFps > target + MagicNumbers.HEADROOM_FPS) {
                            // FPS comfortably above target: improve quality (step level down, min 0)
                            qualityLevelRef.current = Math.max(0, qualityLevelRef.current - 1);
                        }
                        // else: FPS within target band — hold current level
                    }

                    // Restart eval window after each check (adjusted or not).
                    // Also update lastEvalAreaRef so the resize area-increase guard
                    // uses the current canvas size as its new baseline (T030, FR-007).
                    // Without this, routine cycle restarts would leave lastEvalAreaRef
                    // stale, causing the guard to re-trigger on subsequent resize events
                    // that do not actually grow the canvas.
                    evalWindowStartTimeRef.current = now;
                    frameTimesRef.current = [];
                    lastEvalAreaRef.current = viewportMeasurements.width * viewportMeasurements.height;
                }
            }
        } else {
            // First frame: initialize the eval window start time
            evalWindowStartTimeRef.current = now;
        }

        // Update last-frame timestamp for next tick
        lastFrameTimeRef.current = now;

        // -----------------------------------------------------------------------
        // Render
        // -----------------------------------------------------------------------
        const bgImage = bgImageDataRef.current;
        const ctx = ctxRef.current;
        const ctx2 = ctx2Ref.current;

        if (ctx != null && bgImage != null) {
            const w = viewportMeasurements.width;
            const h = viewportMeasurements.height;
            ctx.drawImage(bgImage, 0, 0, w, h);
            _drawText(ctx);
            // drawStatusBar(ctx, viewportMeasurements);  // commented out as in original

            const userGrafxSetting = persistence.getGraphicsMode();
            if (userGrafxSetting === 'lo') {
                // Low graphics mode: skip deformer pipeline entirely
            } else {
                // 'hi' or 'auto': run deformer pipeline at current quality level.
                // qualityLevelRef.current is stepped by the bidirectional eval loop above.
                _deform(ctx2);
            }

            // store canvas image data for manipulation
            const imgData = ctx.getImageData(0, 0, w, h);
            originalScreenBitmapRef.current = imgData;
        }

        // Always call latest version via animFnRef — prevents stale closures
        rafRef.current = window.requestAnimationFrame(() => animFnRef.current());
    }

    // Keep animFnRef pointing to current render's version
    animFnRef.current = recursiveAnimationFunction;

    // ---- ember hooks → useEffect ----

    useEffect(() => {
        // init() equivalent: register bgImage callback
        // Uses _setBgImageRef so the callback always calls the latest _setBgImage
        inputProcessor.bgImageCallbackRef.current = function(imgPath) {
            _setBgImageRef.current(imgPath);
        };

        // didInsertElement() equivalent
        _initCanvas();

        // Load initial background image.
        // (In Ember, _setContainerSize called _setBgImage on first run because
        //  containerHeight/Width were undefined. In React they're pre-initialized
        //  so we call _setBgImage explicitly here.)
        _setBgImageRef.current(null);

        // Subscribe to quality preset changes (T025).
        // When the user changes the preset in cmd-settings, update targetFpsRef
        // immediately and reset qualityLevelRef to 0 (maximum quality) so the
        // adapter re-evaluates from full quality at the new FPS target (FR-008).
        persistence.onQualityPresetChange(function(newPreset) {
            targetFpsRef.current = _presetToFps(newPreset);
            qualityLevelRef.current = 0;
            evalWindowStartTimeRef.current = performance.now();
            frameTimesRef.current = [];
        });

        // add resize listener — 200ms trailing-edge debounce (T029)
        // debounceTimer is declared inside the closure (not a ref) so it is
        // private to this effect instance and cleaned up with the effect.
        let debounceTimer;
        function handleResize() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function() {
                _setContainerSizeRef.current();
                _doRedrawHackRef.current();
            }, MagicNumbers.RESIZE_DEBOUNCE_MS);
        }
        window.addEventListener('resize', handleResize);

        // get everything started
        recursiveAnimationFunction();
        _setDomFocusToSelf();

        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(debounceTimer);
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div
            id="iza-computer"
            ref={containerRef}
            onClick={() => _setDomFocusToSelf()}
            onKeyDown={(e) => inputProcessor.processKey(e)}
        >
            <div className="route-container crt-canvas-wrapper" style={canvasWrapperStyle}>
                <MpfIndicator mpf={mpf} isVisible={isMpfVisible} />
                <img id="vignette" className="vignette" alt="vignette" src="assets/vignette.png" />
                <canvas
                    id="source-canvas"
                    ref={sourceCanvasRef}
                    width={viewportMeasurements.width}
                    height={viewportMeasurements.height}
                />
                <canvas
                    id="altered-canvas"
                    ref={alteredCanvasRef}
                    width={viewportMeasurements.width}
                    height={viewportMeasurements.height}
                />
                <div className="outlet-container">
                    <Outlet context={inputProcessor} />
                </div>
                <LoadingIndicator isVisible={isLoadingSomething} />
                <img className="footer-light" src="assets/redLight.png" alt="footer light" />
            </div>
        </div>
    );
}
