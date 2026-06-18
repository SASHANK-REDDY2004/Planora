const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Initialize database connection
const db = require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/habits', require('./routes/habits'));
app.use('/api/mood', require('./routes/mood'));
app.use('/api/meals', require('./routes/meals'));

// Serve static assets in production/local
app.use(express.static(path.join(__dirname, '..', 'client')));

// Fallback for SPA routing - serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'client', 'index.html'));
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(` LifeOS Server running on port ${PORT}`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(` Database: ${db.isMongo ? 'MongoDB Atlas' : 'Local JSON Database'}`);
    console.log(` Access URL: http://localhost:${PORT}`);
    console.log(`=========================================`);
  });
}

module.exports = app;
