/**
 * IzaComputer — top-level orchestrating component for the CRT canvas display.
 *
 * Dual-canvas data flow (FR-016):
 *   source canvas  → receives fillText() / drawImage() (the "live" scene read by the deformer)
 *   altered canvas → receives putImageData() of deformer-processed pixels (visible to user)
 *
 *   Per-frame pipeline:
 *     1. drawImage(bgImage) + fillText() onto source canvas (ctxRef)
 *     2. renderFrame() reads source getImageData(), applies applyAllDeformers(), writes to altered canvas
 *     3. Displacement bands are composited onto altered canvas via ctx2Ref
 *     4. source canvas sits beneath altered canvas in the DOM; user sees only altered canvas
 *
 * This component is an orchestrator only — rendering logic lives in CanvasRenderer.ts,
 * quality adaptation logic lives in qualityAdapter.ts. All pixel loops are in deformers.ts.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';

import { getGraphicsMode, getFontSize, getQualityPreset, onQualityPresetChange } from '../utils/persistence';
import rngeezus from '../utils/rngeezus';
import MagicNumbers, { QUALITY_LADDER } from '../constants/magic-numbers';
import { initCanvases, renderFrame, triggerRepaint } from './canvas/CanvasRenderer';
import { createQualityAdapter, evaluateQuality } from './canvas/qualityAdapter';
import LoadingIndicator from './LoadingIndicator';
import MpfIndicator from './MpfIndicator';

import type { QualityLevel, QualityAdapterState } from '../types/canvas';
import type { InputState } from '../reducers/inputReducer';

// --------------------------------------------------------------------------
// Pure computed helpers (no React deps — safe outside component)
// --------------------------------------------------------------------------

function _presetToFps(preset: string | null): number {
    switch (preset) {
        case 'high':   return MagicNumbers.TARGET_FPS_HIGH;
        case 'low':    return MagicNumbers.TARGET_FPS_LOW;
        case 'normal': // fall through
        default:       return MagicNumbers.TARGET_FPS;
    }
}

function _computeIsSmallViewport(w: number, h: number): boolean {
    return w <= MagicNumbers.SCREEN_BREAK || h <= MagicNumbers.SCREEN_BREAK;
}

function _computeFontSize(isSmall: boolean): number {
    const userSize = getFontSize();
    if (userSize) {
        switch (userSize) {
            case 's': return MagicNumbers.FONT_SIZE_S;
            case 'm': return MagicNumbers.FONT_SIZE_M;
            case 'l': return MagicNumbers.FONT_SIZE;
        }
    }
    return isSmall ? MagicNumbers.FONT_SIZE_S : MagicNumbers.FONT_SIZE;
}

function _computeFontCharWidth(fontSize: number): number {
    switch (fontSize) {
        case MagicNumbers.FONT_SIZE_S: return MagicNumbers.FONT_CHARACTER_WIDTH_S;
        case MagicNumbers.FONT_SIZE_M: return MagicNumbers.FONT_CHARACTER_WIDTH_M;
        default:                       return MagicNumbers.FONT_CHARACTER_WIDTH;
    }
}

function _computeViewport(): { width: number; height: number } {
    const w = window.innerWidth;
    const h = window.innerHeight;
    let cw: number, ch: number;
    if (w / h >= MagicNumbers.CANVAS_ASPECT_RATIO) {
        cw = h * MagicNumbers.CANVAS_ASPECT_RATIO;
        ch = h;
    } else {
        cw = w;
        ch = w / MagicNumbers.CANVAS_ASPECT_RATIO;
    }
    if (!isFinite(cw) || isNaN(cw) || cw <= 0) cw = 1;
    if (!isFinite(ch) || isNaN(ch) || ch <= 0) ch = 1;
    return { width: cw, height: ch };
}

// --------------------------------------------------------------------------
// Prop type (InputProcessor return value shape)
// --------------------------------------------------------------------------

interface DisplayLine {
    text: string;
    x: number;
    y: number;
    customColor: string | null;
}

interface InputProcessorRef {
    state: InputState;
    allDisplayLines: string[];
    bgImageCallbackRef: React.MutableRefObject<((img: string | null) => void) | undefined>;
    processKey: (e: { key: string; preventDefault: () => void; ctrlKey?: boolean }) => void;
    setMaxCharsPerLine: (n: number) => void;
}

// --------------------------------------------------------------------------
// Component
// --------------------------------------------------------------------------

export default function IzaComputer({ inputProcessor }: { inputProcessor: InputProcessorRef }) {
    // ---- state ----
    const [containerWidth, setContainerWidth]   = useState(window.innerWidth);
    const [containerHeight, setContainerHeight] = useState(window.innerHeight);
    const [isMpfVisible]                        = useState(() => new URLSearchParams(window.location.search).get('fps') !== '0');
    const [mpf, setMpf]                         = useState('');
    const [isLoadingSomething, setIsLoadingSomething] = useState(false);

    // ---- DOM refs ----
    const containerRef      = useRef<HTMLDivElement>(null);
    const sourceCanvasRef   = useRef<HTMLCanvasElement>(null);
    const alteredCanvasRef  = useRef<HTMLCanvasElement>(null);

    // ---- canvas context refs ----
    const ctxRef  = useRef<CanvasRenderingContext2D | null>(null);
    const ctx2Ref = useRef<CanvasRenderingContext2D | null>(null);

    // ---- animation loop mutable values ----
    const bgImageDataRef            = useRef<HTMLImageElement | null>(null);
    const originalScreenBitmapRef   = useRef<ImageData | null>(null);
    const displacementCounterRef    = useRef<number | null>(null);
    const qualityLevelRef           = useRef<QualityLevel>(0);
    const rafRef                    = useRef<number | null>(null);
    const targetFpsRef              = useRef<number>(_presetToFps(getQualityPreset()));
    // qualityAdapterStateRef carries debounce state for the qualityAdapter pure-function evaluator.
    const qualityAdapterStateRef    = useRef<QualityAdapterState>(
        createQualityAdapter({ targetFps: targetFpsRef.current, headroomFps: MagicNumbers.HEADROOM_FPS, stallThresholdMs: MagicNumbers.STALL_THRESHOLD_MS, debounceMs: MagicNumbers.EVAL_WINDOW_MS })
    );
    const evalWindowStartTimeRef    = useRef<number | null>(null);
    const frameTimesRef             = useRef<number[]>([]);
    const lastFrameTimeRef          = useRef<number | null>(null);
    const lastEvalAreaRef           = useRef<number>(0);
    const animFnRef                 = useRef<(() => void) | null>(null);

    // Stable wrapper refs so one-time effects and resize listeners always call latest version.
    const _setBgImageRef        = useRef<((p: string | null) => void) | null>(null);
    const _setContainerSizeRef  = useRef<(() => void) | null>(null);

    // ---- computed values (fresh every render) ----
    const isSmallViewport   = _computeIsSmallViewport(containerWidth, containerHeight);
    const fontSize          = _computeFontSize(isSmallViewport);
    const fontCharWidth     = _computeFontCharWidth(fontSize);
    const viewport          = _computeViewport();
    const textEdgeBuffer    = Math.max(viewport.width, viewport.height) * 0.06;
    const maxCharsPerLine   = Math.floor((viewport.width - 2 * textEdgeBuffer) / fontCharWidth);
    // Compute visible display lines from allDisplayLines (line-wrap + visible slice)
    const visibleDisplayLines = _computeVisibleDisplayLines(
        inputProcessor.allDisplayLines,
        viewport,
        textEdgeBuffer,
        fontSize,
        fontCharWidth,
    );

    const canvasWrapperStyle = {
        height: `${viewport.height}px`,
        width:  `${viewport.width}px`,
    };

    // Push maxCharsPerLine into processor whenever viewport or font changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { inputProcessor.setMaxCharsPerLine(maxCharsPerLine); }, [maxCharsPerLine]);

    // ---- private functions (redefined each render; called via refs to avoid stale closures) ----

    function _setBgImage(imgPath: string | null) {
        const imageObj = new Image();
        setIsLoadingSomething(true);
        imageObj.onload = function () {
            bgImageDataRef.current = imageObj;
            setIsLoadingSomething(false);
        };
        imageObj.src = `assets/${imgPath || 'emptyScreen.jpg'}`;
    }
    _setBgImageRef.current = _setBgImage;

    function _setContainerSize() {
        const newW = window.innerWidth;
        const newH = window.innerHeight;
        if (containerHeight === newH && containerWidth === newW) return;
        setContainerWidth(newW);
        setContainerHeight(newH);
        const newVp = _computeViewport();
        if (sourceCanvasRef.current && alteredCanvasRef.current) {
            // initCanvases resizes both canvases and re-initialises contexts (CanvasRenderer)
            initCanvases(
                { source: sourceCanvasRef.current, altered: alteredCanvasRef.current },
                { width: newVp.width, height: newVp.height, fontSize, fontCharWidth },
            );
            ctxRef.current  = sourceCanvasRef.current.getContext('2d', { willReadFrequently: true });
            ctx2Ref.current = alteredCanvasRef.current.getContext('2d');
        }
        // Area re-evaluation (FR-007): if canvas grew, restart eval window so adapter reassesses.
        const newArea = newVp.width * newVp.height;
        if (newArea > lastEvalAreaRef.current) {
            evalWindowStartTimeRef.current = performance.now();
            frameTimesRef.current = [];
            lastEvalAreaRef.current = newArea;
        }
        _setBgImageRef.current!(inputProcessor.state.bgImage as string | null);
    }
    _setContainerSizeRef.current = _setContainerSize;

    function _drawText(ctx: CanvasRenderingContext2D) {
        ctx.font = `${fontSize}px courier-std`;
        visibleDisplayLines.forEach((line) => {
            ctx.fillStyle = line.customColor ?? MagicNumbers.DEFAULT_SCROLLED_COLOR;
            ctx.fillText(line.text, line.x, line.y);
        });
    }

    function _doDisplacementCounter() {
        if (displacementCounterRef.current == null) displacementCounterRef.current = 0;
        if (displacementCounterRef.current > viewport.height * 3) displacementCounterRef.current = 0;
        displacementCounterRef.current += QUALITY_LADDER[qualityLevelRef.current].displacement.travelPixelsPerCycle ?? 3;
    }

    function _createDisplacement(
        ctx2: CanvasRenderingContext2D,
        deformedImage: ImageData,
        dHeight: number,
        offset: number,
        displacement: number,
    ) {
        if (offset > viewport.height) return;
        const band = ctx2.createImageData(viewport.width, dHeight);
        for (let i = 0; i < band.data.length; i++) {
            band.data[i] = deformedImage.data[i + offset * viewport.width * 4];
        }
        ctx2.putImageData(band, displacement, offset);
    }

    // The animation loop — redefined each render, called via animFnRef to prevent stale closures.
    function recursiveAnimationFunction() {
        const now = performance.now();
        const lastTime = lastFrameTimeRef.current;

        // ---- Bidirectional quality evaluation (delegates to qualityAdapter pure function) ----
        if (lastTime !== null) {
            const delta = now - lastTime;
            const { nextLevel, nextState } = evaluateQuality(
                qualityAdapterStateRef.current,
                { deltaMs: delta, timestamp: now },
            );
            qualityLevelRef.current       = nextLevel;
            qualityAdapterStateRef.current = nextState;

            // Accumulate frame times for the FPS display (mpf indicator)
            frameTimesRef.current.push(delta);
            const windowStart   = evalWindowStartTimeRef.current;
            const windowElapsed = windowStart !== null ? now - windowStart : 0;
            if (windowStart !== null && windowElapsed >= MagicNumbers.EVAL_WINDOW_MS) {
                const fc    = frameTimesRef.current.length;
                const total = frameTimesRef.current.reduce((s, t) => s + t, 0);
                if (fc > 0) {
                    setMpf(`${Math.round(fc / (total / 1000))} (q${qualityLevelRef.current})`);
                }
                evalWindowStartTimeRef.current = now;
                frameTimesRef.current          = [];
                lastEvalAreaRef.current        = viewport.width * viewport.height;
            }
        } else {
            evalWindowStartTimeRef.current = now;
        }
        lastFrameTimeRef.current = now;

        // ---- Render ----
        const bgImage = bgImageDataRef.current;
        const ctx     = ctxRef.current;
        const ctx2    = ctx2Ref.current;

        if (ctx !== null && bgImage !== null) {
            ctx.drawImage(bgImage, 0, 0, viewport.width, viewport.height);
            _drawText(ctx);

            const userGrafxSetting = getGraphicsMode();
            if (userGrafxSetting !== 'lo') {
                // Delegate deformer pipeline (applyAllDeformers) to CanvasRenderer.renderFrame.
                // renderFrame: source.getImageData → applyAllDeformers → altered.putImageData
                if (sourceCanvasRef.current && alteredCanvasRef.current) {
                    renderFrame(
                        { source: sourceCanvasRef.current, altered: alteredCanvasRef.current },
                        qualityLevelRef.current,
                    );
                }

                // Displacement bands composited onto altered canvas (not abstracted into CanvasRenderer
                // because they require rngeezus pool access and QUALITY_LADDER band configuration).
                if (ctx2 !== null && originalScreenBitmapRef.current) {
                    const bandCount = QUALITY_LADDER[qualityLevelRef.current].displacement.bandCount;
                    if (bandCount > 0) {
                        _doDisplacementCounter();
                        const counter = displacementCounterRef.current ?? 0;
                        const largeDx = rngeezus.getRandomValue('largeDisplacementPool') as number;
                        if (bandCount >= 3) _createDisplacement(ctx2, originalScreenBitmapRef.current, 5, counter + 2, 4);
                        if (bandCount >= 2) _createDisplacement(ctx2, originalScreenBitmapRef.current, 4, counter + 1, largeDx);
                        _createDisplacement(ctx2, originalScreenBitmapRef.current, 2, counter, 1);
                    }
                }
            }

            originalScreenBitmapRef.current = ctx.getImageData(0, 0, viewport.width, viewport.height);
        }

        rafRef.current = window.requestAnimationFrame(() => animFnRef.current!());
    }

    animFnRef.current = recursiveAnimationFunction;

    // ---- one-time mount effect ----
    useEffect(() => {
        inputProcessor.bgImageCallbackRef.current = (imgPath) => _setBgImageRef.current!(imgPath);

        if (sourceCanvasRef.current && alteredCanvasRef.current) {
            // CanvasRenderer.initCanvases: sets dimensions, disables smoothing, primes both contexts.
            initCanvases(
                { source: sourceCanvasRef.current, altered: alteredCanvasRef.current },
                { width: viewport.width, height: viewport.height, fontSize, fontCharWidth },
            );
            ctxRef.current  = sourceCanvasRef.current.getContext('2d', { willReadFrequently: true });
            ctx2Ref.current = alteredCanvasRef.current.getContext('2d');
        }

        _setBgImageRef.current!(null);

        // Subscribe to quality preset changes — reset adapter and quality level on change (FR-008).
        onQualityPresetChange((newPreset) => {
            targetFpsRef.current           = _presetToFps(newPreset);
            qualityLevelRef.current        = 0;
            qualityAdapterStateRef.current = createQualityAdapter({
                targetFps: targetFpsRef.current,
                headroomFps: MagicNumbers.HEADROOM_FPS,
                stallThresholdMs: MagicNumbers.STALL_THRESHOLD_MS,
                debounceMs: MagicNumbers.EVAL_WINDOW_MS,
            });
            evalWindowStartTimeRef.current = performance.now();
            frameTimesRef.current          = [];
        });

        let debounceTimer: ReturnType<typeof setTimeout>;
        function handleResize() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                _setContainerSizeRef.current!();
                // triggerRepaint replaces the setTimeout z-index hack (FR-018): uses double-rAF
                // to schedule a display toggle inside the browser's own frame scheduler.
                if (sourceCanvasRef.current) triggerRepaint(sourceCanvasRef.current);
            }, MagicNumbers.RESIZE_DEBOUNCE_MS);
        }
        window.addEventListener('resize', handleResize);

        recursiveAnimationFunction();
        if (containerRef.current) {
            containerRef.current.setAttribute('tabindex', '1');
            containerRef.current.focus();
            _setContainerSizeRef.current!();
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(debounceTimer);
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div
            id="iza-computer"
            ref={containerRef}
            onClick={() => { if (containerRef.current) { containerRef.current.setAttribute('tabindex', '1'); containerRef.current.focus(); _setContainerSizeRef.current!(); } }}
            onKeyDown={(e) => inputProcessor.processKey(e)}
        >
            <div className="route-container crt-canvas-wrapper" style={canvasWrapperStyle}>
                <MpfIndicator mpf={mpf} isVisible={isMpfVisible} />
                <img id="vignette" className="vignette" alt="vignette" src="assets/vignette.png" />
                <canvas
                    id="source-canvas"
                    ref={sourceCanvasRef}
                    width={viewport.width}
                    height={viewport.height}
                />
                <canvas
                    id="altered-canvas"
                    ref={alteredCanvasRef}
                    width={viewport.width}
                    height={viewport.height}
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

// --------------------------------------------------------------------------
// Display-line helpers (pure functions — no React deps)
// --------------------------------------------------------------------------

function _fitLines(allLines: string[], maxChars: number): string[] {
    const blockDemarcation = MagicNumbers.COLORIZE_LINE_PREFIX + MagicNumbers.DEFAULT_FEEDBACK_COLOR;
    const colorizePrefix   = MagicNumbers.COLORIZE_LINE_PREFIX;
    const colorLen         = MagicNumbers.COLORIZE_COLOR_LENGTH;
    const extractIdx       = colorizePrefix.length + colorLen;
    const result: string[] = [];

    allLines.forEach((currLine) => {
        let undemarcated: string | undefined;
        if (currLine.indexOf(blockDemarcation) === 0) {
            undemarcated = currLine.split(blockDemarcation)[1];
        }

        const testLine       = undemarcated ?? currLine;
        const isColorized    = testLine.substr(0, colorizePrefix.length) === colorizePrefix;
        let savedColor       = '';
        let workingLine      = currLine;

        if (isColorized) {
            savedColor   = testLine.substr(0, extractIdx);
            workingLine  = testLine.substr(extractIdx);
        } else if (undemarcated != null) {
            savedColor   = currLine.substr(0, extractIdx);
            workingLine  = undemarcated;
        }

        if (workingLine.length <= maxChars) {
            result.push(savedColor.concat(workingLine));
            return;
        }

        let segments: string[] = [];
        let remaining          = workingLine;

        while (remaining.length > maxChars) {
            if (remaining.indexOf(' ') === -1) {
                segments.push(remaining.substring(0, maxChars));
                remaining = remaining.substring(maxChars - 1);
                break;
            }
            let lastSpace = remaining.lastIndexOf(' ', maxChars);
            if (lastSpace === -1) lastSpace = maxChars;
            segments.push(remaining.substring(0, lastSpace));
            const rest            = remaining.substring(lastSpace);
            const firstNonSpace   = rest.search(/\S|$/);
            remaining             = rest.substring(firstNonSpace);
        }
        segments.push(remaining);

        if (isColorized || undemarcated != null) {
            segments = segments.map((s) => savedColor.concat(s));
        }
        result.push(...segments);
    });

    return result;
}

function _computeVisibleDisplayLines(
    allDisplayLines: string[],
    vp: { width: number; height: number },
    textEdgeBuffer: number,
    fontSize: number,
    fontCharWidth: number,
): DisplayLine[] {
    const maxChars       = Math.floor((vp.width - 2 * textEdgeBuffer) / fontCharWidth);
    const lineHeight     = MagicNumbers.SPACE_BETWEEN_LINES + fontSize;
    const maxLineHeight  = vp.height - 2 * textEdgeBuffer;
    const maxLines       = Math.ceil(maxLineHeight / lineHeight);
    const allFitted      = _fitLines(allDisplayLines, maxChars);
    const initIndex      = allFitted.length >= maxLines ? allFitted.length - maxLines : 0;
    const colorizePrefix = MagicNumbers.COLORIZE_LINE_PREFIX;
    const colorLen       = MagicNumbers.COLORIZE_COLOR_LENGTH;
    const result: DisplayLine[] = [];
    let yCounter         = 0;

    for (let i = initIndex; i < allFitted.length; i++) {
        const line         = allFitted[i];
        const isColorized  = line.substr(0, colorizePrefix.length) === colorizePrefix;
        let customColor: string | null = null;
        let workingLine    = line;

        if (isColorized) {
            customColor  = line.substr(colorizePrefix.length, colorLen);
            workingLine  = line.substr(colorizePrefix.length + colorLen);
        }

        result.push({
            text: workingLine,
            x: textEdgeBuffer,
            y: textEdgeBuffer + lineHeight * yCounter,
            customColor,
        });
        yCounter++;
    }

    return result;
}
