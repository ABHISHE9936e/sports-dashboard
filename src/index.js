import 'dotenv/config';
import http from 'http';
import express from 'express';
import { matchesRouter } from './Routes/matches.js';
import setupWebSocketServer from './ws/server.js';
import securityMiddleware  from './utils/arcjet.js';

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());


app.get('/', (req, res) => {
  res.send('Server is running on port ' + PORT);
});

app.use(securityMiddleware);

app.use('/matches', matchesRouter);

const server = http.createServer(app);

const wsServer = setupWebSocketServer(server);

app.locals.broadcastMatchCreated = wsServer.broadcastMatchCreated;

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export { app, server, wsServer };
