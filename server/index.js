const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { buildReport, validate } = require('./report');

const app = express();

// Security middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  })
);
app.use(express.json({ limit: '1mb' }));

app.post('/api/report', (req, res) => {
  const { tasks, date } = req.body || {};
  const error = validate(tasks);
  if (error) return res.status(400).json({ error });
  res.json(buildReport(tasks, date));
});

const dist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(dist));
app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Daily report running on http://localhost:${PORT}`));
