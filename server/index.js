require('dotenv').config();

const express = require('express');
const cors = require('cors');
const PORT = process.env.PORT || 5000;
const scoresRoute = require('./routes/scores');
const pickemRoute = require('./routes/pickem');

const fs = require('fs');
const path = require('path');
const dataDir = path.join(__dirname, 'data/pickem');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize Express app
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', scoresRoute);
app.use('/api', pickemRoute);

app.get('/', (req, res) => {
  res.send('CFB Pickem backend is running!');
});

// Serve React static files
app.use(express.static(path.join(__dirname, '../client/build')));

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

