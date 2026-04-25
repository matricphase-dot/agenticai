# Deployment Guide: Render Free Tier

Follow these steps to deploy the Agentic AI Platform to Render.com completely for free.

## Step 1 — Push to GitHub
Ensure all changes are committed and pushed to your GitHub repository.
```bash
git add .
git commit -m "chore: add render deployment config and free tier optimizations"
git push origin main
```

## Step 2 — Create Render Account
Go to [render.com](https://render.com), sign up for a free account, and connect your GitHub account.

## Step 3 — Deploy PostgreSQL (Database)
1. Click **New** > **PostgreSQL**.
2. **Name**: `agenticai-db`.
3. **Region**: Choose the one closest to you.
4. **Plan**: `Free`.
5. Click **Create Database**.
6. Once created, copy the **Internal Database URL**. You will need this for the backend.
   > **Note**: Free tier databases expire after 90 days.

## Step 4 — Deploy Redis (Cache & Queues)
1. Click **New** > **Redis**.
2. **Name**: `agenticai-redis`.
3. **Plan**: `Free`.
4. Click **Create Redis**.
5. Once created, copy the **Internal Redis URL**.
   > **Note**: Free tier Redis has a 25MB limit.

## Step 5 — Deploy Backend (Web Service)
1. Click **New** > **Web Service**.
2. Select your repository.
3. **Name**: `agenticai-backend`.
4. **Root Directory**: `backend`.
5. **Runtime**: `Node`.
6. **Build Command**: `npm install && npx prisma generate && npm run build`
7. **Start Command**: `npx prisma migrate deploy && node dist/index.js`
8. **Plan**: `Free`.
9. Click **Advanced** and add all Environment Variables from `RENDER_ENV_VARS.md`.
   - Use the **Internal Database URL** from Step 3 for `DATABASE_URL`.
   - Use the **Internal Redis URL** from Step 4 for `REDIS_URL`.

## Step 6 — Deploy Frontend (Web Service)
1. Click **New** > **Web Service**.
2. Select the same repository.
3. **Name**: `agenticai-frontend`.
4. **Root Directory**: `frontend`.
5. **Runtime**: `Node`.
6. **Build Command**: `npm install && npm run build`
7. **Start Command**: `npm start`
8. **Plan**: `Free`.
9. Add Environment Variables:
   - `NEXT_PUBLIC_API_URL`: `https://agenticai-backend.onrender.com`
   - `NEXT_PUBLIC_WS_URL`: `https://agenticai-backend.onrender.com`

## Step 7 — Seed the Database
After the backend is live:
1. Go to the `agenticai-backend` service in your Render dashboard.
2. Click the **Shell** tab.
3. Run:
   ```bash
   node -e "require('./dist/prisma/seed')"
   ```

## Step 8 — Test the Deployment
1. Open your frontend URL (e.g., `https://agenticai-frontend.onrender.com`).
2. Login with:
   - **Email**: `alice@agenticai.dev`
   - **Password**: `Demo@1234`
3. Verify the Marketplace and Dashboard load correctly.

## Step 9 — Free Tier Limitations
- **Sleep**: Services sleep after 15 min of inactivity. Initial wake-up can take ~30 seconds.
- **Database**: PostgreSQL free expires after 90 days.
- **Redis**: Limited to 25MB.
- **Usage**: 750 hours/month (total).
- **Upgrade**: When ready, change plan to **Starter** ($7/mo per service).
