const { ChatClient } = require('./client/ChatClient');
const readline = require('node:readline');

const sessionIdIndex = process.argv.indexOf('--sessionId');
const nameIndex = process.argv.indexOf('--name');
const keyIndex = process.argv.indexOf('--key');

if (sessionIdIndex === -1 || nameIndex === -1 || keyIndex === -1) {
    console.error('Arguments --sessionId, --name, and --key are required');
    process.exit(1);
}

const sessionId = process.argv[sessionIdIndex + 1];
const name = process.argv[nameIndex + 1];
const key = process.argv[keyIndex + 1];

const client = new ChatClient({ url: 'ws://localhost:8080', username: name, sessionId, key });
client.init();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', (input) => {
    if (input.trim().toLowerCase() === 'exit') {
        rl.close();
    } else {
        client.send(input);
    }
});

