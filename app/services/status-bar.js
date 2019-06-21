import Service from '@ember/service';
import { set } from '@ember/object';
import { isPresent } from '@ember/utils';

import MagicNumbers from '../const/magic-numbers';

export default Service.extend({

    statusMessage: null,

    drawStatusBar(ctx, viewportMeasurements) {
        if (isPresent(this.statusMessage)) {
            // draw rect
            const rectHeight = 30;
            const textY = viewportMeasurements.height - 15;
            ctx.fillStyle = '#4ba0ff';
            ctx.fillRect(0, viewportMeasurements.height - rectHeight, viewportMeasurements.width, rectHeight);
    
            // Draw text
            const textX = viewportMeasurements.width -
                this.statusMessage.length * MagicNumbers.STATUS_FONT_CHARACTER_WIDTH -
                MagicNumbers.STATUS_BORDER;

            ctx.font = `700 ${MagicNumbers.STATUS_FONT_SIZE}px courier-std`;
            ctx.fillStyle = '#000000';
            ctx.fillText(this.statusMessage, textX, textY);
            ctx.fillText(this.statusMessage, textX - 1, textY);
            ctx.fillText(this.statusMessage, textX - 2, textY);
        }
    },

    clearStatusMessage() {
        set(this, 'statusMessage', null);
    },

    setStatusMessage(newMessage) {
        set(this, 'statusMessage', newMessage);
    }
});