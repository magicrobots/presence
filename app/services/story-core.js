import Service from '@ember/service';
import { computed } from '@ember/object';
import { isPresent } from '@ember/utils';
import { inject as service } from '@ember/service';

import rooms from '../const/story-rooms';
import items from '../const/story-items';

const XP_PER_MOVE = 1;
const HOME_COORD_X = 47;
const HOME_COORD_Y = 47;
const EXIT_POSSIBILITIES = [
        {abbr:'N', word: 'NORTH', coordModifier: {direction: 'Y', amount: -1}},
        {abbr:'E', word: 'EAST', coordModifier: {direction: 'X', amount: 1}},
        {abbr:'W', word: 'WEST', coordModifier: {direction: 'X', amount: -1}},
        {abbr:'S', word: 'SOUTH', coordModifier: {direction: 'Y', amount: 1}}
    ];

export default Service.extend({
    persistenceHandler: service(),
    
    // ------------------- private methods -------------------

    _increaseXP(amount) {
        const oldXP = this.persistenceHandler.getStoryXP();
        const newXP = oldXP + amount;
        this.persistenceHandler.setStoryXP(newXP);
    },

    // ------------------- computed properties -------------------

    currentRoom: computed('persistenceHandler.magicRobotsData.{story-pos-x,story-pos-y}', {
        get() {
            const posX = this.persistenceHandler.getStoryPosX() || HOME_COORD_X;
            const posY = this.persistenceHandler.getStoryPosY() || HOME_COORD_Y;

            return rooms.getRoom({x: posX, y: posY});
        }
    }),

    // ------------------- public methods -------------------

    reportStoryData() {
        const posX = this.persistenceHandler.getStoryPosX();
        const posY = this.persistenceHandler.getStoryPosY();
        const xp = this.persistenceHandler.getStoryXP();
        const visited = this.persistenceHandler.getStoryVisitedRooms();

        console.log(`Position: (${posX}, ${posY}), XP: ${xp}, visited rooms: [${visited}]`);
    },

    formatStoryData() {
        // start over
        this.persistenceHandler.setStoryXP(0);
        this.persistenceHandler.setStoryPosX(HOME_COORD_X);
        this.persistenceHandler.setStoryPosY(HOME_COORD_Y);
        this.persistenceHandler.setStoryVisitedRooms([]);
    },

    isValidDirection(enteredDirection) {
        if (isPresent(this.currentRoom.exits[enteredDirection.abbr])) {
            return true;
        }

        return false;
    },

    handlePositionChange(enteredDirection) {
        const positionFunctionNameGet = `getStoryPos${enteredDirection.coordModifier.direction}`;
        const positionFunctionNameSet = `setStoryPos${enteredDirection.coordModifier.direction}`;
        const defaultCoord = enteredDirection.coordModifier.direction === 'X' ? HOME_COORD_X : HOME_COORD_Y;
        const currentCoordValue = this.persistenceHandler[positionFunctionNameGet]() || defaultCoord;
        const newCoord = currentCoordValue + enteredDirection.coordModifier.amount;

        // set new value
        this._increaseXP(XP_PER_MOVE);
        this.persistenceHandler[positionFunctionNameSet](newCoord);
    },

    getCurrentRoomDescription() {
        let roomDesc = this.currentRoom.description;

        // store room as visited
        this.persistenceHandler.addStoryVisitedRoom(this.currentRoom.id);

        // add present items
        if (this.currentRoom.inventory.length > 0) {
            if (this.currentRoom.inventory.length > 1) {
                roomDesc = roomDesc.concat('There is stuff.');
            } else {
                // there's just one thing
                const inventoryItemName = this.currentRoom.inventory[0];
                const item = items.getItem(inventoryItemName);
                roomDesc = roomDesc.concat(` ${item.description}`);
            }
        }

        const fullDesc = [roomDesc].concat(['']);

        // add exits
        let exitDescs = '';
        const scope = this;
        EXIT_POSSIBILITIES.forEach((currPossibility) => {
            const currExitPossibility = scope.currentRoom.exits[currPossibility.abbr];
            if(isPresent(currExitPossibility)) {
                exitDescs = exitDescs.concat(`${currExitPossibility} `);
            }
        });

        fullDesc.push(exitDescs);

        return fullDesc;
    },
    
    getExitPossibilities() {
        return EXIT_POSSIBILITIES;
    }
});