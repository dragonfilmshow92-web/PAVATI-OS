require('dotenv').config();
const db = require('../server/db-mongo');
const server = require('../server/server');

let isConnected = false;

module.exports = async (req, res) => {
  if (!isConnected) {
    try {
      await db.connectDB();
      isConnected = true;
    } catch (err) {
      console.error("Vercel DB Connection Error:", err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: false, message: "Database connection failed" }));
    }
  }

  // Forward request to Node http.Server instance
  server.emit('request', req, res);
};
