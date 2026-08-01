import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import readline from "readline";
import { createPublicClient, http, keccak256, toBytes, toHex } from "viem";

dotenv.config();

const EIP1967_IMPL_SLOT = toHex(
  BigInt(keccak256(toBytes("eip1967.proxy.implementation"))) - 1n,
  { size: 32 },
);
const EIP1967_BEACON_SLOT = toHex(
  BigInt(keccak256(toBytes("eip1967.proxy.beacon"))) - 1n,
  { size: 32 },
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const DEPLOYMENTS = path.join(ROOT, "ignition", "deployments");

const API_KEY = process.env.VITE_ETHERSCAN_KEY || "";

const EXPLORER_V2 = "https://api.etherscan.io/v2/api";

type NetworkEntry = { name?: string; chainId: number; rpcUrl?: string };

type AbiInput = { type?: unknown };
type AbiItem = { type?: unknown; name?: unknown; inputs?: AbiInput[] };
type LocalAbiArtifact = {
  label: string;
  path: string;
  contractName: string;
  abi: unknown[];
};

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function select(label: string, options: string[]): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log(`\n${label}`);
    options.forEach((opt, i) => console.log(`  ${i + 1}) ${opt}`));

    rl.question(`\nSelect [1-${options.length}]: `, (answer) => {
      rl.close();
      const idx = parseInt(answer.trim(), 10) - 1;
      if (idx < 0 || idx >= options.length) {
        console.error("Invalid selection.");
        process.exit(1);
      }
      resolve(options[idx]);
    });
  });
}

