import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/email-credentials?token={tempToken}&email={email}
 * 
 * Retrieves temporarily stored email credentials.
 * Token expires after 5 minutes or first use.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = req.nextUrl.searchParams.get('token');
  const email = req.nextUrl.searchParams.get('email');

  if (!token || !email) {
    return NextResponse.json(
      { error: 'Missing token or email parameter' },
      { status: 400 }
    );
  }

  try {
    // Verify user owns this email
    const { data: emailAccount } = await supabase
      .from('email_accounts')
      .select('id')
      .eq('user_id', user.id)
      .eq('email_address', email)
      .single();

    if (!emailAccount) {
      return NextResponse.json(
        { error: 'Email not found or not authorized' },
        { status: 403 }
      );
    }

    // Retrieve credentials from KV
    const credentialsKey = `creds:${email}:${token}`;
    const credentials = await kv.get(credentialsKey);

    if (!credentials) {
      return NextResponse.json(
        { error: 'Token expired or invalid' },
        { status: 401 }
      );
    }

    // Delete token after retrieval (one-time use)
    await kv.del(credentialsKey);

    // Return credentials
    return NextResponse.json({
      email: credentials.email,
      password: credentials.password,
      smtp: {
        host: credentials.smtpHost,
        port: credentials.smtpPort,
        user: credentials.email,
        pass: credentials.password,
      },
      imap: {
        host: credentials.serverNode,
        port: 993,
        user: credentials.email,
        pass: credentials.password,
      },
      webmail: `https://${credentials.serverNode}:2096/`,
    });
  } catch (error: any) {
    console.error('Credential retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve credentials' },
      { status: 500 }
    );
  }
}