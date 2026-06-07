// src/lib/mxroute-client.ts

export interface ProvisionEmailResult {
  success: boolean;
  domain: string;
  email: string;
  smtpHost: string;
  smtpPort: number;
  mxRecord: string;
  spfRecord: string;
}

// Load credentials from Vercel Environment Variables
const MX_API_BASE = 'https://api.mxroute.com'; 
const headers = {
  'Content-Type': 'application/json',
  'X-Server': process.env.MXROUTE_SERVER || '',     // e.g., "arrow.mxrouting.net"
  'X-Username': process.env.MXROUTE_USERNAME || '', 
  'X-API-Key': process.env.MXROUTE_API_KEY || '',   
};

/**
 * Main function to provision a domain and an email account
 */
export async function provisionMXrouteEmail(
  domain: string, 
  emailPrefix: string, 
  password: string
): Promise<ProvisionEmailResult> {
  
  // 1. Add Domain to MXroute
  const domainRes = await fetch(`${MX_API_BASE}/domains`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ domain }),
  });

  // If it's not OK and not a 409 (Conflict/Already Exists), throw an error
  if (!domainRes.ok && domainRes.status !== 409) {
    const errText = await domainRes.text();
    throw new Error(`MXroute Domain Error (${domainRes.status}): ${errText}`);
  }

  // 2. Create the Email Account
  const emailRes = await fetch(`${MX_API_BASE}/domains/${domain}/email-accounts`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ 
      user: emailPrefix, 
      password: password,
      quota: 0 // 0 = Unlimited on MXroute
    }),
  });

  if (!emailRes.ok) {
    const errText = await emailRes.text();
    throw new Error(`MXroute Email Error (${emailRes.status}): ${errText}`);
  }

  // 3. Construct DNS & SMTP Details
  // MXroute uses the server name as the MX host
  const mxHost = process.env.MXROUTE_SERVER || 'arrow.mxrouting.net';
  
  return {
    success: true,
    domain: domain,
    email: `${emailPrefix}@${domain}`,
    smtpHost: mxHost,
    smtpPort: 465, // MXroute standard SSL port (587 for STARTTLS)
    mxRecord: `10 ${mxHost}`,
    spfRecord: `v=spf1 a mx include:${mxHost} ~all`,
  };
}