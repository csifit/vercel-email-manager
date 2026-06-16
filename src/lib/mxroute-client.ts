//src/lib/mxroute-client.ts
export interface ProvisionEmailResult {
success: boolean;
domain: string;
email: string;
smtpHost: string;
smtpPort: number;
mxRecord: string;
spfRecord: string;
serverNode: string;
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
console.log('========== MXROUTE DEBUG ==========');
console.log('Domain:', domain);
console.log('Email Prefix:', emailPrefix);
console.log('MXROUTE_SERVER:', process.env.MXROUTE_SERVER);
console.log('MXROUTE_USERNAME:', process.env.MXROUTE_USERNAME);
console.log(
'MXROUTE_API_KEY exists:',
!!process.env.MXROUTE_API_KEY
);

// STEP 1: Create domain if needed
console.log('Creating / verifying domain...');

const domainRes = await fetch(`${MX_API_BASE}/domains`, {
method: 'POST',
headers,
body: JSON.stringify({ domain }),
});

const domainResponseText = await domainRes.text();

console.log('Domain status:', domainRes.status);
console.log('Domain response:', domainResponseText);

if (!domainRes.ok && domainRes.status !== 409) {
throw new Error(
`MXroute Domain Error (${domainRes.status}): ${domainResponseText}`
);
}

// STEP 2: Create mailbox
console.log('Creating mailbox...');

const emailRes = await fetch(
`${MX_API_BASE}/domains/${domain}/email-accounts`,
{
method: 'POST',
headers,
body: JSON.stringify({
username: emailPrefix,
password,
quota: 0,
}),
}
);

const emailResponseText = await emailRes.text();

console.log('Email status:', emailRes.status);
console.log('Email response:', emailResponseText);

if (!emailRes.ok) {
throw new Error(
`MXroute Email Error (${emailRes.status}): ${emailResponseText}`
);
}

// STEP 3: Get actual server node
let actualServer =
process.env.MXROUTE_SERVER || 'fusion.mxrouting.net';

try {
console.log('Fetching domain details...');

```
const domainDetailsRes = await fetch(
  `${MX_API_BASE}/domains/${domain}`,
  {
    headers,
  }
);

const detailsText = await domainDetailsRes.text();

console.log(
  'Domain details status:',
  domainDetailsRes.status
);
console.log(
  'Domain details response:',
  detailsText
);

try {
  const domainData = JSON.parse(detailsText);

  actualServer =
    domainData.server ||
    domainData.node ||
    domainData.hostname ||
    actualServer;
} catch {
  console.log(
    'Could not parse domain details JSON'
  );
}
```

} catch (error) {
console.error(
'Could not fetch domain details:',
error
);
}

console.log('Provisioning successful');
console.log('Server node:', actualServer);
console.log('===================================');

return {
success: true,
domain,
email: `${emailPrefix}@${domain}`,
smtpHost: actualServer,
smtpPort: 465,
mxRecord: `10 ${actualServer}`,
spfRecord: `v=spf1 a mx include:${actualServer} ~all`,
serverNode: actualServer,
};
}
