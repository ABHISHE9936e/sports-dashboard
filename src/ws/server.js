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

export default function setupWebSocketServer(server) {
  const wss = new WebSocketServer({
    noServer: true,
    maxPayload: 1024 * 1024 * 10,
  });

  server.on('upgrade', async (req, socket, head) => {
    let pathname;
    try {
      pathname = new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname;
    } catch {
      socket.destroy();
      return;
    }

    if (pathname !== '/ws') {
      socket.destroy();
      return;
    }

    const onSocketError = (error) => {
      console.error('Socket error during upgrade:', error);
      socket.destroy();
    };
    socket.on('error', onSocketError);

    if (wsArcjet) {
      try {
        const decision = await wsArcjet.protect(req, { requested: 1 });
        if (socket.destroyed) {
          return;
        }

        if (decision.isDenied()) {
          const response = decision.reason.isRateLimit()
            ? 'HTTP/1.1 429 Too Many Requests\r\nConnection: close\r\n\r\n'
            : 'HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n';
          socket.write(response);
          socket.destroy();
          return;
        }
      } catch (error) {
        console.error('Arcjet protection error:', error);
        if (!socket.destroyed) {
          socket.write('HTTP/1.1 500 Internal Server Error\r\nConnection: close\r\n\r\n');
          socket.destroy();
        }
        return;
      }
    }

    socket.removeListener('error', onSocketError);

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  });

  wss.on('connection', (socket, req) => {
    socket.on('error', (error) => {
      console.error('WebSocket client error:', error);
    });

    jsonSend(socket, { type: 'WELCOME' });
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
