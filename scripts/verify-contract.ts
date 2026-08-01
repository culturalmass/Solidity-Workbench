import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import readline from "readline";
import { execSync } from "child_process";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const DEPLOYMENTS = path.join(ROOT, "ignition", "deployments");

const CHAINS: Record<string, { chainId: number; network: string }> = {
  bscMainnet: { chainId: 56, network: "bscMainnet" },
  bscTestnet: { chainId: 97, network: "bscTestnet" },
  baseMainnet: { chainId: 8453, network: "baseMainnet" },
  baseSepolia: { chainId: 84532, network: "baseSepolia" },
};

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

function readJournalArgs(
  chainId: number,
  futureId: string,
): string[] | null {
  const journalPath = path.join(
    DEPLOYMENTS,
    `chain-${chainId}`,
    "journal.jsonl",
  );
  if (!fs.existsSync(journalPath)) return null;

  const lines = fs.readFileSync(journalPath, "utf-8").trim().split("\n");
  for (const line of lines) {
    const entry = JSON.parse(line);
    if (
      entry.type === "DEPLOYMENT_EXECUTION_STATE_INITIALIZE" &&
      entry.futureId === futureId
    ) {
      return entry.constructorArgs ?? [];
    }
  }
  return null;
}

function findContractFile(contractName: string): string | null {
  const contractsDir = path.join(ROOT, "contracts");
  if (!fs.existsSync(contractsDir)) return null;

  const files = fs.readdirSync(contractsDir);
  for (const file of files) {
    if (!file.endsWith(".sol")) continue;
    const content = fs.readFileSync(path.join(contractsDir, file), "utf-8");
    const match = content.match(
      new RegExp(`contract\\s+${contractName}\\s`),
    );
    if (match) return `contracts/${file}:${contractName}`;
  }
  return null;
}

async function main() {
  console.log("\n=== Verify Contract ===");

  const chainNames = Object.keys(CHAINS);
  const chainLabels = chainNames.map(
    (n) => `${n} (chain ${CHAINS[n].chainId})`,
  );
  const pickedChain = await select("Target chain:", chainLabels);
  const chainName = chainNames[chainLabels.indexOf(pickedChain)];
  const chain = CHAINS[chainName];

  const addressesPath = path.join(
    DEPLOYMENTS,
    `chain-${chain.chainId}`,
    "deployed_addresses.json",
  );
  if (!fs.existsSync(addressesPath)) {
    console.error(`No deployments found for ${chainName}.`);
    process.exit(1);
  }

  const addresses: Record<string, string> = JSON.parse(
    fs.readFileSync(addressesPath, "utf-8"),
  );
  const keys = Object.keys(addresses);
  if (keys.length === 0) {
    console.error("No contracts deployed on this chain.");
    process.exit(1);
  }

  const contractLabels = keys.map((k) => `${k} → ${addresses[k]}`);
  const pickedContract = await select("Contract to verify:", contractLabels);
  const selectedKey = keys[contractLabels.indexOf(pickedContract)];
  const address = addresses[selectedKey];

  const contractName = selectedKey.split("#")[1];
  const constructorArgs = readJournalArgs(chain.chainId, selectedKey);

  const contractFlag = findContractFile(contractName);

  let cmd = `npx hardhat verify --network ${chain.network}`;
  if (contractFlag) {
    cmd += ` --contract ${contractFlag}`;
  }
  cmd += ` ${address}`;
  if (constructorArgs && constructorArgs.length > 0) {
    cmd += " " + constructorArgs.map((a) => `"${a}"`).join(" ");
  }

  console.log(`\nRunning: ${cmd}\n`);

  try {
    execSync(cmd, { stdio: "inherit", cwd: ROOT });
    console.log("\nVerification complete.");
  } catch {
    console.error("\nVerification failed. Check output above.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
