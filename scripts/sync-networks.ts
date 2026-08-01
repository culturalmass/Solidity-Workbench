import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// --- ESM FIX: Recreate __dirname ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// -----------------------------------

const EXCLUDED_NETWORKS = ["default", "node", "hardhat", "localhost"];

async function main() {
  const networks = hre.config.networks;
  const manifest: Record<
    string,
    { chainId: number; name: string; rpcUrl: string }
  > = {};

  for (const [name, config] of Object.entries(networks)) {
    if (
      EXCLUDED_NETWORKS.includes(name) ||
      !config ||
      !("chainId" in config) ||
      typeof config.chainId !== "number" ||
      !("url" in config)
    ) {
      continue;
    }

    const url =
      typeof config.url === "string"
        ? config.url
        : await config.url.getUrl();

    manifest[name] = { name, chainId: config.chainId, rpcUrl: url };
  }

  // Define the output path (pointing to your frontend src folder)
  const outputPath = path.join(__dirname, "../src/networks.json");

  // Ensure the directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));

  console.log("--------------------------------------------------");
  console.log(`✅ Sync successful!`);
  console.log(`🌐 Networks found: ${Object.keys(manifest).join(", ")}`);
  console.log(`📍 Saved to: ${outputPath}`);
  console.log("--------------------------------------------------");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Sync failed:", error);
    process.exit(1);
  });
