import { createWalletClient, createPublicClient, http, Chain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { PrivateKeyAccount } from "viem/accounts";
import { baseSepolia, base, bsc, bscTestnet, localhost } from "viem/chains";

const viemChains: Record<number, Chain> = {
  [localhost.id]: localhost,
  [bscTestnet.id]: bscTestnet,
  [baseSepolia.id]: baseSepolia,
  [base.id]: base,
  [bsc.id]: bsc,
};

const getPrivateKey = () => {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return import.meta.env.VITE_PRIVATE_KEY;
  }
  return process.env.VITE_PRIVATE_KEY;
};

const rawKey = getPrivateKey()?.trim();
const privateKey = rawKey?.startsWith("0x") ? rawKey : rawKey ? `0x${rawKey}` : undefined;

function resolveAccount(): PrivateKeyAccount | undefined {
  if (!privateKey || !/^0x[0-9a-fA-F]{64}$/.test(privateKey)) return undefined;
  return privateKeyToAccount(privateKey as `0x${string}`);
}

export const account = resolveAccount();

export function getClients(network: { chainId: number; rpcUrl: string }) {
  const chain = viemChains[network.chainId];

  const publicClient = createPublicClient({
    chain,
    transport: http(network.rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(network.rpcUrl),
  });

  return { publicClient, walletClient };
}
