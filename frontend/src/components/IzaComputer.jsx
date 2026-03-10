import React, { useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';

import persistence from '../hooks/usePersistence';
import rngeezus from '../utils/rngeezus';
import { applyAllDeformers } from '../utils/deformers';
import MagicNumbers from '../constants/magic-numbers';
import LoadingIndicator from './LoadingIndicator';
import MpfIndicator from './MpfIndicator';
// import { useStatusBar } from '../context/StatusBarContext';  // commented out as in original

// --------------------------------------------------------------------------
// Pure computed helpers (no React deps — safe outside component)
// --------------------------------------------------------------------------

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

function _computeViewportMeasurements(containerWidth, containerHeight, isSmallViewport) {
    const outputRatio = 4 / 3;
    const borderValue = isSmallViewport ? 0 : MagicNumbers.MIN_BORDER;
    const currHeight = containerHeight;
    const currWidth = containerWidth > MagicNumbers.ABSOLUTE_MAX_VIEWPORT_WIDTH
        ? MagicNumbers.ABSOLUTE_MAX_VIEWPORT_WIDTH
        : containerWidth;
    const maxHeight = currHeight - (borderValue * 2);
    const maxWidth = currWidth - (borderValue * 2);
    const isWideViewport = maxWidth / maxHeight > outputRatio;

    let height, width, left, top;

    if (isWideViewport) {
        height = maxHeight;
        width = outputRatio * height;
        top = 0;
    } else {
        width = maxWidth;
        height = maxWidth * (1 / outputRatio);
        top = (currHeight - height) / 2 - (borderValue * 1);
    }

    if (isSmallViewport) {
        top = 0;
    }

    left = (containerWidth - width) / 2;

    return { left, top, width, height };
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
    const isEvaluatedRef = useRef(false);
    const isPerformantRef = useRef(false);
    const performanceEvalRef = useRef([]);
    const rafRef = useRef(null);

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
    const viewportMeasurements = _computeViewportMeasurements(containerWidth, containerHeight, isSmallViewport);
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

    const routeContainerStyle = {
        height: `${viewportMeasurements.height}px`,
        width: `${viewportMeasurements.width}px`,
        left: `${viewportMeasurements.left}px`,
        top: `${viewportMeasurements.top}px`,
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
        const newIsSmall = _computeIsSmallViewport(newW, newH);
        const newViewport = _computeViewportMeasurements(newW, newH, newIsSmall);

        if (ctxRef.current) {
            ctxRef.current.fillRect(0, 0, newViewport.width, newViewport.height);
            ctx2Ref.current.fillRect(0, 0, newViewport.width, newViewport.height);
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

        // chain pixel modifications
        deformedImage = applyAllDeformers(deformedImage);

        // make new image for display using contents of deformed image data
        let newImageData = ctx2.createImageData(viewportMeasurements.width, viewportMeasurements.height);
        for (let i = 0; i < newImageData.data.length; i++) {
            newImageData.data[i] = deformedImage.data[i];
        }

        // draw deformed image
        ctx2.putImageData(newImageData, 0, 0);

        _doDisplacementCounter();
        const largeDisplacement = rngeezus.getRandomValue('largeDisplacementPool');
        _createDisplacement(ctx2, deformedImage, 5, displacementCounterRef.current + 2, 4);
        _createDisplacement(ctx2, deformedImage, 4, displacementCounterRef.current + 1, largeDisplacement);
        _createDisplacement(ctx2, deformedImage, 2, displacementCounterRef.current, 1);
    }

    function _handlePerformanceEval(mpfValue) {
        setMpf(`${mpfValue} MPF (${performanceEvalRef.current.length}/${MagicNumbers.PERFORMANCE_TEST_LENGTH})`);
        performanceEvalRef.current.push(mpfValue);

        const avg = (values) => {
            let total = 0;
            for (let i = 0; i < values.length; i++) {
                total += values[i];
            }
            return total / values.length;
        };

        if (performanceEvalRef.current.length >= MagicNumbers.PERFORMANCE_TEST_LENGTH) {
            const perf = avg(performanceEvalRef.current);
            isPerformantRef.current = perf < MagicNumbers.MAX_MPF;
            isEvaluatedRef.current = true;
            setIsMpfVisible(false);
        }
    }

    // The animation loop — redefined each render so it always closes over fresh
    // computed values. animFnRef.current is updated below so rAF always calls
    // the latest version (no stale closures on visibleDisplayLines etc.)
    function recursiveAnimationFunction() {
        const preTime = new Date().getTime();
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
            if (userGrafxSetting === 'hi') {
                _deform(ctx2);
                if (alteredCanvasRef.current.style.display === 'none') {
                    alteredCanvasRef.current.style = '';
                }
            } else if (userGrafxSetting === 'lo') {
                // kill ctx2 if you need to
                alteredCanvasRef.current.style = 'display:none;';
            } else {
                if (!isEvaluatedRef.current || isPerformantRef.current) {
                    _deform(ctx2);
                } else {
                    // kill ctx2 if you need to
                    alteredCanvasRef.current.style = 'display:none;';
                }
            }

            // store canvas image data for manipulation
            const imgData = ctx.getImageData(0, 0, w, h);
            originalScreenBitmapRef.current = imgData;
        }

        // Always call latest version via animFnRef — prevents stale closures
        rafRef.current = window.requestAnimationFrame(() => animFnRef.current());

        const postTime = new Date().getTime();

        if (!isEvaluatedRef.current) {
            _handlePerformanceEval(postTime - preTime);
        }
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

        // add resize listener
        function handleResize() {
            _setContainerSizeRef.current();
            _doRedrawHackRef.current();
        }
        window.addEventListener('resize', handleResize);

        // get everything started
        recursiveAnimationFunction();
        _setDomFocusToSelf();

        return () => {
            window.removeEventListener('resize', handleResize);
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div
            id="iza-computer"
            className="route-container iza-computer"
            style={routeContainerStyle}
            ref={containerRef}
            onClick={() => _setDomFocusToSelf()}
            onKeyDown={(e) => inputProcessor.processKey(e)}
        >
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
    );
}
