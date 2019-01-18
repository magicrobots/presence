import Component from '@ember/component';
import { set, computed } from '@ember/object';
import { htmlSafe } from '@ember/string';
import { isPresent } from '@ember/utils';
import { inject as service } from '@ember/service';

export default Component.extend({
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

    _setContainerSize() {
        set(this, 'containerHeight', window.innerHeight);
        set(this, 'containerWidth', window.innerWidth);

        const canvasSource = this.$('#source-canvas')[0];
        const ctx = canvasSource.getContext("2d");
        const canvasAltered = this.$('#altered-canvas')[0];
        const ctx2 = canvasAltered.getContext("2d");

        const imageObj = new Image();
        // const w = this.canvasWidth;
        // const h = this.canvasHeight;
        const scope = this;

        // store reference to ctx for render loop access
        set(this, 'ctx', ctx)

        // canvas to put interaction items into
        ctx.fillStyle = "blue";
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        // canvas to put modified image onto
        ctx2.fillStyle = "rgba(0,0,0,0)";
        ctx2.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        // load BG image
        imageObj.onload = function() {
            // ctx.drawImage(this, 0, 0, w, h);
            set(scope, 'bgImageData', this);

            // store canvas image with original pixel objects
            // const imgData = ctx.getImageData(0, 0, w, h);
            // set(scope, 'originalScreenBitmap', imgData);

            // scope._drawText(ctx);

            // begin animation loop
            // return setInterval(scope._deform,
            //     ctx,
            //     scope,
            //     imgData);
        };

        imageObj.src = 'assets/emptyScreen.jpg';
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

            if(isPresent(ctx) && isPresent(bgImage)) {
                const w = scope.canvasWidth;
                const h = scope.canvasHeight;
                ctx.drawImage(bgImage, 0, 0, w, h);
                scope._drawText(ctx);
            }
        }, 50);
    },

    _drawText(ctx) {
        ctx.font = `${this.FONT_SIZE}px Courier`;
        //ctx.fillStyle = "white";

        const temp = ctx;

        this.visibleDisplayLines.forEach((currLine) => {
            if (currLine.text === this.inputProcessor.PROMPT_LINE_1) {
                temp.fillStyle = "#18fe1c";
            } else {
                temp.fillStyle = "white";
            }
            temp.fillText(currLine.text, currLine.x, currLine.y);
        });
    },

    /*
    _deform(ctx, scope, imgData) {
        const noisedImage = scope._noise(ctx, imgData);

        // redraw results
        var newImageData = ctx.createImageData(scope.canvasWidth, scope.canvasHeight);
        newImageData.data = noisedImage;
        // ctx.putImageData(newImageData, 0, 0);
    },

    _noise(ctx, imgData) {
        // select all values of pixels and adjust them randomly or down a little
        const noised = imgData.data.map((currValue) => {
            const maxAdjustment = 20;
            const randomAdjustment = Math.random() * maxAdjustment;
            return currValue + randomAdjustment - (maxAdjustment / 2);
        });

        return ;
    }
    */
});
