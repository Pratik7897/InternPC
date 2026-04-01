// Keywords that identify internship-related emails
const INTERNSHIP_KEYWORDS = [
  'internship', 'internships', 'intern', 'off campus', 'off-campus',
  'hiring', 'we are hiring', 'recruitment', 'campus recruitment',
  'job opening', 'job opportunity', 'placement drive', 'career opportunity',
  'apply now', 'fresher', 'graduate program', 'trainee', 'apprentice',
  'summer intern', 'winter intern', 'opportunity', 'vacancies', 'opening',
]

// Build Gmail query string - searches subject AND body for keywords
const buildGmailQuery = () => {
  const keywordQuery = '(internship OR internships OR intern OR "off campus" OR "off-campus" OR hiring OR "we are hiring" OR recruitment OR "campus placement" OR "job opening" OR "job opportunity" OR fresher OR trainee OR "placement drive" OR vacancies OR opening)'
  return `${keywordQuery} newer_than:90d -category:promotions -category:social`
}

// Extracts clean company name from raw "From" header
const parseCompanyName = (fromRaw) => {
  if (!fromRaw) return 'Unknown Company'
  const displayName = fromRaw.split('<')[0].replace(/"/g, '').trim()
  if (displayName) return displayName
  const emailMatch = fromRaw.match(/@([^>]+)/)
  if (emailMatch) {
    const domain = emailMatch[1].replace(/\.\w+$/, '')
    return domain.charAt(0).toUpperCase() + domain.slice(1)
  }
  return 'Unknown Company'
}

// Check if text contains internship-related keywords
const hasInternshipKeyword = (text) => {
  if (!text) return false
  const lower = text.toLowerCase()
  return INTERNSHIP_KEYWORDS.some(kw => lower.includes(kw))
}

// Decode base64url-encoded email body parts
const decodeBase64Url = (str) => {
  if (!str) return ''
  try {
    // Replace URL-safe chars and decode
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
  } catch {
    return ''
  }
}

// Recursively extract plain text from MIME parts
const extractTextFromParts = (payload) => {
  if (!payload) return ''

  // Direct text/plain body
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return decodeBase64Url(payload.body.data)
  }

  // text/html - strip tags
  if (payload.mimeType === 'text/html' && payload.body?.data) {
    const html = decodeBase64Url(payload.body.data)
    return html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ')
  }

  // Recurse into multipart
  if (payload.parts && payload.parts.length > 0) {
    // Prefer plain text parts
    const plainPart = payload.parts.find(p => p.mimeType === 'text/plain')
    if (plainPart) return extractTextFromParts(plainPart)

    // Try multipart/alternative or any other part
    for (const part of payload.parts) {
      const text = extractTextFromParts(part)
      if (text.trim()) return text
    }
  }

  return ''
}

// ─── Field Extractors ─────────────────────────────────────────────────────────

/**
 * Try to extract a deadline/last-date from email text.
 * Looks for patterns like "last date: 15 April", "apply by March 31", "deadline: 1 May 2026"
 */
