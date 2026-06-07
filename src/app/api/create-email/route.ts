import { NextResponse } from 'next/server';
import { provisionMXrouteEmail } from '@/lib/mxroute-client';

export async function POST(req: Request) {
  try {
    const { domain, prefix, password } = await req.json();

    // Basic validation
    if (!domain || !prefix || !password) {
      return NextResponse.json({ error: 'Domain, prefix, and password are required.' }, { status: 400 });
    }

    // Call our MXroute engine
    const result = await provisionMXrouteEmail(domain, prefix, password);

    // Return the success data, including the DNS records the user needs to add
    return NextResponse.json({
      success: true,
      email: result.email,
      smtp: {
        host: result.smtpHost,
        port: result.smtpPort,
        user: result.email,
        pass: password, // In a real app, don't return the plain text password in the response!
      },
      dnsRecords: [
        { type: 'MX', name: '@', value: result.mxRecord },
        { type: 'TXT', name: '@', value: result.spfRecord },
      ]
    });

  } catch (error: any) {
    console.error('Create Email Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}