async function fetchSourceInfo(chainId: number, address: string) {
  const url = `${EXPLORER_V2}?module=contract&action=getsourcecode&address=${address}&chainid=${chainId}&apikey=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== "1" || !data.result?.[0]) {
    throw new Error(
      `Explorer API error: ${data.message || "Unknown error"}. Is the contract verified?`,
    );
  }
  return data.result[0];
}

function loadNetworks(): Record<string, NetworkEntry> {
  const networksPath = path.join(ROOT, "src", "networks.json");
  if (!fs.existsSync(networksPath)) {
    throw new Error(
      `Networks file not found: ${path.relative(ROOT, networksPath)}. Run pnpm dev or pnpm hardhat run scripts/sync-networks.ts first.`,
    );
  }

  const networks = JSON.parse(fs.readFileSync(networksPath, "utf-8")) as Record<
    string,
    NetworkEntry
  >;

  return Object.fromEntries(
    Object.entries(networks).filter(
      ([, network]) => typeof network.chainId === "number",
    ),
  );
}

function getRpcUrl(
  networks: Record<string, NetworkEntry>,
  chainName: string,
): string | undefined {
  return networks[chainName]?.rpcUrl;
}

async function readProxyImplFromChain(
  rpcUrl: string,
  address: string,
): Promise<string | null> {
  const client = createPublicClient({ transport: http(rpcUrl) });
  for (const slot of [EIP1967_IMPL_SLOT, EIP1967_BEACON_SLOT]) {
    const raw = await client.getStorageAt({
      address: address as `0x${string}`,
      slot: slot as `0x${string}`,
    });
    if (!raw || raw === "0x" || /^0x0+$/.test(raw)) continue;
    const impl = "0x" + raw.slice(-40);
    if (!/^0x0+$/.test(impl)) return impl;
  }
  return null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asAbiItem(entry: unknown): AbiItem {
  return isObject(entry) ? entry : {};
}

function abiKey(entry: unknown): string {
  const item = asAbiItem(entry);
  const inputTypes = Array.isArray(item.inputs)
    ? item.inputs.map((input) => input.type)
    : undefined;
  return JSON.stringify([item.type, item.name, inputTypes]);
}

function findJsonFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return findJsonFiles(entryPath);
    return entry.isFile() && entry.name.endsWith(".json") ? [entryPath] : [];
  });
}

function loadLocalAbiArtifacts(): LocalAbiArtifact[] {
  const searchRoots = [
    path.join(ROOT, "artifacts", "contracts"),
    path.join(ROOT, "ignition", "deployments"),
  ];

  const artifacts = searchRoots
    .flatMap(findJsonFiles)
    .filter((file) => !file.includes(`${path.sep}build-info${path.sep}`))
    .flatMap((file): LocalAbiArtifact[] => {
      try {
        const json = JSON.parse(fs.readFileSync(file, "utf-8"));
        if (!Array.isArray(json.abi) || json.abi.length === 0) return [];

        const contractName =
          typeof json.contractName === "string"
            ? json.contractName
            : path.basename(file, ".json");
        const relativePath = path.relative(ROOT, file);

        return [
          {
            label: `${contractName} — ${relativePath}`,
            path: file,
            contractName,
            abi: json.abi,
          },
        ];
      } catch {
        return [];
      }
    });

  return artifacts.sort((a, b) => a.label.localeCompare(b.label));
}

async function chooseLocalAbi(): Promise<{ abi: unknown[]; name: string }> {
  const artifacts = loadLocalAbiArtifacts();

  if (artifacts.length === 0) {
    throw new Error("No local ABI artifacts found in artifacts/ or ignition/deployments/.");
  }

  const picked = await select(
    "Choose a local ABI from the repository:",
    artifacts.map((artifact) => artifact.label),
  );
  const artifact = artifacts.find((item) => item.label === picked);

  if (!artifact) {
    throw new Error("Selected ABI artifact not found.");
  }

  console.log(`Using local ABI: ${path.relative(ROOT, artifact.path)}`);
  return { abi: artifact.abi, name: artifact.contractName };
}

async function fetchContractInfo(
  chainId: number,
  chainName: string,
  address: string,
  networks: Record<string, NetworkEntry>,
): Promise<{ abi: unknown[]; name: string }> {
  const info = await fetchSourceInfo(chainId, address);
  let proxyImpl: string =
    info.Proxy === "1" && info.Implementation ? info.Implementation : "";

  if (!proxyImpl) {
    const rpcUrl = getRpcUrl(networks, chainName);
    if (rpcUrl) {
      const impl = await readProxyImplFromChain(rpcUrl, address);
      if (impl) {
        console.log(`EIP-1967 proxy detected via storage slot.`);
        proxyImpl = impl;
      }
    }
  }

  let abiSource = info;
  if (proxyImpl && /^0x[a-fA-F0-9]{40}$/.test(proxyImpl)) {
    console.log(`Implementation: ${proxyImpl}`);
    abiSource = await fetchSourceInfo(chainId, proxyImpl);
  }

  const proxyAbi = JSON.parse(info.ABI || "[]") as unknown[];
  const implAbi = abiSource === info ? [] : (JSON.parse(abiSource.ABI || "[]") as unknown[]);
  const seen = new Set<string>();
  const merged = [...implAbi, ...proxyAbi].filter((entry) => {
    const key = abiKey(entry);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const name = info.ContractName || abiSource.ContractName || "Unknown";
  return { abi: merged, name };
}

async function main() {
  console.log("\n=== Grab External Contract ===");

  const networks = loadNetworks();
  const chainNames = Object.keys(networks);
  if (chainNames.length === 0) {
    throw new Error("No networks found in src/networks.json.");
  }

  const chainLabels = chainNames.map(
    (name) => `${name} (chain ${networks[name].chainId})`,
  );
  const picked = await select("Target chain:", chainLabels);
  const chainName = chainNames[chainLabels.indexOf(picked)];

  const address = await ask("Contract address: ");
  if (!address.startsWith("0x") || address.length !== 42) {
    console.error("Invalid address format.");
    process.exit(1);
  }

  const chainId = networks[chainName].chainId;
  console.log(`\nFetching ABI from ${chainName} explorer...`);

  let abi: unknown[];
  let detectedName: string;

  try {
    const fetched = await fetchContractInfo(chainId, chainName, address, networks);
    abi = fetched.abi;
    detectedName = fetched.name;
    console.log(`Found: ${detectedName} (${abi.length} ABI entries)`);
  } catch (err) {
    console.warn(
      `Explorer ABI lookup failed: ${err instanceof Error ? err.message : err}`,
    );
    const useLocal = await ask("Use an ABI from this repository instead? [Y/n]: ");

    if (useLocal.toLowerCase() === "n") {
      console.error("No ABI selected. Aborting.");
      process.exit(1);
    }

    const local = await chooseLocalAbi();
    abi = local.abi;
    detectedName = local.name;
    console.log(`Selected: ${detectedName} (${abi.length} ABI entries)`);
  }

  const nameOverride = await ask(`Contract name [${detectedName}]: `);
  const contractName = nameOverride || detectedName;

  const chainDir = path.join(DEPLOYMENTS, `chain-${chainId}`);
  const artifactsDir = path.join(chainDir, "artifacts");
  fs.mkdirSync(artifactsDir, { recursive: true });

  const fileKey = `External_${contractName}`;
  const artifactPath = path.join(artifactsDir, `${fileKey}.json`);
  const artifact = {
    _format: "hh3-artifact-1",
    contractName,
    sourceName: "external",
    abi,
  };
  fs.writeFileSync(artifactPath, JSON.stringify(artifact, null, 2));
  console.log(`\nWrote artifact: ${path.relative(ROOT, artifactPath)}`);

  const addressesPath = path.join(chainDir, "deployed_addresses.json");
  let addresses: Record<string, string> = {};
  if (fs.existsSync(addressesPath)) {
    addresses = JSON.parse(fs.readFileSync(addressesPath, "utf-8"));
  }

  const addressKey = `External#${contractName}`;
  addresses[addressKey] = address;
  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log(`Updated: ${path.relative(ROOT, addressesPath)}`);
  console.log(`  ${addressKey} → ${address}`);

  console.log(`\nDone. Select ${chainName} in the app to interact with ${contractName}.`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
