const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3000 });

console.log('WebSocket server running on ws://localhost:8111');

// Map to keep track of clients and their data streams
const clients = new Map();

// Function to create a heartbeat (ping) mechanism
function heartbeat() {
  this.isAlive = true;
}

wss.on('connection', (ws) => {
  console.log('New client connected');

  // Set initial client state
  ws.isAlive = true;
  ws.on('pong', heartbeat);

  // Error handling for each connection
  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });

  // Add client to the clients Map
  clients.set(ws, { buffer: [] });

  ws.on('message', (data) => {
    try {
      // Buffer message to prevent overflow with large frames
      const clientData = clients.get(ws);
      clientData.buffer.push(data);

      // Once we have a complete frame, process it
      const frame = Buffer.concat(clientData.buffer);
      clientData.buffer = [];  // Clear buffer after frame is complete

      // Broadcast frame to all other connected clients
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(frame, (error) => {
            if (error) console.error('Failed to send frame:', error);
          });
        }
      });
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });
});

// Set up a ping interval to check if clients are still connected
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();

    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(interval);
  console.log('WebSocket server closed');
});

// Error handling at server level
wss.on('error', (err) => {
  console.error('Server error:', err);
});
