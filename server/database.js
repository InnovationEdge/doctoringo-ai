// server/database.js
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const dbPath = process.env.DATABASE_PATH || 'chat_history.db';
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeDb();
    }
});

function initializeDb() {
    db.serialize(() => {
        // Create sessions table
        db.run(`
            CREATE TABLE IF NOT EXISTS sessions (
                session_id TEXT PRIMARY KEY,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) console.error("Error creating sessions table:", err.message);
        });

        // Create messages table
        db.run(`
            CREATE TABLE IF NOT EXISTS messages (
                message_id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                role TEXT NOT NULL, -- 'user', 'assistant', 'system'
                content TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions (session_id)
            )
        `, (err) => {
            if (err) console.error("Error creating messages table:", err.message);
        });

         // Create an index for faster history lookups
         db.run(`CREATE INDEX IF NOT EXISTS idx_session_timestamp ON messages (session_id, timestamp)`, (err) => {
            if (err) console.error("Error creating index:", err.message);
         });
    });
}

module.exports = db;
