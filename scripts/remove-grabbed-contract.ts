import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const NETWORKS_PATH = path.join(ROOT, "src", "networks.json");
const DEPLOYMENTS = path.join(ROOT, "ignition", "deployments");

type NetworkEntry = { name?: string; chainId: number };
type GrabbedContract = {
  addressKey: string;
  contractName: string;
  address: string;
  artifactPath: string;
};

function loadNetworks(): Record<string, NetworkEntry> {
  if (!fs.existsSync(NETWORKS_PATH)) {
    throw new Error(
      `Networks file not found: ${path.relative(ROOT, NETWORKS_PATH)}. Run pnpm dev or pnpm hardhat run scripts/sync-networks.ts first.`,
    );
  }

  const networks = JSON.parse(fs.readFileSync(NETWORKS_PATH, "utf-8")) as Record<
    string,
    NetworkEntry
  >;

  return Object.fromEntries(
    Object.entries(networks).filter(
      ([, network]) => typeof network.chainId === "number",
    ),
  );
}

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

function loadGrabbedContracts(chainId: number): GrabbedContract[] {
  const chainDir = path.join(DEPLOYMENTS, `chain-${chainId}`);
  const addressesPath = path.join(chainDir, "deployed_addresses.json");

  if (!fs.existsSync(addressesPath)) return [];

  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf-8")) as Record<
    string,
    string
  >;

  return Object.entries(addresses)
    .filter(([key]) => key.startsWith("External#"))
    .map(([addressKey, address]) => {
      const contractName = addressKey.slice("External#".length);
      return {
        addressKey,
        contractName,
        address,
        artifactPath: path.join(chainDir, "artifacts", `External_${contractName}.json`),
      };
    })
    .sort((a, b) => a.contractName.localeCompare(b.contractName));
}

function removeAddress(chainId: number, addressKey: string): void {
  const addressesPath = path.join(
    DEPLOYMENTS,
    `chain-${chainId}`,
    "deployed_addresses.json",
  );
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf-8")) as Record<
    string,
    string
  >;

  delete addresses[addressKey];
  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
}

async function main() {
  console.log("\n=== Remove Grabbed Contract ===");

  const networks = loadNetworks();
  const chainNames = Object.keys(networks);
  if (chainNames.length === 0) {
    throw new Error("No networks found in src/networks.json.");
  }

  const chainLabels = chainNames.map(
    (name) => `${name} (chain ${networks[name].chainId})`,
  );
  const pickedChain = await select("Target chain:", chainLabels);
  const chainName = chainNames[chainLabels.indexOf(pickedChain)];
  const chainId = networks[chainName].chainId;

  const grabbedContracts = loadGrabbedContracts(chainId);
  if (grabbedContracts.length === 0) {
    console.log(`No grabbed contracts found for ${chainName}.`);
    return;
  }

  const contractLabels = grabbedContracts.map(
    (contract) => `${contract.contractName} (${contract.address})`,
  );
  const pickedContract = await select("Grabbed contract to remove:", contractLabels);
  const contract = grabbedContracts[contractLabels.indexOf(pickedContract)];

  console.log(`\nThis will remove:`);
  console.log(`  ${contract.addressKey} → ${contract.address}`);
  console.log(`  ${path.relative(ROOT, contract.artifactPath)}`);

  const confirm = await ask("Continue? [y/N]: ");
  if (confirm.toLowerCase() !== "y") {
    console.log("Aborted.");
    return;
  }

  removeAddress(chainId, contract.addressKey);
  fs.rmSync(contract.artifactPath, { force: true });

  console.log(`\nRemoved ${contract.contractName} from ${chainName}.`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
