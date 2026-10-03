import 'dotenv/config';
import express from 'express';
import {matchesRouter} from './Routes/matches.js';


const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Server is running on port ' + PORT);
});

app.use('/matches', matchesRouter);


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
