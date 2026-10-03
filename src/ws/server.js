import { WebSocket, WebSocketServer } from 'ws';

function jsonSend(socket, payload) {
  if (socket.readyState !== WebSocket.OPEN) {
    console.log('Socket not open');
    return;
  }
  socket.send(JSON.stringify(payload));
}

function broadcast(sockets, payload) {
  for (const client of sockets) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(payload));
    }
  }
}

export default function setupWebSocketServer(server) {
  const wss = new WebSocketServer({
    server,
    path: '/ws',
    maxPayload: 1024 * 1024 * 10,
  });

  wss.on('connection', (socket) => {
    jsonSend(socket, { type: 'WELCOME' });

    socket.on('error', (error) => {
      console.error('WebSocket client error:', error);
    });
  });

  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
  });

  function broadcastMatchCreated(match) {
    broadcast(wss.clients, { type: 'MATCH_CREATED', data: match });
  }

  return {
    wss,
    broadcastMatchCreated,
    broadeCastMatchCreated: broadcastMatchCreated,
  };
}
