require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./config/database');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await testConnection();

  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════╗
║   Personal Finance Manager - API Server      ║
║   Running on http://localhost:${PORT}           ║
║   Environment: ${process.env.NODE_ENV || 'development'}                ║
╚══════════════════════════════════════════════╝
    `);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
