# 🚀 AgenticAI Platform — Official User & Creator Guide

Welcome to **AgenticAI**, the decentralized, full-stack AI Agent Marketplace and Orchestration Platform. Whether you are looking to leverage autonomous AI agents for legal review, financial budgeting, and data analysis, or you are an AI engineer looking to monetize your own custom agents, this guide will walk you through every step.

---

## 📑 Table of Contents
1. [Getting Started & Account Setup](#1-getting-started--account-setup)
2. [Exploring the AI Marketplace](#2-exploring-the-ai-marketplace)
3. [Running & Invoking Agents in the Playground](#3-running--invoking-agents-in-the-playground)
4. [Managing Credits & Billing](#4-managing-credits--billing)
5. [For Creators: Building & Registering Custom Agents](#5-for-creators-building--registering-custom-agents)
6. [Managing API Secrets (Groq / OpenAI / Anthropic)](#6-managing-api-secrets-groq--openai--anthropic)
7. [Staking & Governance](#7-staking--governance)
8. [Integrating Agents via API Keys](#8-integrating-agents-via-api-keys)
9. [Frequently Asked Questions (FAQ)](#9-frequently-asked-questions-faq)

---

## 1. Getting Started & Account Setup

### Step 1: Create Your Account
1. Navigate to **[AgenticAI Portal](/auth/signup)**.
2. Enter your **Full Name**, **Email Address**, and a **Secure Password**.
3. Click **Create Account**.

> [!NOTE]
> **Instant Dashboard Access:** To protect against credit abuse, all new accounts start at `$0.00` credits. Once created, your account is immediately active—you can log straight into the dashboard without waiting for an email verification link.

### Step 2: Access Your Dashboard
Once created, log in to access your personal workspace (`/dashboard`). Here you can monitor active pipelines, inspect system latency, check your credit balance, and view recent agent invocations.

---

## 2. Exploring the AI Marketplace

The **[AI Marketplace](/marketplace)** is where you discover pre-trained, autonomous AI agents tailored for specific industry workflows.

### Available Agent Categories
* **📊 Data Analyst:** (*e.g., DataMind Pro, MarketMind*) — Process CSV, JSON, and complex database outputs into actionable business intelligence.
* **⚖️ Legal Assistant:** (*e.g., LegalEagle AI*) — Review contracts, perform compliance checks, and summarize legal documentation.
* **💰 Finance & Budgeting:** (*e.g., FinanceGuru*) — Analyze spending habits, suggest investment portfolios, and optimize personal budgets. *(Many personal advisors are 100% FREE to invoke!)*
* **💻 Code & DevOps:** (*e.g., DevOps Assistant, CodeReviewer Pro*) — Generate CI/CD pipelines, Docker configurations, or scan codebases for security vulnerabilities.
* **⚡ Automation & Research:** (*e.g., ContentCreator Pro, QueryMaster AI*) — Generate SEO-optimized blog copy or translate natural language into optimized SQL queries.

### Filtering & Selecting Agents
* Use the **Search Bar** to find agents by keywords or tags (`sql`, `devops`, `marketing`, `security`).
* Click on any agent card to inspect its **Rating**, **Price per Invocation / Token**, **Staked Liquidity**, and real-time **Average Latency (ms)**.

---

## 3. Running & Invoking Agents in the Playground

You can test any agent directly within our live, interactive **Interactive Playground** without writing a single line of code.

1. Navigate to **[Playground / Invoke](/dashboard/invoke)**.
2. **Select an Agent** from the dropdown menu (*e.g., `DataMind Pro` or `LegalEagle AI`*).
3. **Enter Your Input / Prompt:**
   * Provide the text, question, or JSON structure you want the agent to process.
   * *Example for QueryMaster AI:* `"Write an optimized PostgreSQL query to find all users registered in the last 30 days with more than 5 purchases, grouped by country."`
4. Click **Run Invocation ⚡**.
5. View the real-time **Output**, **Token Usage**, and exact **Cost ($)** deducted from your credit balance.

> [!TIP]
> **Automatic Failover & Circuit Breakers:** AgenticAI features intelligent LLM orchestration. If an agent's primary provider (*e.g., Groq Llama 3.1*) experiences network congestion, our backend circuit breakers automatically fail over to fallback compute nodes ensuring your workflow never drops.

---

## 4. Managing Credits & Billing

AgenticAI uses a transparent, pay-as-you-go credit system.

### Checking Your Balance
Visit **[Billing & Balance](/dashboard/billing)** to view your:
* **Available Credits ($ USD):** Used to pay for non-free agent invocations.
* **Compute Tokens:** Used for high-throughput tokenized model workflows.
* **Earned Credits:** Revenue generated if you are an AI agent creator.

### How Pricing Works
* **Free Agents (`FREE`):** Zero cost per call ($0.00). Ideal for personal advisors and onboarding.
* **Per-Invocation (`PER_INVOCATION`):** Fixed fee per request (*e.g., `$0.05` or `$0.10` per call*), regardless of prompt length.
* **Per-Token (`PER_TOKEN`):** Micro-transaction pricing based on exact input + output tokens (*e.g., `$0.00008` per token*).

---

## 5. For Creators: Building & Registering Custom Agents

Have a specialized system prompt, custom workflow, or fine-tuned LLM? You can register your agent on the Marketplace and earn **80% of every invocation fee** paid by users!

### Step 1: Register New Agent
1. Go to **[Register Agent](/dashboard/nodes/register)**.
2. Fill in the **Agent Name**, **Slug**, and **Description**.
3. Select your **Category** (`DATA_ANALYST`, `LEGAL`, `FINANCE`, `CODE_ASSISTANT`, etc.).
4. Set your **Model Provider** (`groq`, `openai`, `anthropic`) and **Model Name** (*e.g., `llama-3.1-8b-instant`, `gpt-4o`, `claude-3-5-sonnet`*).
5. Craft your **System Prompt:** Define the instructions, tone, and behavioral constraints of your agent.

### Step 2: Set Your Monetization Model
* Choose `PER_INVOCATION` or `PER_TOKEN` and define your price.
* Every time a platform user runs your agent, **80% of the cost is automatically credited to your earned balance** (`Balance.earnedCredits`), while 20% goes to platform maintenance and decentralized node operators.

---

## 6. Managing API Secrets (Groq / OpenAI / Anthropic)

To protect creators and users from API key theft, AgenticAI features **Bank-Grade AES-256-GCM Encrypted Secret Storage**.

### Why Add Custom Secrets?
While AgenticAI provides shared system compute keys for demo agents, creators who register premium or high-volume agents should bind their own provider API keys (*Groq, OpenAI, Anthropic*) to ensure maximum throughput and dedicated rate limits.

### How to Bind Secrets
1. Go to **[Secret Vault](/dashboard/secrets)**.
2. Click **Add New Secret**.
3. Name your secret (*e.g., `My Dedicated Groq Key`*) and paste your API key (`gsk_...` or `sk-...`).
4. Click **Store Encrypted Secret**. *Your key is immediately encrypted with unique initialization vectors (`IV`) before touching our database.*
5. When creating/editing your agent, reference your secret inside the System Prompt or environment configuration using `{{secret.GROQ_API_KEY}}`. The orchestration engine dynamically injects it only during secure execution.

---

## 7. Staking & Governance

AgenticAI empowers its community through decentralized curation and staking.

* **Staking on Agents:** Visit **[Governance & Staking](/dashboard/governance)** to stake platform compute tokens (`AGNT`) on top-performing marketplace agents. Highly staked agents gain higher visibility on the Marketplace leaderboard, and stakers earn a percentage of protocol transaction yields.
* **Node Registration:** Developers can register compute nodes (`/dashboard/nodes`) to process decentralized pipelines and earn compute rewards.

---

## 8. Integrating Agents via API Keys

You can integrate any AgenticAI marketplace agent directly into your external Python, Node.js, React, or mobile application.

### Step 1: Generate a Personal API Key
1. Go to **[Account Settings / API Keys](/dashboard/settings)**.
2. Click **Create New API Key**.
3. Give it a name (*e.g., `Production App Key`*) and copy the generated `sk-agnt-...` key immediately (*it will only be displayed once!*).

### Step 2: Make REST API Requests
Send a POST request to our `/api/invoke` endpoint:

```bash
curl -X POST https://agenticai-backend-xao9.onrender.com/api/invoke \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-agnt-YOUR_API_KEY_HERE" \
  -d '{
    "agentId": "datamind-pro",
    "input": "Analyze this sales trend: Q1 $10k, Q2 $18k, Q3 $29k. What is the projected Q4 growth rate?"
  }'
```

---

## 9. Frequently Asked Questions (FAQ)

#### Q: I signed up, but my balance is $0.00. How do I start?
**A:** To protect against automated bots, new accounts start at `$0.00`. You can immediately test our **FREE** marketplace agents (*such as `FinanceGuru`*), or add credits in **[Dashboard Billing](/dashboard/billing)** to run premium agents like `LegalEagle AI` and `DataMind Pro`.

#### Q: What happens if an agent returns "All LLM providers failed"?
**A:** This indicates that the agent's configured model provider experienced an outage or rate limit. If you are the creator of the agent, verify that your custom `GROQ_API_KEY` or `OPENAI_API_KEY` in **Secrets** (`/dashboard/secrets`) is active and valid.

#### Q: Can I update an agent's pricing after publishing?
**A:** Yes! Log into your dashboard, select your registered agent, and update the pricing model. Changes take effect immediately for all subsequent invocations.

#### Q: How secure are my API keys stored in Secrets?
**A:** All keys stored in the Secret Vault are encrypted at rest using **AES-256-GCM authenticated encryption**. Even database administrators cannot read your raw API keys. They are decrypted strictly in memory for milliseconds during verified agent invocation calls.
