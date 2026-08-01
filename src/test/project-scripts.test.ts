import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import packageJson from "../../package.json";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

describe("Project scripts", () => {
  it("exposes the required local and CI verification scripts", () => {
    expect(packageJson.scripts.lint).toBe("eslint .");
    expect(packageJson.scripts.test).toBe("vitest");
    expect(packageJson.scripts["test:ci"]).toBe("vitest run");
    expect(packageJson.scripts.build).toContain("tsc -b");
    expect(packageJson.scripts.build).toContain("vite build");
  });

  it.each([
    ["build", "hardhat run scripts/sync-networks.ts && tsc -b && vite build"],
    ["deploy", "node scripts/deploy-runner.ts"],
    ["grab", "hardhat run scripts/sync-networks.ts && npx tsx scripts/grab-contract.ts"],
    ["ungrab", "hardhat run scripts/sync-networks.ts && npx tsx scripts/remove-grabbed-contract.ts"],
    ["verify", "npx tsx scripts/verify-contract.ts"],
  ] as const)("keeps the %s script wired to the expected command", (name, command) => {
    expect(packageJson.scripts[name]).toBe(command);
  });

  it.each([
    "scripts/sync-networks.ts",
    "scripts/deploy-runner.ts",
    "scripts/grab-contract.ts",
    "scripts/remove-grabbed-contract.ts",
    "scripts/verify-contract.ts",
  ])("has script file %s", (scriptPath) => {
    expect(existsSync(resolve(root, scriptPath))).toBe(true);
  });

  it("runs the same verification gates in GitHub Actions", async () => {
    const workflow = await import("node:fs/promises").then((fs) =>
      fs.readFile(resolve(root, ".github/workflows/ci.yml"), "utf8"),
    );

    expect(workflow).toContain("pnpm run lint");
    expect(workflow).toContain("pnpm run test:ci");
    expect(workflow).toContain("pnpm run build");
  });
});
