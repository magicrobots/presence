import Service from '@ember/service';

import rooms from '../const/story-rooms';
import items from '../const/story-items';

export default Service.extend({

    posX: 47,
    posY: 47,

    getCurrentRoomDescription() {
        const currentRoom = rooms.getRoom({x: this.posX, y:this.posY});
        let description = currentRoom.description;

        // add present items
        if (currentRoom.inventory.length > 0) {
            if (currentRoom.inventory.length > 1) {
                description = description.concat('There is stuff.');
            } else {
                // there's just one thing
                const inventoryItemName = currentRoom.inventory[0];
                const item = items.getItem(inventoryItemName);
                description = description.concat(` There is a ${item.name}.`);
            }
        }

        return description;
    }
});