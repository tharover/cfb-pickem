// server/routes/pickem.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const pickemDir = path.join(__dirname, 'data/pickem');
if (!fs.existsSync(pickemDir)) {
  fs.mkdirSync(pickemDir, { recursive: true });
}

// *************************************************
// Load pick’em slate for a specific year and week
// *************************************************
router.get('/load-pickem', (req, res) => {
  const { year, week } = req.query;
  if (!year || !week) {
    return res.status(400).json({ error: 'Missing year or week' });
  }

  const filePath = path.join(__dirname, '../data/pickem', `${year}-week${week}.json`);

  console.log('Loading pickem slate from:', filePath, ' file exists:', fs.existsSync(filePath));

  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) {
      // File might not exist yet
      console.log('Slate file not found, returning empty slate:', err);
      return res.json({ year, week, selectedGames: [] });
    }
    try {
      console.log('Successfully read slate file:', JSON.stringify(data).substring(0, 100), '...');
      const slate = JSON.parse(data);
      res.json(slate);
    } catch (parseErr) {
      console.error('Corrupt slate file:', parseErr);
      res.status(500).json({ error: 'Failed to parse saved slate' });
    }
  });
});


// *************************************************
// Save pick’em slate for a specific year and week
// *************************************************
router.post('/save-pickem', (req, res) => {
  const { year, week, selectedGames } = req.body;
  if (!year || !week || !Array.isArray(selectedGames)) {
    return res.status(400).json({ error: 'Missing or invalid data' });
  }

  const filePath = path.join(__dirname, '../data/pickem', `${year}-week${week}.json`);

  fs.writeFile(filePath, JSON.stringify({ year, week, selectedGames }, null, 2), (err) => {
    if (err) {
      console.error('Failed to save slate:', err);
      return res.status(500).json({ error: 'Failed to save slate' });
    }
    res.json({ success: true });
  });
});

// *************************************************
// Delete pick’em slate for a specific year and week 
// *************************************************
router.delete('/delete-pickem', (req, res) => {
  const { year, week } = req.query;
  if (!year || !week) return res.status(400).json({ error: 'Missing year or week' });

  const filePath = path.join(__dirname, '../data/pickem', `${year}-week${week}.json`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return res.json({ success: true });
  }

  res.status(404).json({ error: 'Slate not found' });
});

module.exports = router;
