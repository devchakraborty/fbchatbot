import request from 'supertest';
import sinon from 'sinon';
import nock from 'nock';
import { FBChatBot } from '../lib';

function botFactory() {
    return new FBChatBot({
        verifyToken: 'verify_token',
        logLevel: 'error',
        accessToken: 'access_token'
    });
}

describe('FBChatBot', () => {

    it('responds to correct subscription', (done) => {
        const bot = botFactory();
        request(bot.app)
            .get('/webhook?hub.mode=subscribe&hub.verify_token=verify_token&hub.challenge=abcdef')
            .expect(200, 'abcdef', done);
    });

    it('responds to incorrect subscription', (done) => {
        const bot = botFactory();
        request(bot.app)
            .get('/webhook?hub.mode=subscribe&hub.verify_token=verfy_token&hub.challenge=abcdef')
            .expect(403, done);
    });

    it('responds to valid message event', (done) => {
        const bot = botFactory();
        const spy = sinon.spy();

        bot.on('message', spy);

        const message = {
            sender: {
                id: 'USER_ID'
            },
            recipient: {
                id: 'PAGE_ID'
            },
            timestamp: 1458692752478,
            message: {
                mid: 'mid.1457764197618:41d102a3e1ae206a38',
                seq: 73,
                text: 'hello, world!',
                quick_reply: {
                    payload: 'DEVELOPER_DEFINED_PAYLOAD'
                }
            }
        };

        request(bot.app)
            .post('/webhook')
            .send({
                object: 'page',
                entry: [
                    {
                        id: 'PAGE_ID',
                        time: 1458692752478,
                        messaging: [
                            message
                        ]
                    }
                ]
            })
            .expect(200)
            .then(() => {
                sinon.assert.calledOnce(spy);
                sinon.assert.calledWith(spy, message);
                done();
            });
    });

    it('sends message correctly', (done) => {
        const bot = botFactory();

        const fb = nock('https://graph.facebook.com')
                    .post('/v2.6/me/messages')
                    .query({ access_token: 'access_token' })
                    .reply(200, {
                        recipient_id: '1008372609250235',
                        message_id: 'mid.1456970487936:c34767dfe57ee6e339'
                    });

        const message = {
            recipient: {
                id: 'USER_ID'
            },
            message: {
                text: 'hello, world!'
            }
        };

        bot.sendMessage(message).then(() => {
            fb.done();
        }).then(done);
    });
});
