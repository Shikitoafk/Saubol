# Saubol

SAT and IELTS practice platform.

## Production checklist

1. In Supabase SQL Editor, run [`supabase_progress_schema.sql`](./supabase_progress_schema.sql). This enables row-level security, durable SAT answer history, and atomic progress updates.
2. In Supabase Authentication, enable **Email**. Add your production URL and `https://your-domain/login` to the Redirect URLs. Enable Google only after its OAuth redirect URL is configured there.
3. Add the following variables to the hosting provider (Vercel, Netlify, etc.): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and, when images use Storage, `VITE_SAT_IMAGE_BASE`.
4. Build with `npm run build`; check with `npx tsc --noEmit`.

Never expose `SUPABASE_SERVICE_ROLE_KEY` in browser variables or commit it to Git.
