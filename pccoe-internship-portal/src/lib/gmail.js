export const fetchGmailInternships = async (providerToken) => {
  if (!providerToken) return []
  
  try {
    // Only search emails that look like opportunities to prevent pulling random stuff
    const query = encodeURIComponent('intern OR internship OR "off campus" OR hiring OR placement')
    
    // 1. Get the list of Message IDs matching our search query (Max 10 for performance)
    const listRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=10`, {
      headers: { Authorization: `Bearer ${providerToken}` }
    })
    
    if (!listRes.ok) {
      throw new Error("Failed to fetch from Gmail. Permissions might be missing.")
    }

    const listData = await listRes.json()
    if (!listData.messages || listData.messages.length === 0) return []

    // 2. Fetch the actual content (snippet, subject, sender) for each Message ID
    const emails = await Promise.all(
      listData.messages.map(async (msg) => {
        const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`, {
             headers: { Authorization: `Bearer ${providerToken}` }
        })
        const msgData = await msgRes.json()
        
        const headers = msgData.payload?.headers || []
        const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject'
        
        // Clean up the sender string (e.g. "Google Careers <careers@google.com>" -> "Google Careers")
        let fromRaw = headers.find(h => h.name === 'From')?.value || 'Unknown Sender'
        const fromClean = fromRaw.split('<')[0].replace(/"/g, '').trim()
        
        const dateRaw = headers.find(h => h.name === 'Date')?.value || ''
        
        return {
          id: `gmail-${msgData.id}`,
          title: subject,
          company_name: fromClean,
          company_logo_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(fromClean)}&background=random&color=fff`,
          description: msgData.snippet + '...',
          
          // Fallbacks for UI mapping since Gmail doesn't give us rigid schemas
          is_gmail: true,
          location: 'Check Email',
          work_mode: 'TBD',
          stipend: 'Check Email',
          duration: 'TBD',
          deadline: dateRaw ? new Date(dateRaw).toLocaleDateString() : 'Unknown',
          requirements: ['Sourced from Gmail'],
          is_active: true,
          is_featured: false,
          
          // Where they go when they click Apply
          apply_link: `https://mail.google.com/mail/u/0/#inbox/${msgData.id}`
        }
      })
    )
    
    return emails
  } catch (err) {
    console.error('Gmail fetch sequence error:', err)
    return []
  }
}
