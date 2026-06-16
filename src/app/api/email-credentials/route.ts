import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { createClient } from '@/lib/supabase/server';

// 1. Define the exact shape of the data stored in Vercel KV
interface EmailCredentials {
  email: string;
  password: string;
  smtpHost: string;
  smtpPort: number;
  serverNode: string;
}

export async function GET(req: NextRequest) {
  try {
    // 2. Authenticate the user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Get query parameters
    const token = req.nextUrl.searchParams.get('token');
    const email = req.nextUrl.searchParams.get('email');

    if (!token || !email) {
      return NextResponse.json(
        { error: 'Missing token or email parameter' },
        { status: 400 }
      );
    }

    // 4. Verify the user owns this email account
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

    // 5. Retrieve and validate the one-time token from KV
    const credentialsKey = `creds:${email}:${token}`;
    
    // FIX: Pass the interface to kv.get so TypeScript knows the shape
    const credentials = await kv.get<EmailCredentials>(credentialsKey);

    if (!credentials) {
      return NextResponse.json(
        { error: 'Token expired or invalid' },
        { status: 401 }
      );
    }

    // 6. Delete the token immediately (One-time use for security)
    await kv.del(credentialsKey);

    // 7. Return the credentials and the correct webmail URL
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
      webmail: `https://${credentials.serverNode}/roundcube/`,
    });

  } catch (error: any) {
    console.error('Credential retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve credentials', details: error.message },
      { status: 500 }
    );
  }
}