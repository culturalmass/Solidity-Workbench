import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";

type NetworkEntry = {
  chainId: number;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const NETWORKS_PATH = path.join(ROOT, "src", "networks.json");

function usage() {
  console.error("❌ Usage: pnpm deploy [network] [--reset]");
  console.error("   e.g.  pnpm deploy");
  console.error("   e.g.  pnpm deploy baseSepolia");
  console.error("   e.g.  pnpm deploy baseSepolia --reset");
}

function loadNetworks(): Record<string, NetworkEntry> {
  if (!fs.existsSync(NETWORKS_PATH)) {
    throw new Error(`Networks file not found: ${NETWORKS_PATH}`);
  }

  return JSON.parse(fs.readFileSync(NETWORKS_PATH, "utf-8")) as Record<
    string,
    NetworkEntry
  >;
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

async function main() {
  const args = process.argv.slice(2);
  const reset = args.includes("--reset");
  const requestedNetworks = args.filter((arg) => !arg.startsWith("--"));
  const unknownArgs = args.filter(
    (arg) => arg.startsWith("--") && arg !== "--reset",
  );

  if (requestedNetworks.length > 1 || unknownArgs.length > 0) {
    usage();
    process.exit(1);
  }

  const availableNetworks = loadNetworks();
  const networkNames = Object.keys(availableNetworks);

  if (networkNames.length === 0) {
    throw new Error("No networks found in src/networks.json");
  }

  let network = requestedNetworks[0];

  if (!network) {
    console.log("\n=== Deploy Contract ===");
    const chainLabels = networkNames.map(
      (name) => `${name} (chain ${availableNetworks[name].chainId})`,
    );
    const picked = await select("Target chain:", chainLabels);
    network = networkNames[chainLabels.indexOf(picked)];
  } else if (!availableNetworks[network]) {
    console.error(`Unknown network: ${network}`);
    console.error(`Available networks: ${networkNames.join(", ")}`);
    process.exit(1);
  }

  console.log(`🌐 Targeting network: ${network}`);
  if (reset) {
    console.log("♻️  Resetting Ignition deployment before deploy");
  }

  execFileSync(
    "hardhat",
    ["--network", network, "run", "scripts/deploy-and-clean.ts"],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        DEPLOY_RESET: reset ? "1" : "0",
      },
    },
  );
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
