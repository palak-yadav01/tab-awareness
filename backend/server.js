import express from 'express'
import cors from 'cors'
import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const db = new pg.Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
})

db.connect()
  .then(() => console.log('✅ Connected to PostgreSQL!'))
  .catch((err) => console.error('❌ Database connection failed:', err.message))

// ── Receive events ────────────────────────────────────
app.post('/api/events/batch', async (req, res) => {
  const { events } = req.body
  if (!events || events.length === 0) return res.json({ ok: true })

  try {
    for (const e of events) {
      await db.query(
        `INSERT INTO tab_events (event_type, url, domain, category, dwell_ms, tab_count, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [e.event_type, e.url || '', e.domain || '', e.category || '', e.dwell_ms || 0, e.tab_count || 0, e.time]
      )
    }
    console.log(`✅ Saved ${events.length} events`)
    res.json({ ok: true, saved: events.length })
  } catch (err) {
    console.error('❌ Error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── Today's summary ───────────────────────────────────
app.get('/api/summary/today', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE event_type = 'open')   AS tabs_opened,
        COUNT(*) FILTER (WHERE event_type = 'close')  AS tabs_closed,
        COUNT(*) FILTER (WHERE event_type = 'switch') AS tab_switches,
        MAX(tab_count)                                 AS peak_tabs,
        COALESCE(SUM(dwell_ms) FILTER (WHERE event_type = 'dwell'), 0) AS total_dwell_ms
      FROM tab_events
      WHERE created_at >= CURRENT_DATE
    `)
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Hoarding Score ────────────────────────────────────
app.get('/api/hoarding-score', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        MAX(tab_count)  AS peak_tabs,
        COUNT(*) FILTER (WHERE event_type = 'open') AS total_opened,
        COALESCE(AVG(dwell_ms) FILTER (WHERE event_type = 'dwell' AND dwell_ms > 0), 0) AS avg_dwell
      FROM tab_events
      WHERE created_at >= CURRENT_DATE
    `)

    const { peak_tabs, total_opened, avg_dwell } = result.rows[0]
    let score = 0

    // Factor 1: too many tabs open at once
    if (peak_tabs > 20) score += 30
    else if (peak_tabs > 10) score += 15
    else if (peak_tabs > 5) score += 5

    // Factor 2: opening too many tabs
    if (total_opened > 50) score += 30
    else if (total_opened > 20) score += 15
    else if (total_opened > 10) score += 5

    // Factor 3: not spending time on tabs (opening but not reading)
    if (avg_dwell < 5000) score += 25
    else if (avg_dwell < 15000) score += 10

    score = Math.min(score, 100)
    const level = score < 25 ? 'healthy' : score < 50 ? 'mild' : score < 75 ? 'moderate' : 'severe'

    res.json({ score, level, peak_tabs, total_opened })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Domain breakdown ──────────────────────────────────
app.get('/api/domains', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        domain,
        category,
        COUNT(*) AS visits
      FROM tab_events
      WHERE created_at >= CURRENT_DATE
        AND domain != ''
        AND domain != '_browser'
        AND domain != '_unknown'
      GROUP BY domain, category
      ORDER BY visits DESC
      LIMIT 10
    `)
    res.json({ domains: result.rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Zombie tabs ───────────────────────────────────────
app.get('/api/zombies', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        domain,
        COUNT(*) AS count,
        MIN(created_at) AS first_seen
      FROM tab_events
      WHERE event_type = 'open'
        AND created_at < NOW() - INTERVAL '2 hours'
        AND domain != ''
        AND domain != '_browser'
      GROUP BY domain
      ORDER BY first_seen ASC
      LIMIT 10
    `)
    res.json({ zombies: result.rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`))