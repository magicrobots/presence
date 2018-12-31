import Component from '@ember/component';
import { set, computed } from '@ember/object';
import { htmlSafe } from '@ember/string';
import ResizeObservable from 'ember-resize-observer/mixins/resize-observable';

export default Component.extend(ResizeObservable, {

    didRender() {
        this._setContainerSize();
    },

    observedResize() {
        this._setContainerSize();
    },

    _setContainerSize() {
        set(this, 'containerHeight', window.innerHeight);
        set(this, 'containerWidth', window.innerWidth);
        this._doBackgroundCycle();
    },

    routeContainerStyle: computed('containerHeight', 'containerWidth', {
        get() {
            // make it a 4:3 ratio as big as possible in the viewport

            const border = 50;
            const outputRatio = 4/3;
            const currHeight = this.containerHeight;
            const currWidth = this.containerWidth;
            const maxHeight = currHeight - (border * 2);
            const maxWidth = currWidth - (border * 2);
            const isWideViewport = maxWidth / maxHeight > outputRatio;
            
            let newHeight;
            let newWidth;
            let newLeft;
            let newTop;

            if (isWideViewport) {
                newHeight = maxHeight;
                newWidth = outputRatio * newHeight;
                newTop = 0;
            } else {
                newWidth = maxWidth;
                newHeight = maxWidth * (1 / outputRatio);
                newTop = (currHeight - newHeight) / 2 - (border * 1);
            }

            newLeft = (currWidth - newWidth) / 2;

            const styleString = `height: ${newHeight}px; 
                width: ${newWidth}px; 
                left: ${newLeft}px;
                top: ${newTop}px`;

            return htmlSafe(styleString);
        }
    }),

    _doBackgroundCycle() {
        const imgContainer = this.$('.route-container');
        let bgCounter = 1;

        const doSnow = setInterval(function() {
              imgContainer.css('background-image', `url("assets/snow-${bgCounter}.jpg")`);
              bgCounter++;

              if(bgCounter > 5) {
                  clearInterval(doSnow);
              imgContainer.css('background-image', 'url("assets/emptyScreen.jpg")');
              }
        }, 125);
    }
});
