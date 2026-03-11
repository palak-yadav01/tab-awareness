// Helper to extract domain from URL
function getDomain(url) {
  if (!url || url.startsWith('chrome://')) return '_browser'
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return '_unknown'
  }
}

// Helper to categorize domain
function getCategory(domain) {
  const work = ['github.com','stackoverflow.com','notion.so','linear.app','figma.com','docs.google.com','sheets.google.com','drive.google.com','slack.com','zoom.us']
  const social = ['twitter.com','x.com','facebook.com','instagram.com','reddit.com','tiktok.com','discord.com','linkedin.com']
  const news = ['news.ycombinator.com','techcrunch.com','theverge.com','bbc.com','cnn.com','medium.com']
  const entertainment = ['youtube.com','netflix.com','twitch.tv','spotify.com']

  if (work.some(d => domain.includes(d))) return 'work'
  if (social.some(d => domain.includes(d))) return 'social'
  if (news.some(d => domain.includes(d))) return 'news'
  if (entertainment.some(d => domain.includes(d))) return 'entertainment'
  return 'other'
}

let eventBuffer = []
let activeTabId = null
let activeTabStart = null

// When a tab opens
chrome.tabs.onCreated.addListener(async (tab) => {
  const allTabs = await chrome.tabs.query({})
  const domain = getDomain(tab.url)

  eventBuffer.push({
    event_type: 'open',
    url: tab.url || '',
    domain: domain,
    category: getCategory(domain),
    dwell_ms: 0,
    tab_count: allTabs.length,
    time: new Date().toISOString()
  })

  console.log('Tab opened! Domain:', domain, '| Total:', allTabs.length)
})

// When a tab closes
chrome.tabs.onRemoved.addListener(async (tabId) => {
  const allTabs = await chrome.tabs.query({})

  eventBuffer.push({
    event_type: 'close',
    url: '',
    domain: '',
    category: '',
    dwell_ms: 0,
    tab_count: allTabs.length,
    time: new Date().toISOString()
  })
})

// When you switch tabs
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const now = Date.now()

  // Record dwell time on previous tab
  if (activeTabId !== null && activeTabStart !== null) {
    const dwellMs = now - activeTabStart
    eventBuffer.push({
      event_type: 'dwell',
      url: '',
      domain: '',
      category: '',
      dwell_ms: dwellMs,
      tab_count: 0,
      time: new Date().toISOString()
    })
  }

  // Start tracking new tab
  activeTabId = tabId
  activeTabStart = now

  const tab = await chrome.tabs.get(tabId)
  const allTabs = await chrome.tabs.query({})
  const domain = getDomain(tab.url)

  eventBuffer.push({
    event_type: 'switch',
    url: tab.url || '',
    domain: domain,
    category: getCategory(domain),
    dwell_ms: 0,
    tab_count: allTabs.length,
    time: new Date().toISOString()
  })

  console.log('Switched to:', domain, '| Category:', getCategory(domain))
})

// Send events every 30 seconds
chrome.alarms.create('flush', { periodInMinutes: 0.5 })

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'flush') sendEvents()
})

async function sendEvents() {
  if (eventBuffer.length === 0) return
  const toSend = [...eventBuffer]
  eventBuffer = []

  try {
    await fetch('http://localhost:3000/api/events/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: toSend })
    })
    console.log('Sent', toSend.length, 'events')
  } catch {
    eventBuffer = [...toSend, ...eventBuffer]
    console.log('Backend offline, will retry')
  }
}