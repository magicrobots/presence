import Service from '@ember/service';
import { set } from '@ember/object';
import { isPresent } from '@ember/utils';

const FONT_SIZE = 16;
const FONT_CHARACTER_WIDTH = 10;
const STATUS_BORDER = 75;

export default Service.extend({

    statusMessage: null,

    drawStatusBar(ctx, viewportMeasurements) {
        if (isPresent(this.statusMessage)) {
            // draw rect
            const rectHeight = 30;
            const textY = viewportMeasurements.height - 15;
            ctx.fillStyle = "green";
            ctx.fillRect(0, viewportMeasurements.height - rectHeight, viewportMeasurements.width, rectHeight);
    
            // Draw text
            const textX = viewportMeasurements.width -
                this.statusMessage.length * FONT_CHARACTER_WIDTH -
                STATUS_BORDER;

            ctx.font = `700 ${FONT_SIZE}px courier-std`;
            ctx.fillStyle = "black";
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