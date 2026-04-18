import { getDB } from '../../lib/db'
import { Configuration, OpenAIApi } from 'openai'
import { v4 as uuidv4 } from 'uuid'

// configure OpenAI client
const config = new Configuration({ apiKey: process.env.OPENAI_API_KEY })
const openai = new OpenAIApi(config)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { sessionId, message } = req.body
  if (!message) {
    return res.status(400).json({ error: 'Missing message' })
  }

  const db = await getDB()

  // ensure or create session row
  let sid = sessionId
  if (!sid) {
    sid = uuidv4()
    await db.run('INSERT INTO sessions (id) VALUES (?)', sid)
  } else {
    const exists = await db.get('SELECT id FROM sessions WHERE id = ?', sid)
    if (!exists) {
      await db.run('INSERT INTO sessions (id) VALUES (?)', sid)
    }
  }

  // store system prompt if first message
  const existingMessages = await db.all(
    'SELECT role, content FROM messages WHERE session_id = ?',
    sid
  )
  if (existingMessages.length === 0) {
    await db.run(
      'INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)',
      sid, 'system', 'თქვენ საქართველოში მცხოვრები მოქალაქე ხართ, რომელსაც სჭირდება რჩევა ქართულ კანონმდებლობაზე დაყრდნობით.'
    )
  }

  // store user message
  await db.run(
    'INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)',
    sid, 'user', message
  )

  // load full conversation
  const rows = await db.all(
    'SELECT role, content FROM messages WHERE session_id = ? ORDER BY created_at',
    sid
  )
  const apiMessages = rows.map(r => ({ role: r.role, content: r.content }))

  try {
    // get AI response
    const completion = await openai.createChatCompletion({
      model: 'gpt-5',
      messages: apiMessages,
      temperature: 1
    })
    const aiContent = completion.data.choices[0].message.content

    // store assistant message
    await db.run(
      'INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)',
      sid, 'assistant', aiContent
    )

    return res.status(200).json({ sessionId: sid, content: aiContent })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'OpenAI API error' })
  }
}
