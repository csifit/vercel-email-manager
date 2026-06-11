# Vercel Email Manager

Fill the gap between Vercel domains and email hosting. Instantly provision SMTP credentials from your Vercel dashboard using MXroute's infrastructure.

## Features

- ✅ One-click email provisioning for Vercel domains
- ✅ Automatic SMTP/IMAP credentials in environment variables
- ✅ Multi-domain support with user ownership
- ✅ Webmail access via Roundcube
- ✅ MXroute reseller integration

## Prerequisites

- Vercel account with domains
- MXroute reseller account
- Supabase project (free tier works)
- Vercel KV storage

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# MXroute
MXROUTE_SERVER=arrow.mxrouting.net
MXROUTE_USERNAME=your_reseller_username
MXROUTE_API_KEY=your_api_key

# Vercel
VERCEL_INTEGRATION_ID=your_integration_id

# Auth
NEXTAUTH_SECRET=generate_random_string
```

## Getting Started

1. Clone and install:
```bash
git clone https://github.com/csifit/vercel-email-manager
npm install
```

2. Set environment variables in `.env.local`

3. Run development server:
```bash
npm run dev
```

4. Open http://localhost:3000

## Database Schema

See `docs/database.sql` for the required Supabase tables:
- `profiles` - user accounts
- `user_domains` - domains owned by users
- `email_accounts` - provisioned email accounts
- `oauth_tokens` - Vercel integration tokens

## API Endpoints

See `docs/api.md` for full endpoint documentation.

## Deployment

Deploy to Vercel:
```bash
vercel deploy
```

Configure Vercel Integration in https://vercel.com/integrations/develop

## Security

- Passwords are stored encrypted (bcrypt)
- Temporary tokens for credential retrieval (5 min TTL)
- All API endpoints require authentication
- CORS configured for Vercel subdomains only

## License

MIT