import { WebSocket, WebSocketServer } from 'ws';
import { wsArcjet } from '../utils/arcjet.js';

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

export default  function setupWebSocketServer(server) {
  const wss = new WebSocketServer({
    server,
    path: '/ws',
    maxPayload: 1024 * 1024 * 10,
  });

  wss.on('connection', async (socket, req) => {
    if(wsArcjet){
   try {
      const decision = await wsArcjet.protect(req,{ requested: 1 });
      if (decision.isDenied()) {
        const code = decision.reason.isRateLimit() ? 1013 : 1008;
        const reason = decision.reason.isRateLimit() ? 'rate limit exceeded' : 'access denied';
        socket.close(code, reason);

        return socket.close(403, 'Request blocked due to security policy');
      }
    } catch (error) {
      console.error('Arcjet protection error:', error);
      return socket.close(500, 'Failed to process request');
    }
   
    }
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
