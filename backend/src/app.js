const express = require('express');
const cors = require('cors');

const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    name: 'CaliTourSys Backend API',
    status: 'running',
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

app.use(errorHandler);

module.exports = app;
