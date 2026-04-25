# Render Environment Variables

Copy and paste these into the Render dashboard for each service.

## BACKEND SERVICE ENV VARS
`agenticai-backend`

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | |
| `PORT` | `4000` | |
| `JWT_SECRET` | `2b3619fa2b1f9d26763cca454dd66b46c19983eb5ca6a47bdc98065dabdc5548` | Generated |
| `JWT_EXPIRES_IN` | `7d` | |
| `ENCRYPTION_KEY` | `a280a45df8dae58fac2a3db1473858f9e616d855962dad3a5041653fb049faf9` | Generated |
| `FRONTEND_URL` | `https://agenticai-frontend.onrender.com` | |
| `DATABASE_URL` | `[PASTE_FROM_RENDER_POSTGRES]` | Internal Database URL |
| `REDIS_URL` | `[PASTE_FROM_RENDER_REDIS]` | Internal Redis URL |
| `SMTP_HOST` | `smtp.gmail.com` | |
| `SMTP_PORT` | `587` | |
| `SMTP_SECURE` | `false` | |
| `SMTP_USER` | `YOUR_GMAIL` | Replace with yours |
| `SMTP_PASS` | `YOUR_APP_PASSWORD` | Replace with yours |
| `SMTP_FROM` | `noreply@agenticai.dev` | |
| `PLATFORM_FEE_PERCENT` | `20` | |
| `STAKER_REWARD_PERCENT` | `30` | |
| `INTERNAL_CRON_SECRET` | `097ca16c4a3ee5441335369f7b26d2f1` | Generated |
| `ADMIN_EMAIL` | `admin@agenticai.dev` | |
| `ADMIN_PASSWORD` | `Demo@1234` | Change as needed |

## FRONTEND SERVICE ENV VARS
`agenticai-frontend`

| Key | Value | Notes |
|-----|-------|-------|
| `NEXT_PUBLIC_API_URL` | `https://agenticai-backend.onrender.com` | |
| `NEXT_PUBLIC_WS_URL` | `https://agenticai-backend.onrender.com` | |

---

## Generation Commands
If you want to generate new secrets, run these in your terminal:

**JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**ENCRYPTION_KEY:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**INTERNAL_CRON_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```
