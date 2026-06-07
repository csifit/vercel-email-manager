// src/app/api/test-mxroute/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { provisionMXrouteEmail } from '@/lib/mxroute-client';

export async function GET(req: NextRequest) {
  // Simple security: Only allow this to run if you pass a secret key in the URL
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Let's test by creating a test email on your maild.dev domain
    // e.g., test123@maild.dev
    const result = await provisionMXrouteEmail(
      'maild.dev', 
      'test' + Math.floor(Math.random() * 1000), 
      'SuperSecretPassword123!'
    );

    return NextResponse.json({ 
      message: 'Success! Check your MXroute panel.', 
      data: result 
    });

  } catch (error: any) {
    return NextResponse.json({ 
      message: 'Failed to connect to MXroute.', 
      error: error.message 
    }, { status: 500 });
  }
}