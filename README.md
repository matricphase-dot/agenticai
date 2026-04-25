# Agentic AI Platform

The Infrastructure Layer for the AI Agent Economy

A decentralized, developer-first platform where anyone can create, deploy, scale, and monetize AI agents. Built with Next.js 14, Express, PostgreSQL, Redis, and Solidity smart contracts.

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express, TypeScript, Prisma, PostgreSQL, Redis, BullMQ
- **Smart Contracts**: Solidity, Hardhat, OpenZeppelin (Polygon)
- **Real-time**: Socket.io
- **Auth**: JWT + refresh tokens

## Features

- **Agent Builder** — create and deploy AI agents with no code
- **Marketplace** — discover and use agents built by the community
- **Staking** — stake AGNT tokens on agents to earn rewards
- **Governance** — propose and vote on platform changes
- **Compute Nodes** — register hardware to earn by running agent tasks
- **Monitoring** — full invocation logs, metrics, and alerts
- **Teams** — collaborate and build agents together

## Local Setup

```bash
# Start Backend
cd backend && npm install && npx prisma migrate dev && npm run dev

# Start Frontend
cd frontend && npm install && npm run dev
```

## Deploy

See [FREE_DEPLOY.md](./FREE_DEPLOY.md) for Render.com deployment instructions.

## Login Credentials (demo)

- **Admin**: `admin@agenticai.dev` / `Demo@1234`
- **Creator**: `alice@agenticai.dev` / `Demo@1234`
- **Staker**: `bob@agenticai.dev` / `Demo@1234`
