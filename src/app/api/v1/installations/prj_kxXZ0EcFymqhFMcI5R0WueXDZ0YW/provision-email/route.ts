import { NextRequest, NextResponse } from 'next/server';

// Store these in your Vercel Environment Variables (.env.local)
const MX_SERVER = process.env.MXROUTE_SERVER;     // e.g., "arrow.mxrouting.net"
const MX_USER = process.env.MXROUTE_USERNAME;     // Your portal username
const MX_API_KEY = process.env.MXROUTE_API_KEY;   // The key from Advanced -> API keys
const VERCEL_TOKEN = process.env.VERCEL_API_TOKEN;

export async function POST(req: NextRequest) {
  try {
    const { domain, vercelProjectId, emailPrefix, emailPassword } = await req.json();

    const headers = {
      'Content-Type': 'application/json',
      'X-Server': MX_SERVER!,
      'X-Username': MX_USER!,
      'X-API-Key': MX_API_KEY!,
    };

    // 1. Add the Domain to MXroute
    const domainRes = await fetch('https://api.mxroute.com/domains', {
      method: 'POST',
      headers,
      body: JSON.stringify({ domain }),
    });

    if (!domainRes.ok && domainRes.status !== 409) { // 409 means domain already exists, which is fine
      const err = await domainRes.json();
      throw new Error(`Failed to add domain: ${JSON.stringify(err)}`);
    }

    // 2. Create the Email Account (Mailbox)
    const emailRes = await fetch(`https://api.mxroute.com/domains/${domain}/email-accounts`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        user: emailPrefix, // e.g., "admin" or "contact"
        password: emailPassword,
        quota: 0 // 0 usually means unlimited on MXroute
      }),
    });

    if (!emailRes.ok) {
      const err = await emailRes.json();
      throw new Error(`Failed to create email account: ${JSON.stringify(err)}`);
    }

    // 3. Get DNS Records (MX, SPF, DKIM)
    // Note: You may need to call GET /domains/{domain} to fetch the exact DKIM/SPF strings 
    // that MXroute generates for this specific domain, or use their standard global records.
    const mxHost = MX_SERVER; // Usually the server name acts as the MX record
    const spfRecord = `v=spf1 a mx include:${mxHost} ~all`; // Verify exact SPF in MXroute docs

    // 4. Inject DNS into Vercel
    const dnsRecords = [
      { type: 'MX', name: '@', value: `10 ${mxHost}` },
      { type: 'TXT', name: '@', value: spfRecord },
      // Add DKIM TXT record here once you fetch it from the API
    ];

    for (const record of dnsRecords) {
      await fetch(`https://api.vercel.com/v2/domains/${domain}/records`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VERCEL_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(record),
      });
    }

    // 5. Return Success & SMTP Details to Frontend
    return NextResponse.json({
      success: true,
      smtpDetails: {
        host: mxHost,
        port: 465, // MXroute typically uses 465 (SSL) or 587 (STARTTLS)
        username: `${emailPrefix}@${domain}`,
        password: emailPassword,
      }
    });

  } catch (error: any) {
    console.error('Provisioning Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}