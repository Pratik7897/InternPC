export const fetchGmailInternships = async (providerToken) => {
  if (!providerToken) return []
  
  try {
    // Strict query: must have keywords in the SUBJECT, only last 30 days
    const query = encodeURIComponent(
      'subject:(internship OR "off campus" OR "off-campus" OR hiring OR "campus recruitment") newer_than:30d'
    )
    
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=15`,
      { headers: { Authorization: `Bearer ${providerToken}` } }
    )
    
    if (!listRes.ok) {
      console.warn('Gmail API error - user may not have granted email scope:', listRes.status)
      return []
    }

    const listData = await listRes.json()
    if (!listData.messages || listData.messages.length === 0) return []

    const emails = await Promise.all(
      listData.messages.map(async (msg) => {
        try {
          const msgRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
            { headers: { Authorization: `Bearer ${providerToken}` } }
          )
          const msgData = await msgRes.json()
          
          const headers = msgData.payload?.headers || []
          const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject'
          
          // Extra client-side filter: skip if subject doesn't mention relevant keywords
          const subjectLower = subject.toLowerCase()
          const hasKeyword = ['internship', 'off campus', 'off-campus', 'hiring', 'recruitment', 'opportunity'].some(
            kw => subjectLower.includes(kw)
          )
          if (!hasKeyword) return null

          let fromRaw = headers.find(h => h.name === 'From')?.value || 'Unknown Sender'
          const fromClean = fromRaw.split('<')[0].replace(/"/g, '').trim()
          const dateRaw = headers.find(h => h.name === 'Date')?.value || ''
          
          return {
            id: `gmail-${msgData.id}`,
            title: subject,
            company_name: fromClean,
            company_logo_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(fromClean)}&background=random&color=fff`,
            description: msgData.snippet + '...',
            is_gmail: true,
            location: 'Check Email',
            work_mode: 'TBD',
            stipend: 'Check Email',
            duration: 'TBD',
            deadline: dateRaw ? new Date(dateRaw).toLocaleDateString() : 'Unknown',
            requirements: ['Sourced from Gmail'],
            is_active: true,
            is_featured: false,
            apply_link: `https://mail.google.com/mail/u/0/#inbox/${msgData.id}`
          }
        } catch {
          return null
        }
      })
    )
    
    // Remove nulls (filtered-out emails)
    return emails.filter(Boolean)
  } catch (err) {
    console.error('Gmail fetch error:', err)
    return []
  }
}
