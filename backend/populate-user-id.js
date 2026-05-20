const { pool } = require('./config/db')

async function populateUserId() {
  try {
    // Get all sessions without userId
    const sessions = await pool.query('SELECT id, username FROM session_management WHERE user_id IS NULL')

    for (const session of sessions.rows) {
      // Find user or agent by login
      const user = await pool.query('SELECT id FROM users WHERE login = $1', [session.username])
      let userId = null

      if (user.rows.length > 0) {
        userId = user.rows[0].id
      }
      else {
        // Check agents
        const agent = await pool.query('SELECT id FROM agents WHERE login = $1', [session.username])
        if (agent.rows.length > 0)
          userId = agent.rows[0].id
      }

      if (userId) {
        await pool.query('UPDATE session_management SET user_id = $1 WHERE id = $2', [userId, session.id])
        console.log(`Updated session ${session.id} with userId ${userId}`)
      }
      else {
        console.log(`No user found for session ${session.id} with username ${session.username}`)
      }
    }

    console.log('Population completed')
  }
  catch (error) {
    console.error('Error:', error)
  }
  finally {
    pool.end()
  }
}

populateUserId()
