const { google } = require('googleapis');
const moment = require('moment');
const fs = require('fs');
const http = require('http');
const url = require('url');
const querystring = require('querystring');
const opn = require('opn');
const destroyer = require('server-destroy');

const TOKEN_PATH = 'credentials.json';
let oAuth2Client;

/**
 * Open an http server to accept the oauth callback. In this simple example, the only request to our webserver is to /callback?code=<code>
 */
async function authenticate() {
    // Load client secrets from a local file.
    try {
        const content = fs.readFileSync('client_secret.json');
        const credentials = JSON.parse(content);
        const {
            client_secret,
            client_id,
            redirect_uris
        } = credentials.web;
        let token = {};
        
        oAuth2Client = new google.auth.OAuth2(
            client_id, client_secret, redirect_uris[0]);

        // Check if we have previously stored a token.
        try {
            token = fs.readFileSync(TOKEN_PATH);
            oAuth2Client.setCredentials(JSON.parse(token));
        } catch (err) {
            oAuth2Client.credentials = await getAccessToken(oAuth2Client);
        }
        return oAuth2Client;
    } catch (err) {
        return console.log('Error loading client secret file:', err);
    }
}
async function getAccessToken(oAuth2Client) {
    const scopes = ['https://www.googleapis.com/auth/calendar'];

    return new Promise((resolve, reject) => {
        // grab the url that will be used for authorization
        const authorizeUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes.join(' ')
        });
        const server = http.createServer(async (req, res) => {
            try {
                if (req.url.indexOf('/oauth2callback') > -1) {
                    const qs = querystring.parse(url.parse(req.url).query);
                    res.end('Authentication successful! Please return to the console.');
                    server.destroy();
                    
                    const { tokens } = await oAuth2Client.getToken(qs.code);
                    
                    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
                    
                    resolve(tokens);
                }
            } catch (e) {
                reject(e);
            }
        }).listen(3000, () => {
            // open the browser to the authorize url to start the workflow
            opn(authorizeUrl, {
                wait: false
            }).then(cp => cp.unref());
        });
        destroyer(server);
    });
}

async function addEvent(eventData) {
    if (!oAuth2Client) {
        oAuth2Client = await authenticate();
    }

    const calendar = google.calendar({version: 'v3', oAuth2Client});
    var event = {
        'summary': eventData.title,
        'location': 'Can you do it?',
        'start': {
            'date': eventData.start,
            'timeZone': 'America/Los_Angeles',
        },
        'end': {
            'date': eventData.end,
            'timeZone': 'America/Los_Angeles',
        },
        'reminders': {
            'useDefault': false,
            'overrides': [{
                'method': 'popup',
                'minutes': 360
            }, ],
        },
    };

    return new Promise((resolve, reject) => {
        calendar.events.insert({
            auth: oAuth2Client,
            calendarId: 'primary',
            resource: event,
        }, function (err, event) {
            if (err) {
                console.log('There was an error contacting the Calendar service: ' + err);
                reject(err);
                return;
            }
            console.log('Event created: %s', event.data.htmlLink);
            resolve(event.data);
        });
    });
}

module.exports = {
    addEvent: addEvent
}