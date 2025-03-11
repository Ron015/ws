const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 8080 });
const clients = new Set();

server.on('connection', (socket) => {
    console.log("Client Connected!");
    clients.add(socket);

    socket.on('message', (data) => {
        clients.forEach(client => {
            if (client !== socket && client.readyState === WebSocket.OPEN) {
                client.send(data); // Send audio data to all clients
            }
        });
    });

    socket.on('close', () => {
        clients.delete(socket);
    });
});
