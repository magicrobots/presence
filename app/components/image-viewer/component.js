import Component from '@ember/component';
import { set, computed } from '@ember/object';
import { isPresent } from '@ember/utils';

export default Component.extend({

    // ------------------- vars -------------------

    FONT_SIZE: 12,
    TEXT_EDGE_BUFFER: 80,
    PROMPT_LINE_1: 'node|0656324 magicrobots/ (unknown user)',
    PROMPT_LINE_2: '$',

    isPromptCursorVisible: true,

    classNames: ['image-viewer'],

    //ctx: null,
    //bgImageData: null,

    // ------------------- ember hooks -------------------

    keyDown(event) {
        console.log('keyDOwn ' + event);
    },

    init() {
        this._super(...arguments);

        this._startPromptCursorLoop();
        this._startRenderLoop();
    },

    didRender() {
        const canvasSource = this.$('#source-canvas')[0];
        const ctx = canvasSource.getContext("2d");

        set(this, 'ctx', ctx)

        const canvasAltered = this.$('#altered-canvas')[0];
        const ctx2 = canvasAltered.getContext("2d");

        const imageObj = new Image();
        const w = this.canvasWidth;
        const h = this.canvasHeight;
        const scope = this;

        // canvas to put interaction items into
        ctx.fillStyle = "blue";
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        // canvas to put modified image onto
        ctx2.fillStyle = "rgba(0,0,0,0)";
        ctx2.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

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

    // ------------------- computed properties -------------------

    canvasWidth: computed('viewportMeasurements', {
        get() {
            return this.viewportMeasurements.width;
        }
    }),
    canvasHeight: computed('viewportMeasurements', {
        get() {
            return this.viewportMeasurements.height;
        }
    }),

    // ------------------- private functions -------------------

    _startPromptCursorLoop() {
        const scope = this;
        setInterval(function() {
            set(scope, 'isPromptCursorVisible', !scope.isPromptCursorVisible);
        }, 500);
    },

    _startRenderLoop() {
        const scope = this;

        setInterval(function() {
            const bgImage = scope.bgImageData;
            const ctx = scope.ctx;

            if (!isPresent(bgImage)) {
                return;
            }

            if(isPresent(ctx)) {
                const w = scope.canvasWidth;
                const h = scope.canvasHeight;
                ctx.drawImage(bgImage, 0, 0, w, h);
                scope._drawText(ctx);
            }
        }, 50);
    },

    _drawText(ctx) {
        ctx.font = `${this.FONT_SIZE}px Courier`;
        ctx.fillStyle = "white";

        const cursor = this.isPromptCursorVisible ? '_' : '';
        const interactiveLine = `${this.PROMPT_LINE_2}: ${cursor}`;

        ctx.fillText(this.PROMPT_LINE_1, this.TEXT_EDGE_BUFFER, this.TEXT_EDGE_BUFFER);
        ctx.fillText(interactiveLine, this.TEXT_EDGE_BUFFER, this.TEXT_EDGE_BUFFER + this.FONT_SIZE);
    },

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
});
