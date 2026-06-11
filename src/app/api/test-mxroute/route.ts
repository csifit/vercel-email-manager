import { NextRequest, NextResponse } from 'next/server';
import { provisionMXrouteEmail } from '@/lib/mxroute-client';
import { generateSecurePassword } from '@/lib/password';

/**
 * GET /api/test-mxroute?secret={NEXTAUTH_SECRET}
 * 
 * Tests MXroute API connectivity and creates a test email account.
 * Requires valid NEXTAUTH_SECRET for security.
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  
  if (secret !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json(
      { error: 'Unauthorized - invalid secret' },
      { status: 401 }
    );
  }

  try {
    // Generate secure random password for test
    const testPassword = generateSecurePassword(16);
    const testPrefix = `test${Date.now()}`;

    const result = await provisionMXrouteEmail(
      'maild.dev',
      testPrefix,
      testPassword
    );

    return NextResponse.json({
      success: true,
      message: 'Successfully connected to MXroute API!',
      data: {
        email: result.email,
        serverNode: result.serverNode,
        smtpHost: result.smtpHost,
        smtpPort: result.smtpPort,
        // Do NOT return password in response
      },
      warning: 'This is a test email account. Log into your MXroute panel to manage or delete it.',
    });

  } catch (error: any) {
    console.error('MXroute test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to connect to MXroute API',
      message: error.message,
      troubleshooting: [
        'Check that MXROUTE_SERVER, MXROUTE_USERNAME, and MXROUTE_API_KEY are set',
        'Verify your MXroute reseller account is active',
        'Check MXroute API status',
      ],
    }, { status: 500 });
  }
}