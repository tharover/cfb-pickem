const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.CFB_API_KEY;

router.get('/fetch-scores', async (req, res) => {
  const { year, week, refresh } = req.query;

  if (!year || !week) {
    return res.status(400).json({ error: 'Missing year or week' });
  }

  const cachePath = path.join(__dirname, '../data/cache', `${year}-week${week}.json`);
  console.log('Cache path:', cachePath, ', exists:', fs.existsSync(cachePath), 'refresh:', refresh);
  // Load from cache unless refresh is true
  if (fs.existsSync(cachePath) && refresh !== 'true') {
    console.log('Retrieving scores from cache:', cachePath);
    const cached = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    return res.json({ ...cached, source: 'cache' });
  }

  try {
    console.log('Fetching scores for year:', year, 'week:', week, 'API_KEY:', API_KEY ? 'SET' : 'NOT SET');
    const response = await fetch(`https://api.collegefootballdata.com/games?year=${year}&week=${week}`, {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });

    const games = await response.json();
    console.log('Fetched games:', games.message ? 'No' : games.length, 'games for year:', year, 'week:', week);
    const enriched = {
      year,
      week,
      games: games,
      source: 'api',
      timestamp: new Date().toISOString()
    };

    fs.writeFileSync(cachePath, JSON.stringify(enriched, null, 2));
    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch scores' });
  }
});

module.exports = router;
