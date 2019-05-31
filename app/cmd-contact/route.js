import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { isPresent } from '@ember/utils';
import { set, computed } from '@ember/object';
import AWS from 'aws-sdk';
import ENV from '../config/environment';

import environmentHelpers from '../utils/environment-helpers';


const ses = new AWS.SES({
    apiVersion: '2010-12-01',
    accessKeyId: ENV.aws.id,
    "secretAccessKey": ENV.aws.access,
    "region": "us-east-1"
});

export default Route.extend({
    inputProcessor: service(),
    persistenceHandler: service(),

    initMessage: computed({
        get() {
            return ['Enter a message:'];
        }
    }),
    messageBody: '',
    stepIndex: 0,

    _sendEmail() {
        // init response
        this.inputProcessor.handleFunctionFromApp(['sending message...']);

        // Prepare values to send with email
        const emailParams = {
            Destination: { ToAddresses: [ 'Admin <adam@magicrobots.com>' ] },
            Message: {
                Body: { Text: {
                Data: this.messageBody,
                Charset: 'UTF-8' } },
                Subject: { Data: 'Robotified Contact Form', Charset: 'UTF-8' }
            },
            ReplyToAddresses: [`Administrator <adam@magicrobots.com>`],
            Source: `${this.persistenceHandler.getUsername()} <adam@magicrobots.com>`, // this has to be verified email in SES
        };

        const scope = this;
        ses.sendEmail(emailParams, function(error) {
            if (error) {

            // handle error
                scope.inputProcessor.handleFunctionFromApp([`message sending error: ${error}.`]);
            } else {

            // handle success
                scope.inputProcessor.handleFunctionFromApp(['message sent.']);
            }
            scope._resetContact();
        });
    },

    _resetContact() {
        set(this, 'stepIndex', 0);
    },

    afterModel() {
        const appEnvironment = environmentHelpers.generateEnvironmentWithDefaults({
            activeAppName: this.routeName,
            displayAppNameInPrompt: true,
            interruptPrompt: true,
            overrideScope: this,
            response: this.initMessage
        });

        this._resetContact();

        this.inputProcessor.setAppEnvironment(appEnvironment);
    },

    handleContactInput(inputString) {

        let appResponse = this.initMessage;

        switch(this.stepIndex) {
            case 0:
                set(this, 'messageBody', inputString);
                appResponse = [
                    `MESSAGE: [${this.messageBody}]`,
                    '',
                    'Are you sure you want to send the message to Magic Robots HQ?',
                    'y/n'
                    ];
                break;
            case 1:
                if (isPresent(inputString)) {
                    const response = inputString.toLowerCase();
                    if (['y', 'yes'].includes(response)) {
                        this._sendEmail();
                        return;
                    }
                }

                this._resetContact();
                this.inputProcessor.handleFunctionFromApp(this.initMessage);
                return;
            default:
                appResponse = ['press any key to continue.'];
                break;

        }

        // increment step
        set(this, 'stepIndex', this.stepIndex + 1);
        this.inputProcessor.handleFunctionFromApp(appResponse);
    }
});