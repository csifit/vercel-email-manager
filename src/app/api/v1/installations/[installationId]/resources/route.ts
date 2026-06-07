import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { provisionMXrouteEmail } from '@/lib/mxroute-client';

export async function POST(
  req: NextRequest,
  { params }: { params: { installationId: string } }
) {
  const { installationId } = params;
  const body = await req.json();
  
  // The user inputs the domain name in the Vercel UI. It comes as 'name'.
  const domain = body.name; 
  
  // You will configure 'metadata' in the Vercel dashboard to ask for prefix and password
  const emailPrefix = body.metadata?.emailPrefix || 'admin';
  const emailPassword = body.metadata?.emailPassword || 'DefaultPass123!';

  try {
    // 1. Call YOUR MXroute engine to create the domain and email
    const mxResult = await provisionMXrouteEmail(domain, emailPrefix, emailPassword);

    // 2. Get the saved Vercel Access Token to inject DNS records later
    const installation = await kv.get(`install:${installationId}`) as any;
    if (installation?.accessToken) {
      // FIX: Changed mxResult.mxHost to mxResult.smtpHost
      console.log(`[DNS] Would inject MX record for ${domain} using host: ${mxResult.smtpHost}`);
    }

    // 3. THE MAGIC: Return the response to Vercel
    return NextResponse.json({
      id: domain,
      name: domain,
      status: 'ready',
      billingPlan: { id: body.billingPlanId },
      metadata: { domain, emailPrefix },
      
      // Vercel automatically adds these to the user's project as Environment Variables!
      // Note: Vercel secrets must be strings, so we use .toString() for the port.
      secrets: [
        { name: 'SMTP_HOST', value: mxResult.smtpHost },
        { name: 'SMTP_PORT', value: mxResult.smtpPort.toString() },
        { name: 'SMTP_USER', value: mxResult.email }, // Cleaner than reconstructing it
        { name: 'SMTP_PASS', value: emailPassword },
      ]
    });

  } catch (error: any) {
    console.error('Provisioning failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}