import WebSocket, { WebSocketServer } from 'ws';
import winston from 'winston';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'server-error.log', level: 'error' })
    ],
});

interface PlayerData {
    id: string;
    x: number;
    y: number;
}

interface ZombieData {
    id: string;
    x: number;
    y: number;
    health: number;
}

interface GameState {
    players: Record<string, PlayerData>;
    zombies: ZombieData[];
    points: number;
    wave: number;
}

const sanitizeInput = (data: any): any => {
    if (typeof data !== 'object' || data === null) return null;
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
        if (key === 'type' && typeof value === 'string') sanitized[key] = value;
        else if (['x', 'y', 'targetX', 'targetY', 'damage'].includes(key) && typeof value === 'number' && !isNaN(value)) {
            sanitized[key] = Math.max(0, Math.min(800, value)); // Clamp values
        }
    }
    return sanitized;
};

const gameState: GameState = {
    players: {},
    zombies: [],
    points: 0,
    wave: 1,
};

const spawnZombies = () => {
    const count = 5 * gameState.wave;
    for (let i = 0; i < count; i++) {
        gameState.zombies.push({
            id: `${gameState.wave}-${i}`,
            x: 100 + i * 150,
            y: 100,
            health: 50 + gameState.wave * 10,
        });
    }
};

spawnZombies();

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws: WebSocket) => {
    const playerId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    gameState.players[playerId] = { id: playerId, x: 400, y: 500 };
    logger.info(`Player ${playerId} connected`);

    ws.on('message', (message: string) => {
        try {
            const data = sanitizeInput(JSON.parse(message));
            if (!data) throw new Error('Invalid message format');

            switch (data.type) {
                case 'join':
                    gameState.players[playerId] = { id: playerId, x: data.x || 400, y: data.y || 500 };
                    break;
                case 'move':
                    gameState.players[playerId] = { id: playerId, x: data.x, y: data.y };
                    break;
                case 'shoot':
                    const bulletSpeed = 500;
                    const dx = data.targetX - data.x;
                    const dy = data.targetY - data.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const time = distance / bulletSpeed;
                    setTimeout(() => {
                        const hitZombie = gameState.zombies.find((z) =>
                            Math.abs(z.x - data.targetX) < 20 && Math.abs(z.y - data.targetY) < 20
                        );
                        if (hitZombie) {
                            hitZombie.health -= 20;
                            if (hitZombie.health <= 0) {
                                gameState.zombies = gameState.zombies.filter((z) => z.id !== hitZombie.id);
                                gameState.points += 10;
                                if (gameState.zombies.length === 0) {
                                    gameState.wave++;
                                    spawnZombies();
                                }
                            }
                        }
                    }, time * 1000);
                    break;
                case 'damage':
                    gameState.points = Math.max(0, gameState.points - (data.damage || 0));
                    if (gameState.points <= 0) {
                        gameState.wave = 1;
                        gameState.zombies = [];
                        spawnZombies();
                    }
                    break;
                default:
                    logger.warn(`Unknown message type from ${playerId}: ${data.type}`);
            }

            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(gameState));
                }
            });
        } catch (err) {
            logger.error(`Message handling failed for ${playerId}:`, err);
        }
    });

    ws.on('error', (err) => logger.error(`WebSocket error for ${playerId}:`, err));
    ws.on('close', () => {
        delete gameState.players[playerId];
        logger.info(`Player ${playerId} disconnected`);
    });
});

wss.on('error', (err) => logger.error('WebSocket server error:', err));
console.log('WebSocket server running on ws://localhost:8080');
