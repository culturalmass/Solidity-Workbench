import type { NetworkConfig } from "../../types";
import networksManifest from "../networks.json";

export const networkList = Object.values(networksManifest) as NetworkConfig[];
