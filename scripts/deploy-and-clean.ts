import hre from "hardhat";
import fs from "fs";
import path from "path";
import DeployerModule from "../ignition/modules/deployer"; // ✅ import directly
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const networkName = hre.globalOptions.network;
  const networkConfig = hre.config.networks[networkName];
  const chainId = networkConfig.chainId;

  if (!chainId) {
    throw new Error(
      `❌ chainId not found for network "${networkName}". Add it to hardhat.config.ts.`,
    );
  }

  console.log(`🚀 Deploying to: ${networkName} (Chain: ${chainId})`);

  const deploymentDir = path.join(
    __dirname,
    "../ignition/deployments",
    `chain-${chainId}`,
  );

  if (process.env.DEPLOY_RESET === "1") {
    console.log(`♻️  Removing previous Ignition deployment: ${deploymentDir}`);
    fs.rmSync(deploymentDir, { recursive: true, force: true });
  }

  const connection = await hre.network.connect();

  // ✅ pass the module object directly, not a path string
  await connection.ignition.deploy(DeployerModule);

  // Rename # → _ in artifacts for this chain
  const artifactsDir = path.join(deploymentDir, "artifacts");

  console.log(`\n🧹 Cleaning artifacts in: ${artifactsDir}`);

  if (!fs.existsSync(artifactsDir)) {
    console.warn(`⚠️  Artifacts directory not found for chain ${chainId}`);
    return;
  }

  const files = fs.readdirSync(artifactsDir);
  let count = 0;

  files.forEach((file) => {
    if (file.includes("#")) {
      fs.renameSync(
        path.join(artifactsDir, file),
        path.join(artifactsDir, file.replaceAll("#", "_")),
      );
      count++;
    }
  });

  console.log(`✅ Renamed ${count} artifact(s).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
