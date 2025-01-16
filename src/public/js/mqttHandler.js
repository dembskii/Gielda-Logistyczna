document.addEventListener('DOMContentLoaded', () => {

    // Konfiguracja klienta MQTT
 const mqttConfig = {
     clientId: 'webclient_' + Math.random().toString(16).substr(2, 8),
     protocol: 'ws',
     hostname: 'localhost',
     port: 8000,
     path: '/mqtt', 
     keepalive: 60,
     reconnectPeriod: 5000,
     connectTimeout: 30 * 1000,
     clean: true
 };

 
    const client = mqtt.connect(`ws://${mqttConfig.hostname}:${mqttConfig.port}${mqttConfig.path}`, mqttConfig);



    // MQTT
    client.on('connect', () => {
    console.log('Browser connected to MQTT');
    client.subscribe('jobs/#');
    });

    client.on('message', (topic, message) => {
        console.log('Received:', topic, message.toString());
    });


     

 });

