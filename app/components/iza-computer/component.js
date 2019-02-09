import Component from '@ember/component';
import { set, computed, observer } from '@ember/object';
import { htmlSafe } from '@ember/string';
import { isPresent } from '@ember/utils';
import { inject as service } from '@ember/service';

import Deformers from '../../mixins/deformers';

export default Component.extend(Deformers, {
    inputProcessor: service(),
    classNames: ['iza-computer'],

    // ------------------- vars -------------------

    FONT_SIZE: 12,
    SPACE_BETWEEN_LINES: 2,
    FRAME_RATE: 1000/60,

    // ------------------- ember hooks -------------------

    init() {
        this._super(...arguments);

        this._startRenderLoop();
    },
    
    didInsertElement: function() {
        this._setDomFocusToSelf();
        set(this.inputProcessor, 'relevantMarkup', this.$()[0]);

        const scope = this;
        window.addEventListener('resize', function() {
            scope._setContainerSize();
        })
    },

    click() {
        this._setDomFocusToSelf();
    },

    keyDown(event) {
        this.inputProcessor.processKey(event);
    },

    didRender() {
        this._setContainerSize();
    },

    // ------------------- computed properties -------------------

    textEdgeBuffer: computed('viewportMeasurements{width,height}', {
        get() {
            return Math.max(this.viewportMeasurements.width, this.viewportMeasurements.height) * 0.06;
        }
    }),

    visibleDisplayLines: computed('inputProcessor.allDisplayLines.[]', 'viewportMeasurements.height', 'textEdgeBuffer', {
        get() {
            const lineHeightInPixels = this.SPACE_BETWEEN_LINES + this.FONT_SIZE;
            const maxLineHeight = this.viewportMeasurements.height - (2 * this.textEdgeBuffer);
            const allLines = this.inputProcessor.allDisplayLines;
            const maxLines = Math.ceil(maxLineHeight / lineHeightInPixels);
            const initIndex = allLines.length >= maxLines ? allLines.length - maxLines : 0;
            const returnSet = [];

            let yCounter = 0;
            for (let i = initIndex; i < allLines.length; i++) {
                const currLine = allLines[i];
                const currY = lineHeightInPixels * yCounter;

                yCounter++;

                returnSet.push({
                    text: currLine,
                    x: this.textEdgeBuffer,
                    y: this.textEdgeBuffer + currY});
            }

            return returnSet;
        }
    }),

    viewportMeasurements: computed('containerHeight', 'containerWidth', {
        get() {
            // make it a 4:3 ratio as big as possible in the viewport
            const border = 50;
            const outputRatio = 4 / 3;
            const currHeight = this.containerHeight;
            const currWidth = this.containerWidth;
            const maxHeight = currHeight - (border * 2);
            const maxWidth = currWidth - (border * 2);
            const isWideViewport = maxWidth / maxHeight > outputRatio;

            let height;
            let width;
            let left;
            let top;

            if (isWideViewport) {
                height = maxHeight;
                width = outputRatio * height;
                top = 0;
            } else {
                width = maxWidth;
                height = maxWidth * (1 / outputRatio);
                top = (currHeight - height) / 2 - (border * 1);
            }

            left = (currWidth - width) / 2;

            return {left, top, width, height};
        }
    }),

    routeContainerStyle: computed('viewportMeasurements', {
        get() {
            const styleString = `height: ${this.viewportMeasurements.height}px; 
                width: ${this.viewportMeasurements.width}px; 
                left: ${this.viewportMeasurements.left}px;
                top: ${this.viewportMeasurements.top}px`;

            return htmlSafe(styleString);
        }
    }),

    canvasWidth: computed('viewportMeasurements.width', {
        get() {
            return this.viewportMeasurements.width;
        }
    }),

    canvasHeight: computed('viewportMeasurements.height', {
        get() {
            return this.viewportMeasurements.height;
        }
    }),

    // ------------------- private functions -------------------

    backgroundImageChanged: observer('inputProcessor.bgImage', function() {
        this._setBgImage(this.inputProcessor.bgImage);
    }),

    _setContainerSize() {
        set(this, 'containerHeight', window.innerHeight);
        set(this, 'containerWidth', window.innerWidth);

        const canvasSource = this.$('#source-canvas')[0];
        const ctx = canvasSource.getContext("2d");
        const canvasAltered = this.$('#altered-canvas')[0];
        const ctx2 = canvasAltered.getContext("2d");

        ctx.imageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
        ctx2.imageSmoothingEnabled = false;
        ctx2.mozImageSmoothingEnabled = false;
        ctx2.webkitImageSmoothingEnabled = false;
        ctx2.msImageSmoothingEnabled = false;

        // store reference to ctx for render loop access
        set(this, 'ctx', ctx)
        set(this, 'ctx2', ctx2)

        // canvas to put interaction items into
        ctx.fillStyle = "blue";
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        // canvas to put modified image onto
        ctx2.fillStyle = "rgba(0,0,0,0)";
        ctx2.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        this._setBgImage();
    },

    _setBgImage(imgPath) {
        const newImage = imgPath || 'emptyScreen.jpg';
        const scope = this;
        const imageObj = new Image();

        // load BG image
        imageObj.onload = function() {
            set(scope, 'bgImageData', this);
        };

        imageObj.src = `assets/${newImage}`;

    },

    _setDomFocusToSelf() {
        this.$().attr({ tabindex: 1 });
        this.$().focus();
    },

    _startRenderLoop() {
        const scope = this;

        setInterval(function() {
            const bgImage = scope.bgImageData;
            const ctx = scope.ctx;
            const ctx2 = scope.ctx2;

            if(isPresent(ctx) && isPresent(bgImage)) {
                const w = scope.canvasWidth;
                const h = scope.canvasHeight;
                ctx.drawImage(bgImage, 0, 0, w, h);
                scope._drawText(ctx);
                scope._deform(ctx2);
                scope._deform(ctx2);

                // store canvas image data for manipulation
                const imgData = ctx.getImageData(0, 0, scope.canvasWidth, scope.canvasHeight);
                set(scope, 'originalScreenBitmap', imgData);
            }
        }, this.FRAME_RATE);
    },

    _drawText(ctx) {
        ctx.font = `${this.FONT_SIZE}px Courier`;
        const scopedContext = ctx;

        this.visibleDisplayLines.forEach((currLine) => {
            if (currLine.text === this.inputProcessor.PROMPT_LINE_1) {
                scopedContext.fillStyle = '#35ff82';
            } else if (currLine.text === 'robots') {
                scopedContext.fillStyle = '#fffa00';
            } else {
                scopedContext.fillStyle = 'white';
            }
            scopedContext.fillText(currLine.text, currLine.x, currLine.y);
        });
    },
    
    _deform(ctx2) {
        if (!this.originalScreenBitmap) {
            return;
        }

        let deformedImage = this.originalScreenBitmap;

        // chain pixel modifications
        deformedImage = this.pixelize(deformedImage);
        // deformedImage = this.noise(deformedImage, 0);
        deformedImage = this.glowEdges(deformedImage);

        // make new image for display using contents of deformed image data
        let newImageData = ctx2.createImageData(this.canvasWidth, this.canvasHeight);
        for(let i = 0; i < newImageData.data.length; i += 1) {
            newImageData.data[i] = deformedImage.data[i];
        }

        // draw deformed image
        ctx2.putImageData(newImageData, 0, 0);
    }
});
