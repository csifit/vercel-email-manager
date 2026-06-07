import { NextRequest, NextResponse } from 'next/server';
import { verifyVercelToken } from '@/lib/vercel-auth';
import { kv } from '@vercel/kv';
import { provisionMXrouteEmail } from '@/lib/mxroute'; // The MXroute code from our previous lesson

export async function POST(
  req: NextRequest,
  { params }: { params: { installationId: string } }
) {
  if (!(await verifyVercelToken(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { installationId } = params;
  const { name, metadata, billingPlanId } = await req.json();
  
  // The user inputs the domain name in the Vercel UI. It comes as 'name'.
  const domain = name; 
  
  // You configure 'metadata' schema in Vercel dashboard to ask for prefix and password
  const emailPrefix = metadata?.emailPrefix || 'admin';
  const emailPassword = metadata?.emailPassword || 'DefaultPass123!';

  try {
    // 1. Call MXroute to create the domain and email
    const mxResult = await provisionMXrouteEmail(domain, emailPrefix, emailPassword);

    // 2. Get the saved Vercel Access Token to inject DNS records
    const installation = await kv.get(`install:${installationId}`) as any;
    if (installation?.accessToken) {
      await injectDNSRecords(installation.accessToken, domain, mxResult.mxHost);
    }

    // 3. THE MAGIC: Return the response to Vercel
    return NextResponse.json({
      id: domain,
      name: domain,
      status: 'ready',
      billingPlan: { id: billingPlanId },
      metadata: { domain, emailPrefix },
      
      // Vercel automatically adds these to the user's project as Environment Variables!
      secrets: [
        { name: 'SMTP_HOST', value: mxResult.smtpHost },
        { name: 'SMTP_PORT', value: '465' },
        { name: 'SMTP_USER', value: `${emailPrefix}@${domain}` },
        { name: 'SMTP_PASS', value: emailPassword },
      ]
    });

  } catch (error: any) {
    console.error('Provisioning failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper to inject DNS into Vercel
async function injectDNSRecords(vercelToken: string, domain: string, mxHost: string) {
  // Use the Vercel API to add MX and TXT records to the user's domain
  // (Use the Vercel API code we discussed in previous lessons here)
  console.log(`Injecting MX record ${mxHost} for ${domain} using token...`);
}