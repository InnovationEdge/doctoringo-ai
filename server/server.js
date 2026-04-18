// server/server.js
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const db = require('./database'); // Ensure db is initialized

const app = express();
const port = process.env.SERVER_PORT || 3001;

// Improved CORS configuration for secure requests
app.use(cors({
  origin: ['https://knowhow.ge', 'https://www.knowhow.ge', 'http://localhost:4000'],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS']
}));

app.use(express.json()); // Middleware to parse JSON bodies

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// --- API Endpoints ---

// 1. Get or Create Session
app.post('/api/session', (req, res) => {
    console.log('Session creation requested');
    const sessionId = uuidv4();
    const sql = `INSERT INTO sessions (session_id) VALUES (?)`;
    db.run(sql, [sessionId], function (err) {
        if (err) {
            console.error("Error creating session:", err.message);
            return res.status(500).json({ error: 'Failed to create session' });
        }
        console.log(`Session created with ID: ${sessionId}`);
        res.json({ sessionId });
    });
});

// 2. Get Chat History for a Session
app.get('/api/history/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    console.log(`History requested for session: ${sessionId}`);
    const sql = `SELECT role, content FROM messages WHERE session_id = ? ORDER BY timestamp ASC`;

    db.all(sql, [sessionId], (err, rows) => {
        if (err) {
            console.error("Error fetching history:", err.message);
            return res.status(500).json({ error: 'Failed to fetch chat history' });
        }
        // Map to the format expected by the frontend (or close to it)
        const history = rows.map(row => ({
            id: `${row.role}-${Date.now()}-${Math.random().toString(36).substring(7)}`, // Generate a unique ID
            content: row.content,
            isUser: row.role === 'user',
            isComplete: true, // History messages are always complete
            // Add role if needed for frontend logic: role: row.role
        }));
        console.log(`Returning ${history.length} messages for session ${sessionId}`);
        res.json(history);
    });
});

// 3. Handle Chat Message (User sends message, gets AI response)
app.post('/api/chat', async (req, res) => {
    const { sessionId, message } = req.body;
    console.log(`Chat message received for session ${sessionId}: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`);

    if (!sessionId || !message) {
        return res.status(400).json({ error: 'sessionId and message are required' });
    }

    // --- First verify the session exists ---
    const checkSessionSql = `SELECT 1 FROM sessions WHERE session_id = ?`;
    db.get(checkSessionSql, [sessionId], async (err, row) => {
        if (err || !row) {
            console.error(`Session ${sessionId} not found or error:`, err ? err.message : "Not found");
            return res.status(404).json({ error: 'Invalid session ID' });
        }

        // --- Save User Message ---
        const userRole = 'user';
        const userSql = `INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)`;
        db.run(userSql, [sessionId, userRole, message], async function (err) {
            if (err) {
                console.error("Error saving user message:", err.message);
                return res.status(500).json({ error: 'Failed to save user message' });
            }

            // --- Fetch Conversation History for OpenAI ---
            const historySql = `SELECT role, content FROM messages WHERE session_id = ? ORDER BY timestamp ASC`;
            db.all(historySql, [sessionId], async (err, rows) => {
                if (err) {
                    console.error("Error fetching history for OpenAI:", err.message);
                    return res.status(500).json({ error: 'Failed to fetch history for context' });
                }

                // Construct messages for OpenAI API
                const conversation = [
                    {
                        role: 'system',
                        content: 'თქვენ საქართველოში მცხოვრები მოქალაქე ხართ, რომელსაც სჭირდება რჩევა ქართულ კანონმდებლობაზე დაყრდნობით.'
                    },
                    ...rows.map(row => ({ role: row.role, content: row.content }))
                    // Note: The latest user message is already included in 'rows'
                ];

                // --- Call OpenAI API ---
                try {
                    console.log(`Calling OpenAI for session ${sessionId}...`);
                    const response = await fetch(OPENAI_API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${OPENAI_API_KEY}`
                        },
                        body: JSON.stringify({
                            model: 'gpt-5',
                            messages: conversation,
                            temperature: 1
                        })
                    });

                    if (!response.ok) {
                        const errorBody = await response.text();
                        console.error(`OpenAI API Error (${response.status}): ${errorBody}`);
                        throw new Error(`OpenAI API request failed with status ${response.status}`);
                    }

                    const data = await response.json();
                    const aiResponseContent = data.choices?.[0]?.message?.content || '❌ No response from GPT.';

                    // --- Save AI Message ---
                    const aiRole = 'assistant';
                    const aiSql = `INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)`;
                    db.run(aiSql, [sessionId, aiRole, aiResponseContent], function (err) {
                        if (err) {
                            console.error("Error saving AI message:", err.message);
                            // Don't necessarily fail the whole request, maybe just log
                            // But we should still return the AI response to the user
                        }
                        console.log(`AI response saved for session ${sessionId}`);
                         // Return the AI response to the frontend
                         res.json({
                            id: Date.now(), // Temporary ID for frontend rendering
                            content: aiResponseContent,
                            isUser: false,
                            isComplete: true // Response is complete when sent back
                        });
                    });

                } catch (error) {
                    console.error('Error calling OpenAI or processing response:', error);
                    res.status(500).json({ error: 'Failed to get response from AI' });
                }
            });
        });
    });
});

// Add a health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// --- Start Server ---
app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening at http://0.0.0.0:${port}`);
});
