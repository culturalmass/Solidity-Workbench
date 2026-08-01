# Solidity Workbench

A local smart contract workbench for deploying, configuring, and interacting with Solidity contracts across EVM networks.

This repo is prepared for GitHub: local secrets and generated build/deployment files are ignored.

## What the app can do

- Deploy example ERC20 tokens with Hardhat Ignition.
- Interact with deployed contracts from a web UI.
- Select a supported network from the toolbar.
- Select a deployed contract from the toolbar.
- Automatically load deployed contract addresses from `ignition/deployments/chain-*/deployed_addresses.json`.
- Automatically load contract ABIs from Ignition deployment artifacts.
- Split contract functions into:
  - **Read** functions: `view` / `pure`
  - **Write** functions: `payable` / `nonpayable`
- Render input fields from ABI function parameters.
- Execute read calls through a public client.
- Send write transactions through a wallet client.
- Show transaction hashes, confirmations, read results, and errors in the log viewer.
- Clear the log viewer.
- Import external verified contracts with the `grab` script.
- Verify deployed contracts with the `verify` script.

## Included contracts

The repo currently includes two simple ERC20 contracts:

- `contracts/usdt.sol` → `USDT`
- `contracts/usdc.sol` → `USDC`

Both mint a fixed supply to the initial holder passed to the constructor.

## Requirements

- Node.js
- pnpm
- A funded deployer wallet for the target network
- Optional: explorer API key for verification

## Setup

```bash
pnpm install
cp .env.example .env
```

Edit `.env`:

```env
VITE_PRIVATE_KEY="0xYOUR_PRIVATE_KEY"
VITE_ETHERSCAN_KEY="YOUR_EXPLORER_API_KEY"
```

> Never commit `.env` or real private keys.

## Scripts

```bash
pnpm dev       # Sync networks, then start the Vite app
pnpm build     # Sync networks, typecheck, and build the app
pnpm lint      # Run ESLint
pnpm preview   # Preview production build
pnpm deploy    # Interactive deployment flow
pnpm verify    # Interactive verification flow
pnpm grab      # Import a verified external contract ABI
```

## Supported networks

Networks are configured in `hardhat.config.ts`.

Current configured networks:

- `bscTestnet` — chain `97`
- `baseSepolia` — chain `84532`
- `baseMainnet` — chain `8453`
- `bscMainnet` — chain `56`

Before the app starts or builds, `scripts/sync-networks.ts` reads `hardhat.config.ts` and writes the frontend manifest to:

```txt
src/networks.json
```

The UI uses that file to populate the Network dropdown.

## How deployments work

Deployments are controlled by:

```txt
ignition/modules/deployer.ts
```

Current deployer:

```ts
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("TokenBuild", (m) => {
  const initialHolder = m.getAccount(0);

  const usdt = m.contract("USDT", [initialHolder]);
  const usdc = m.contract("USDC", [initialHolder]);

  return { usdt, usdc };
});
```

### What this means

- `TokenBuild` is the Ignition module name.
- `m.getAccount(0)` uses the first deployer account from the selected Hardhat network.
- `m.contract("USDT", [initialHolder])` deploys the Solidity contract named `USDT` and passes `initialHolder` to its constructor.
- `m.contract("USDC", [initialHolder])` does the same for `USDC`.
- The returned object controls what Ignition records in deployment artifacts.

## Deploy contracts

Interactive deploy:

```bash
pnpm deploy
```

Deploy to a specific network:

```bash
pnpm deploy bscTestnet
pnpm deploy baseSepolia
```

Reset previous Ignition deployment for that chain before deploying:

```bash
pnpm deploy bscTestnet --reset
pnpm deploy baseSepolia --reset
```

Use `--reset` when you changed `deployer.ts`, changed constructor arguments, or want a fresh deployment for that chain.

Deployment output is written under:

```txt
ignition/deployments/chain-<chainId>/
```

The frontend reads from that folder to discover deployed contracts and ABIs.

## How to edit `deployer.ts`

### Deploy only USDT

```ts
export default buildModule("TokenBuild", (m) => {
  const initialHolder = m.getAccount(0);
  const usdt = m.contract("USDT", [initialHolder]);

  return { usdt };
});
```

Then run:

```bash
pnpm deploy bscTestnet --reset
```

### Deploy only USDC

```ts
export default buildModule("TokenBuild", (m) => {
  const initialHolder = m.getAccount(0);
  const usdc = m.contract("USDC", [initialHolder]);

  return { usdc };
});
```

Then run:

```bash
pnpm deploy bscTestnet --reset
```

### Change the initial token holder

Use a fixed address instead of `m.getAccount(0)`:

```ts
export default buildModule("TokenBuild", (m) => {
  const initialHolder = "0x0000000000000000000000000000000000000000";
  const usdt = m.contract("USDT", [initialHolder]);
  const usdc = m.contract("USDC", [initialHolder]);

  return { usdt, usdc };
});
```

Replace the zero address with the real wallet address. The token contracts reject the zero address.

## Use the web app

After deploying:

```bash
pnpm dev
```

Then open the local Vite URL shown in the terminal.

In the app:

1. Select the target network.
2. Select the deployed contract.
3. Choose **Read** or **Write**.
4. Fill function inputs.
5. Click **Execute**.
6. Review results in the Log Viewer.

## Verify contracts

After deployment, run:

```bash
pnpm verify
```

The script opens an interactive verification flow. Make sure `VITE_ETHERSCAN_KEY` is set in `.env`.

## Import external contracts

To import an already deployed verified contract ABI:

```bash
pnpm grab
```

Choose the chain and paste the contract address. The app can then use the grabbed ABI/artifact data.
