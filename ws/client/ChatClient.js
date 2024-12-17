const { WebSocket } = require('ws');
const crypto = require('crypto');

class ChatClient {
    constructor(options) {
        this.ws = new WebSocket(options.url);
        this.sessionId = sessionStorage.getItem('sessionId') || crypto.randomUUID(); // Уникальный ID для вкладки
        sessionStorage.setItem('sessionId', this.sessionId); // Сохраняем для текущей вкладки
        this.username = options.username;
        this.encryptionKey = options.key || 'default_secret_key'; // Ключ шифрования
    }

    init() {
        this.ws.on('open', () => this.onOpen());
        this.ws.on('message', (data) => this.onMessage(data));
        this.ws.on('error', console.error);
    }

    onOpen() {
        console.log('connected');
        this.ws.send(JSON.stringify({
            type: 'options',
            sessionId: this.sessionId,
            data: {
                username: this.username
            }
        }));
    }

    onMessage(data) {
        const parsedData = JSON.parse(data);

        if (parsedData.type === 'message') {
            try {
                const decryptedMessage = this.decrypt(parsedData.data.message);
                console.log(`${parsedData.data.sender} >>: ${decryptedMessage}`);
            } catch (err) {
                console.error('Failed to decrypt message:', err.message);
            }
        } else if (parsedData.type === 'options') {
            this.setOptions(parsedData);
        } else {
            console.log('unknown message type');
        }
    }

    setOptions(msgObject) {
        this.sessionId = msgObject.sessionId;
        console.log('Your sessionId: ', this.sessionId);
    }

        send(data) {
            if (this.ws.readyState !== WebSocket.OPEN) {
                console.error('WebSocket is not open');
                return;
            }
        
            const encryptedMessage = this.encrypt(data);
            const msgObject = {
                type: 'message',
                sessionId: this.sessionId,
                data: {
                    sender: this.username,
                    message: encryptedMessage
                }
            };
            this.ws.send(JSON.stringify(msgObject));
        }
        

    encrypt(text) {
        const key = Buffer.from(this.encryptionKey.padEnd(32, '0')); // 32 символи
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return `${iv.toString('hex')}:${encrypted}`;
    }

    decrypt(text) {
        const key = Buffer.from(this.encryptionKey.padEnd(32, '0')); // 32 символи
        const [iv, encryptedText] = text.split(':');
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(iv, 'hex'));
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}

module.exports = { ChatClient };
