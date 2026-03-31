// Keywords that identify internship-related emails
const INTERNSHIP_KEYWORDS = [
  'internship',
  'intern',
  'off campus',
  'off-campus',
  'hiring',
  'recruitment',
  'campus recruitment',
  'job opening',
  'placement drive',
  'career opportunity',
  'we are hiring',
  'apply now',
  'fresher',
  'graduate program',
  'trainee',
  'apprentice',
]

// Build Gmail query string - searches subject AND body for keywords
const buildGmailQuery = () => {
  // Gmail search: match any of these keywords anywhere in the email, last 90 days
  const keywordQuery = '(internship OR intern OR "off campus" OR "off-campus" OR hiring OR recruitment OR "campus placement" OR "job opening" OR fresher OR trainee)'
  return `${keywordQuery} newer_than:90d -category:promotions -category:social`
}

// Extracts a clean company/sender name from a raw "From" header
const parseCompanyName = (fromRaw) => {
  if (!fromRaw) return 'Unknown Company'
  // "Display Name <email@domain.com>" -> "Display Name"
  const displayName = fromRaw.split('<')[0].replace(/"/g, '').trim()
  if (displayName) return displayName
  // Fallback: extract domain from email
  const emailMatch = fromRaw.match(/@([^>]+)/)
  if (emailMatch) {
    const domain = emailMatch[1].replace(/\.\w+$/, '') // remove TLD
    return domain.charAt(0).toUpperCase() + domain.slice(1)
  }
  return 'Unknown Company'
}

// Check if subject/snippet contains internship-related keywords
const hasInternshipKeyword = (text) => {
  if (!text) return false
  const lower = text.toLowerCase()
  return INTERNSHIP_KEYWORDS.some(kw => lower.includes(kw))
}

/**
 * Fetches internship-related emails from the user's Gmail inbox
 * @param {string} providerToken - Google OAuth access token
 * @returns {Promise<Array>} Array of internship objects formatted for the portal
 */
export const fetchGmailInternships = async (providerToken) => {
  if (!providerToken) {
    console.log('Gmail: No provider token available.')
    return []
  }

  console.log('Gmail: Fetching internship emails...')

  try {
    const query = encodeURIComponent(buildGmailQuery())

    // Fetch up to 30 matching messages
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=30`,
      { headers: { Authorization: `Bearer ${providerToken}` } }
    )

    if (!listRes.ok) {
      const errText = await listRes.text()
      if (listRes.status === 401) {
        console.warn('Gmail: Token expired or invalid. Please re-login with Google.')
        // Clear the cached token so UI can prompt re-login
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

    console.log(`Gmail: Found ${listData.messages.length} potential emails, processing...`)

    // Fetch metadata for each email in parallel
    const emailResults = await Promise.allSettled(
      listData.messages.map(async (msg) => {
        try {
          const msgRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}` +
            `?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
            { headers: { Authorization: `Bearer ${providerToken}` } }
          )

          if (!msgRes.ok) return null
          const msgData = await msgRes.json()

          const headers = msgData.payload?.headers || []
          const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject'
          const fromRaw = headers.find(h => h.name === 'From')?.value || ''
          const dateRaw = headers.find(h => h.name === 'Date')?.value || ''
          const snippet = msgData.snippet || ''

          // Client-side keyword filter on subject OR snippet
          if (!hasInternshipKeyword(subject) && !hasInternshipKeyword(snippet)) {
            return null
          }

          const companyName = parseCompanyName(fromRaw)
          const receivedDate = dateRaw
            ? new Date(dateRaw).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric'
              })
            : 'Unknown Date'

          return {
            id: `gmail-${msgData.id}`,
            title: subject,
            company_name: companyName,
            company_logo_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&background=1a1a2e&color=60a5fa&bold=true&size=128`,
            description: snippet ? snippet + '...' : 'Open the email to view full details.',
            is_gmail: true,
            location: 'See Email',
            work_mode: 'See Email',
            stipend: 'See Email',
            duration: 'See Email',
            deadline: receivedDate,
            requirements: [],
            skills_required: [],
            is_active: true,
            is_featured: false,
            apply_link: `https://mail.google.com/mail/u/0/#inbox/${msgData.id}`
          }
        } catch {
          return null
        }
      })
    )

    // Extract fulfilled results and filter nulls
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
