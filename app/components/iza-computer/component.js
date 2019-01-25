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
    TEXT_EDGE_BUFFER: 80,

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

    visibleDisplayLines: computed('inputProcessor.allDisplayLines.[]', {
        get() {
            const allLines = this.inputProcessor.allDisplayLines;
            const returnSet = [];
            for (let i = 0; i < allLines.length; i++) {
                const currLine = allLines[i];

                returnSet.push({
                    text: currLine,
                    x: this.TEXT_EDGE_BUFFER,
                    y: this.TEXT_EDGE_BUFFER + ((this.SPACE_BETWEEN_LINES + this.FONT_SIZE) * i)});
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
        }, 1000/60);
    },

    _drawText(ctx) {
        ctx.font = `${this.FONT_SIZE}px Courier`;
        const temp = ctx;

        this.visibleDisplayLines.forEach((currLine) => {
            if (currLine.text === this.inputProcessor.PROMPT_LINE_1) {
                temp.fillStyle = '#35ff82';
            } else if (currLine.text === 'robots') {
                temp.fillStyle = '#80d7f7';
            } else {
                temp.fillStyle = 'white';
            }
            temp.fillText(currLine.text, currLine.x, currLine.y);
        });
    },
    
    _deform(ctx2) {
        const noisedImage = this.noise();
        if (!noisedImage) {
            return;
        }

        // redraw results
        var newImageData = ctx2.createImageData(this.canvasWidth, this.canvasHeight);
        for(let i = 0; i < newImageData.data.length; i += 1) {
            newImageData.data[i] = noisedImage[i];
        }
        ctx2.putImageData(newImageData, 0, 0);
    }
});
