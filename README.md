# FBChatBot

Simple class for building FB chat bots.

## Usage

```javascript
// Require module
var FBChatBot = require('fbchatbot').FBChatBot;

// Instantiate a bot
var bot = new FBChatBot({
  verifyToken: 'verify_token', // verify token as specified in FB Developer Console, can also specify FBCHATBOT_VERIFY_TOKEN env var
  accessToken: 'access_token', // FB page access token, can also specify FBCHATBOT_ACCESS_TOKEN env var
  logLevel: 'debug', // levels as specified at https://github.com/winstonjs/winston#logging-levels
  port: 3000 // port to run the web server on, can also specify PORT env var
});

// Respond to incoming messages
// Valid events are: pre_checkout, message, delivery, read, postback, optin, referral, payment, checkout_update, account_linking
bot.on('message', function(message) {
   // ... do something with the message
   
   // Send an outgoing message
   bot.sendMessage({
      recipient: {
        id: 'USER_ID',
      },
      message: {
        text: 'why hello there!',
      }
   });
});

// Start the web server
bot.listen();
