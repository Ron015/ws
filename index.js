const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3000 });

console.log('WebSocket server running on ws://localhost:3000');

// Function to create a WAV header
const createWavHeader = (sampleRate, numChannels, bitDepth, dataSize) => {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4); // ChunkSize
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  header.writeUInt16LE(numChannels, 22); // NumChannels
  header.writeUInt32LE(sampleRate, 24); // SampleRate
  header.writeUInt32LE(sampleRate * numChannels * (bitDepth / 8), 28); // ByteRate
  header.writeUInt16LE(numChannels * (bitDepth / 8), 32); // BlockAlign
  header.writeUInt16LE(bitDepth, 34); // BitsPerSample
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40); // Subchunk2Size
  return header;
};

wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', (pcmData) => {
    const sampleRate = 16000;
    const numChannels = 1;
    const bitDepth = 16;
    const dataSize = pcmData.length;

    // Create WAV header and concatenate with PCM data
    const wavHeader = createWavHeader(sampleRate, numChannels, bitDepth, dataSize);
    const wavData = Buffer.concat([wavHeader, pcmData]);

    // Broadcast the WAV data to all other connected clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(wavData);
        console.log('Broadcasted audio data to a client');
      }
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});