const extractDeadline = (text) => {
  if (!text) return null
  const t = text

  const patterns = [
    // "last date: 15 April 2026", "last date to apply: April 15"
    /last\s+date(?:\s+to\s+apply)?[:\s–-]+(\d{1,2}[\s/-](?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*[\s/-]?\d{0,4}|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/i,
    // "apply by 31 March 2026" / "apply before April 30"
    /apply\s+(?:by|before|on\s+or\s+before)[:\s]+(\d{1,2}[\s/-](?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*[\s/-]?\d{0,4}|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/i,
    // "deadline[: ] 30 Apr 26"
    /deadline[:\s–-]+(\d{1,2}[\s/-](?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*[\s/-]?\d{0,4}|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/i,
    // "closing date: ..."
    /closing\s+date[:\s–-]+(\d{1,2}[\s/-](?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*[\s/-]?\d{0,4})/i,
    // "due date: ..."
    /due\s+date[:\s–-]+(\d{1,2}[\s/-](?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*[\s/-]?\d{0,4})/i,
  ]

  for (const re of patterns) {
    const m = t.match(re)
    if (m?.[1]) {
      try {
        const d = new Date(m[1])
        if (!isNaN(d)) {
          return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        }
        // Return raw match if Date constructor couldn't parse it
        return m[1].trim()
      } catch {
        return m[1].trim()
      }
    }
  }
  return null
}

/**
 * Try to extract internship duration from email text.
 * Looks for: "2 months", "6-week", "8 weeks", "3 month internship", "1 year"
 */
const extractDuration = (text) => {
  if (!text) return null
  const patterns = [
    /(\d+(?:\.\d+)?)\s*[-–]?\s*(week|weeks|month|months|year|years)\s*(?:internship|program|duration)?/i,
    /duration[:\s–-]+(\d+\s*(?:week|weeks|month|months|year|years))/i,
    /(\d+)\s*(?:to|-)\s*(\d+)\s*(week|weeks|month|months)/i,  // "2 to 3 months"
  ]
  for (const re of patterns) {
    const m = text.match(re)
    if (m) {
      // Handle "2 to 3 months" case
      if (m[3]) return `${m[1]}-${m[2]} ${m[3]}`
      if (m[2]) return `${m[1]} ${m[2]}`
      if (m[1]) return m[1]
    }
  }
  return null
}

/**
 * Try to extract stipend / pay from email text.
 * Looks for: "₹15,000/month", "INR 20000", "$500/week", "15k per month", "unpaid"
 */
const extractStipend = (text) => {
  if (!text) return null
  if (/unpaid/i.test(text)) return 'Unpaid'

  const patterns = [
    // ₹ or Rs or INR prefix
    /(?:₹|rs\.?|inr)\s*[\d,]+(?:[\d,]*k)?(?:\s*[-–\/]\s*(?:₹|rs\.?|inr)?\s*[\d,]+(?:[\d,]*k)?)?(?:\s*(?:per|\/)\s*(?:month|week|annum|hr|hour))?/i,
    // Stipend label
    /stipend[:\s–-]+(?:₹|rs\.?|inr|\$)?\s*[\d,]+(?:k)?(?:\s*[-–\/][\d,]+k?)?(?:\s*(?:per|\/)\s*(?:month|week))?/i,
    // $ prefix
    /\$\s*[\d,]+(?:\s*[-–\/]\s*\$?\s*[\d,]+)?(?:\s*(?:per|\/)\s*(?:month|week))?/i,
    // "15,000 per month" / "20k per month"
    /[\d,]+k?\s*(?:per|\/)\s*(?:month|week|annum)/i,
  ]

  for (const re of patterns) {
    const m = text.match(re)
    if (m?.[0]) {
      const val = m[0].replace(/\s+/g, ' ').trim()
      if (val.length < 60) return val  // sanity length check
    }
  }
  return null
}

/**
 * Extract the best "Apply Now" or relevant URL from email text.
 * Prefers URLs that contain apply/register/form/job keywords.
 */
const extractApplyLink = (text, fallbackId) => {
  const fallback = `https://mail.google.com/mail/u/0/#inbox/${fallbackId}`
  if (!text) return fallback

  // Find all URLs in the text
  const urlRe = /https?:\/\/[^\s<>"')\]]+/gi
  const urls = [...new Set(text.match(urlRe) || [])]

  if (urls.length === 0) return fallback

  // Score each URL: prefer apply/register/form/careers links
  const applyKeywords = ['apply', 'register', 'application', 'form', 'job', 'career', 'recruit', 'intern', 'unstop', 'internshala', 'naukri', 'linkedin', 'lever', 'greenhouse', 'workday', 'glassdoor', 'indeed']
  const scored = urls.map(url => {
    const lower = url.toLowerCase()
    // Exclude tracking pixels, analytics, unsubscribe links
    if (/pixel|track|unsubscribe|click\.|\bads\b|utm_|analytics/i.test(lower)) return { url, score: -1 }
    const score = applyKeywords.reduce((acc, kw) => acc + (lower.includes(kw) ? 2 : 0), 0)
    return { url, score }
  })

  scored.sort((a, b) => b.score - a.score)
  const best = scored[0]
  return best && best.score >= 0 ? best.url : fallback
}

/**
 * Extract location from email text.
 * Looks for remote, WFH, Pune, Bangalore, etc.
 */
const extractLocation = (text) => {
  if (!text) return null
  if (/\b(remote|work\s+from\s+home|wfh|fully\s+remote)\b/i.test(text)) return 'Remote'
  if (/\b(hybrid)\b/i.test(text)) return 'Hybrid'

  // Common Indian cities
  const cities = ['Pune', 'Mumbai', 'Bangalore', 'Bengaluru', 'Delhi', 'Hyderabad', 'Chennai', 'Kolkata', 'Noida', 'Gurgaon', 'Gurugram', 'Ahmedabad', 'Jaipur', 'Indore', 'Nagpur']
  for (const city of cities) {
    if (new RegExp(`\\b${city}\\b`, 'i').test(text)) return city
  }
  return null
}

/**
 * Fetches internship-related emails from the user's Gmail inbox.
 * Uses full body format for richer data extraction.
 * @param {string} providerToken - Google OAuth access token
 * @returns {Promise<Array>} Array of internship objects
 */
export const fetchGmailInternships = async (providerToken) => {
  if (!providerToken) {
    console.log('Gmail: No provider token available.')
    return []
  }

  console.log('Gmail: Fetching internship emails with full body parsing...')

  try {
    const query = encodeURIComponent(buildGmailQuery())

    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=30`,
      { headers: { Authorization: `Bearer ${providerToken}` } }
    )

    if (!listRes.ok) {
      const errText = await listRes.text()
      if (listRes.status === 401) {
        console.warn('Gmail: Token expired or invalid. Please re-login with Google.')
        localStorage.removeItem('gmail_provider_token')
      } else {
        console.warn(`Gmail API error ${listRes.status}:`, errText)
      }
      return []
    }

    const listData = await listRes.json()
    if (!listData.messages || listData.messages.length === 0) {
      console.log('Gmail: No matching messages found.')
      return []
    }

    console.log(`Gmail: Found ${listData.messages.length} potential emails, processing with full body...`)

    const emailResults = await Promise.allSettled(
      listData.messages.map(async (msg) => {
        try {
          // Use format=full to get entire MIME tree including body parts
          const msgRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
            { headers: { Authorization: `Bearer ${providerToken}` } }
          )

          if (!msgRes.ok) return null
          const msgData = await msgRes.json()

          const headers = msgData.payload?.headers || []
          const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject'
          const fromRaw = headers.find(h => h.name === 'From')?.value || ''
          const dateRaw = headers.find(h => h.name === 'Date')?.value || ''
          const snippet = msgData.snippet || ''

          // Client-side keyword filter
          const combinedText = subject + ' ' + snippet
          if (!hasInternshipKeyword(combinedText)) return null

          // Extract full body text for richer parsing
          const bodyText = extractTextFromParts(msgData.payload)
          // Use body + snippet for pattern matching (snippet is a good short preview)
          const searchText = bodyText || snippet

          // ─── Extract fields ────────────────────────────────────────────
          const deadline = extractDeadline(searchText) || extractDeadline(snippet)
          const duration = extractDuration(searchText) || extractDuration(snippet)
          const stipend = extractStipend(searchText) || extractStipend(snippet)
          const location = extractLocation(searchText) || extractLocation(snippet)
          const applyLink = extractApplyLink(searchText, msgData.id)

          const companyName = parseCompanyName(fromRaw)
          const receivedDate = dateRaw
            ? new Date(dateRaw).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : 'Unknown Date'

          // Build clean preview: use snippet but fix HTML entities
          const preview = snippet
            ? snippet.replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>') + '...'
            : 'Open the email to view full details.'

          return {
            id: `gmail-${msgData.id}`,
            title: subject,
            company_name: companyName,
            company_logo_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&background=1a1a2e&color=60a5fa&bold=true&size=128`,
            description: preview,
            is_gmail: true,
            location: location || 'See Email',
            work_mode: location === 'Remote' ? 'Remote' : location === 'Hybrid' ? 'Hybrid' : 'See Email',
            stipend: stipend || 'See Email',
            duration: duration || 'See Email',
            // deadline shows the extracted last-date, fallback to received date
            deadline: deadline || receivedDate,
            received_date: receivedDate,
            apply_link: applyLink,
            requirements: [],
            skills_required: [],
            is_active: true,
            is_featured: false,
            // Store whether we found a real apply link vs Gmail fallback
            has_apply_link: applyLink !== `https://mail.google.com/mail/u/0/#inbox/${msgData.id}`,
          }
        } catch (err) {
          console.warn('Gmail: Error processing message:', err)
          return null
        }
      })
    )

    const emails = emailResults
      .filter(r => r.status === 'fulfilled' && r.value !== null)
      .map(r => r.value)

    console.log(`Gmail: Returning ${emails.length} internship emails.`)
    return emails

  } catch (err) {
    console.error('Gmail fetch error:', err)
    return []
  }
}
