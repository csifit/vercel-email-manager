//src/lib/mxroute-client.ts
console.log('MXROUTE_SERVER:', process.env.MXROUTE_SERVER);
console.log('MXROUTE_USERNAME:', process.env.MXROUTE_USERNAME);
console.log('MXROUTE_API_KEY exists:', !!process.env.MXROUTE_API_KEY);
export interface ProvisionEmailResult {
  success: boolean;
  domain: string;
  email: string;
  smtpHost: string;
  smtpPort: number;
  mxRecord: string;
  spfRecord: string;
  serverNode: string; // NEW: The specific server (e.g., fusion.mxrouting.net)
}

const MX_API_BASE = 'https://api.mxroute.com'; 
const headers = {
  'Content-Type': 'application/json',
  'X-Server': process.env.MXROUTE_SERVER || '',
  'X-Username': process.env.MXROUTE_USERNAME || '',
  'X-API-Key': process.env.MXROUTE_API_KEY || '',
};

export async function provisionMXrouteEmail(
  domain: string, 
  emailPrefix: string, 
  password: string
): Promise<ProvisionEmailResult> {
  
  // 1. Add Domain (Ignore 409 Conflict if it already exists)
  const domainRes = await fetch(`${MX_API_BASE}/domains`, {
    method: 'POST', headers, body: JSON.stringify({ domain }),
  });
  if (!domainRes.ok && domainRes.status !== 409) {
    const errText = await domainRes.text();
    throw new Error(`MXroute Domain Error: ${errText}`);
  }

  // 2. Create Email Account
  const emailRes = await fetch(`${MX_API_BASE}/domains/${domain}/email-accounts`, {
    method: 'POST', headers,
    body: JSON.stringify({ username: emailPrefix, password, quota: 0 }),
  });
  if (!emailRes.ok) {
    const errText = await emailRes.text();
    throw new Error(`MXroute Email Error: ${errText}`);
  }

  // 3. Fetch Domain Details to get the EXACT server node
  let actualServer = process.env.MXROUTE_SERVER || 'arrow.mxrouting.net';
  try {
    const domainDetailsRes = await fetch(`${MX_API_BASE}/domains/${domain}`, { headers });
    if (domainDetailsRes.ok) {
      const domainData = await domainDetailsRes.json();
      // MXroute API might return the server under 'server', 'node', or 'hostname'
      actualServer = domainData.server || domainData.node || domainData.hostname || actualServer;
    }
  } catch (e) {
    console.error("Could not fetch domain details for server node:", e);
  }

  return {
    success: true,
    domain,
    email: `${emailPrefix}@${domain}`,
    smtpHost: actualServer,
    smtpPort: 465,
    mxRecord: `10 ${actualServer}`,
    spfRecord: `v=spf1 a mx include:${actualServer} ~all`,
    serverNode: actualServer, // Return the exact server!
  };
}
// src/lib/mxroute-client.ts
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok || response.status >= 400) {
        return response; // Return on success or client error (don't retry)
      }
      // Server error, try again
      if (i < retries - 1) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      if (i === retries - 1) throw error;
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}