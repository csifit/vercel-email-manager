const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'MXROUTE_USERNAME',
  'MXROUTE_API_KEY',
  'NEXTAUTH_SECRET',
];

const missingEnvVars = requiredEnvVars.filter(
  (envVar) => !process.env[envVar]
);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing environment variables: ${missingEnvVars.join(', ')}\n` +
    `See .env.example for required variables`
  );
}

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  mxrouteServer: process.env.MXROUTE_SERVER || 'arrow.mxrouting.net',
  mxrouteUsername: process.env.MXROUTE_USERNAME!,
  mxrouteApiKey: process.env.MXROUTE_API_KEY!,
  vercelIntegrationId: process.env.VERCEL_INTEGRATION_ID,
  nextauthSecret: process.env.NEXTAUTH_SECRET!,
};