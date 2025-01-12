const mqtt = require('mqtt');

const mqttConfig = {
    clientId: 'server_' + Math.random().toString(16).substr(2, 8),
    protocol: 'ws',
    hostname: 'localhost',
    port: 8000,
    path: '/mqtt', // Dodaj ścieżkę dla WebSocket HiveMQ
    keepalive: 60,
    reconnectPeriod: 5000,
    connectTimeout: 30 * 1000,
    clean: true
};

const client = mqtt.connect(`ws://${mqttConfig.hostname}:${mqttConfig.port}${mqttConfig.path}`, mqttConfig);

client.on('connect', () => {
    console.log('Connected to MQTT broker');
    client.subscribe('jobs/#');
});

client.on('message', (topic, message) => {
    console.log(`Received: ${topic}: ${message.toString()}`);
});

module.exports = client;