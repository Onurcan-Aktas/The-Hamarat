require('dotenv').config();
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const dns = require('dns');
// import dns from "dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

// dotenv.config()

connectDB();

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/recipes', require('./routes/recipes'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/chat', require('./routes/chat'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'Hamarat API is running 🍳' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Hamarat server running on port ${PORT}`);
});
