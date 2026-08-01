import { getDisplayName } from "@/lib/utils";
import networksManifest from "../networks.json";
import { networkList } from "@/lib/constants";
import type { NetworkConfig, NetworkName, ThemeMode } from "../../types";

export default function Toolbar({
  selectedNetwork,
  setSelectedNetwork,
  currentAddress,
  selectedKey,
  setSelectedKey,
  contractKeys,
  theme,
}: {
  selectedKey: string;
  setSelectedKey: (value: React.SetStateAction<string>) => void;
  selectedNetwork: NetworkConfig;
  currentAddress: string;
  contractKeys: string[];
  theme: ThemeMode;
  setSelectedNetwork: (value: React.SetStateAction<NetworkConfig>) => void;
}) {
  const isModern = theme === "modern";
  const selectClass = isModern
    ? "h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
    : "win95-inset h-5 px-1 text-xs focus:outline-none";

  return (
    <div
      className={
        isModern
          ? "flex flex-wrap items-center gap-3 border-b border-slate-200/80 bg-white/70 px-5 py-4"
          : "p-2 border-b border-[#7f7f7f] flex gap-4 items-center bg-[#c0c0c0]"
      }
    >
      <label
        className={
          isModern
            ? "flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500"
            : "flex items-center gap-2 text-xs"
        }
      >
        <span>Network</span>
        <select
          className={selectClass}
          value={selectedNetwork.name}
          onChange={(e) => {
            const net = networksManifest[e.target.value as NetworkName];
            setSelectedNetwork(net);
          }}
        >
          {networkList.map((net) => (
            <option key={net.chainId} value={net.name}>
              {net.name} ({net.chainId})
            </option>
          ))}
        </select>
      </label>

      <label
        className={
          isModern
            ? "flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500"
            : "flex items-center gap-2 text-xs"
        }
      >
        <span>Contract</span>
        <select
          className={selectClass}
          value={selectedKey}
          onChange={(e) => setSelectedKey(e.target.value)}
          disabled={contractKeys.length === 0}
        >
          {contractKeys.length === 0 ? (
            <option value="">No contracts</option>
          ) : (
            contractKeys.map((key) => (
              <option key={key} value={key}>
                {getDisplayName(key)}
              </option>
            ))
          )}
        </select>
      </label>

      {isModern ? (
        <div className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span>Address</span>
          <div className="flex h-10 min-w-0 items-center truncate rounded-xl border border-slate-200 bg-slate-50 px-3 font-mono text-xs font-normal normal-case tracking-normal text-slate-600">
            {currentAddress}
          </div>
        </div>
      ) : (
        <div className="win95-inset h-5 px-2 pt-0.5 bg-zinc-100 text-[10px] min-w-50 truncate font-mono text-zinc-600">
          Address: {currentAddress}
        </div>
      )}
    </div>
  );
}
