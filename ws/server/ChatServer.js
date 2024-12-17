const { WebSocketServer, WebSocket } = require('ws');
const { Client } = require('./Client');

class ChatServer {
    wss = null;
    clientsMap = new Map();

    constructor(options) {
        this.port = options.port;
    }

    init() {
        this.wss = new WebSocketServer({ port: this.port });
        this.wss.on('connection', (ws) => this.onConnection(ws));
        this.wss.on('error', console.error);
        console.log(`ChatServer started on port ${this.port}`);
    }

    onConnection(ws) {
        console.log('new connected');
        ws.on('message', (data) => this.onMessage(ws, data));
    }

    onMessage(ws, data) {
        const msgObject = JSON.parse(data.toString());
        console.log(msgObject);

        if (msgObject.type === 'message') {
            this.broadcast(msgObject);
        } else if (msgObject.type === 'options') {
            this.createClient(ws, msgObject);
        } else {
            console.log('unknown message type');
        }
    }

    createClient(ws, msgObject) {
        const isClientExists = this.clientsMap.get(msgObject.sessionId);

        if (isClientExists) {
            const client = this.clientsMap.get(msgObject.sessionId);
            client.updateWs(ws);
            console.log(`Client ${client.username} reconnected`);
            return;
        }

        const client = new Client({
            ws: ws,
            username: msgObject.data.username,
            sessionId: msgObject.sessionId
        });

        this.clientsMap.set(client.sessionId, client);
        console.log(`Client ${client.username} connected`);
    }

    broadcast(msgObject) {
        const sender = this.clientsMap.get(msgObject.sessionId);
        this.clientsMap.forEach((client) => {
            if (client.ws.readyState === WebSocket.OPEN && client.sessionId !== msgObject.sessionId) {
                client.send({
                    type: 'message',
                    data: {
                        sender: sender.username,
                        message: msgObject.data.message
                    }
                });
            }
        });
    }
}

module.exports = { ChatServer };
