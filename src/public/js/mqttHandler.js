
async function subscribe(path) {

    const response = await fetch(`/api/subscriptions/sub/${path}`, {
        method: 'POST',
        credentials: 'include'
    });
    if (response.ok) {
        console.log(await response.json());
        
        await window.client.subscribe(path);
        console.log(`User subscribed ${path}`);
        window.location.reload();
    }
}

async function unsubscribe(path) {
    try {
        const response = await fetch(`/api/subscriptions/unsub/${path}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (response.ok) {
            await window.client.unsubscribe(path);
            console.log(`User unsubscribed from ${path}`);
            window.location.reload();
        }
    } catch (error) {
        console.error('Unsubscription error:', error);
    }
}


document.addEventListener('DOMContentLoaded', () => {

    function createPopup(message) {
        const container = document.getElementById('popup-container');
        const popup = document.createElement('div');
        popup.className = 'popup-message';
        popup.textContent = message;
    
        container.appendChild(popup);
    
        setTimeout(() => {
            popup.style.opacity = '0';
            popup.style.transition = 'opacity 0.3s';
            setTimeout(() => popup.remove(), 300);
        }, 5000);
    }

    function updateJobStatus(jobId, newStatus) {
        console.log(`${jobId} new status : ${newStatus}`);
        
        const jobTables = document.querySelectorAll('.jobs-table');
        jobTables.forEach(table => {
            const jobRow = table.querySelector(`tr[data-job-id="${jobId}"]`);
            if (jobRow) {
                // Update status cell
                const statusCell = jobRow.querySelector('td[class^="status-"]');
                if (statusCell) {
                    statusCell.className = `status-${newStatus}`;
                    statusCell.textContent = newStatus;
                }
            }
        });
    }

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
    window.client = client
    
    const subscribedUrls = window.subscribedUrls
        .split(',')
        .map(url => url.trim())
        .filter(url => url.length > 0);
    
        console.log('Parsed URLs:', subscribedUrls);

    // MQTT
    client.on('connect', () => {
    console.log('Browser connected to MQTT');
    
    // Wczytywanie subskrybcji
    client.subscribe('/sync-job-status/#')
    console.log(`Subscribing ${subscribedUrls.length} urls`);
    subscribedUrls.forEach(path => {
        client.subscribe(path)
        console.log(`Client subscribed ${path}`);
    })
    
    });
    

    client.on('message', (topic, message) => {
        console.log('Received:', topic, message.toString());
        const data = JSON.parse(message.toString());

        if (data.status) {
            createPopup(`Status zlecenia ${topic} zmieniony na: ${data.status}`);
        } else if (data.new_status) {            
            updateJobStatus(topic.split('/')[2],data.new_status)
        }else {
            createPopup(`${data.message}`);
        }
        
        
    });


     

 });

