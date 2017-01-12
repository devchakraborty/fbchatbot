import EventEmitter from 'events';
import express from 'express';
import bodyParser from 'body-parser';
import winston from 'winston';
import _ from 'lodash';
import Promise from 'bluebird';
import fetch from 'node-fetch';

export class FBChatBot extends EventEmitter {
    constructor(options={}) {
        super();
        this.options = options;
        this.app = express();
        this.app.use(bodyParser.json());

        const verifyToken = options.verifyToken || process.env.FBBOT_VERIFY_TOKEN || 'fbbot';

        this.app.get('/webhook', (req, res) => {
            if (req.query['hub.mode'] == 'subscribe') {
                if (req.query['hub.verify_token'] == verifyToken) {
                    this.logger.info('Got valid subscription request');
                    res.status(200).send(req.query['hub.challenge']);
                } else {
                    this.logger.warn('Got invalid subscription request');
                    res.sendStatus(403);
                }
            } else {
                this.logger.warn('Got unsupported webhook GET request');
                res.sendStatus(404);
            }
        });

        const EVENT_TYPES = [
            'pre_checkout',
            'message',
            'delivery',
            'read',
            'postback',
            'optin',
            'referral',
            'payment',
            'checkout_update',
            'account_linking'
        ];

        this.app.post('/webhook', (req, res) => {
            res.sendStatus(200);

            this.logger.debug('Webhook POST from FB', JSON.stringify(req.body, null, '  '));

            if (req.body.object != 'page') {
                this.logger.warn('Got non-page webhook POST request');
                return;
            }

            const entries = req.body.entry;
            if (!entries) {
                return;
            }

            entries.forEach((entry) => {
                const messaging = entry.messaging;
                if (!messaging) {
                    return;
                }


                messaging.forEach((messagingEvent) => {
                    for (const EVENT_TYPE of EVENT_TYPES) {
                        if (messagingEvent[EVENT_TYPE]) this.emit(EVENT_TYPE, messagingEvent);
                    }
                });
            });
        });

        this.logger = new (winston.Logger)({
            transports: [
              new (winston.transports.Console)({
                'timestamp':true,
                level: options.logLevel || 'info'
              })
            ]
        });
    }

    listen() {
        this.app.listen(this.options.port || process.env.PORT || 3000);
    }

    sendMessage(message) {
        const accessToken = this.options.accessToken || process.env.FBBOT_ACCESS_TOKEN;

        if (!accessToken) return Promise.reject('No page access token provided');

        return fetch(
            `https://graph.facebook.com/v2.6/me/messages?access_token=${accessToken}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify(message)
            }
        );
    }
}
