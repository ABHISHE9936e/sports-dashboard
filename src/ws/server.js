import { WebSocket, WebSocketServer } from 'ws';
import { wsArcjet } from '../utils/arcjet.js';

const matchSub = new Map();


function subscribeToMatch(socket, matchId) {
  if (!socket.matchIds) socket.matchIds = new Set();
  socket.matchIds.add(matchId);

  if (matchSub.has(matchId)) {
    matchSub.get(matchId).add(socket);
  } else {
    matchSub.set(matchId, new Set([socket]));
  }
}

function unsubscribeFromMatch(socket, matchId) {
  if (socket.matchIds) socket.matchIds.delete(matchId);
  
  if (!matchSub.has(matchId)) return;
  
  const sub = matchSub.get(matchId);
  sub.delete(socket);
  if (sub.size === 0) matchSub.delete(matchId);
}

function cleanupSocket(socket) {
  if (!socket.matchIds) return;
  
  for(const matchId of socket.matchIds) {
    unsubscribeFromMatch(socket, matchId);
  }
}
function broadcastToMatch(matchId, payload) {
  if (!matchSub.has(matchId)) {
    return;
  }
  for (const socket of matchSub.get(matchId)) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
    }
  }
}
function jsonSend(socket, payload) {
  if (socket.readyState !== WebSocket.OPEN) {
    console.log('Socket not open');
    return;
  }
  socket.send(JSON.stringify(payload));
}

function broadcastToAll(sockets, payload) {
  for (const client of sockets) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(payload));
    }
  }
}
function HandleSocketMessage(socket, message) {
let parsedMessage;
  try {
    parsedMessage = JSON.parse(message);
  } catch (error) {
    console.error('Failed to parse message:', error);
    return;
  }

  if (parsedMessage.type === 'SUBSCRIBE_TO_MATCH') {
    subscribeToMatch(socket, parsedMessage.data);
    socket.send(JSON.stringify({ type: 'SUBSCRIBED_TO_MATCH', data: parsedMessage.data }));
    return;
  }
  if (parsedMessage.type === 'UNSUBSCRIBE_FROM_MATCH') {
    unsubscribeFromMatch(socket, parsedMessage.data);
    socket.send(JSON.stringify({ type: 'UNSUBSCRIBED_FROM_MATCH', data: parsedMessage.data }));
    return;
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
   socket.on('message', (message) => {
     HandleSocketMessage(socket, message);
   });
   socket.on('error', (error) => {
socket.terminate();
   })
   socket.on('close', () => {
      cleanupSocket(socket);
    
  });
});

  function broadcastMatchCreated(match) {
    broadcastToAll(wss.clients, { type: 'MATCH_CREATED', data: match });
  }
  function broadcastCommentry(matchId, commentary) {
    broadcastToMatch(matchId, { type: 'COMMENTARY', data: commentary });
  }

  return {
    wss,
    broadcastMatchCreated,
    broadcastCommentry,

  };
}
