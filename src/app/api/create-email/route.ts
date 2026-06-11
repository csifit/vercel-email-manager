import { NextResponse } from 'next/server';
import { provisionMXrouteEmail } from '@/lib/mxroute-client';
import { createClient } from '@/lib/supabase/server';
import { hashPassword, validatePassword, generateSecureToken } from '@/lib/password';
import { kv } from '@vercel/kv';

export async function POST(req: Request) {
  const supabase = await createClient();
  
  // 1. Verify user is logged in
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { prefix, password, domain } = await req.json();

    // Validate inputs
    if (!prefix || !password) {
      return NextResponse.json(
        { error: 'Prefix and password are required.' },
        { status: 400 }
      );
    }

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required.' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          error: 'Password does not meet requirements',
          requirements: passwordValidation.errors,
        },
        { status: 400 }
      );
    }

    // Verify user has permission to use this domain
    const { data: userDomain, error: domainError } = await supabase
      .from('user_domains')
      .select('id')
      .eq('user_id', user.id)
      .eq('domain', domain)
      .single();

    if (domainError || !userDomain) {
      return NextResponse.json(
        { error: 'Domain not found or not authorized for this user.' },
        { status: 403 }
      );
    }

    // Check rate limit
    const rateLimitKey = `ratelimit:email:${user.id}`;
    const count = await kv.incr(rateLimitKey);
    if (count === 1) {
      await kv.expire(rateLimitKey, 3600); // 1 hour window
    }
    if (count > 10) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 10 emails per hour.' },
        { status: 429 }
      );
    }

    // 2. Provision on MXroute
    let result;
    try {
      result = await provisionMXrouteEmail(domain, prefix, password);
    } catch (mxError: any) {
      console.error('MXroute provisioning error:', mxError);
      return NextResponse.json(
        { error: 'Failed to provision email on MXroute', details: mxError.message },
        { status: 500 }
      );
    }

    // 3. Hash password before storing
    const passwordHash = await hashPassword(password);

    // 4. Save to Supabase Database
    const { error: dbError } = await supabase
      .from('email_accounts')
      .insert({
        user_id: user.id,
        domain_id: userDomain.id,
        email_address: result.email,
        server_node: result.serverNode,
        password_hash: passwordHash,
        status: 'active',
      });

    if (dbError) {
      console.error('Database insert error:', dbError);
      
      if (dbError.code === '23505') {
        // Duplicate email
        return NextResponse.json(
          { error: 'This email address already exists.' },
          { status: 409 }
        );
      }

      // Any other database error should fail completely
      console.error(`Database error (${dbError.code}): ${dbError.message}`);
      return NextResponse.json(
        {
          error: 'Failed to save email account to database.',
          code: dbError.code,
        },
        { status: 500 }
      );
    }

    // 5. Generate temporary token for credential retrieval
    const tempToken = generateSecureToken();
    const credentialsKey = `creds:${result.email}:${tempToken}`;
    
    // Store credentials temporarily (5 minutes)
    await kv.set(credentialsKey, {
      email: result.email,
      password: password, // Stored only temporarily
      smtpHost: result.smtpHost,
      smtpPort: result.smtpPort,
      serverNode: result.serverNode,
    });
    await kv.expire(credentialsKey, 300); // 5 minutes

    // 6. Return success WITHOUT password
    return NextResponse.json({
      success: true,
      email: result.email,
      serverNode: result.serverNode,
      credentialsToken: tempToken,
      credentialsExpiresIn: 300, // seconds
      message: 'Email created successfully. Use the credentialsToken to retrieve SMTP details.',
    });

  } catch (error: any) {
    console.error('Create Email Error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
}