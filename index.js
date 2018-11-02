const fs = require('fs');
const _ = require('underscore');
const moment = require('moment');
const cal = require('./cal');

const data = fs.readFileSync('data.txt').toString();

let total = 0;
const map = {};
function log(str) {
    console.log(str);
}
data.split('\n').forEach(line => {
    if (!line) return;
    // log('line: ' + JSON.stringify(line, null, ' '));
    var key = line.match(/(.+)([:|：])/)[1];
    // log('key: ' + JSON.stringify(key, null, ' '));
    var res = line.match(/\d+/gi);
    // log('res: ' + JSON.stringify(res, null, ' '));
    map[key] = res;
    total += res.length;
});

// log('map: ' + JSON.stringify(map, null, ' '));
// log(`total is ${total}`);

let curKey = '';
var xx = {
    'key': '',
    'value': ''
};
function processMap(map) {
    let result = [];
    let pair = [];
    
    _.forEach(map, (arr, key) => {
        _.forEach(arr, (value) => {
            let e = _.clone(xx);
            e.key = key;
            e.value = value;
            pair.push(e);
            if (pair.length === 2) {
                result.push(pair);
                pair = [];
            }
        });
    });
    if (pair.length > 1) {
        result.push(pair);
    }
    return result;
}

async function yay(result) {
    let date = moment();
    for (let pair of result) {
        // let pair = result[0];
        let eventDate = date.format('YYYY-MM-DD');
        let title = '[LC] ';
        if (pair[0].key === pair[1].key) {
            title += `${pair[0].key}: ${pair[0].value}, ${pair[1].value}`;
        } else {
            title += `${pair[0].key}: ${pair[0].value}; ${pair[1].key}: ${pair[1].value}`;
        }
        let event = {
            title: title,
            start: eventDate,
            end: eventDate
        };
        console.log('event: ' + JSON.stringify(event, null, ' '));
        let res = await cal.addEvent(event);
        console.log('res: ' + JSON.stringify(res, null, ' '));
        date.add(1, 'day');
    }
}

var result = processMap(map);
yay(result);
