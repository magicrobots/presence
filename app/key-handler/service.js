import Service from '@ember/service';
import { set } from '@ember/object';

export default Service.extend({

    currentCommand: '',
    commandHistory: [],

    processKey(keyEvent) {
        switch(keyEvent.key.toUpperCase()) {
            case 'BACKSPACE':
                const deleteFromCommand = this.currentCommand.slice(0, -1);
                set(this, 'currentCommand', deleteFromCommand);
                // delete
                break;
            case 'TAB':
                // tab
                break;
            case 'ENTER':
                this._execute();
                // enter
                break;
            case 'ESCAPE':
                // escape
                break;
            case 'ARROWLEFT':
                // arrow L
                break;
            case 'ARROWUP':
                // arrow U
                break;
            case 'ARROWRIGHT':
                // arrow R
                break;
            case 'ARROWDOWN':
                // arrow D
                break;
            case 'DELETE':
                // arrow delete
                break;
            default:
                // add to command
                const appendedCommand = this.currentCommand.concat(keyEvent.key);
                set(this, 'currentCommand', appendedCommand);
                break;
        }
    },

    _execute() {
        // store command in history
        this.commandHistory.push(this.currentCommand);

        // create executable command from string
        const commandComponents = this.currentCommand.split(' ');
        const method = commandComponents[0];
        const args = commandComponents.splice(1);
    }
});
