const WebSocket = require('ws');
const { fetchDataFromDatabase, fetchChart1DataFromDatabase, fetchChart2DataFromDatabase, connectToDatabase } = require('./database.js');

let wss;

function sendDataToClients(data) {
    if (wss) {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    }
}

async function initWebSocketServer() {
    wss = new WebSocket.Server({ port: 3000 });

    console.log('WebSocket server initialized');

    wss.on('connection', function connection(ws) {
        console.log('Client connected to WebSocket');
        ws.on('close', function close() {
            console.log('Client disconnected from WebSocket');
        });
        sendInitialData(ws);
    });

    async function sendInitialData(ws) {
        try {
            const [combinedData, chart1Data, chart2Data] = await Promise.all([
                fetchDataFromDatabase(),
                fetchChart1DataFromDatabase(),
                fetchChart2DataFromDatabase()
            ]);

            const initialData = {
                combinedData,
                chart1Data,
                chart2Data
            };
            ws.send(JSON.stringify(initialData));

            const pool = await connectToDatabase();
            pool.on('change', async () => {
                const [updatedCombinedData, updatedChart1Data, updatedChart2Data] = await Promise.all([
                    fetchDataFromDatabase(),
                    fetchChart1DataFromDatabase(),
                    fetchChart2DataFromDatabase()
                ]);
                const updatedData = {
                    combinedData: updatedCombinedData,
                    chart1Data: updatedChart1Data,
                    chart2Data: updatedChart2Data
                };
                sendDataToClients(updatedData);
            });
        } catch (error) {
            console.error('Error fetching initial data:', error.message);
        }
    }
}

module.exports = {
    initWebSocketServer
};
