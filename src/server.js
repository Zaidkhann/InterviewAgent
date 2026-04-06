require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes/interview.routes');

const app = express();
const port = process.env.PORT || 8080;

// Security Middleware
app.use(helmet());
app.use(cors());

// Body parser
app.use(express.json());

// Main Router
app.use('/api/interview', routes);

// Serve Static UI Frontend
app.use(express.static('public'));

// Note: The root GET route '/' has been removed because app.use(express.static('public')) 
// will automatically serve the public/index.html file at the root.

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/interview_agent')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(port, () => {
      console.log(`🚀 Server listening on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB', err);
    process.exit(1); // Exit if DB connection fails for Cloud run restart
  });

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Error:', err.message, ']');
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});
