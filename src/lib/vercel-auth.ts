import { NextRequest } from 'next/server';
import { createRemoteJWKSet, jwtVerify } from 'jose';

// Vercel's public JWKS URL (verify this in Vercel's OIDC docs if it changes)
const JWKS_URL = 'https://api.vercel.com/.well-known/jwks.json';
const jwks = createRemoteJWKSet(new URL(JWKS_URL));

export async function verifyVercelToken(req: NextRequest): Promise<boolean> {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;

    const token = authHeader.split(' ')[1];
    
    // Verify the token signature and check that the audience is your integration ID
    await jwtVerify(token, jwks, {
      audience: process.env.VERCEL_INTEGRATION_ID, // Get this from your Vercel Integration settings
    });
    
    return true;
  } catch (error) {
    console.error('JWT Verification Failed:', error);
    return false;
  }
}