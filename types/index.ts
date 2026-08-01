import networksManifest from "../src/networks.json";

// ---- Types ----
export type NetworkName = keyof typeof networksManifest;
export type DeployedAddresses = Record<string, string>;
export type NetworkConfig = {
  name: string;
  chainId: number;
  rpcUrl: string;
};

export type ThemeMode = "win95" | "modern";
