# Deploy to Polygon Mumbai Testnet

Follow these steps to deploy the Agentic AI smart contracts to the Mumbai testnet.

## Step 1 — Create a deployer wallet

1.  **Install MetaMask**: Go to [metamask.io](https://metamask.io) and install the extension.
2.  **Create Account**: Create a new wallet specifically for deployment.
3.  **Export Key**: MetaMask → Account Details → Export Private Key.
    *   ⚠️ **NEVER** use your main wallet private key.
    *   ⚠️ **NEVER** commit the private key to GitHub.

## Step 2 — Get free test MATIC

1.  **Faucet**: Go to [faucet.polygon.technology](https://faucet.polygon.technology).
2.  **Request**: Paste your wallet address and request test MATIC.
    *   It usually takes 1-2 minutes.
    *   You need about 0.5 MATIC for a full protocol deployment.

## Step 3 — Get free RPC URL

1.  **MaticVigil**: Go to [maticvigil.com](https://maticvigil.com) and sign up for a free account.
2.  **Create App**: Create a new app to get your dedicated Mumbai RPC URL.
3.  **Public Fallback**: `https://rpc-mumbai.maticvigil.com`

## Step 4 — Get Polygonscan API key

1.  **Sign Up**: Go to [polygonscan.com](https://polygonscan.com).
2.  **API Key**: Navigate to **API Keys** and generate a new key. This is required for automatic contract verification.

## Step 5 — Configure .env

Create `contracts/.env` and add:
```env
DEPLOYER_PRIVATE_KEY=your_key_here
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
POLYGONSCAN_API_KEY=your_key_here
```

## Step 6 — Deploy

Run the deployment script:
```bash
cd contracts
npx hardhat run scripts/deploy.ts --network mumbai
```

## Step 7 — Verify (Optional)

To verify the contracts on Polygonscan:
```bash
npx hardhat verify --network mumbai <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

## Step 8 — Update Platform

Copy the printed addresses from Step 6 and add them to your **Render Backend** environment variables.
