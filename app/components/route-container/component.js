import Component from '@ember/component';
import { set, computed } from '@ember/object';
import { htmlSafe } from '@ember/string';
import ResizeObservable from 'ember-resize-observer/mixins/resize-observable';

export default Component.extend(ResizeObservable, {

    didRender() {
        this._setCOntainerSize();
    },

    observedResize() {
        this._setCOntainerSize();
    },

    _setCOntainerSize() {
        set(this, 'containerHeight', window.innerHeight);
        set(this, 'containerWidth', window.innerWidth);
    },

    routeContainerStyle: computed('containerHeight', 'containerWidth', {
        get() {
            // make it a 4:3 ratio as big as possible in the viewport
            // minus footer height

            const border = 50;
            const lilBuffer = 10;
            const outputRatio = 4/3;
            const currHeight = this.containerHeight;
            const currWidth = this.containerWidth;
            const maxHeight = currHeight - (border * 2) - lilBuffer;
            const maxWidth = currWidth;
            const isWideViewport = maxWidth / maxHeight > outputRatio;
            
            let newHeight;
            let newWidth;
            let newLeft;
            let newTop;

            if (isWideViewport) {
                newHeight = maxHeight;
                newWidth = outputRatio * newHeight;
                newLeft = (currWidth - newWidth) / 2;
                newTop = 0;
            } else {
                newWidth = maxWidth;
                newHeight = maxWidth * (1 / outputRatio);
                newLeft = 0;
                newTop = (currHeight - newHeight) / 2 - (border * 1);
            }

            const styleString = `height: ${newHeight}px; 
                width: ${newWidth}px; 
                left: ${newLeft}px;
                top: ${newTop}px`;

            return htmlSafe(styleString);
        }
    })
});
