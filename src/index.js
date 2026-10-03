import 'dotenv/config';
import express from 'express';
import prisma from './prisma.js';

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Server is running on port ' + PORT);
});




app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
