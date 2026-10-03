import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { initDatabase } from './db/database.js';

const PORT = process.env.PORT || 5000;

// Initialize SQLite database schema and seed data
try {
  initDatabase();
} catch (err) {
  console.error('❌ Failed to initialize database:', err);
  process.exit(1);
}

// Start HTTP Server
const server = app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🛡️  CloudGuard Security Backend running on port ${PORT}`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🩺 Health: http://localhost:${PORT}/api/health`);
  console.log('====================================================');
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});
